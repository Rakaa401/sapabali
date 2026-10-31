"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CATEGORIES, LANGUAGES, formatDate } from "@/lib/dummy/knowledge";
import type { KnowledgeItem, KnowledgeStatus, Language } from "@/types/knowledge";
import { StatusBadge } from "./StatusBadge";

type SortKey = "updated_desc" | "created_desc" | "title_asc";

const selectClass =
  "rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600";

export default function KnowledgeTable({ initialItems }: { initialItems: KnowledgeItem[] }) {
  // Data dummy disimpan di state. Delete di sini hanya menghapus dari tampilan.
  const [items, setItems] = useState(initialItems);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [language, setLanguage] = useState<"" | Language>("");
  const [status, setStatus] = useState<"" | KnowledgeStatus>("");
  const [sort, setSort] = useState<SortKey>("updated_desc");

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items
      .filter((k) => !q || k.title.toLowerCase().includes(q) || k.content.toLowerCase().includes(q))
      .filter((k) => !category || k.category === category)
      .filter((k) => !language || k.language === language)
      .filter((k) => !status || k.status === status)
      .sort((a, b) => {
        if (sort === "title_asc") return a.title.localeCompare(b.title);
        if (sort === "created_desc") return b.created_at.localeCompare(a.created_at);
        return b.updated_at.localeCompare(a.updated_at);
      });
  }, [items, query, category, language, status, sort]);

  function handleDelete(item: KnowledgeItem) {
    if (window.confirm(`Delete "${item.title}"? This cannot be undone.`)) {
      setItems((prev) => prev.filter((k) => k.id !== item.id));
    }
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-3">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search title or content"
          aria-label="Search knowledge"
          className={`${selectClass} min-w-64 flex-1`}
        />
        <select value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Filter by category" className={selectClass}>
          <option value="">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <select value={language} onChange={(e) => setLanguage(e.target.value as "" | Language)} aria-label="Filter by language" className={selectClass}>
          <option value="">All languages</option>
          {LANGUAGES.map((l) => (
            <option key={l.value} value={l.value}>{l.label}</option>
          ))}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value as "" | KnowledgeStatus)} aria-label="Filter by status" className={selectClass}>
          <option value="">All statuses</option>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="unpublished">Unpublished</option>
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} aria-label="Sort" className={selectClass}>
          <option value="updated_desc">Recently updated</option>
          <option value="created_desc">Recently created</option>
          <option value="title_asc">Title A-Z</option>
        </select>
      </div>

      {visible.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 p-10 text-center">
          <p className="font-medium text-slate-800">No knowledge found</p>
          <p className="mt-1 text-sm text-slate-600">
            Change the search or filters, or create a new knowledge item.
          </p>
        </div>
      ) : (
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
              {visible.map((k) => (
                <tr key={k.id} className="align-top">
                  <td className="max-w-xs px-4 py-3 font-medium text-slate-900">{k.title}</td>
                  <td className="px-4 py-3 text-slate-700">{k.category}</td>
                  <td className="px-4 py-3 uppercase text-slate-700">{k.language}</td>
                  <td className="px-4 py-3 text-slate-700">{k.source_name ?? "-"}</td>
                  <td className="px-4 py-3"><StatusBadge status={k.status} /></td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-700">{formatDate(k.updated_at)}</td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <Link href={`/admin/knowledge/${k.id}`} className="mr-3 text-emerald-700 hover:underline">View</Link>
                    <Link href={`/admin/knowledge/${k.id}/edit`} className="mr-3 text-emerald-700 hover:underline">Edit</Link>
                    <button type="button" onClick={() => handleDelete(k)} className="text-red-700 hover:underline">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="mt-3 text-xs text-slate-500">Showing {visible.length} of {items.length} items (dummy data)</p>
    </div>
  );
}
