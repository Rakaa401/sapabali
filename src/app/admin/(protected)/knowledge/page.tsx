import Link from "next/link";
import KnowledgeTable from "@/components/knowledge/KnowledgeTable";
import { DUMMY_KNOWLEDGE } from "@/lib/dummy/knowledge";

export default function KnowledgeListPage() {
  return (
    <main className="mx-auto max-w-6xl p-6">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Knowledge base</h1>
          <p className="mt-1 text-sm text-slate-600">Manage the information visitors and the AI guide rely on.</p>
        </div>
        <Link href="/admin/knowledge/new" className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800">
          Create knowledge
        </Link>
      </div>
      <KnowledgeTable initialItems={DUMMY_KNOWLEDGE} />
    </main>
  );
}
