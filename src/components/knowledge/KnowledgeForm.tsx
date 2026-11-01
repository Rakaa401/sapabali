"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createKnowledge } from "@/lib/knowledge/actions/create";
import { updateKnowledge } from "@/lib/knowledge/actions/update";
import { LANGUAGES } from "@/lib/knowledge/constants";
import type { KnowledgeCategory } from "@/lib/knowledge/categories";
import { validateKnowledge, type FieldErrors } from "@/lib/knowledge/validation";
import type { Destination, KnowledgeFormValues, KnowledgeItem } from "@/types/knowledge";

function fieldClass(error?: string) {
  return [
    "block w-full rounded-md border bg-white px-3 py-2 text-sm leading-5 text-slate-900 placeholder:text-slate-400",
    "focus:outline-none focus-visible:ring-2",
    error
      ? "border-red-400 focus:border-red-600 focus-visible:ring-red-600/20"
      : "border-slate-300 focus:border-emerald-700 focus-visible:ring-emerald-700/30",
  ].join(" ");
}

const primaryBtn =
  "inline-flex h-9 shrink-0 items-center justify-center whitespace-nowrap rounded-md bg-emerald-700 px-4 text-sm font-medium text-white hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2 disabled:opacity-60";

const secondaryBtn =
  "inline-flex h-9 shrink-0 items-center justify-center whitespace-nowrap rounded-md border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400";

export default function KnowledgeForm({
  mode,
  initial,
  destinations,
  categories,
}: {
  mode: "create" | "edit";
  initial?: KnowledgeItem;
  destinations: Destination[];
  categories: KnowledgeCategory[];
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
      {serverError && (
        <p
          role="alert"
          className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
        >
          {serverError}
        </p>
      )}

      {destinations.length === 0 && (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          No destinations yet. Add at least one destination in Supabase before saving knowledge.
        </p>
      )}

      <div className="space-y-5">
        {/* Main content */}
        <Panel title="Entry">
          <Field label="Title" error={errors.title} htmlFor="title">
            <input
              id="title"
              className={fieldClass(errors.title)}
              value={values.title}
              onChange={(e) => set("title", e.target.value)}
            />
          </Field>

          <Field label="Content" error={errors.content} htmlFor="content">
            <textarea
              id="content"
              rows={8}
              className={fieldClass(errors.content)}
              value={values.content}
              onChange={(e) => set("content", e.target.value)}
            />
          </Field>
        </Panel>

        {/* Details + Source berdampingan */}
        <div className="grid gap-5 md:grid-cols-2 md:items-start">
          <Panel title="Details">
            <Field label="Category" error={errors.category} htmlFor="category">
              <SelectBox
                id="category"
                className={fieldClass(errors.category)}
                value={values.category}
                onChange={(e) => set("category", e.target.value)}
              >
                <option value="">Select category</option>
               {categories.map((category) => (
  <option key={category.id} value={category.name}>
    {category.name}
  </option>
))}
              </SelectBox>
            </Field>

            <Field label="Language" error={errors.language} htmlFor="language">
              <SelectBox
                id="language"
                className={fieldClass(errors.language)}
                value={values.language}
                onChange={(e) => set("language", e.target.value as "id" | "en")}
              >
                {LANGUAGES.map((l) => (
                  <option key={l.value} value={l.value}>
                    {l.label}
                  </option>
                ))}
              </SelectBox>
            </Field>

            <Field label="Destination" error={errors.destination_id} htmlFor="destination">
              <SelectBox
                id="destination"
                className={fieldClass(errors.destination_id)}
                value={values.destination_id}
                onChange={(e) => set("destination_id", e.target.value)}
              >
                <option value="">Select destination</option>
                {destinations.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                    {d.status !== "published" ? ` (${d.status})` : ""}
                  </option>
                ))}
              </SelectBox>
            </Field>
          </Panel>

          <Panel title="Source">
            <Field label="Name" htmlFor="source_name">
              <input
                id="source_name"
                className={fieldClass()}
                value={values.source_name}
                onChange={(e) => set("source_name", e.target.value)}
              />
            </Field>

            <Field label="URL" error={errors.source_url} htmlFor="source_url">
              <input
                id="source_url"
                className={fieldClass(errors.source_url)}
                placeholder="https://"
                value={values.source_url}
                onChange={(e) => set("source_url", e.target.value)}
              />
            </Field>

            <Field label="Description" htmlFor="source_description">
              <textarea
                id="source_description"
                rows={2}
                className={fieldClass()}
                value={values.source_description}
                onChange={(e) => set("source_description", e.target.value)}
              />
            </Field>
          </Panel>
        </div>
      </div>

      <div className="flex justify-end gap-2 border-t border-slate-200 pt-4">
        <Link href="/admin/knowledge" className={secondaryBtn}>
          Cancel
        </Link>
        <button type="submit" disabled={pending} className={primaryBtn}>
          {pending ? "Saving..." : mode === "create" ? "Save as draft" : "Save changes"}
        </button>
      </div>
    </form>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-md border border-slate-200 bg-white">
      <h2 className="border-b border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-900">
        {title}
      </h2>
      <div className="space-y-4 p-4">{children}</div>
    </section>
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
      <label htmlFor={htmlFor} className="mb-1 block text-sm font-medium text-slate-800">
        {label}
      </label>
      {children}
      {error && <p className="mt-1 text-sm text-red-700">{error}</p>}
    </div>
  );
}

function SelectBox({
  className = "",
  children,
  ...props
}: React.ComponentProps<"select">) {
  return (
    <div className="relative">
      <select
        {...props}
        className={`${className} cursor-pointer appearance-none pr-9 disabled:cursor-not-allowed disabled:bg-slate-50`}
      >
        {children}
      </select>
      <svg
        aria-hidden="true"
        viewBox="0 0 20 20"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
      >
        <path d="M5 7.5l5 5 5-5" />
      </svg>
    </div>
  );
}