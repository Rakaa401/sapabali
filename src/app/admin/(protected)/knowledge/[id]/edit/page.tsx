import { notFound } from "next/navigation";
import KnowledgeForm from "@/components/knowledge/KnowledgeForm";
import { getDestinations, getKnowledgeById } from "@/lib/knowledge/queries";

export default async function EditKnowledgePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [item, destinations] = await Promise.all([getKnowledgeById(id), getDestinations()]);
  if (!item) notFound();

  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="mb-6 text-2xl font-semibold text-slate-900">Edit knowledge</h1>
      <KnowledgeForm mode="edit" initial={item} destinations={destinations} />
    </main>
  );
}
