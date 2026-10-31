import KnowledgeForm from "@/components/knowledge/KnowledgeForm";
import { getDestinations } from "@/lib/knowledge/queries";

export default async function NewKnowledgePage() {
  const destinations = await getDestinations();
  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="mb-6 text-2xl font-semibold text-slate-900">Create knowledge</h1>
      <KnowledgeForm mode="create" destinations={destinations} />
    </main>
  );
}
