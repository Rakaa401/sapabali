import {
  BookOpen,
  CheckCircle2,
  FileEdit,
  Archive,
  Layers3,
} from "lucide-react";
import DashboardHeader from "@/components/admin/dashboard/DashboardHeader";
import StatCard from "@/components/admin/dashboard/StatCard";
import RecentKnowledge from "@/components/admin/dashboard/RecentKnowledge";
import QuickActions from "@/components/admin/dashboard/QuickActions";
import { getDashboardData } from "@/lib/dashboard/queries";

export default async function AdminPage() {
  const stats = await getDashboardData();

  const statistics = [
    {
      title: "Total",
      value: stats.total,
      description: "All knowledge entries",
      icon: BookOpen,
    },
    {
      title: "Published",
      value: stats.published,
      description: "Visible to visitors",
      icon: CheckCircle2,
      dotClassName: "bg-emerald-500",
    },
    {
      title: "Draft",
      value: stats.draft,
      description: "Work in progress",
      icon: FileEdit,
      dotClassName: "bg-amber-400",
    },
    {
      title: "Unpublished",
      value: stats.archived,
      description: "Archived entries",
      icon: Archive,
      dotClassName: "bg-zinc-400",
    },
    {
      title: "Categories",
      value: stats.categories,
      description: "Knowledge groups",
      icon: Layers3,
    },
  ];

  const distribution = [
    {
      label: "Published",
      value: stats.published,
      className: "bg-emerald-500",
    },
    {
      label: "Draft",
      value: stats.draft,
      className: "bg-amber-400",
    },
    {
      label: "Unpublished",
      value: stats.archived,
      className: "bg-zinc-300",
    },
  ];

  const total = stats.published + stats.draft + stats.archived;

  return (
    <div className="mx-auto w-full space-y-6">
      <DashboardHeader />

      <section className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
        <div className="grid grid-cols-2 gap-px bg-zinc-200 lg:grid-cols-5">
          {statistics.map((stat) => (
            <StatCard
              key={stat.title}
              {...stat}
              className="last:col-span-2 lg:last:col-span-1"
            />
          ))}
        </div>

        <div className="space-y-3 border-t border-zinc-200 px-5 py-4">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-zinc-700">
              Content status
            </span>
            <span className="text-zinc-400">{total} entries</span>
          </div>

          <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-zinc-100">
            {total > 0 &&
              distribution.map((item) => (
                <div
                  key={item.label}
                  className={item.className}
                  style={{
                    width: `${(item.value / total) * 100}%`,
                  }}
                />
              ))}
          </div>

          <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-zinc-500">
            {distribution.map((item) => (
              <span
                key={item.label}
                className="inline-flex items-center gap-1.5"
              >
                <span
                  className={`size-1.5 rounded-full ${item.className}`}
                />
                {item.label}
                <span className="tabular-nums text-zinc-400">
                  {item.value}
                </span>
              </span>
            ))}
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RecentKnowledge items={stats.recent} />
        </div>
        <QuickActions />
      </div>
    </div>
  );
}