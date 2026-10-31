"use server";

import { revalidatePath } from "next/cache";
import { getAdminClient } from "../server-utils";

// 02.10: hapus knowledge. Chunk & embedding ikut terhapus (on delete cascade)
export async function deleteKnowledge(
  id: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const admin = await getAdminClient();
  if ("error" in admin) return { ok: false, error: admin.error };

  const { data, error } = await admin.supabase
    .from("knowledge_items")
    .delete()
    .eq("id", id)
    .select("id");

  if (error) return { ok: false, error: error.message };
  if (!data || data.length === 0) {
    return { ok: false, error: "Knowledge not found or you do not have permission." };
  }

  revalidatePath("/admin/knowledge");
  return { ok: true };
}
