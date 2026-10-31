import Link from "next/link";
import KnowledgeFilters from "@/components/knowledge/KnowledgeFilters";
import KnowledgeTable from "@/components/knowledge/KnowledgeTable";
import { PAGE_SIZE, getKnowledgeList } from "@/lib/knowledge/queries";

type SearchParams = Record<string, string | string[] | undefined>;

export default async function KnowledgeListPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const get = (key: string) => {
    const v = sp[key];
    return (Array.isArray(v) ? v[0] : v) ?? "";
  };

  const filters = {
    q: get("q"),
    category: get("category"),
    language: get("language"),
    status: get("status"),
    sort: get("sort") || "updated_desc",
  };
  const page = Math.max(1, Number(get("page")) || 1);

  const { items, total, error } = await getKnowledgeList({ ...filters, page });
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function pageHref(target: number) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => v && params.set(k, v));
    params.set("page", String(target));
    return `/admin/knowledge?${params.toString()}`;
  }

  const first = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const last = Math.min(page * PAGE_SIZE, total);

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

      <KnowledgeFilters key={JSON.stringify(filters)} defaults={filters} />

      {error ? (
        <p role="alert" className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-800">
          Could not load knowledge: {error}
        </p>
      ) : (
        <>
          <KnowledgeTable items={items} />
          <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
            <span>Showing {first}-{last} of {total}</span>
            <div className="flex items-center gap-3">
              {page > 1 ? (
                <Link href={pageHref(page - 1)} className="text-emerald-700 hover:underline">Previous</Link>
              ) : (
                <span className="text-slate-400">Previous</span>
              )}
              <span>Page {page} of {totalPages}</span>
              {page < totalPages ? (
                <Link href={pageHref(page + 1)} className="text-emerald-700 hover:underline">Next</Link>
              ) : (
                <span className="text-slate-400">Next</span>
              )}
            </div>
          </div>
        </>
      )}
    </main>
  );
}
