import { createClient } from "@/lib/supabase/server";
import type { KnowledgeFormValues } from "@/types/knowledge";
import type { FieldErrors } from "./validation";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export type AdminClientResult =
  | { error: string }
  | { supabase: SupabaseServerClient };

export type ActionResult =
  | { ok: true; id: string }
  | { ok: false; error: string; fieldErrors?: FieldErrors };

export async function getAdminClient(): Promise<AdminClientResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  const { data: isAdmin, error } = await supabase.rpc("is_admin");
  if (error || !isAdmin) return { error: "You do not have permission to do this." };

  return { supabase };
}

const orNull = (s: string) => (s.trim() ? s.trim() : null);

export function toDbValues(v: KnowledgeFormValues) {
  return {
    title: v.title.trim(),
    content: v.content.trim(),
    category: v.category,
    language: v.language,
    destination_id: v.destination_id,
    source_name: orNull(v.source_name),
    source_url: orNull(v.source_url),
    source_description: orNull(v.source_description),
  };
}