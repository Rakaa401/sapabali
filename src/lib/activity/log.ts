import type { createClient } from "@/lib/supabase/server";
import type { AppActivityAction } from "./types";

type ServerClient = Awaited<ReturnType<typeof createClient>>;

// Service pencatat aktivitas level aplikasi (login, logout, settings).
// Best-effort: kalau gagal mencatat, aksi utamanya tetap jalan.
export async function logActivity(
  supabase: ServerClient,
  entry: {
    action: AppActivityAction;
    description: string;
    resourceLabel?: string;
    metadata?: Record<string, unknown>;
  },
) {
  try {
    const { error } = await supabase.rpc("log_admin_activity", {
      p_action: entry.action,
      p_description: entry.description,
      p_resource_label: entry.resourceLabel ?? null,
      p_metadata: entry.metadata ?? {},
    });
    if (error) console.error("[activity-log]", error.message);
  } catch (e) {
    console.error("[activity-log]", e);
  }
}
