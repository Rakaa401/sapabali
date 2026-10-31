import Link from "next/link";
import { ArrowRight, FileText } from "lucide-react";
import Badge from "@/components/ui/badge";

type KnowledgeItem = {
  id: string;
  title: string;
  category: string | null;
  status: string;
  updated_at: string;
};

export default function RecentKnowledge({
  items,
}: {
  items: KnowledgeItem[];
}) {
  const statusVariants = {
    published: "success",
    draft: "warning",
    archived: "default",
  } as const;

  return (
    <section className="h-full overflow-hidden rounded-xl border border-zinc-200 bg-white">
      <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4">
        <div>
          <h2 className="text-sm font-semibold text-zinc-950">
            Recent updates
          </h2>
          <p className="mt-0.5 text-xs text-zinc-500">
            Latest changes across your knowledge base.
          </p>
        </div>

        <Link
          href="/admin/knowledge"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700 hover:text-emerald-800"
        >
          View all
          <ArrowRight size={14} />
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center px-5 py-16 text-center">
          <div className="rounded-full border border-dashed border-zinc-300 p-3">
            <FileText size={20} className="text-zinc-400" />
          </div>
          <p className="mt-4 text-sm font-medium text-zinc-800">
            No knowledge entries yet
          </p>
          <p className="mt-1 max-w-xs text-sm text-zinc-500">
            Entries you create or edit will show up here.
          </p>
          <Link
            href="/admin/knowledge/new"
            className="mt-5 text-sm font-medium text-emerald-700 hover:text-emerald-800"
          >
            Create the first entry →
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-100 text-xs text-zinc-400">
                <th className="px-5 py-2.5 font-medium">Title</th>
                <th className="px-5 py-2.5 font-medium">Category</th>
                <th className="px-5 py-2.5 font-medium">Status</th>
                <th className="px-5 py-2.5 text-right font-medium">
                  Updated
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-zinc-50">
                  <td className="px-5 py-3 font-medium text-zinc-900">
                    {item.title}
                  </td>
                  <td className="px-5 py-3 text-zinc-500">
                    {item.category || "Uncategorized"}
                  </td>
                  <td className="px-5 py-3">
                    <Badge
                      variant={
                        statusVariants[
                          item.status as keyof typeof statusVariants
                        ] ?? "default"
                      }
                    >
                      {item.status}
                    </Badge>
                  </td>
                  <td className="px-5 py-3 text-right text-zinc-400">
                    {new Date(item.updated_at).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}