import Link from "next/link";
import { redirect } from "next/navigation";
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

  return (
    <main className="mx-auto max-w-3xl p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">Activity</h1>
        <p className="mt-1 text-sm text-slate-600">History of important admin actions: who did what, and to which resource.</p>
      </div>

      <ActivityFilters key={JSON.stringify(filters)} defaults={filters} />

      {error ? (
        <p role="alert" className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-800">
          Could not load activity: {error}
        </p>
      ) : (
        <>
          <ActivityTimeline logs={logs} />
          <div className="mt-6 flex items-center justify-between text-sm text-slate-600">
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
