"use server";

import { revalidatePath } from "next/cache";
import type { createClient } from "@/lib/supabase/server";
import type {
  KnowledgeDraftInput,
  KnowledgeFormValues,
} from "@/types/knowledge";
import {
  getAdminClient,
  isValidKnowledgeCategory,
  toDbValues,
  type ActionResult,
} from "../server-utils";
import { makeSlug } from "../slug";
import { validateKnowledge } from "../validation";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

const SOURCE_TYPE = "ai_structured";
const MAX_SOURCE_NAME_LENGTH = 200;
const MAX_SUMMARY_LENGTH = 5000;
const MAX_RAW_CONTENT_LENGTH = 20000;
const MAX_LIST_ITEMS = 50;
const MAX_LIST_ITEM_LENGTH = 1000;

function asString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function asStringList(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null;

  const items: string[] = [];

  for (const item of value) {
    if (typeof item !== "string") return null;

    const trimmed = item.trim();
    if (trimmed) items.push(trimmed);
  }

  return items;
}

// Server Action adalah endpoint publik: bentuk data dari klien tidak dipercaya.
function parseDraft(input: unknown): KnowledgeDraftInput | null {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return null;
  }

  const raw = input as Record<string, unknown>;

  const title = asString(raw.title);
  const summary = asString(raw.summary);
  const content = asString(raw.content);
  const category = asString(raw.category);
  const destinationId = asString(raw.destination_id);
  const sourceName = asString(raw.source_name);
  const sourceUrl = asString(raw.source_url);
  const rawContent = asString(raw.raw_content);
  const rules = asStringList(raw.important_rules);
  const ambiguities = asStringList(raw.ambiguous_information);
  const language =
    raw.language === "id" || raw.language === "en" ? raw.language : null;

  if (
    title === null ||
    summary === null ||
    content === null ||
    category === null ||
    destinationId === null ||
    sourceName === null ||
    sourceUrl === null ||
    rawContent === null ||
    rules === null ||
    ambiguities === null ||
    language === null
  ) {
    return null;
  }

  return {
    destination_id: destinationId,
    language,
    title,
    summary,
    content,
    category,
    important_rules: rules,
    ambiguous_information: ambiguities,
    source_name: sourceName,
    source_url: sourceUrl,
    raw_content: rawContent,
  };
}

function checkLimits(draft: KnowledgeDraftInput): string | null {
  if (draft.source_name.trim().length > MAX_SOURCE_NAME_LENGTH) {
    return `Source name must be ${MAX_SOURCE_NAME_LENGTH} characters or fewer.`;
  }

  if (draft.summary.length > MAX_SUMMARY_LENGTH) {
    return `Summary must be ${MAX_SUMMARY_LENGTH} characters or fewer.`;
  }

  if (draft.raw_content.length > MAX_RAW_CONTENT_LENGTH) {
    return "The original input is too long.";
  }

  for (const list of [draft.important_rules, draft.ambiguous_information]) {
    if (
      list.length > MAX_LIST_ITEMS ||
      list.some((item) => item.length > MAX_LIST_ITEM_LENGTH)
    ) {
      return "Rules or ambiguous information contain too many or too long items.";
    }
  }

  return null;
}

// Baca ulang record yang baru disimpan dan cocokkan dengan yang dikirim.
async function verifySavedDraft(
  supabase: SupabaseServerClient,
  id: string,
  expected: ReturnType<typeof toDbValues>,
  rawContent: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const failed = {
    ok: false as const,
    error:
      "The saved data could not be verified, so the draft was discarded. Please try again.",
  };

  const { data, error } = await supabase
    .from("knowledge_items")
    .select(
      "id, title, content, category, language, destination_id, source_name, source_url, source_type, status, indexing_status, metadata",
    )
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return failed;

  const aiMetadata = (
    data.metadata as { ai_structuring?: { raw_content?: unknown } } | null
  )?.ai_structuring;

  const matches =
    data.status === "draft" &&
    data.indexing_status === "pending" &&
    data.source_type === SOURCE_TYPE &&
    data.title === expected.title &&
    data.content === expected.content &&
    data.category === expected.category &&
    data.language === expected.language &&
    data.destination_id === expected.destination_id &&
    data.source_name === expected.source_name &&
    data.source_url === expected.source_url &&
    aiMetadata?.raw_content === rawContent;

  return matches ? { ok: true } : failed;
}

export async function createKnowledgeFromAi(
  input: KnowledgeDraftInput,
): Promise<ActionResult> {
  const draft = parseDraft(input);

  if (!draft) {
    return { ok: false, error: "The draft data is invalid." };
  }

  const limitError = checkLimits(draft);

  if (limitError) {
    return { ok: false, error: limitError };
  }

  const values: KnowledgeFormValues = {
    title: draft.title,
    content: draft.content,
    category: draft.category,
    language: draft.language,
    destination_id: draft.destination_id,
    source_name: draft.source_name,
    source_url: draft.source_url,
    source_description: "",
  };

  const fieldErrors = validateKnowledge(values);

  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, error: "Fix the highlighted fields.", fieldErrors };
  }

  const admin = await getAdminClient();

  if ("error" in admin) {
    return { ok: false, error: admin.error };
  }

  const validCategory = await isValidKnowledgeCategory(
    admin.supabase,
    values.category,
  );

  if (!validCategory) {
    return {
      ok: false,
      error: "The selected category is no longer available.",
      fieldErrors: { category: "Choose a valid category." },
    };
  }

  const {
    data: { user },
  } = await admin.supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "You must be signed in." };
  }

  const dbValues = toDbValues(values);

  // Bagian yang tidak punya kolom sendiri disimpan di metadata.
  // Hanya `content` yang di-chunk saat publish, jadi rules/ambiguous/raw_content
  // tidak ikut ke RAG.
  const metadata = {
    ai_structuring: {
      raw_content: draft.raw_content,
      summary: draft.summary.trim(),
      important_rules: draft.important_rules,
      ambiguous_information: draft.ambiguous_information,
      saved_by: user.id,
      saved_at: new Date().toISOString(),
    },
  };

  for (let attempt = 0; attempt < 3; attempt++) {
    const { data, error } = await admin.supabase
      .from("knowledge_items")
      .insert({
        ...dbValues,
        slug: makeSlug(values.title),
        // Status ditentukan server, bukan klien: AI tidak bisa publish.
        status: "draft",
        indexing_status: "pending",
        source_type: SOURCE_TYPE,
        metadata,
      })
      .select("id")
      .single();

    if (!error && data) {
      const verified = await verifySavedDraft(
        admin.supabase,
        data.id,
        dbValues,
        draft.raw_content,
      );

      if (!verified.ok) {
        // Best effort: buang record yang tidak lolos verifikasi
        await admin.supabase.from("knowledge_items").delete().eq("id", data.id);
        return { ok: false, error: verified.error };
      }

      revalidatePath("/admin/knowledge");
      return { ok: true, id: data.id };
    }

    if (error?.code === "23503") {
      return { ok: false, error: "The selected destination does not exist." };
    }

    if (error?.code !== "23505") {
      return {
        ok: false,
        error: error?.message ?? "Could not save the draft.",
      };
    }
  }

  return {
    ok: false,
    error: "Could not generate a unique slug. Try again.",
  };
}