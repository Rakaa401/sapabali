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

  const { data, error } = await admin.supabase
    .from("knowledge_items")
    .update({ status: "unpublished" })
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    return {
      ok: false,
      error: error?.message ?? "Knowledge not found or could not be unpublished.",
    };
  }

  revalidatePath("/admin/knowledge");
  revalidatePath(`/admin/knowledge/${id}`);

  return { ok: true, id };
}