import Link from "next/link";
import { formatDate } from "@/lib/knowledge/format";
import type { KnowledgeItem } from "@/types/knowledge";
import DeleteKnowledgeButton from "./DeleteKnowledgeButton";
import { StatusBadge } from "./StatusBadge";

export default function KnowledgeTable({ items }: { items: KnowledgeItem[] }) {
  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 p-10 text-center">
        <p className="font-medium text-slate-800">No knowledge found</p>
        <p className="mt-1 text-sm text-slate-600">
          Change the search or filters, or create a new knowledge item.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200">
      <table className="w-full min-w-[56rem] text-left text-sm">
        <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
          <tr>
            <th className="px-4 py-3 font-medium">Title</th>
            <th className="px-4 py-3 font-medium">Category</th>
            <th className="px-4 py-3 font-medium">Language</th>
            <th className="px-4 py-3 font-medium">Source</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Updated</th>
            <th className="px-4 py-3 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {items.map((k) => (
            <tr key={k.id} className="align-top">
            <td className="max-w-xs px-4 py-3 font-medium text-slate-900">
  <Link
    href={`/admin/knowledge/${k.id}`}
    className="line-clamp-2 rounded-sm hover:text-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-1"
  >
    {k.title}
  </Link>
</td>
              <td className="px-4 py-3 text-slate-700">{k.category ?? "-"}</td>
              <td className="px-4 py-3 uppercase text-slate-700">{k.language}</td>
              <td className="px-4 py-3 text-slate-700">{k.source_name ?? "-"}</td>
              <td className="px-4 py-3"><StatusBadge status={k.status} /></td>
              <td className="whitespace-nowrap px-4 py-3 text-slate-700">{formatDate(k.updated_at)}</td>
              <td className="whitespace-nowrap px-4 py-3">
                <Link href={`/admin/knowledge/${k.id}`} className="mr-3 rounded-sm text-emerald-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-1">View</Link>
                <Link href={`/admin/knowledge/${k.id}/edit`} className="mr-3 rounded-sm text-emerald-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-1">Edit</Link>
                <DeleteKnowledgeButton id={k.id} title={k.title} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
