import { notFound } from "next/navigation";
import KnowledgeForm from "@/components/knowledge/KnowledgeForm";
import { getDestinations, getKnowledgeById } from "@/lib/knowledge/queries";
import { getKnowledgeCategories } from "@/lib/knowledge/categories";

export default async function EditKnowledgePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
const [item, destinations, categories] = await Promise.all([
  getKnowledgeById(id),
  getDestinations(),
  getKnowledgeCategories(),
]);
  if (!item) notFound();

  return (
    <main className="mx-auto ">
      <h1 className="mb-6 text-2xl font-semibold text-slate-900">Edit knowledge</h1>
      <KnowledgeForm mode="edit" initial={item} destinations={destinations} categories={categories} />
    </main>
  );
}
