import Link from "next/link";
import { formatLatency, formatNumber, formatWib, truncate } from "@/lib/ai-logs/format";
import type { AiLog } from "@/types/ai-log";
import AiLogStatusBadge from "./AiLogStatusBadge";

export default function AiLogTable({ logs }: { logs: AiLog[] }) {
  if (logs.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 p-10 text-center">
        <p className="font-medium text-slate-800">No AI requests found</p>
        <p className="mt-1 text-sm text-slate-600">
          Change the search or filters. Requests appear here once the AI features start logging.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200">
      <table className="w-full min-w-[64rem] text-left text-sm">
        <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
          <tr>
            <th className="px-4 py-3 font-medium">Time</th>
            <th className="px-4 py-3 font-medium">Query and response</th>
            <th className="px-4 py-3 font-medium">Provider / model</th>
            <th className="px-4 py-3 font-medium">Tokens</th>
            <th className="px-4 py-3 font-medium">Latency</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Details</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {logs.map((l) => (
            <tr key={l.id} className="align-top">
              <td className="whitespace-nowrap px-4 py-3 text-slate-700">{formatWib(l.created_at)}</td>
              <td className="max-w-md px-4 py-3">
                <p className="font-medium text-slate-900">{truncate(l.query, 120)}</p>
                {l.status === "error" ? (
                  <p className="mt-1 text-red-700">{truncate(l.error_message, 140) || "Request failed"}</p>
                ) : (
                  <p className="mt-1 text-slate-600">{truncate(l.response, 140) || "-"}</p>
                )}
              </td>
              <td className="px-4 py-3 text-slate-700">
                <div>{l.provider ?? "-"}</div>
                <div className="text-xs text-slate-500">{l.model ?? "-"}</div>
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-slate-700">
                <div>{formatNumber(l.total_tokens)}</div>
                <div className="text-xs text-slate-500">
                  in {formatNumber(l.prompt_tokens)} / out {formatNumber(l.completion_tokens)}
                </div>
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-slate-700">{formatLatency(l.latency_ms)}</td>
              <td className="px-4 py-3"><AiLogStatusBadge status={l.status} /></td>
              <td className="px-4 py-3">
                <Link href={`/admin/ai-logs/${l.id}`} className="text-emerald-700 hover:underline">View</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
