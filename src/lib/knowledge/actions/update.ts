"use server";

import { revalidatePath } from "next/cache";
import type { KnowledgeFormValues } from "@/types/knowledge";
import { getAdminClient, toDbValues, type ActionResult } from "../server-utils";
import { validateKnowledge } from "../validation";

// 02.9: validasi, cek admin, update, tandai indexing "stale" kalau isi berubah
export async function updateKnowledge(
  id: string,
  values: KnowledgeFormValues,
): Promise<ActionResult> {
  const fieldErrors = validateKnowledge(values);
  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, error: "Fix the highlighted fields.", fieldErrors };
  }

  const admin = await getAdminClient();
  if ("error" in admin) return { ok: false, error: admin.error };

  const { data: existing } = await admin.supabase
    .from("knowledge_items")
    .select("title, content, indexing_status")
    .eq("id", id)
    .maybeSingle();
  if (!existing) return { ok: false, error: "Knowledge not found." };

  const patch: Record<string, unknown> = toDbValues(values);
  const contentChanged =
    existing.title !== patch.title || existing.content !== patch.content;
  if (contentChanged && existing.indexing_status !== "pending") {
    patch.indexing_status = "stale"; // embedding lama sudah tidak sesuai isi
  }

  const { data, error } = await admin.supabase
    .from("knowledge_items")
    .update(patch)
    .eq("id", id)
    .select("id");

  if (error) {
    if (error.code === "23503") {
      return { ok: false, error: "The selected destination does not exist." };
    }
    return { ok: false, error: error.message };
  }
  if (!data || data.length === 0) {
    return { ok: false, error: "Knowledge not found or you do not have permission." };
  }

  revalidatePath("/admin/knowledge");
  revalidatePath(`/admin/knowledge/${id}`);
  return { ok: true, id };
}
