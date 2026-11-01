import Link from "next/link";
import { formatWibDay, formatWibTime } from "@/lib/activity/format";
import { ACTIVITY_ACTIONS, type ActivityAction, type ActivityLog } from "@/lib/activity/types";

const RESOURCE_STYLE: Record<string, { badge: string; dot: string }> = {
  auth: { badge: "bg-slate-100 text-slate-700", dot: "bg-slate-400" },
  knowledge: { badge: "bg-emerald-100 text-emerald-800", dot: "bg-emerald-500" },
  destination: { badge: "bg-blue-100 text-blue-800", dot: "bg-blue-500" },
  settings: { badge: "bg-amber-100 text-amber-800", dot: "bg-amber-500" },
};

function actionLabel(action: string) {
  return ACTIVITY_ACTIONS[action as ActivityAction]?.label ?? action;
}

function identity(l: ActivityLog) {
  if (l.admin_name && l.admin_email) return `${l.admin_name} (${l.admin_email})`;
  return l.admin_name || l.admin_email || "System (no signed-in admin)";
}

function changedFields(l: ActivityLog): string | null {
  const v = l.metadata?.changed_fields;
  return Array.isArray(v) && v.length > 0 ? v.join(", ") : null;
}

export default function ActivityTimeline({ logs }: { logs: ActivityLog[] }) {
  if (logs.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 p-10 text-center">
        <p className="font-medium text-slate-800">No activity found</p>
        <p className="mt-1 text-sm text-slate-600">
          Change the filters, or perform an admin action such as editing knowledge.
        </p>
      </div>
    );
  }

  // kelompokkan per hari (WIB), urutan tetap terbaru di atas
  const groups: { day: string; items: ActivityLog[] }[] = [];
  for (const l of logs) {
    const day = formatWibDay(l.created_at);
    const last = groups[groups.length - 1];
    if (last && last.day === day) last.items.push(l);
    else groups.push({ day, items: [l] });
  }

  return (
    <div className="space-y-8">
      {groups.map((g) => (
        <section key={g.day}>
          <h2 className="mb-4 text-sm font-medium text-slate-500">{g.day}</h2>
          <ol className="relative ml-2 border-l border-slate-200">
            {g.items.map((l) => {
              const style = RESOURCE_STYLE[l.resource_type] ?? RESOURCE_STYLE.auth;
              const changed = changedFields(l);
              const canLink =
                l.resource_type === "knowledge" && l.resource_id && l.action !== "knowledge_deleted";
              return (
                <li key={l.id} className="mb-6 ml-6">
                  <span className={`absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full ring-4 ring-white ${style.dot}`} />
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${style.badge}`}>
                      {actionLabel(l.action)}
                    </span>
                    <time dateTime={l.created_at} className="text-xs text-slate-500">
                      {formatWibTime(l.created_at)}
                    </time>
                  </div>
                  <p className="mt-1 text-sm font-medium text-slate-900">{l.description}</p>
                  {changed && <p className="mt-0.5 text-xs text-slate-600">Changed: {changed}</p>}
                  <p className="mt-1 text-xs text-slate-600">
                    By {identity(l)}
                    {l.resource_label && (
                      <>
                        {" · "}
                        <span className="capitalize">{l.resource_type}</span>:{" "}
                        {canLink ? (
                          <Link href={`/admin/knowledge/${l.resource_id}`} className="text-emerald-700 hover:underline">
                            {l.resource_label}
                          </Link>
                        ) : (
                          l.resource_label
                        )}
                      </>
                    )}
                  </p>
                </li>
              );
            })}
          </ol>
        </section>
      ))}
    </div>
  );
}
