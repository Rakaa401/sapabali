import { createClient } from "@/lib/supabase/server";
import { ACTIVITY_ACTIONS, type ActivityLog } from "./types";

export const ACTIVITY_PAGE_SIZE = 20;

export interface ActivityParams {
  action?: string;
  from?: string; // yyyy-mm-dd (WIB)
  to?: string; // yyyy-mm-dd (WIB)
  page?: number;
}

const DATE = /^\d{4}-\d{2}-\d{2}$/;

// Server-side: filter tipe, rentang tanggal, pagination. RLS membatasi baca hanya untuk admin.
export async function getActivityLogs(p: ActivityParams) {
  const supabase = await createClient();
  const page = p.page && p.page > 0 ? p.page : 1;
  const from = (page - 1) * ACTIVITY_PAGE_SIZE;

  let query = supabase.from("activity_logs").select("*", { count: "exact" });

  if (p.action && p.action in ACTIVITY_ACTIONS) query = query.eq("action", p.action);
  if (p.from && DATE.test(p.from)) query = query.gte("created_at", `${p.from}T00:00:00+07:00`);
  if (p.to && DATE.test(p.to)) query = query.lte("created_at", `${p.to}T23:59:59.999+07:00`);

  const { data, count, error } = await query
    .order("created_at", { ascending: false })
    .range(from, from + ACTIVITY_PAGE_SIZE - 1);

  return {
    logs: (data ?? []) as ActivityLog[],
    total: count ?? 0,
    error: error?.message ?? null,
  };
}
