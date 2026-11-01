
import AiStructuringForm from "@/components/ai-structuring/AiStructuringForm";
import { getDestinations } from "@/lib/knowledge/queries";

export default async function AiStructuringPage() {
  const destinations = await getDestinations();

  return (
    <main className="mx-auto space-y-6">
      <div>
        <div className="mb-2 flex items-center gap-2 text-sm font-medium text-emerald-700">
          <span>AI Tools</span>
          <span className="text-slate-400">/</span>
          <span>Knowledge Structuring</span>
        </div>
        <h1 className="text-2xl font-semibold text-slate-950">
          AI Knowledge Structuring
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
          Transform raw information into structured knowledge for the SapaBali knowledge base.
        </p>
      </div>

      <AiStructuringForm destinations={destinations} />
    </main>
  );
}
