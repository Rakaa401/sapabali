"use server";

import { revalidatePath } from "next/cache";
import type { KnowledgeFormValues } from "@/types/knowledge";
import {
  getAdminClient,
  isValidKnowledgeCategory,
  type ActionResult,
} from "../server-utils";
import { validateKnowledge } from "../validation";
import { indexKnowledge } from "@/lib/rag/index-knowledge";

export async function publishKnowledge(id: string): Promise<ActionResult> {
  const admin = await getAdminClient();

  if ("error" in admin) {
    return { ok: false, error: admin.error };
  }

  const { data: knowledge, error: knowledgeError } = await admin.supabase
    .from("knowledge_items")
    .select(
      "id, title, content, category, language, destination_id, source_name, source_url, source_description",
    )
    .eq("id", id)
    .maybeSingle();

  if (knowledgeError || !knowledge) {
    return {
      ok: false,
      error: knowledgeError?.message ?? "Knowledge not found.",
    };
  }

  const values: KnowledgeFormValues = {
    title: knowledge.title,
    content: knowledge.content,
    category: knowledge.category ?? "",
    language: knowledge.language,
    destination_id: knowledge.destination_id ?? "",
    source_name: knowledge.source_name ?? "",
    source_url: knowledge.source_url ?? "",
    source_description: knowledge.source_description ?? "",
  };

  const fieldErrors = validateKnowledge(values);

  if (Object.keys(fieldErrors).length > 0) {
    return {
      ok: false,
      error: "Complete the required fields before publishing.",
      fieldErrors,
    };
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

  const { data: destination, error: destinationError } = await admin.supabase
    .from("destinations")
    .select("id, status")
    .eq("id", values.destination_id)
    .maybeSingle();

  if (destinationError || !destination || destination.status !== "published") {
    return {
      ok: false,
      error: "The destination must be published before this knowledge can be published.",
      fieldErrors: { destination_id: "Choose a published destination." },
    };
  }

  try {
    await indexKnowledge(id);
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? `Indexing failed: ${error.message}`
          : "Knowledge indexing failed.",
    };
  }

  const { data, error } = await admin.supabase
    .from("knowledge_items")
    .update({ status: "published" })
    .eq("id", id)
    .eq("indexing_status", "indexed")
    .select("id")
    .maybeSingle();

  if (error || !data) {
    return {
      ok: false,
      error: error?.message ?? "Could not publish knowledge.",
    };
  }

  revalidatePath("/admin/knowledge");
  revalidatePath(`/admin/knowledge/${id}`);

  return { ok: true, id };
}


export async function reindexKnowledge(id: string): Promise<ActionResult> {
  const admin = await getAdminClient();

  if ("error" in admin) {
    return { ok: false, error: admin.error };
  }

  try {
    await indexKnowledge(id);

    revalidatePath("/admin/knowledge");
    revalidatePath(`/admin/knowledge/${id}`);

    return { ok: true, id };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? `Re-indexing failed: ${error.message}`
          : "Knowledge re-indexing failed.",
    };
  }
}