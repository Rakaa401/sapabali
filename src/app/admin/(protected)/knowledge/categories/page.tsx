
import KnowledgeCategoryManager from "@/components/knowledge/KnowledgeCategoryManager";
import { getKnowledgeCategories } from "@/lib/knowledge/categories";

export default async function KnowledgeCategoriesPage() {
  const categories = await getKnowledgeCategories();

  return (
    <main className="mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">
          Knowledge Categories
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Manage categories used to organize your knowledge base.
        </p>
      </div>

      <KnowledgeCategoryManager categories={categories} />
    </main>
  );
}
