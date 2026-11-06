"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { KnowledgeCategory } from "@/lib/knowledge/categories";

type FormValues = {
  name: string;
  slug: string;
  description: string;
};

const emptyForm: FormValues = {
  name: "",
  slug: "",
  description: "",
};

const fieldClass =
  "block rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700/30";

const primaryBtn =
  "inline-flex h-9 shrink-0 items-center justify-center whitespace-nowrap rounded-md bg-emerald-700 px-4 text-sm font-medium text-white hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2 disabled:opacity-60";

const secondaryBtn =
  "inline-flex h-9 shrink-0 items-center justify-center whitespace-nowrap rounded-md border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 disabled:opacity-60";

function createSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export default function KnowledgeCategoryManager({
  categories,
}: {
  categories: KnowledgeCategory[];
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [form, setForm] = useState<FormValues>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [slugEdited, setSlugEdited] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const filteredCategories = useMemo(() => {
    const keyword = search.toLowerCase().trim();

    if (!keyword) return categories;

    return categories.filter(
      (category) =>
        category.name.toLowerCase().includes(keyword) ||
        category.slug.toLowerCase().includes(keyword)
    );
  }, [categories, search]);

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setSlugEdited(false);
    setError(null);
    setSuccess(null);
    setFormOpen(true);
  }

  function openEdit(category: KnowledgeCategory) {
    setEditingId(category.id);
    setForm({
      name: category.name,
      slug: category.slug,
      description: category.description ?? "",
    });
    setSlugEdited(true);
    setError(null);
    setSuccess(null);
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditingId(null);
    setForm(emptyForm);
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const name = form.name.trim();
    const slug = createSlug(form.slug);

    if (!name || !slug) {
      setError("Category name and slug are required.");
      return;
    }

    setPending(true);

    const supabase = createClient();

    const payload = {
      name,
      slug,
      description: form.description.trim() || null,
    };

    const result = editingId
      ? await supabase
          .from("knowledge_categories")
          .update(payload)
          .eq("id", editingId)
      : await supabase.from("knowledge_categories").insert(payload);

    setPending(false);

    if (result.error) {
      setError(
        result.error.code === "23505"
          ? "A category with this name or slug already exists."
          : result.error.message
      );
      return;
    }

    closeForm();
    setSuccess(editingId ? "Category updated." : "Category created.");
    router.refresh();
  }

  async function handleDelete(category: KnowledgeCategory) {
    if (category.knowledge_count > 0) {
      setError(
        `Cannot delete "${category.name}" because it is used by ${category.knowledge_count} knowledge item(s).`
      );
      return;
    }

    const confirmed = window.confirm(
      `Delete category "${category.name}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    setPending(true);
    setError(null);
    setSuccess(null);

    const supabase = createClient();

    const { count, error: countError } = await supabase
      .from("knowledge_items")
      .select("id", { count: "exact", head: true })
      .eq("category", category.name);

    if (countError) {
      setError(countError.message);
      setPending(false);
      return;
    }

    if ((count ?? 0) > 0) {
      setError(
        `Cannot delete "${category.name}" because it is currently in use.`
      );
      setPending(false);
      return;
    }

    const { error: deleteError } = await supabase
      .from("knowledge_categories")
      .delete()
      .eq("id", category.id);

    setPending(false);

    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    setSuccess("Category deleted.");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or slug"
          aria-label="Search categories"
          className={`${fieldClass} w-full sm:w-72`}
        />

        <button type="button" onClick={openCreate} className={primaryBtn}>
          Add category
        </button>
      </div>

      {error && (
        <p
          role="alert"
          className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
        >
          {error}
        </p>
      )}

      {success && (
        <p
          role="status"
          className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800"
        >
          {success}
        </p>
      )}

      {/* Form */}
      {formOpen && (
        <form
          onSubmit={handleSubmit}
          className="rounded-md border border-slate-300 bg-slate-50"
        >
          <div className="border-b border-slate-200 px-5 py-3">
            <h2 className="text-base font-semibold text-slate-900">
              {editingId ? "Edit category" : "New category"}
            </h2>
          </div>

          <div className="grid gap-4 px-5 py-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="category-name"
                className="mb-1 block text-sm font-medium text-slate-800"
              >
                Name
                <span className="ml-1 text-red-600" aria-hidden="true">*</span>
              </label>
              <input
                id="category-name"
                required
                value={form.name}
                onChange={(e) => {
                  const name = e.target.value;
                  setForm((prev) => ({
                    ...prev,
                    name,
                    slug: slugEdited ? prev.slug : createSlug(name),
                  }));
                }}
                className={`${fieldClass} w-full`}
                placeholder="Cultural etiquette"
              />
            </div>

            <div>
              <label
                htmlFor="category-slug"
                className="mb-1 block text-sm font-medium text-slate-800"
              >
                Slug
                <span className="ml-1 text-red-600" aria-hidden="true">*</span>
              </label>
              <input
                id="category-slug"
                required
                value={form.slug}
                onChange={(e) => {
                  setSlugEdited(true);
                  setForm((prev) => ({ ...prev, slug: e.target.value }));
                }}
                className={`${fieldClass} w-full`}
                placeholder="cultural-etiquette"
              />
            </div>

            <div className="sm:col-span-2">
              <label
                htmlFor="category-description"
                className="mb-1 block text-sm font-medium text-slate-800"
              >
                Description
              </label>
              <textarea
                id="category-description"
                rows={3}
                value={form.description}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, description: e.target.value }))
                }
                className={`${fieldClass} w-full`}
                placeholder="What kind of knowledge belongs here?"
              />
            </div>
          </div>

          <div className="flex flex-col-reverse gap-2 border-t border-slate-200 px-5 py-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={closeForm}
              disabled={pending}
              className={secondaryBtn}
            >
              Cancel
            </button>
            <button type="submit" disabled={pending} className={primaryBtn}>
              {pending
                ? "Saving..."
                : editingId
                ? "Save changes"
                : "Create category"}
            </button>
          </div>
        </form>
      )}

      {/* List */}
      <div className="overflow-hidden rounded-md border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                <th scope="col" className="px-4 py-2.5 font-medium">
                  Category
                </th>
                <th scope="col" className="w-64 px-4 py-2.5 font-medium">
                  Slug
                </th>
                <th scope="col" className="w-24 px-4 py-2.5 text-right font-medium">
                  Items
                </th>
                <th scope="col" className="w-36 px-4 py-2.5 text-right font-medium">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filteredCategories.map((category) => (
                <tr key={category.id} className="hover:bg-slate-50/70">
                  <td className="px-4 py-3 align-middle">
                    <p className="font-medium text-slate-900">
                      {category.name}
                    </p>
                    {category.description && (
                      <p className="mt-0.5 line-clamp-2 w-72 text-slate-500 lg:w-96">
                        {category.description}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 align-middle">
                    <code className="rounded bg-slate-100 px-1.5 py-0.5 text-[13px] text-slate-700">
                      {category.slug}
                    </code>
                  </td>
                  <td className="px-4 py-3 text-right align-middle tabular-nums text-slate-700">
                    {category.knowledge_count}
                  </td>
                  <td className="px-4 py-3 align-middle">
                    <div className="flex justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => openEdit(category)}
                        disabled={pending}
                        className="rounded px-2 py-1 font-medium text-slate-700 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 disabled:opacity-50"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(category)}
                        disabled={pending}
                        className="rounded px-2 py-1 font-medium text-red-700 hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredCategories.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-10 text-center text-slate-500"
                  >
                    {search
                      ? `No categories match "${search}".`
                      : "No categories yet. Add one to start organizing knowledge."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-sm text-slate-500">
        {filteredCategories.length === categories.length
          ? `${categories.length} ${categories.length === 1 ? "category" : "categories"}`
          : `${filteredCategories.length} of ${categories.length} categories`}
      </p>
    </div>
  );
}