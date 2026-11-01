"use server";

import { createClient } from "@/lib/supabase/server";
import { logActivity } from "./log";

// Panggil ini SETELAH login admin berhasil (lihat petunjuk di halaman login)
export async function recordAdminLogin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  await logActivity(supabase, { action: "admin_login", description: "Logged in" });
}
