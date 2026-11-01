
"use client";

import { useState } from "react";
import { Sparkles, FileText, ChevronDown } from "lucide-react";
import Input from "@/components/ui/input";
import Textarea from "@/components/ui/textarea";
import Select from "@/components/ui/select";
import type { Destination, Language } from "@/types/knowledge";

const MAX_CONTENT_LENGTH = 20000;
const MIN_CONTENT_LENGTH = 20;

const selectClass =
  "h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-700 " +
  "transition-colors hover:border-zinc-300 " +
  "focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20";

const fieldClass = "block text-sm font-medium text-slate-800";

type FormValues = {
  content: string;
  source_name: string;
  source_url: string;
  destination_id: string;
  language: Language;
};

export default function AiStructuringForm({
  destinations,
}: {
  destinations: Destination[];
}) {
  const [values, setValues] = useState<FormValues>({
    content: "",
    source_name: "",
    source_url: "",
    destination_id: destinations[0]?.id ?? "",
    language: "id",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");

  function update<K extends keyof FormValues>(
    key: K,
    value: FormValues[K],
  ) {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: "" }));
    setMessage("");
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors: Record<string, string> = {};
    const content = values.content.trim();

    if (content.length < MIN_CONTENT_LENGTH) {
      nextErrors.content = `Enter at least ${MIN_CONTENT_LENGTH} characters.`;
    }

    if (values.content.length > MAX_CONTENT_LENGTH) {
      nextErrors.content = `Content cannot exceed ${MAX_CONTENT_LENGTH.toLocaleString()} characters.`;
    }

    if (!values.destination_id) {
      nextErrors.destination_id = "Select a destination.";
    }

    if (
      values.source_url.trim() &&
      !/^https?:\/\/.+\..+/.test(values.source_url.trim())
    ) {
      nextErrors.source_url = "Enter a valid HTTP or HTTPS URL.";
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) return;

    setMessage(
      "Your input is valid. AI generation will be connected in the next implementation phase.",
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      <section className="rounded-lg border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-5 py-4">
          <div className="flex items-center gap-2">
            <FileText size={18} className="text-emerald-700" />
            <h2 className="text-sm font-semibold text-slate-900">
              Raw Information
            </h2>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Paste unstructured information that you want to turn into
            structured knowledge.
          </p>
        </div>

        <div className="space-y-2 p-5">
          <label htmlFor="raw-content" className={fieldClass}>
            Raw text <span className="text-red-600">*</span>
          </label>

          <Textarea
            id="raw-content"
            value={values.content}
            onChange={(event) => update("content", event.target.value)}
            placeholder="Paste articles, travel information, cultural guides, local insights, or other reference material..."
            rows={12}
            maxLength={MAX_CONTENT_LENGTH}
            aria-invalid={Boolean(errors.content)}
            aria-describedby="content-count content-error"
            className={
              errors.content
                ? "border-red-400 focus:border-red-500 focus:ring-red-500/10"
                : ""
            }
          />

          <div className="flex items-start justify-between gap-3">
            {errors.content ? (
              <p id="content-error" className="text-sm text-red-600">
                {errors.content}
              </p>
            ) : (
              <p className="text-xs text-slate-500">
                Minimum {MIN_CONTENT_LENGTH} characters.
              </p>
            )}

            <p
              id="content-count"
              className={`shrink-0 text-xs ${
                values.content.length >= MAX_CONTENT_LENGTH
                  ? "text-red-600"
                  : "text-slate-500"
              }`}
            >
              {values.content.length.toLocaleString()} /{" "}
              {MAX_CONTENT_LENGTH.toLocaleString()}
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="text-sm font-semibold text-slate-900">
            Source & Context
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Add the source and destination context for this information.
          </p>
        </div>

        <div className="grid gap-5 p-5 md:grid-cols-2">
          <div className="space-y-1.5">
            <label htmlFor="source-name" className={fieldClass}>
              Source name
            </label>
            <Input
              id="source-name"
              value={values.source_name}
              onChange={(event) => update("source_name", event.target.value)}
              placeholder="e.g. Bali Tourism Board"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="source-url" className={fieldClass}>
              Source URL
            </label>
            <Input
              id="source-url"
              type="url"
              value={values.source_url}
              onChange={(event) => update("source_url", event.target.value)}
              placeholder="https://example.com/article"
              aria-invalid={Boolean(errors.source_url)}
              className={
                errors.source_url
                  ? "border-red-400 focus:border-red-500 focus:ring-red-500/10"
                  : ""
              }
            />
            {errors.source_url && (
              <p className="text-sm text-red-600">{errors.source_url}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="destination" className={fieldClass}>
              Destination <span className="text-red-600">*</span>
            </label>

            <span className="relative block">
              <Select
                id="destination"
                value={values.destination_id}
                onChange={(event) =>
                  update("destination_id", event.target.value)
                }
                aria-invalid={Boolean(errors.destination_id)}
                disabled={destinations.length === 0}
                className={`${selectClass} cursor-pointer appearance-none pr-9`}
              >
                <option value="">Select destination</option>
                {destinations.map((destination) => (
                  <option key={destination.id} value={destination.id}>
                    {destination.name}
                    {destination.status !== "published"
                      ? ` (${destination.status})`
                      : ""}
                  </option>
                ))}
              </Select>

              <ChevronDown
                size={16}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400"
              />
            </span>

            {errors.destination_id && (
              <p className="text-sm text-red-600">
                {errors.destination_id}
              </p>
            )}

            {destinations.length === 0 && (
              <p className="text-sm text-amber-700">
                Add a destination before generating knowledge.
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="language" className={fieldClass}>
              Language
            </label>

            <span className="relative block">
              <Select
                id="language"
                value={values.language}
                onChange={(event) =>
                  update("language", event.target.value as Language)
                }
                className={`${selectClass} cursor-pointer appearance-none pr-9`}
              >
                <option value="id">Bahasa Indonesia</option>
                <option value="en">English</option>
              </Select>

              <ChevronDown
                size={16}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400"
              />
            </span>
          </div>
        </div>
      </section>

      {message && (
        <div
          role="status"
          className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
        >
          {message}
        </div>
      )}

      <div className="flex justify-end border-t border-slate-200 pt-5">
        <button
          type="submit"
          disabled={destinations.length === 0}
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-emerald-700 px-5 text-sm font-medium text-white transition hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Sparkles size={16} />
          Generate structure
        </button>
      </div>
    </form>
  );
}
