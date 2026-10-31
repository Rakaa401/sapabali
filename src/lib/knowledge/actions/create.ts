"use server";

import { revalidatePath } from "next/cache";
import type { KnowledgeFormValues } from "@/types/knowledge";
import { getAdminClient, toDbValues, type ActionResult } from "../server-utils";
import { makeSlug } from "../slug";
import { validateKnowledge } from "../validation";

// 02.6: validasi, cek admin, simpan sebagai Draft
export async function createKnowledge(values: KnowledgeFormValues): Promise<ActionResult> {
  const fieldErrors = validateKnowledge(values);
  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, error: "Fix the highlighted fields.", fieldErrors };
  }

  const admin = await getAdminClient();
 if ("error" in admin) return { ok: false, error: admin.error ?? "Unauthorized" };

  for (let attempt = 0; attempt < 3; attempt++) {
    const { data, error } = await admin.supabase
      .from("knowledge_items")
      .insert({
        ...toDbValues(values),
        slug: makeSlug(values.title),
        status: "draft",
        indexing_status: "pending",
        source_type: "manual",
      })
      .select("id")
      .single();

    if (!error && data) {
      revalidatePath("/admin/knowledge");
      return { ok: true, id: data.id };
    }
    if (error?.code === "23503") {
      return { ok: false, error: "The selected destination does not exist." };
    }
    if (error?.code !== "23505") {
      return { ok: false, error: error?.message ?? "Could not save knowledge." };
    }
    // 23505 = slug bentrok, coba lagi dengan slug baru
  }
  return { ok: false, error: "Could not generate a unique slug. Try again." };
}
