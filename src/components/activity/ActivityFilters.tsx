"use client";

import Form from "next/form";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { ACTIVITY_ACTIONS } from "@/lib/activity/types";

export interface ActivityFilterValues {
  action: string;
  from: string;
  to: string;
}

const field =
  "h-9 rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-700 " +
  "transition-colors hover:border-zinc-300 " +
  "focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20";

const label = "flex flex-col gap-1.5 text-xs font-medium text-zinc-500";

export default function ActivityFilters({ defaults }: { defaults: ActivityFilterValues }) {
  const submitOnChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) =>
    e.currentTarget.form?.requestSubmit();

  return (
    <Form action="/admin/activity" className="flex flex-wrap items-end gap-3">
      <label className={`${label} min-w-48`}>
        Activity type
        <span className="relative block">
          <select
            name="action"
            defaultValue={defaults.action}
            onChange={submitOnChange}
            className={`${field} w-full cursor-pointer appearance-none pr-9`}
          >
            <option value="">All activity types</option>
            {Object.entries(ACTIVITY_ACTIONS).map(([key, meta]) => (
              <option key={key} value={key}>
                {meta.label}
              </option>
            ))}
          </select>
          <ChevronDown
            size={16}
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400"
          />
        </span>
      </label>

      <label className={label}>
        From
        <input
          type="date"
          name="from"
          defaultValue={defaults.from}
          onChange={submitOnChange}
          className={field}
        />
      </label>

      <label className={label}>
        To
        <input
          type="date"
          name="to"
          defaultValue={defaults.to}
          onChange={submitOnChange}
          className={field}
        />
      </label>

      <div className="flex items-center gap-2">
        <button
          type="submit"
          className="h-9 rounded-lg bg-emerald-600 px-4 text-sm font-medium text-white transition-colors hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
        >
          Apply
        </button>
        <Link
          href="/admin/activity"
          className="inline-flex h-9 items-center rounded-lg px-3 text-sm font-medium text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-800"
        >
          Reset
        </Link>
      </div>
    </Form>
  );
}