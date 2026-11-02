"use client";

import { useEffect, useRef, useState } from "react";
import {
  Sparkles,
  FileText,
  ChevronDown,
  Check,
  Loader2,
  X,
} from "lucide-react";
import Input from "@/components/ui/input";
import Textarea from "@/components/ui/textarea";
import Select from "@/components/ui/select";
import type { Destination, Language } from "@/types/knowledge";

const MAX_CONTENT_LENGTH = 20000;
const MIN_CONTENT_LENGTH = 20;

const selectClass =
  "h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-700 " +
  "transition-colors hover:border-zinc-300 " +
  "focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 " +
  "disabled:cursor-not-allowed disabled:bg-zinc-50 disabled:text-zinc-400";

const fieldClass = "block text-sm font-medium text-slate-800";

// Tahapan yang ditampilkan selama loading (threshold = persen mulai tahap)
const STAGES = [
  { from: 0, label: "Reading your content" },
  { from: 25, label: "Identifying key information" },
  { from: 50, label: "Organizing the structure" },
  { from: 75, label: "Finalizing the result" },
];

// Progress simulasi berhenti mendekati angka ini sampai respons asli datang
const PROGRESS_CAP = 92;

type FormValues = {
  content: string;
  source_name: string;
  source_url: string;
  destination_id: string;
  language: Language;
};

interface StructuringResult {
  suggested_title: string;
  summary: string;
  organized_content: string;
  suggested_category: string;
  important_rules: string[];
  ambiguous_information: string[];
}

function getStageIndex(progress: number) {
  let index = 0;
  STAGES.forEach((stage, i) => {
    if (progress >= stage.from) index = i;
  });
  return index;
}

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
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<StructuringResult | null>(null);
  const [apiError, setApiError] = useState("");
  const [progress, setProgress] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  const abortRef = useRef<AbortController | null>(null);
  const loadingRef = useRef<HTMLDivElement | null>(null);
  const resultRef = useRef<HTMLElement | null>(null);

  // Progress simulasi: melambat saat mendekati PROGRESS_CAP
  useEffect(() => {
    if (!isGenerating) return;

    const startedAt = Date.now();
    setProgress(2);
    setElapsed(0);

    const timer = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAt) / 1000));
      setProgress((current) => {
        const next = current + (PROGRESS_CAP - current) * 0.035;
        return Math.min(PROGRESS_CAP, next);
      });
    }, 300);

    return () => clearInterval(timer);
  }, [isGenerating]);

  // Batalkan request kalau komponen di-unmount
  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  // Scroll ke panel loading saat mulai, dan ke hasil saat selesai
  useEffect(() => {
    if (isGenerating) {
      loadingRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [isGenerating]);

  useEffect(() => {
    if (result) {
      resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [result]);

  function update<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: "" }));
    setMessage("");
  }

  function handleCancel() {
    abortRef.current?.abort();
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isGenerating) return;

    setErrors({});
    setMessage("");
    setApiError("");
    setResult(null);

    const nextErrors: Record<string, string> = {};

    if (values.content.trim().length < MIN_CONTENT_LENGTH) {
      nextErrors.content = `Content must contain at least ${MIN_CONTENT_LENGTH} characters.`;
    }

    if (values.content.trim().length > MAX_CONTENT_LENGTH) {
      nextErrors.content = `Content cannot exceed ${MAX_CONTENT_LENGTH} characters.`;
    }

    if (!values.destination_id) {
      nextErrors.destination_id = "Please select a destination.";
    }

    if (values.source_url.trim()) {
      try {
        const url = new URL(values.source_url.trim());

        if (!["http:", "https:"].includes(url.protocol)) {
          throw new Error("Invalid URL");
        }
      } catch {
        nextErrors.source_url = "Enter a valid HTTP or HTTPS URL.";
      }
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;
    setIsGenerating(true);

    try {
      const response = await fetch("/api/admin/ai-structuring", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
        signal: controller.signal,
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Failed to structure content.");
      }

      if (!payload.data) {
        throw new Error("The AI returned an invalid response.");
      }

      // Lompat ke 100% sebentar biar terasa selesai
      setProgress(100);
      await new Promise((resolve) => setTimeout(resolve, 450));

      setResult(payload.data);
      setMessage("Content successfully structured. Review the result below.");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        setMessage("Generation cancelled.");
      } else {
        setApiError(
          error instanceof Error
            ? error.message
            : "Something went wrong. Please try again.",
        );
      }
    } finally {
      setIsGenerating(false);
      abortRef.current = null;
    }
  }

  const percent = Math.round(progress);
  const stageIndex = getStageIndex(progress);

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      {/* fieldset disabled = semua input terkunci selama proses berjalan */}
      <fieldset
        disabled={isGenerating}
        className="m-0 min-w-0 space-y-6 border-0 p-0"
      >
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
              aria-describedby={
                errors.content ? "content-count content-error" : "content-count"
              }
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
                <p className="text-sm text-red-600">{errors.destination_id}</p>
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
      </fieldset>

      {message && !isGenerating && (
        <div
          role="status"
          className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
        >
          {message}
        </div>
      )}

      {/* Action bar */}
      <div className="flex flex-wrap items-center justify-end gap-3 border-t border-slate-200 pt-5">
        {isGenerating && (
          <button
            type="button"
            onClick={handleCancel}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-50 hover:text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-300"
          >
            <X size={16} />
            Cancel
          </button>
        )}

        <button
          type="submit"
          disabled={isGenerating}
          className="inline-flex h-11 min-w-48 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-emerald-700 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-emerald-600 disabled:hover:shadow-sm"
        >
          {isGenerating ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Structuring... {percent}%
            </>
          ) : (
            <>
              <Sparkles size={16} />
              Generate Structure
            </>
          )}
        </button>
      </div>

      {/* Loading panel */}
      {isGenerating && (
        <div
          ref={loadingRef}
          role="status"
          aria-live="polite"
          className="space-y-5 rounded-xl border border-emerald-200 bg-emerald-50/50 p-6"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-sm font-semibold text-zinc-900">
                {percent >= 100
                  ? "Done!"
                  : `${STAGES[stageIndex].label}...`}
              </h2>
              <p className="mt-1 text-xs text-zinc-500">
                This usually takes 10–30 seconds. Please keep this page open.
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-semibold tabular-nums text-emerald-700">
                {percent}%
              </p>
              <p className="text-xs tabular-nums text-zinc-400">{elapsed}s</p>
            </div>
          </div>

          <div
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={percent}
            aria-label="Structuring progress"
            className="h-2 w-full overflow-hidden rounded-full bg-emerald-100"
          >
            <div
              className="h-full rounded-full bg-emerald-600 transition-[width] duration-300 ease-out"
              style={{ width: `${percent}%` }}
            />
          </div>

          <ol className="grid gap-2 sm:grid-cols-4">
            {STAGES.map((stage, index) => {
              const done = percent >= 100 || index < stageIndex;
              const active = index === stageIndex && percent < 100;

              return (
                <li
                  key={stage.label}
                  className={`flex items-center gap-2 text-xs ${
                    done
                      ? "text-emerald-700"
                      : active
                        ? "font-medium text-zinc-900"
                        : "text-zinc-400"
                  }`}
                >
                  <span
                    className={`flex size-5 shrink-0 items-center justify-center rounded-full border ${
                      done
                        ? "border-emerald-600 bg-emerald-600 text-white"
                        : active
                          ? "border-emerald-600 text-emerald-600"
                          : "border-zinc-300"
                    }`}
                  >
                    {done ? (
                      <Check size={12} />
                    ) : active ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : null}
                  </span>
                  {stage.label}
                </li>
              );
            })}
          </ol>
        </div>
      )}

      {apiError && !isGenerating && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          {apiError}
        </div>
      )}

      {result && !isGenerating && (
        <section
          ref={resultRef}
          className="scroll-mt-6 space-y-5 rounded-xl border border-zinc-200 bg-white p-6"
        >
          <div>
            <h2 className="text-lg font-semibold text-zinc-900">
              AI Structuring Result
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
              Review the generated information before saving it to the
              knowledge base.
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-zinc-700">Suggested Title</p>
            <div className="rounded-lg bg-zinc-50 p-3 text-sm text-zinc-900">
              {result.suggested_title}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-zinc-700">Summary</p>
            <div className="whitespace-pre-wrap rounded-lg bg-zinc-50 p-3 text-sm text-zinc-700">
              {result.summary}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-zinc-700">
              Organized Content
            </p>
            <div className="whitespace-pre-wrap rounded-lg bg-zinc-50 p-3 text-sm text-zinc-700">
              {result.organized_content}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-zinc-700">
              Suggested Category
            </p>
            <div className="rounded-lg bg-zinc-50 p-3 text-sm text-zinc-700">
              {result.suggested_category || "No category suggested"}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-zinc-700">
              Important Rules & Instructions
            </p>
            {result.important_rules.length > 0 ? (
              <ul className="list-disc space-y-1 pl-5 text-sm text-zinc-700">
                {result.important_rules.map((rule, index) => (
                  <li key={index}>{rule}</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-zinc-500">
                No explicit rules identified.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-zinc-700">
              Ambiguous Information
            </p>
            {result.ambiguous_information.length > 0 ? (
              <ul className="list-disc space-y-1 pl-5 text-sm text-amber-700">
                {result.ambiguous_information.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-zinc-500">
                No ambiguous information identified.
              </p>
            )}
          </div>
        </section>
      )}
    </form>
  );
}