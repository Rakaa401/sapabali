"use server";

import { revalidatePath } from "next/cache";
import { getAdminClient, type ActionResult } from "../server-utils";

export async function unpublishKnowledge(
  id: string,
): Promise<ActionResult> {
  const admin = await getAdminClient();

  if ("error" in admin) {
    return { ok: false, error: admin.error };
  }

  const { error } = await admin.supabase.rpc("unpublish_knowledge", {
    p_knowledge_item_id: id,
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/admin/knowledge");
  revalidatePath(`/admin/knowledge/${id}`);

  return { ok: true, id };
}