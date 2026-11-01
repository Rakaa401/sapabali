import KnowledgeForm from "@/components/knowledge/KnowledgeForm";
import { getDestinations } from "@/lib/knowledge/queries";

export default async function NewKnowledgePage() {
  const destinations = await getDestinations();

  return (
    <main className="p-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">Create knowledge</h1>
        <p className="mt-1 text-sm text-slate-600">
          Add an entry to the knowledge base. New entries are saved as drafts.
        </p>
      </header>

      <KnowledgeForm mode="create" destinations={destinations} />
    </main>
  );
}