import { createClient } from "@/lib/supabase/server";
import type { AiLog } from "@/types/ai-log";

export const AI_LOGS_PAGE_SIZE = 20;

export interface AiLogParams {
  q?: string;
  provider?: string;
  model?: string;
  status?: string;
  from?: string; // yyyy-mm-dd (WIB)
  to?: string; // yyyy-mm-dd (WIB)
  page?: number;
}

const DATE = /^\d{4}-\d{2}-\d{2}$/;

// Server-side: search, filter, date range, pagination. RLS membatasi baca hanya untuk admin.
export async function getAiLogs(p: AiLogParams) {
  const supabase = await createClient();
  const page = p.page && p.page > 0 ? p.page : 1;
  const from = (page - 1) * AI_LOGS_PAGE_SIZE;

  let query = supabase.from("ai_logs").select("*", { count: "exact" });

  const q = p.q?.trim();
  if (q) query = query.ilike("query", `%${q.replace(/[\\%_]/g, (m) => `\\${m}`)}%`);
  if (p.provider) query = query.eq("provider", p.provider);
  if (p.model) query = query.eq("model", p.model);
  if (p.status === "success" || p.status === "error") query = query.eq("status", p.status);
  if (p.from && DATE.test(p.from)) query = query.gte("created_at", `${p.from}T00:00:00+07:00`);
  if (p.to && DATE.test(p.to)) query = query.lte("created_at", `${p.to}T23:59:59.999+07:00`);

  const { data, count, error } = await query
    .order("created_at", { ascending: false })
    .range(from, from + AI_LOGS_PAGE_SIZE - 1);

  return {
    logs: (data ?? []) as AiLog[],
    total: count ?? 0,
    error: error?.message ?? null,
  };
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function getAiLogById(id: string) {
  if (!UUID.test(id)) return null;
  const supabase = await createClient();
  const { data } = await supabase.from("ai_logs").select("*").eq("id", id).maybeSingle();
  return (data as AiLog | null) ?? null;
}

// Pilihan dropdown filter diambil dari data yang ada
export async function getAiLogFilterOptions() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("ai_logs")
    .select("provider, model")
    .order("created_at", { ascending: false })
    .limit(1000);

  const providers = new Set<string>();
  const models = new Set<string>();
  (data ?? []).forEach((r: { provider: string | null; model: string | null }) => {
    if (r.provider) providers.add(r.provider);
    if (r.model) models.add(r.model);
  });
  return { providers: [...providers].sort(), models: [...models].sort() };
}
