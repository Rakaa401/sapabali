"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createKnowledge } from "@/lib/knowledge/actions/create";
import { updateKnowledge } from "@/lib/knowledge/actions/update";
import { CATEGORIES, LANGUAGES } from "@/lib/knowledge/constants";
import { validateKnowledge, type FieldErrors } from "@/lib/knowledge/validation";
import type { Destination, KnowledgeFormValues, KnowledgeItem } from "@/types/knowledge";

const fieldClass =
  "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600";

export default function KnowledgeForm({
  mode,
  initial,
  destinations,
}: {
  mode: "create" | "edit";
  initial?: KnowledgeItem;
  destinations: Destination[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [values, setValues] = useState<KnowledgeFormValues>({
    title: initial?.title ?? "",
    content: initial?.content ?? "",
    category: initial?.category ?? "",
    language: initial?.language ?? "id",
    destination_id: initial?.destination_id ?? destinations[0]?.id ?? "",
    source_name: initial?.source_name ?? "",
    source_url: initial?.source_url ?? "",
    source_description: initial?.source_description ?? "",
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);

  function set<K extends keyof KnowledgeFormValues>(key: K, value: KnowledgeFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError(null);

    const found = validateKnowledge(values);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    startTransition(async () => {
      const result =
        mode === "edit" && initial
          ? await updateKnowledge(initial.id, values)
          : await createKnowledge(values);

      if (!result.ok) {
        setErrors(result.fieldErrors ?? {});
        setServerError(result.error);
        return;
      }
      router.push(`/admin/knowledge/${result.id}`);
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <Field label="Title" error={errors.title} htmlFor="title">
        <input id="title" className={fieldClass} value={values.title} onChange={(e) => set("title", e.target.value)} />
      </Field>

      <Field label="Content" error={errors.content} htmlFor="content">
        <textarea id="content" rows={8} className={fieldClass} value={values.content} onChange={(e) => set("content", e.target.value)} />
      </Field>

      <div className="grid gap-5 sm:grid-cols-3">
        <Field label="Category" error={errors.category} htmlFor="category">
          <select id="category" className={fieldClass} value={values.category} onChange={(e) => set("category", e.target.value)}>
            <option value="">Select category</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </Field>
        <Field label="Language" error={errors.language} htmlFor="language">
          <select id="language" className={fieldClass} value={values.language} onChange={(e) => set("language", e.target.value as "id" | "en")}>
            {LANGUAGES.map((l) => (
              <option key={l.value} value={l.value}>{l.label}</option>
            ))}
          </select>
        </Field>
        <Field label="Destination" error={errors.destination_id} htmlFor="destination">
          <select id="destination" className={fieldClass} value={values.destination_id} onChange={(e) => set("destination_id", e.target.value)}>
            <option value="">Select destination</option>
            {destinations.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}{d.status !== "published" ? ` (${d.status})` : ""}
              </option>
            ))}
          </select>
        </Field>
      </div>

      {destinations.length === 0 && (
        <p className="rounded-md bg-amber-50 px-4 py-3 text-sm text-amber-800">
          No destinations yet. Add at least one destination in Supabase before saving knowledge.
        </p>
      )}

      <fieldset className="space-y-5 rounded-lg border border-slate-200 p-4">
        <legend className="px-2 text-sm font-medium text-slate-700">Source</legend>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Source name" htmlFor="source_name">
            <input id="source_name" className={fieldClass} value={values.source_name} onChange={(e) => set("source_name", e.target.value)} />
          </Field>
          <Field label="Source URL" error={errors.source_url} htmlFor="source_url">
            <input id="source_url" className={fieldClass} placeholder="https://" value={values.source_url} onChange={(e) => set("source_url", e.target.value)} />
          </Field>
        </div>
        <Field label="Source description" htmlFor="source_description">
          <textarea id="source_description" rows={2} className={fieldClass} value={values.source_description} onChange={(e) => set("source_description", e.target.value)} />
        </Field>
      </fieldset>

      {serverError && (
        <p role="alert" className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-800">{serverError}</p>
      )}

      <div className="flex gap-3">
        <button type="submit" disabled={pending} className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2 disabled:opacity-60">
          {pending ? "Saving..." : mode === "create" ? "Save as draft" : "Save changes"}
        </button>
        <Link href="/admin/knowledge" className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
          Cancel
        </Link>
      </div>
    </form>
  );
}

function Field({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1 block text-sm font-medium text-slate-800">{label}</label>
      {children}
      {error && <p className="mt-1 text-sm text-red-700">{error}</p>}
    </div>
  );
}
