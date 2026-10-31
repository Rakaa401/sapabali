import { createClient } from "@/lib/supabase/server";

export async function getDashboardData() {
  const supabase = await createClient();

  const [
    totalResult,
    publishedResult,
    draftResult,
    archivedResult,
    categoriesResult,
    recentResult,
  ] = await Promise.all([
    supabase
      .from("knowledge_items")
      .select("*", { count: "exact", head: true }),

    supabase
      .from("knowledge_items")
      .select("*", { count: "exact", head: true })
      .eq("status", "published"),

    supabase
      .from("knowledge_items")
      .select("*", { count: "exact", head: true })
      .eq("status", "draft"),

    supabase
      .from("knowledge_items")
      .select("*", { count: "exact", head: true })
      .eq("status", "archived"),

    supabase
      .from("knowledge_items")
      .select("category")
      .not("category", "is", null),

    supabase
      .from("knowledge_items")
      .select("id, title, category, status, updated_at")
      .order("updated_at", { ascending: false })
      .limit(5),
  ]);

  const errors = [
    totalResult.error,
    publishedResult.error,
    draftResult.error,
    archivedResult.error,
    categoriesResult.error,
    recentResult.error,
  ].filter(Boolean);

  if (errors.length > 0) {
    throw new Error("Failed to load dashboard data");
  }

  const categories = new Set(
    (categoriesResult.data ?? [])
      .map((item) => item.category?.trim())
      .filter((category): category is string => Boolean(category))
  );

  return {
    total: totalResult.count ?? 0,
    published: publishedResult.count ?? 0,
    draft: draftResult.count ?? 0,
    archived: archivedResult.count ?? 0,
    categories: categories.size,
    recent: recentResult.data ?? [],
  };
}