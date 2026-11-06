import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeft, ChevronRight, History } from "lucide-react";
import NoAccess from "@/components/admin/NoAccess";
import ActivityFilters from "@/components/activity/ActivityFilters";
import ActivityTimeline from "@/components/activity/ActivityTimeline";
import { ACTIVITY_PAGE_SIZE, getActivityLogs } from "@/lib/activity/queries";
import { getAdminSession } from "@/lib/admin/session";

type SearchParams = Record<string, string | string[] | undefined>;

export default async function ActivityPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  // Hanya admin: belum login -> login, bukan admin -> ditolak
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  if (!session.profile) return <NoAccess what="activity logs" />;

  const sp = await searchParams;
  const get = (key: string) => {
    const v = sp[key];
    return (Array.isArray(v) ? v[0] : v) ?? "";
  };

  const filters = { action: get("action"), from: get("from"), to: get("to") };
  const page = Math.max(1, Number(get("page")) || 1);

  const { logs, total, error } = await getActivityLogs({ ...filters, page });
  const totalPages = Math.max(1, Math.ceil(total / ACTIVITY_PAGE_SIZE));

  function pageHref(target: number) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => v && params.set(k, v));
    params.set("page", String(target));
    return `/admin/activity?${params.toString()}`;
  }

  const first = total === 0 ? 0 : (page - 1) * ACTIVITY_PAGE_SIZE + 1;
  const last = Math.min(page * ACTIVITY_PAGE_SIZE, total);
  const hasFilters = Object.values(filters).some(Boolean);

  const pagerBtn =
    "inline-flex h-8 items-center gap-1 rounded-lg border px-3 text-sm font-medium transition-colors";
  const pagerActive =
    "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 hover:text-emerald-700";
  const pagerDisabled =
    "cursor-not-allowed border-zinc-100 bg-zinc-50 text-zinc-300";

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      {/* Header */}
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
            Activity
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            History of important admin actions: who did what, and to which
            resource.
          </p>
        </div>
        {!error && (
          <span className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs tabular-nums text-zinc-500">
            {total} {total === 1 ? "entry" : "entries"}
          </span>
        )}
      </header>

      {/* Filters */}
      <section className="rounded-xl border border-zinc-200 bg-white p-4">
        <ActivityFilters key={JSON.stringify(filters)} defaults={filters} />
      </section>

      {/* Content */}
      {error ? (
        <p
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          Could not load activity: {error}
        </p>
      ) : logs.length === 0 ? (
        <section className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-300 bg-white px-6 py-16 text-center">
          <History size={28} className="text-zinc-300" />
          <p className="text-sm font-medium text-zinc-700">
            No activity found
          </p>
          <p className="text-xs text-zinc-500">
            {hasFilters
              ? "Try changing or clearing the filters."
              : "Admin actions will show up here."}
          </p>
          {hasFilters && (
            <Link
              href="/admin/activity"
              className="mt-2 text-sm font-medium text-emerald-700 hover:underline"
            >
              Clear filters
            </Link>
          )}
        </section>
      ) : (
        <section className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
          <div className="p-5">
            <ActivityTimeline logs={logs} />
          </div>

          {/* Pagination */}
          <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-200 bg-zinc-50/60 px-5 py-3 text-sm text-zinc-500">
            <span className="tabular-nums">
              Showing {first}-{last} of {total}
            </span>

            <nav aria-label="Pagination" className="flex items-center gap-2">
              {page > 1 ? (
                <Link
                  href={pageHref(page - 1)}
                  className={`${pagerBtn} ${pagerActive}`}
                >
                  <ChevronLeft size={14} /> Previous
                </Link>
              ) : (
                <span aria-disabled="true" className={`${pagerBtn} ${pagerDisabled}`}>
                  <ChevronLeft size={14} /> Previous
                </span>
              )}

              <span className="px-1 tabular-nums text-xs">
                {page} / {totalPages}
              </span>

              {page < totalPages ? (
                <Link
                  href={pageHref(page + 1)}
                  className={`${pagerBtn} ${pagerActive}`}
                >
                  Next <ChevronRight size={14} />
                </Link>
              ) : (
                <span aria-disabled="true" className={`${pagerBtn} ${pagerDisabled}`}>
                  Next <ChevronRight size={14} />
                </span>
              )}
            </nav>
          </footer>
        </section>
      )}
    </div>
  );
}