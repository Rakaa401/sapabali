import { createClient } from "@/lib/supabase/server";
import type { Destination, KnowledgeItem, KnowledgeWithDestination } from "@/types/knowledge";

export const PAGE_SIZE = 10;

export interface ListParams {
  q?: string;
  category?: string;
  language?: string;
  status?: string;
  sort?: string;
  page?: number;
}

const SORTS: Record<string, { column: string; ascending: boolean }> = {
  updated_desc: { column: "updated_at", ascending: false },
  created_desc: { column: "created_at", ascending: false },
  title_asc: { column: "title", ascending: true },
};

// 02.4: list + search + filter + sort + pagination
export async function getKnowledgeList(p: ListParams) {
  const supabase = await createClient();
  const page = p.page && p.page > 0 ? p.page : 1;
  const from = (page - 1) * PAGE_SIZE;

  let query = supabase.from("knowledge_items").select("*", { count: "exact" });

  // buang karakter yang merusak sintaks filter PostgREST
  const q = p.q?.replace(/[,()%*\\]/g, " ").trim();
  if (q) query = query.or(`title.ilike.*${q}*,content.ilike.*${q}*`);
  if (p.category) query = query.eq("category", p.category);
  if (p.language) query = query.eq("language", p.language);
  if (p.status) query = query.eq("status", p.status);

  const sort = SORTS[p.sort ?? ""] ?? SORTS.updated_desc;
  const { data, count, error } = await query
    .order(sort.column, { ascending: sort.ascending })
    .range(from, from + PAGE_SIZE - 1);

  return {
    items: (data ?? []) as KnowledgeItem[],
    total: count ?? 0,
    error: error?.message ?? null,
  };
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function getKnowledgeById(id: string) {
  if (!UUID.test(id)) return null; // ID ngawur -> not found, bukan error 500
  const supabase = await createClient();
  const { data } = await supabase
    .from("knowledge_items")
    .select("*, destination:destinations(name)")
    .eq("id", id)
    .maybeSingle();
  return (data as KnowledgeWithDestination | null) ?? null;
}

export async function getDestinations() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("destinations")
    .select("id, name, slug, status")
    .order("name");
  return (data ?? []) as Destination[];
}
