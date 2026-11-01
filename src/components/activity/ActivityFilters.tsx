"use client";

import Form from "next/form";
import Link from "next/link";
import { ACTIVITY_ACTIONS } from "@/lib/activity/types";

export interface ActivityFilterValues {
  action: string;
  from: string;
  to: string;
}

const field =
  "rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600";

export default function ActivityFilters({ defaults }: { defaults: ActivityFilterValues }) {
  const submitOnChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) =>
    e.currentTarget.form?.requestSubmit();

  return (
    <Form action="/admin/activity" className="mb-6 flex flex-wrap items-center gap-3 text-sm text-slate-700">
      <select name="action" defaultValue={defaults.action} onChange={submitOnChange} aria-label="Filter by activity type" className={field}>
        <option value="">All activity types</option>
        {Object.entries(ACTIVITY_ACTIONS).map(([key, meta]) => (
          <option key={key} value={key}>{meta.label}</option>
        ))}
      </select>
      <label className="flex items-center gap-2">
        From
        <input type="date" name="from" defaultValue={defaults.from} onChange={submitOnChange} className={field} />
      </label>
      <label className="flex items-center gap-2">
        To
        <input type="date" name="to" defaultValue={defaults.to} onChange={submitOnChange} className={field} />
      </label>
      <button type="submit" className="rounded-md bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-900">Apply</button>
      <Link href="/admin/activity" className="px-2 py-2 text-slate-600 hover:underline">Reset</Link>
    </Form>
  );
}
