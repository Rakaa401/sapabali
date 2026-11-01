"use client";

import Form from "next/form";
import Link from "next/link";

export interface AiLogFilterValues {
  q: string;
  provider: string;
  model: string;
  status: string;
  from: string;
  to: string;
}

const field =
  "rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600";

export default function AiLogFilters({
  defaults,
  providers,
  models,
}: {
  defaults: AiLogFilterValues;
  providers: string[];
  models: string[];
}) {
  const submitOnChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) =>
    e.currentTarget.form?.requestSubmit();

  return (
    <Form action="/admin/ai-logs" className="mb-4 space-y-3">
      <div className="flex flex-wrap gap-3">
        <input type="search" name="q" defaultValue={defaults.q} placeholder="Search query" aria-label="Search query" className={`${field} min-w-64 flex-1`} />
        <select name="provider" defaultValue={defaults.provider} onChange={submitOnChange} aria-label="Filter by provider" className={field}>
          <option value="">All providers</option>
          {providers.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        <select name="model" defaultValue={defaults.model} onChange={submitOnChange} aria-label="Filter by model" className={field}>
          <option value="">All models</option>
          {models.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
        <select name="status" defaultValue={defaults.status} onChange={submitOnChange} aria-label="Filter by status" className={field}>
          <option value="">All statuses</option>
          <option value="success">Success</option>
          <option value="error">Failed</option>
        </select>
      </div>
      <div className="flex flex-wrap items-center gap-3 text-sm text-slate-700">
        <label className="flex items-center gap-2">
          From
          <input type="date" name="from" defaultValue={defaults.from} onChange={submitOnChange} className={field} />
        </label>
        <label className="flex items-center gap-2">
          To
          <input type="date" name="to" defaultValue={defaults.to} onChange={submitOnChange} className={field} />
        </label>
        <button type="submit" className="rounded-md bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-900">Search</button>
        <Link href="/admin/ai-logs" className="px-2 py-2 text-slate-600 hover:underline">Reset</Link>
      </div>
    </Form>
  );
}
