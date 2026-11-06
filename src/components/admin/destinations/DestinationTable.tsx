"use client";

import Image from "next/image";

import { useMemo, useState } from "react";
import Link from "next/link";
import { MapPin, Pencil, Plus, Search } from "lucide-react";
import type { Destination } from "@/lib/destinations/queries";
import Badge from "@/components/ui/badge";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import Select from "@/components/ui/select";

const PAGE_SIZE = 8;

const statusVariants = {
  published: "success",
  draft: "warning",
  archived: "default",
} as const;

export default function DestinationTable({
  initialItems,
}: {
  initialItems: Destination[];
}) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);

  const categories = useMemo(
    () =>
      Array.from(
        new Set(
          initialItems
            .map((item) => item.category)
            .filter((value): value is string => Boolean(value))
        )
      ).sort(),
    [initialItems]
  );

  const filteredItems = useMemo(() => {
    const keyword = search.toLowerCase();

    return initialItems.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(keyword) ||
        item.slug.toLowerCase().includes(keyword);
      const matchesCategory = category === "all" || item.category === category;
      const matchesStatus = status === "all" || item.status === status;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [initialItems, search, category, status]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * PAGE_SIZE;

  const paginatedItems = filteredItems.slice(
    startIndex,
    startIndex + PAGE_SIZE
  );

  function resetPage() {
    setPage(1);
  }

  return (
    <section className="space-y-5">
      {/* Filters */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_200px_180px]">
        <div className="relative sm:col-span-2 lg:col-span-1">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
          />
          <Input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              resetPage();
            }}
            placeholder="Search destinations..."
            className="h-10 pl-9"
          />
        </div>

        <Select
          value={category}
          onChange={(event) => {
            setCategory(event.target.value);
            resetPage();
          }}
          className="h-10"
        >
          <option value="all">All categories</option>
          {categories.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </Select>

        <Select
          value={status}
          onChange={(event) => {
            setStatus(event.target.value);
            resetPage();
          }}
          className="h-10"
        >
          <option value="all">All statuses</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
          <option value="archived">Archived</option>
        </Select>
      </div>

      {/* Table card */}
      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
        <div className="flex flex-col gap-3 border-b border-zinc-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-zinc-900">
              All destinations
            </h2>
            <p className="mt-1 text-xs text-zinc-500">
              {filteredItems.length} destinations found
            </p>
          </div>

          <Link href="/admin/destinations/new" className="w-full sm:w-auto">
            <Button size="sm" className="h-9 w-full gap-1.5 rounded-lg px-3.5 sm:w-auto">
              <Plus size={15} />
              Add destination
            </Button>
          </Link>
        </div>

        {paginatedItems.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <MapPin className="mx-auto mb-3 text-zinc-300" size={28} />
            <p className="text-sm font-medium text-zinc-800">
              No destinations found
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              Try changing your search or filters.
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px] text-left">
                <thead className="bg-zinc-50/80 text-[11px] font-medium uppercase tracking-wide text-zinc-500">
                  <tr>
                    <th className="px-5 py-3 font-medium">Destination</th>
                    <th className="px-5 py-3 font-medium">Category</th>
                    <th className="px-5 py-3 font-medium">Regency</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="whitespace-nowrap px-5 py-3 font-medium">
                      Last updated
                    </th>
                    <th className="px-5 py-3 text-right font-medium">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-zinc-100">
                  {paginatedItems.map((item) => (
                    <tr key={item.id} className="hover:bg-zinc-50/70">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          {item.image_url ? (
                            <Image
                              src={item.image_url}
                              alt={item.name}
                              width={44}
                              height={44}
                              unoptimized
                              className="size-11 shrink-0 rounded-lg border border-zinc-200 object-cover"
                            />
                          ) : (
                            <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-400">
                              <MapPin size={18} />
                            </div>
                          )}

                          <div className="min-w-0 max-w-[260px]">
                            <p className="truncate text-sm font-medium text-zinc-900">
                              {item.name}
                            </p>
                            <p className="mt-0.5 truncate text-xs text-zinc-400">
                              /{item.slug}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-3.5 text-sm text-zinc-600">
                        {item.category || "—"}
                      </td>

                      <td className="px-5 py-3.5 text-sm text-zinc-600">
                        {item.regency || "—"}
                      </td>

                      <td className="px-5 py-3.5">
                        <Badge variant={statusVariants[item.status]}>
                          {item.status}
                        </Badge>
                      </td>

                      <td className="whitespace-nowrap px-5 py-3.5 text-xs text-zinc-500">
                        {new Date(item.updated_at).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>

                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            href={`/admin/destinations/${item.id}/edit`}
                            className="rounded-md p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
                            aria-label={`Edit ${item.name}`}
                          >
                            <Pencil size={16} />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex flex-col gap-3 border-t border-zinc-200 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-zinc-500">
                Showing {startIndex + 1}–
                {Math.min(startIndex + PAGE_SIZE, filteredItems.length)} of{" "}
                {filteredItems.length}
              </p>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => setPage((value) => value - 1)}
                >
                  Previous
                </Button>

                <span className="min-w-12 text-center text-xs tabular-nums text-zinc-500">
                  {currentPage} / {totalPages}
                </span>

                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === totalPages}
                  onClick={() => setPage((value) => value + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
}