import Link from "next/link";
import { notFound } from "next/navigation";
import DeleteKnowledgeButton from "@/components/knowledge/DeleteKnowledgeButton";
import { IndexingBadge, StatusBadge } from "@/components/knowledge/StatusBadge";
import { formatDate } from "@/lib/knowledge/format";
import { getKnowledgeById } from "@/lib/knowledge/queries";
import { KnowledgePublicationActions } from "@/components/knowledge/KnowledgePublicationActions";

const primaryBtn =
  "inline-flex h-9 shrink-0 items-center justify-center whitespace-nowrap rounded-md bg-emerald-700 px-4 text-sm font-medium text-white hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2";

const secondaryBtn =
  "inline-flex h-9 shrink-0 items-center justify-center whitespace-nowrap rounded-md border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400 disabled:hover:bg-white";

const dangerBtn =
  "inline-flex h-9 shrink-0 items-center justify-center whitespace-nowrap rounded-md border border-red-300 bg-white px-4 text-sm font-medium text-red-700 hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 disabled:opacity-60";

export default async function KnowledgeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const item = await getKnowledgeById(id);
  if (!item) notFound();

  return (
    <main className="">
      <Link
        href="/admin/knowledge"
        className="inline-flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-slate-900"
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-4 w-4"
        >
          <path d="M12.5 5l-5 5 5 5" />
        </svg>
        Knowledge list
      </Link>

      {/* Header */}
      <header className="mb-5 mt-3 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold text-slate-900">{item.title}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <StatusBadge status={item.status} />
            <IndexingBadge status={item.indexing_status} />
          </div>
        </div>

        <div className="flex w-full flex-wrap items-center gap-2 md:w-auto">
          <Link href={`/admin/knowledge/${item.id}/edit`} className={primaryBtn}>
            Edit
          </Link>
   <KnowledgePublicationActions
   indexingStatus={item.indexing_status}
  id={item.id}
  status={item.status}
  primaryClassName={primaryBtn}
  secondaryClassName={secondaryBtn}
/>
          <DeleteKnowledgeButton
            id={item.id}
            title={item.title}
            redirectTo="/admin/knowledge"
            className={dangerBtn}
          />
        </div>
      </header>

      <div className="space-y-5">
        {/* Ringkasan: semua info singkat sebaris */}
        <section className="grid gap-x-6 gap-y-4 rounded-md border border-slate-200 bg-white p-4 sm:grid-cols-2 md:grid-cols-5">
          <Meta label="Category" value={item.category} />
          <Meta
            label="Language"
            value={item.language === "id" ? "Indonesian" : "English"}
          />
          <Meta label="Destination" value={item.destination?.name ?? null} />
          <Meta label="Created" value={formatDate(item.created_at)} />
          <Meta label="Last updated" value={formatDate(item.updated_at)} />
        </section>

        <div className="grid gap-5 md:grid-cols-3 md:items-start">
          {/* Content */}
          <section className="rounded-md border border-slate-200 bg-white md:col-span-2">
            <h2 className="border-b border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-900">
              Content
            </h2>
            <article className="whitespace-pre-line p-4 leading-relaxed text-slate-800">
              {item.content}
            </article>
          </section>

          {/* Source */}
          <section className="rounded-md border border-slate-200 bg-white">
            <h2 className="border-b border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-900">
              Source
            </h2>
            <div className="space-y-4 p-4">
              <Meta label="Name" value={item.source_name} />
              <Meta label="URL" value={item.source_url} href={item.source_url} />
              <Meta label="Description" value={item.source_description} />
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

function Meta({
  label,
  value,
  href,
}: {
  label: string;
  value: string | null;
  href?: string | null;
}) {
  return (
    <dl className="min-w-0 text-sm">
      <dt className="text-slate-500">{label}</dt>
      <dd className="mt-0.5 break-words font-medium text-slate-900">
        {value && href ? (
          <a
            href={href}
            target="_blank"
            rel="noreferrer"
            className="text-emerald-700 hover:underline"
          >
            {value}
          </a>
        ) : (
          value || "-"
        )}
      </dd>
    </dl>
  );
}