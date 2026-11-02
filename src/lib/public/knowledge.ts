import { createClient } from "@/lib/supabase/server";

export type PublicLanguage = "id" | "en";

// Hanya field yang aman dilihat pengunjung.
// TIDAK ada: status, indexing_status, metadata, source_type, slug internal, created_at, destination_id.
export interface PublicKnowledgeItem {
  id: string;
  title: string;
  excerpt: string;
  category: string | null;
  language: PublicLanguage;
  source_name: string | null;
  source_url: string | null;
  updated_at: string;
}

export interface PublicKnowledgeDetail {
  id: string;
  title: string;
  content: string;
  category: string | null;
  language: PublicLanguage;
  source_name: string | null;
  source_url: string | null;
  updated_at: string;
}

export interface PublicKnowledgeQuery {
  destinationSlug: string;
  language?: string;
  category?: string;
  page?: number;
  pageSize?: number;
}

export interface PublicKnowledgePage {
  items: PublicKnowledgeItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export const PUBLIC_PAGE_SIZE = 12;
const MAX_PAGE_SIZE = 50;

// destinations!inner = baris knowledge hanya ikut kalau destinasinya cocok dengan filter di bawah
const LIST_COLUMNS =
  "id, title, content, category, language, source_name, source_url, updated_at, destinations!inner(slug, status)";

interface Row {
  id: string;
  title: string;
  content: string;
  category: string | null;
  language: PublicLanguage;
  source_name: string | null;
  source_url: string | null;
  updated_at: string;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function normalizeLanguage(value?: string): PublicLanguage | undefined {
  return value === "id" || value === "en" ? value : undefined;
}

function validSlug(slug: string) {
  return slug.length > 0 && slug.length <= 200;
}

function toExcerpt(content: string, max = 200) {
  const flat = content.replace(/\s+/g, " ").trim();
  return flat.length > max ? `${flat.slice(0, max).trimEnd()}...` : flat;
}

function emptyPage(page: number, pageSize: number): PublicKnowledgePage {
  return { items: [], total: 0, page, pageSize, totalPages: 1 };
}

// Daftar knowledge untuk halaman publik: hanya Published, hanya dari destinasi Published.
// Filter status ditulis eksplisit karena admin yang sedang login bisa membaca draft lewat RLS.
export async function getPublicKnowledgeList(q: PublicKnowledgeQuery): Promise<PublicKnowledgePage> {
  const pageSize = Math.min(Math.max(Math.floor(q.pageSize ?? PUBLIC_PAGE_SIZE) || PUBLIC_PAGE_SIZE, 1), MAX_PAGE_SIZE);
  const page = q.page && q.page > 0 ? Math.floor(q.page) : 1;
  if (!validSlug(q.destinationSlug)) return emptyPage(page, pageSize);

  const from = (page - 1) * pageSize;
  const supabase = await createClient();

  let query = supabase
    .from("knowledge_items")
    .select(LIST_COLUMNS, { count: "exact" })
    .eq("status", "published")
    .eq("destinations.slug", q.destinationSlug)
    .eq("destinations.status", "published");

  const language = normalizeLanguage(q.language);
  if (language) query = query.eq("language", language);

  const category = q.category?.trim();
  if (category && category.length <= 100) query = query.eq("category", category);

  const { data, count, error } = await query
    .order("updated_at", { ascending: false })
    .order("id")
    .range(from, from + pageSize - 1);

  // error database dilempar, bukan dianggap "kosong", supaya tidak menyesatkan pengunjung
  if (error) throw new Error("Could not load knowledge.");

  const total = count ?? 0;
  const items = ((data ?? []) as unknown as Row[]).map((r) => ({
    id: r.id,
    title: r.title,
    excerpt: toExcerpt(r.content),
    category: r.category,
    language: r.language,
    source_name: r.source_name,
    source_url: r.source_url,
    updated_at: r.updated_at,
  }));

  return { items, total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
}

// Satu knowledge lengkap (dipakai halaman detail 05.4). Aturan filternya sama dengan daftar.
export async function getPublicKnowledgeItem(
  destinationSlug: string,
  id: string,
): Promise<PublicKnowledgeDetail | null> {
  if (!validSlug(destinationSlug) || !UUID.test(id)) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("knowledge_items")
    .select(LIST_COLUMNS)
    .eq("id", id)
    .eq("status", "published")
    .eq("destinations.slug", destinationSlug)
    .eq("destinations.status", "published")
    .maybeSingle();

  if (error) throw new Error("Could not load knowledge.");
  if (!data) return null;

  const r = data as unknown as Row;
  return {
    id: r.id,
    title: r.title,
    content: r.content,
    category: r.category,
    language: r.language,
    source_name: r.source_name,
    source_url: r.source_url,
    updated_at: r.updated_at,
  };
}

// Kategori yang punya konten published + jumlahnya (untuk navigasi kategori di 05.3)
export async function getPublicKnowledgeCategories(destinationSlug: string, language?: string) {
  if (!validSlug(destinationSlug)) return [];

  const supabase = await createClient();
  let query = supabase
    .from("knowledge_items")
    .select("category, destinations!inner(slug, status)")
    .eq("status", "published")
    .eq("destinations.slug", destinationSlug)
    .eq("destinations.status", "published")
    .not("category", "is", null)
    .limit(1000);

  const lang = normalizeLanguage(language);
  if (lang) query = query.eq("language", lang);

  const { data, error } = await query;
  if (error) throw new Error("Could not load categories.");

  const counts = new Map<string, number>();
  for (const r of (data ?? []) as unknown as { category: string }[]) {
    counts.set(r.category, (counts.get(r.category) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => a.category.localeCompare(b.category));
}
