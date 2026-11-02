"use server";

import { revalidatePath } from "next/cache";
import type { KnowledgeFormValues } from "@/types/knowledge";
import {
  getAdminClient,
  isValidKnowledgeCategory,
  toDbValues,
  type ActionResult,
} from "../server-utils";
import { validateKnowledge } from "../validation";
import { indexKnowledge } from "@/lib/rag/index-knowledge";

export async function updateKnowledge(
  id: string,
  values: KnowledgeFormValues,
): Promise<ActionResult> {
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

  const { data: existing, error: fetchError } = await admin.supabase
    .from("knowledge_items")
    .select("title, content, status, indexing_status")
    .eq("id", id)
    .maybeSingle();

  if (fetchError || !existing) {
    return {
      ok: false,
      error: fetchError?.message ?? "Knowledge not found.",
    };
  }

  const patch: Record<string, unknown> = toDbValues(values);

  const contentChanged =
    existing.title !== patch.title || existing.content !== patch.content;

  if (contentChanged) {
    patch.indexing_status = "pending";
  }

  const { data, error } = await admin.supabase
    .from("knowledge_items")
    .update(patch)
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error) {
    if (error.code === "23503") {
      return {
        ok: false,
        error: "The selected destination does not exist.",
      };
    }

    return { ok: false, error: error.message };
  }

  if (!data) {
    return { ok: false, error: "Knowledge not found." };
  }

  if (contentChanged && existing.status === "published") {
    try {
      await indexKnowledge(id);
    } catch (error) {
      revalidatePath("/admin/knowledge");
      revalidatePath(`/admin/knowledge/${id}`);

      return {
        ok: false,
        error:
          error instanceof Error
            ? `Content saved, but re-indexing failed: ${error.message}. Use the Re-index action to retry.`
            : "Content saved, but re-indexing failed. Use the Re-index action to retry.",
      };
    }
  }

  revalidatePath("/admin/knowledge");
  revalidatePath(`/admin/knowledge/${id}`);

  return { ok: true, id };
}
