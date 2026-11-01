"use server";

import { redirect } from "next/navigation";
import { logActivity } from "@/lib/activity/log";
import { createClient } from "@/lib/supabase/server";

export async function signOut() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // catat dulu selagi sesi masih aktif
  if (user) await logActivity(supabase, { action: "admin_logout", description: "Logged out" });

  await supabase.auth.signOut();
  redirect("/admin/login");
}
