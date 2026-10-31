import { notFound } from "next/navigation";
import KnowledgeForm from "@/components/knowledge/KnowledgeForm";
import { getKnowledgeById } from "@/lib/dummy/knowledge";

export default async function EditKnowledgePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  // TODO (02.8): ganti dengan fetch by ID dari Supabase
  const item = getKnowledgeById(id);
  if (!item) notFound();

  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="mb-6 text-2xl font-semibold text-slate-900">Edit knowledge</h1>
      <KnowledgeForm mode="edit" initial={item} />
    </main>
  );
}
