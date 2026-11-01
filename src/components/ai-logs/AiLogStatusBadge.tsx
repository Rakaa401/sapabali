import type { AiLogStatus } from "@/types/ai-log";

export default function AiLogStatusBadge({ status }: { status: AiLogStatus }) {
  const style = status === "success" ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800";
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${style}`}>
      {status === "error" ? "failed" : status}
    </span>
  );
}
