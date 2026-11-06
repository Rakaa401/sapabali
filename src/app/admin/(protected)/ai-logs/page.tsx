import Link from "next/link";
import { redirect } from "next/navigation";
import NoAccess from "@/components/admin/NoAccess";
import AiLogFilters from "@/components/ai-logs/AiLogFilters";
import AiLogTable from "@/components/ai-logs/AiLogTable";
import { getAdminSession } from "@/lib/admin/session";
import {
  AI_LOGS_PAGE_SIZE,
  getAiLogFilterOptions,
  getAiLogs,
} from "@/lib/ai-logs/queries";

type SearchParams = Record<string, string | string[] | undefined>;

export default async function AiLogsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  // Hanya admin: belum login -> login, bukan admin -> ditolak
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  if (!session.profile) return <NoAccess what="AI logs" />;

  const sp = await searchParams;
  const get = (key: string) => {
    const v = sp[key];
    return (Array.isArray(v) ? v[0] : v) ?? "";
  };

  const filters = {
    q: get("q"),
    provider: get("provider"),
    model: get("model"),
    status: get("status"),
    from: get("from"),
    to: get("to"),
  };
  const page = Math.max(1, Number(get("page")) || 1);

  const [{ logs, total, error }, options] = await Promise.all([
    getAiLogs({ ...filters, page }),
    getAiLogFilterOptions(),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / AI_LOGS_PAGE_SIZE));

  function pageHref(target: number) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => v && params.set(k, v));
    params.set("page", String(target));
    return `/admin/ai-logs?${params.toString()}`;
  }

  const first = total === 0 ? 0 : (page - 1) * AI_LOGS_PAGE_SIZE + 1;
  const last = Math.min(page * AI_LOGS_PAGE_SIZE, total);

  return (
    <main className="mx-auto w-full max-w-6xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">AI logs</h1>
        <p className="mt-1 text-sm text-slate-600">
          Inspect AI request history: queries, responses, token usage, and
          errors.
        </p>
      </div>

      <AiLogFilters
        key={JSON.stringify(filters)}
        defaults={filters}
        providers={options.providers}
        models={options.models}
      />

      {error ? (
        <p
          role="alert"
          className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          Could not load AI logs: {error}
        </p>
      ) : (
        <>
          <AiLogTable logs={logs} />
          <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
            <span>
              Showing {first}-{last} of {total}
            </span>
            <div className="flex items-center gap-3">
              {page > 1 ? (
                <Link
                  href={pageHref(page - 1)}
                  className="text-emerald-700 hover:underline"
                >
                  Previous
                </Link>
              ) : (
                <span className="text-slate-400">Previous</span>
              )}
              <span>
                Page {page} of {totalPages}
              </span>
              {page < totalPages ? (
                <Link
                  href={pageHref(page + 1)}
                  className="text-emerald-700 hover:underline"
                >
                  Next
                </Link>
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
