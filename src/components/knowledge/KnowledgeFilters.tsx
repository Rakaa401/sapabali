"use client";

import Form from "next/form";
import Link from "next/link";
import { CATEGORIES, LANGUAGES } from "@/lib/knowledge/constants";

export interface FilterValues {
  q: string;
  category: string;
  language: string;
  status: string;
  sort: string;
}

const field =
  "rounded-md border border-slate-300 bg-white px-3 py-2 text-sm transition focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-1";

export default function KnowledgeFilters({ defaults }: { defaults: FilterValues }) {
  // Ganti filter -> langsung kirim form (URL ikut berubah, data diambil ulang dari Supabase)
  const submitOnChange = (e: React.ChangeEvent<HTMLSelectElement>) =>
    e.currentTarget.form?.requestSubmit();

  return (
    <Form action="/admin/knowledge" className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
      <input
        type="search"
        name="q"
        defaultValue={defaults.q}
        placeholder="Search title or content"
        aria-label="Search knowledge"
        className={`${field} min-w-0 flex-1`}
      />
      <select name="category" defaultValue={defaults.category} onChange={submitOnChange} aria-label="Filter by category" className={field}>
        <option value="">All categories</option>
        {CATEGORIES.map((c) => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>
      <select name="language" defaultValue={defaults.language} onChange={submitOnChange} aria-label="Filter by language" className={field}>
        <option value="">All languages</option>
        {LANGUAGES.map((l) => (
          <option key={l.value} value={l.value}>{l.label}</option>
        ))}
      </select>
      <select name="status" defaultValue={defaults.status} onChange={submitOnChange} aria-label="Filter by status" className={field}>
        <option value="">All statuses</option>
        <option value="draft">Draft</option>
        <option value="published">Published</option>
        <option value="unpublished">Unpublished</option>
      </select>
      <select name="sort" defaultValue={defaults.sort} onChange={submitOnChange} aria-label="Sort" className={field}>
        <option value="updated_desc">Recently updated</option>
        <option value="created_desc">Recently created</option>
        <option value="title_asc">Title A-Z</option>
      </select>
      <button type="submit" className="rounded-md bg-slate-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-700 focus-visible:ring-offset-2">
        Search
      </button>
      <Link href="/admin/knowledge" className="px-2 py-2 text-sm text-slate-600 hover:underline">
        Reset
      </Link>
    </Form>
  );
}
