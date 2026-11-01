
import { createClient } from "@/lib/supabase/server";

export interface KnowledgeCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  knowledge_count: number;
}

export async function getKnowledgeCategories() {
  const supabase = await createClient();

  const [categoryResult, knowledgeResult] = await Promise.all([
    supabase
      .from("knowledge_categories")
      .select("*")
      .order("name", { ascending: true }),
    supabase
      .from("knowledge_items")
      .select("category"),
  ]);

  if (categoryResult.error) {
    throw new Error(categoryResult.error.message);
  }

  if (knowledgeResult.error) {
    throw new Error(knowledgeResult.error.message);
  }

  const counts = new Map<string, number>();

  for (const item of knowledgeResult.data ?? []) {
    if (item.category) {
      counts.set(item.category, (counts.get(item.category) ?? 0) + 1);
    }
  }

  return (categoryResult.data ?? []).map((category) => ({
    ...category,
    knowledge_count: counts.get(category.name) ?? 0,
  })) as KnowledgeCategory[];
}
