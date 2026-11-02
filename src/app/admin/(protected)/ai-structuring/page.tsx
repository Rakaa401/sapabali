import AiStructuringForm from "@/components/ai-structuring/AiStructuringForm";
import { createKnowledgeFromAi } from "@/lib/knowledge/actions/create-from-ai";
import { getDestinations } from "@/lib/knowledge/queries";
import { createClient } from "@/lib/supabase/server";

// Kategori wajib dipilih dari daftar yang sudah ada (sama seperti form manual).
async function getCategoryNames(): Promise<string[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("knowledge_categories")
    .select("name")
    .order("name", { ascending: true });

  if (error) {
    console.error("[AI STRUCTURING] Failed to load categories", error);
    return [];
  }

  return (data ?? []).map((category) => category.name as string);
}

export default async function AiStructuringPage() {
  const [destinations, categories] = await Promise.all([
    getDestinations(),
    getCategoryNames(),
  ]);

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

      <AiStructuringForm
        destinations={destinations}
        categories={categories}
        onSaveDraft={createKnowledgeFromAi}
      />
    </main>
  );
}