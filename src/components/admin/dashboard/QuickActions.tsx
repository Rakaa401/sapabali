import Link from "next/link";
import { BookOpen, FolderPlus, Sparkles, ArrowUpRight } from "lucide-react";

const actions = [
  {
    title: "Manage Knowledge",
    description: "Create, edit, and organize entries.",
    href: "/admin/knowledge",
    icon: BookOpen,
  },
  {
    title: "Manage Categories",
    description: "Group information by topic.",
    href: "/admin/knowledge/categories",
    icon: FolderPlus,
  },
  {
    title: "AI Structuring",
    description: "Structure raw information with AI.",
    href: "/admin/ai-structuring",
    icon: Sparkles,
  },
];

export default function QuickActions() {
  return (
    <section className="h-full overflow-hidden rounded-xl border border-zinc-200 bg-white">
      <div className="border-b border-zinc-200 px-5 py-4">
        <h2 className="text-sm font-semibold text-zinc-950">Quick actions</h2>
        <p className="mt-0.5 text-xs text-zinc-500">
          Common tasks to manage your platform.
        </p>
      </div>

      <ul className="divide-y divide-zinc-100">
        {actions.map((action) => {
          const Icon = action.icon;

          return (
            <li key={action.href}>
              <Link
                href={action.href}
                className="group flex items-center gap-3.5 px-5 py-4 transition hover:bg-zinc-50"
              >
                <Icon size={18} className="shrink-0 text-emerald-700" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-zinc-900">
                    {action.title}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-zinc-500">
                    {action.description}
                  </p>
                </div>
                <ArrowUpRight
                  size={16}
                  className="shrink-0 text-zinc-300 transition group-hover:text-emerald-600"
                />
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}