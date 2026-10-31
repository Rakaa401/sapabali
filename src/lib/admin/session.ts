import { createClient } from "@/lib/supabase/server";

// null = belum login. profile null = login tapi BUKAN admin (tidak ada di admin_users / ditolak RLS).
export async function getAdminSession() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("admin_users")
    .select("id, full_name, role, created_at")
    .eq("id", user.id)
    .maybeSingle();

  return { supabase, user, profile };
}
