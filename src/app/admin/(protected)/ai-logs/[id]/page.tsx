import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import NoAccess from "@/components/admin/NoAccess";
import AiLogStatusBadge from "@/components/ai-logs/AiLogStatusBadge";
import { getAdminSession } from "@/lib/admin/session";
import { formatLatency, formatNumber, formatWib } from "@/lib/ai-logs/format";
import { getAiLogById } from "@/lib/ai-logs/queries";

export default async function AiLogDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  if (!session.profile) return <NoAccess what="AI logs" />;

  const { id } = await params;
  const log = await getAiLogById(id);
  if (!log) notFound();

  const hasMetadata = Object.keys(log.metadata ?? {}).length > 0;

  return (
    <main className="mx-auto space-y-6 ">
      <Link href="/admin/ai-logs" className="text-sm text-emerald-700 hover:underline">Back to AI logs</Link>

      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold text-slate-900">AI request</h1>
        <AiLogStatusBadge status={log.status} />
      </div>

      <Block title="User query">{log.query}</Block>

      {log.status === "error" ? (
        <Block title="Error message" tone="error">{log.error_message || "Request failed (no message recorded)."}</Block>
      ) : (
        <Block title="AI response">{log.response || "-"}</Block>
      )}

      <dl className="grid gap-x-6 gap-y-4 text-sm sm:grid-cols-2">
        <Meta label="Time" value={formatWib(log.created_at)} />
        <Meta label="Latency" value={formatLatency(log.latency_ms)} />
        <Meta label="Provider" value={log.provider ?? "-"} />
        <Meta label="Model" value={log.model ?? "-"} />
        <Meta label="Prompt tokens" value={formatNumber(log.prompt_tokens)} />
        <Meta label="Completion tokens" value={formatNumber(log.completion_tokens)} />
        <Meta label="Total tokens" value={formatNumber(log.total_tokens)} />
        <Meta label="User ID" value={log.user_id ?? "-"} />
        <Meta label="Log ID" value={log.id} />
      </dl>

      {hasMetadata && (
        <section>
          <h2 className="mb-2 text-sm font-medium text-slate-700">Metadata</h2>
          <pre className="overflow-x-auto rounded-lg border border-slate-200 bg-slate-50 p-4 text-xs text-slate-800">
            {JSON.stringify(log.metadata, null, 2)}
          </pre>
        </section>
      )}
    </main>
  );
}

function Block({
  title,
  tone,
  children,
}: {
  title: string;
  tone?: "error";
  children: React.ReactNode;
}) {
  const box = tone === "error" ? "border-red-200 bg-red-50 text-red-900" : "border-slate-200 bg-white text-slate-800";
  return (
    <section>
      <h2 className="mb-2 text-sm font-medium text-slate-700">{title}</h2>
      <div className={`whitespace-pre-wrap break-words rounded-lg border p-4 text-sm leading-relaxed ${box}`}>{children}</div>
    </section>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-slate-500">{label}</dt>
      <dd className="mt-0.5 break-words font-medium text-slate-900">{value}</dd>
    </div>
  );
}
