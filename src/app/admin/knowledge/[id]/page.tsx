import Link from "next/link";
import { notFound } from "next/navigation";
import { IndexingBadge, StatusBadge } from "@/components/knowledge/StatusBadge";
import { formatDate, getDestinationName, getKnowledgeById } from "@/lib/dummy/knowledge";

export default async function KnowledgeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  // TODO (02.7): ganti dengan fetch by ID dari Supabase
  const item = getKnowledgeById(id);
  if (!item) notFound();

  return (
    <main className="mx-auto max-w-3xl p-6">
      <Link href="/admin/knowledge" className="text-sm text-emerald-700 hover:underline">Back to knowledge list</Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <h1 className="text-2xl font-semibold text-slate-900">{item.title}</h1>
        <div className="flex gap-2">
          <Link href={`/admin/knowledge/${item.id}/edit`} className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800">Edit</Link>
          {/* Dihubungkan di 02.10 dan 02.12 */}
          <button type="button" disabled className="rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-400">
            {item.status === "published" ? "Unpublish" : "Publish"}
          </button>
          <button type="button" disabled className="rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-400">Delete</button>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <StatusBadge status={item.status} />
        <IndexingBadge status={item.indexing_status} />
      </div>

      <article className="mt-6 whitespace-pre-line rounded-lg border border-slate-200 bg-white p-5 leading-relaxed text-slate-800">
        {item.content}
      </article>

      <dl className="mt-6 grid gap-x-6 gap-y-4 text-sm sm:grid-cols-2">
        <Meta label="Category" value={item.category} />
        <Meta label="Language" value={item.language === "id" ? "Indonesian" : "English"} />
        <Meta label="Destination" value={getDestinationName(item.destination_id)} />
        <Meta label="Indexing status" value={item.indexing_status} />
        <Meta label="Source name" value={item.source_name} />
        <Meta label="Source URL" value={item.source_url} />
        <Meta label="Source description" value={item.source_description} />
        <Meta label="Created" value={formatDate(item.created_at)} />
        <Meta label="Last updated" value={formatDate(item.updated_at)} />
      </dl>
    </main>
  );
}

function Meta({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <dt className="text-slate-500">{label}</dt>
      <dd className="mt-0.5 break-words font-medium text-slate-900">{value || "-"}</dd>
    </div>
  );
}
