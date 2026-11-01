import KnowledgeForm from "@/components/knowledge/KnowledgeForm";
import { getDestinations } from "@/lib/knowledge/queries";
import { getKnowledgeCategories } from "@/lib/knowledge/categories";

export default async function NewKnowledgePage() {
  const [destinations, categories] = await Promise.all([
    getDestinations(),
    getKnowledgeCategories(),
  ]);

  return (
    <main className="mx-auto  space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Create knowledge</h1>
      </div>
      <KnowledgeForm
        mode="create"
        destinations={destinations}
        categories={categories}
      />
    </main>
  );
}