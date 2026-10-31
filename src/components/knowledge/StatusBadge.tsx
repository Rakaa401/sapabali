import type { IndexingStatus, KnowledgeStatus } from "@/types/knowledge";

const STATUS_STYLE: Record<KnowledgeStatus, string> = {
  draft: "bg-amber-100 text-amber-800",
  published: "bg-emerald-100 text-emerald-800",
  unpublished: "bg-slate-200 text-slate-700",
};

const INDEXING_STYLE: Record<IndexingStatus, string> = {
  pending: "bg-slate-100 text-slate-600",
  indexing: "bg-blue-100 text-blue-800",
  indexed: "bg-emerald-100 text-emerald-800",
  failed: "bg-red-100 text-red-800",
  stale: "bg-orange-100 text-orange-800",
};

const base = "inline-block rounded-full px-2.5 py-0.5 text-xs font-medium capitalize";

export function StatusBadge({ status }: { status: KnowledgeStatus }) {
  return <span className={`${base} ${STATUS_STYLE[status]}`}>{status}</span>;
}

export function IndexingBadge({ status }: { status: IndexingStatus }) {
  return <span className={`${base} ${INDEXING_STYLE[status]}`}>{status}</span>;
}
