"use client";

import { useEffect, useRef, useState } from "react";
import {
  Sparkles,
  FileText,
  ChevronDown,
  Check,
  Loader2,
  X,
  Globe,
  Plus,
  RefreshCw,
  RotateCcw,
  Save,
  Trash2,
} from "lucide-react";
import Input from "@/components/ui/input";
import Textarea from "@/components/ui/textarea";
import Select from "@/components/ui/select";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type {
  Destination,
  KnowledgeDraftInput,
  Language,
  SaveDraftResult,
} from "@/types/knowledge";

const MAX_CONTENT_LENGTH = 20000;
const MIN_CONTENT_LENGTH = 20;

const selectClass =
  "h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-700 " +
  "transition-colors hover:border-zinc-300 " +
  "focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 " +
  "disabled:cursor-not-allowed disabled:bg-zinc-50 disabled:text-zinc-400";

const fieldClass = "block text-sm font-medium text-slate-800";

const errorInputClass =
  "border-red-400 focus:border-red-500 focus:ring-red-500/10";

const secondaryButtonClass =
  "inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-50 hover:text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-300 disabled:cursor-not-allowed disabled:opacity-60";

const primaryButtonClass =
  "inline-flex h-11 min-w-48 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-emerald-700 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-emerald-600 disabled:hover:shadow-sm";

const LANGUAGE_LABELS: Record<string, string> = {
  id: "Bahasa Indonesia",
  en: "English",
};

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

// Bentuk respons mentah dari /api/admin/ai-structuring
interface StructuringResult {
  suggested_title: string;
  summary: string;
  organized_content: string;
  suggested_category: string;
  important_rules: string[];
  ambiguous_information: string[];
  // Opsional: kalau API nanti mengembalikan bahasa hasil deteksi, dipakai otomatis
  detected_language?: string;
}

// Bentuk yang diedit reviewer (nama field dibuat netral, tanpa prefix "suggested_")
type ReviewFields = {
  title: string;
  summary: string;
  content: string;
  category: string;
  rules: string[];
  ambiguities: string[];
};

interface AiStructuringFormProps {
  destinations: Destination[];
  // Nama kategori yang sudah ada (knowledge_categories). Kategori wajib dipilih dari daftar ini.
  categories: string[];
  // Server Action penyimpan draft (03.5). Server selalu menyimpan dengan status "draft".
  onSaveDraft: (draft: KnowledgeDraftInput) => Promise<SaveDraftResult>;
}

// Cocokkan saran kategori AI dengan kategori yang ada (tanpa peduli huruf besar/kecil).
// Tidak cocok -> "" supaya reviewer memilih sendiri.
function matchCategory(suggested: string, categories: string[]) {
  const wanted = suggested.trim().toLowerCase();
  if (!wanted) return "";

  return categories.find((name) => name.trim().toLowerCase() === wanted) ?? "";
}

function toReviewFields(
  result: StructuringResult,
  categories: string[],
): ReviewFields {
  return {
    title: result.suggested_title ?? "",
    summary: result.summary ?? "",
    content: result.organized_content ?? "",
    category: matchCategory(result.suggested_category ?? "", categories),
    rules: [...(result.important_rules ?? [])],
    ambiguities: [...(result.ambiguous_information ?? [])],
  };
}

function cloneFields(fields: ReviewFields): ReviewFields {
  return {
    ...fields,
    rules: [...fields.rules],
    ambiguities: [...fields.ambiguities],
  };
}

function cleanList(items: string[]) {
  return items.map((item) => item.trim()).filter(Boolean);
}

function getStageIndex(progress: number) {
  let index = 0;
  STAGES.forEach((stage, i) => {
    if (progress >= stage.from) index = i;
  });
  return index;
}

function EditableList({
  id,
  label,
  items,
  onChange,
  addLabel,
  emptyText,
  placeholder,
  tone = "default",
}: {
  id: string;
  label: string;
  items: string[];
  onChange: (items: string[]) => void;
  addLabel: string;
  emptyText: string;
  placeholder?: string;
  tone?: "default" | "warning";
}) {
  const toneClass =
    tone === "warning"
      ? "border-amber-300 focus:border-amber-500 focus:ring-amber-500/10"
      : "";

  return (
    <div className="space-y-2">
      <p id={`${id}-label`} className="text-sm font-medium text-zinc-700">
        {label}
      </p>

      {items.length === 0 ? (
        <p className="text-sm text-zinc-500">{emptyText}</p>
      ) : (
        <ul aria-labelledby={`${id}-label`} className="space-y-2">
          {items.map((item, index) => (
            <li key={index} className="flex items-start gap-2">
              <Textarea
                aria-label={`${label} ${index + 1}`}
                value={item}
                rows={2}
                placeholder={placeholder}
                onChange={(event) =>
                  onChange(
                    items.map((current, i) =>
                      i === index ? event.target.value : current,
                    ),
                  )
                }
                className={`min-h-0 ${toneClass}`}
              />
              <button
                type="button"
                aria-label={`Remove ${label.toLowerCase()} ${index + 1}`}
                onClick={() => onChange(items.filter((_, i) => i !== index))}
                className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-300 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Trash2 size={16} />
              </button>
            </li>
          ))}
        </ul>
      )}

      <button
        type="button"
        onClick={() => onChange([...items, ""])}
        className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-dashed border-zinc-300 px-3 text-sm font-medium text-zinc-600 transition-colors hover:border-emerald-500 hover:text-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Plus size={14} />
        {addLabel}
      </button>
    </div>
  );
}

export default function AiStructuringForm({
  destinations,
  categories,
  onSaveDraft,
}: AiStructuringFormProps) {
  const router = useRouter();

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
  const [apiError, setApiError] = useState("");
  const [progress, setProgress] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  // State review (03.4)
  // source   = snapshot input asli yang dipakai saat generate (dipakai Regenerate & Save)
  // baseline = hasil AI apa adanya, untuk deteksi edit manual & revert
  // review   = versi yang sedang diedit reviewer
  const [source, setSource] = useState<FormValues | null>(null);
  const [baseline, setBaseline] = useState<ReviewFields | null>(null);
  const [review, setReview] = useState<ReviewFields | null>(null);
  const [detectedLanguage, setDetectedLanguage] = useState<Language>("id");
  const [aiSuggestedCategory, setAiSuggestedCategory] = useState("");
  const [resultKey, setResultKey] = useState(0);
  const [reviewErrors, setReviewErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [savedJson, setSavedJson] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const loadingRef = useRef<HTMLDivElement | null>(null);
  const resultRef = useRef<HTMLElement | null>(null);

  const reviewJson = review ? JSON.stringify(review) : "";
  const baselineJson = baseline ? JSON.stringify(baseline) : "";
  // Beda dari output AI -> perlu konfirmasi sebelum Regenerate menimpa
  const isEdited = review !== null && reviewJson !== baselineJson;
  // Beda dari versi terakhir yang disimpan (atau dari output AI kalau belum pernah disimpan)
  const hasUnsavedChanges =
    review !== null && reviewJson !== (savedJson ?? baselineJson);
  // Input mentah dikunci selama generate & review supaya Regenerate selalu memakai sumber yang sama
  const inputLocked = isGenerating || review !== null;

  // Progress simulasi: melambat saat mendekati PROGRESS_CAP
  useEffect(() => {
    if (!isGenerating) return;

    const startedAt = Date.now();

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

  // Peringatan sebelum menutup tab kalau ada edit yang belum tersimpan
  useEffect(() => {
    if (!hasUnsavedChanges) return;

    function handleBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault();
      event.returnValue = "";
    }

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Scroll ke panel loading saat mulai, dan ke hasil setiap generate sukses
  useEffect(() => {
    if (isGenerating) {
      loadingRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [isGenerating]);

  useEffect(() => {
    if (resultKey > 0) {
      resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [resultKey]);

  function update<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: "" }));
    setMessage("");
  }

  function updateReview<K extends keyof ReviewFields>(
    key: K,
    value: ReviewFields[K],
  ) {
    setReview((current) => (current ? { ...current, [key]: value } : current));
    setReviewErrors((current) => ({ ...current, [key]: "" }));
    setSaveError("");
    setMessage("");
  }

  function handleCancel() {
    abortRef.current?.abort();
  }

  // Dipakai oleh Generate pertama maupun Regenerate.
  // Hasil lama (kalau ada) tidak dihapus di awal, jadi kalau gagal/dibatalkan
  // edit reviewer tetap aman.
  async function runStructuring(input: FormValues) {
    const controller = new AbortController();
    abortRef.current = controller;

    setApiError("");
    setMessage("");
    setProgress(2);
    setElapsed(0);
    setIsGenerating(true);

    try {
      const response = await fetch("/api/admin/ai-structuring", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(input),
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

      const data = payload.data as StructuringResult;
      const fields = toReviewFields(data, categories);
      setAiSuggestedCategory((data.suggested_category ?? "").trim());

      setSource(input);
      setBaseline(fields);
      setReview(cloneFields(fields));
      setDetectedLanguage(
        data.detected_language === "id" || data.detected_language === "en"
          ? data.detected_language
          : input.language,
      );
      setReviewErrors({});
      setSaveError("");
      setSavedJson(null);
      setResultKey((key) => key + 1);
      setMessage(
        "Content successfully structured. Review and edit the result below.",
      );
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        setMessage(
          review
            ? "Generation cancelled. Your current draft was kept."
            : "Generation cancelled.",
        );
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

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isGenerating || review) return;

    setErrors({});
    setMessage("");
    setApiError("");

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

    await runStructuring(values);
  }

  async function handleRegenerate() {
    if (!source || isGenerating || isSaving) return;

    if (
      isEdited &&
      !window.confirm(
        "Regenerating will replace your manual edits with a new AI result. Continue?",
      )
    ) {
      return;
    }

    await runStructuring(source);
  }

  function handleRevert() {
    if (!baseline || isSaving) return;

    if (!window.confirm("Revert all manual edits back to the AI output?")) {
      return;
    }

    setReview(cloneFields(baseline));
    setReviewErrors({});
    setSaveError("");
    setMessage("");
  }

  // Kembali ke form input (hasil review dibuang)
  function handleEditInput() {
    if (isGenerating || isSaving) return;

    if (
      hasUnsavedChanges &&
      !window.confirm(
        "Discard this result and edit the original input? Your manual edits will be lost.",
      )
    ) {
      return;
    }

    setReview(null);
    setBaseline(null);
    setSource(null);
    setSavedJson(null);
    setReviewErrors({});
    setSaveError("");
    setApiError("");
    setMessage("");
  }

  async function handleSaveDraft() {
    if (!review || !source || isSaving || isGenerating) return;

    const nextErrors: Record<string, string> = {};

    if (!review.title.trim()) {
      nextErrors.title = "Title is required.";
    }

    if (!review.content.trim()) {
      nextErrors.content = "Content is required.";
    }

    if (!review.category) {
      nextErrors.category = "Choose a category.";
    }

    if (Object.keys(nextErrors).length > 0) {
      setReviewErrors(nextErrors);
      return;
    }

    const draft: KnowledgeDraftInput = {
      destination_id: source.destination_id,
      language: detectedLanguage,
      title: review.title.trim(),
      summary: review.summary.trim(),
      content: review.content.trim(),
      category: review.category,
      important_rules: cleanList(review.rules),
      ambiguous_information: cleanList(review.ambiguities),
      source_name: source.source_name.trim(),
      source_url: source.source_url.trim(),
      raw_content: source.content,
    };

    setIsSaving(true);
    setSaveError("");
    setMessage("");

    try {
      const result = await onSaveDraft(draft);

      if (result.ok) {
        setSavedJson(reviewJson);
        setMessage("Draft saved. Redirecting to the knowledge detail...");
        router.push(`/admin/knowledge/${result.id}`);
        // isSaving sengaja dibiarkan true sampai halaman berpindah (cegah klik ganda)
        return;
      }

      const fieldErrors = result.fieldErrors ?? {};
      const reviewFieldErrors: Record<string, string> = {};

      if (fieldErrors.title) reviewFieldErrors.title = fieldErrors.title;
      if (fieldErrors.content) reviewFieldErrors.content = fieldErrors.content;
      if (fieldErrors.category) reviewFieldErrors.category = fieldErrors.category;

      setReviewErrors(reviewFieldErrors);

      // Field yang terkunci (destination, source URL, language) tidak bisa
      // diperbaiki di layar ini, jadi pesannya ditampilkan di error simpan.
      const lockedFieldErrors = [
        fieldErrors.destination_id,
        fieldErrors.source_url,
        fieldErrors.language,
      ].filter(Boolean);

      setSaveError([result.error, ...lockedFieldErrors].join(" "));
    } catch (error) {
      setSaveError(
        error instanceof Error
          ? error.message
          : "Failed to save the draft. Please try again.",
      );
    }

    setIsSaving(false);
  }

  const percent = Math.round(progress);
  const stageIndex = getStageIndex(progress);
  const languageLabel =
    LANGUAGE_LABELS[detectedLanguage] ?? String(detectedLanguage);

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      {/* fieldset disabled = input asli terkunci selama generate & review */}
      <fieldset
        disabled={inputLocked}
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
              className={errors.content ? errorInputClass : ""}
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
                className={errors.source_url ? errorInputClass : ""}
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

      {/* Action bar generate (hanya sebelum ada hasil, atau saat proses berjalan) */}
      {(isGenerating || !review) && (
        <div className="flex flex-wrap items-center justify-end gap-3 border-t border-slate-200 pt-5">
          {isGenerating && (
            <button
              type="button"
              onClick={handleCancel}
              className={secondaryButtonClass}
            >
              <X size={16} />
              Cancel
            </button>
          )}

          <button
            type="submit"
            disabled={isGenerating}
            className={primaryButtonClass}
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
      )}

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
                {percent >= 100 ? "Done!" : `${STAGES[stageIndex].label}...`}
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

      {/* Review & edit */}
      {review && !isGenerating && (
        <section
          ref={resultRef}
          className="scroll-mt-6 space-y-5 rounded-xl border border-zinc-200 bg-white p-6"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-zinc-900">
                Review & Edit AI Result
              </h2>
              <p className="mt-1 max-w-xl text-sm text-zinc-500">
                Check the generated information and edit anything that needs
                fixing. Nothing is published from this screen. Regenerate uses
                your original input, which stays locked while you review.
              </p>
            </div>

            <div
              title="Based on the language selected for this generation"
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-medium text-zinc-700"
            >
              <Globe size={14} className="text-emerald-700" />
              Language: {languageLabel}
            </div>
          </div>

          <fieldset
            disabled={isSaving}
            className="m-0 min-w-0 space-y-5 border-0 p-0"
          >
            <div className="space-y-1.5">
              <label htmlFor="review-title" className={fieldClass}>
                Title <span className="text-red-600">*</span>
              </label>
              <Input
                id="review-title"
                value={review.title}
                onChange={(event) => updateReview("title", event.target.value)}
                aria-invalid={Boolean(reviewErrors.title)}
                aria-describedby={
                  reviewErrors.title ? "review-title-error" : undefined
                }
                className={reviewErrors.title ? errorInputClass : ""}
              />
              {reviewErrors.title && (
                <p id="review-title-error" className="text-sm text-red-600">
                  {reviewErrors.title}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="review-summary" className={fieldClass}>
                Summary
              </label>
              <Textarea
                id="review-summary"
                value={review.summary}
                onChange={(event) =>
                  updateReview("summary", event.target.value)
                }
                rows={4}
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="review-content" className={fieldClass}>
                Organized content <span className="text-red-600">*</span>
              </label>
              <Textarea
                id="review-content"
                value={review.content}
                onChange={(event) =>
                  updateReview("content", event.target.value)
                }
                rows={14}
                aria-invalid={Boolean(reviewErrors.content)}
                aria-describedby={
                  reviewErrors.content ? "review-content-error" : undefined
                }
                className={reviewErrors.content ? errorInputClass : ""}
              />
              {reviewErrors.content && (
                <p id="review-content-error" className="text-sm text-red-600">
                  {reviewErrors.content}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="review-category" className={fieldClass}>
                Category <span className="text-red-600">*</span>
              </label>

              <span className="relative block">
                <Select
                  id="review-category"
                  value={review.category}
                  onChange={(event) =>
                    updateReview("category", event.target.value)
                  }
                  aria-invalid={Boolean(reviewErrors.category)}
                  aria-describedby={
                    reviewErrors.category ? "review-category-error" : undefined
                  }
                  disabled={categories.length === 0}
                  className={`${selectClass} cursor-pointer appearance-none pr-9`}
                >
                  <option value="">Select category</option>
                  {categories.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </Select>

                <ChevronDown
                  size={16}
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400"
                />
              </span>

              {reviewErrors.category && (
                <p id="review-category-error" className="text-sm text-red-600">
                  {reviewErrors.category}
                </p>
              )}

              {(categories.length === 0 ||
                (!review.category && aiSuggestedCategory)) && (
                <p className="text-sm text-amber-700">
                  {categories.length === 0
                    ? "No categories yet."
                    : `AI suggested "${aiSuggestedCategory}", which is not in your category list.`}{" "}
                  <Link
                    href="/admin/knowledge/categories"
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium underline"
                  >
                    Manage categories
                  </Link>{" "}
                  in a new tab, then{" "}
                  <button
                    type="button"
                    onClick={() => router.refresh()}
                    className="font-medium underline"
                  >
                    refresh the list
                  </button>
                  .
                </p>
              )}
            </div>

            <EditableList
              id="review-rules"
              label="Important rules & instructions"
              items={review.rules}
              onChange={(items) => updateReview("rules", items)}
              addLabel="Add rule"
              emptyText="No explicit rules identified."
              placeholder="Describe a rule or instruction"
            />

            <EditableList
              id="review-ambiguities"
              label="Ambiguous information"
              items={review.ambiguities}
              onChange={(items) => updateReview("ambiguities", items)}
              addLabel="Add item"
              emptyText="No ambiguous information identified."
              placeholder="Describe what needs to be verified"
              tone="warning"
            />
          </fieldset>

          {saveError && (
            <div
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
            >
              {saveError}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-200 pt-5">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleEditInput}
                disabled={isSaving}
                className={secondaryButtonClass}
              >
                <FileText size={16} />
                Edit original input
              </button>

              {isEdited && (
                <button
                  type="button"
                  onClick={handleRevert}
                  disabled={isSaving}
                  className={secondaryButtonClass}
                >
                  <RotateCcw size={16} />
                  Revert edits
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleRegenerate}
                disabled={isSaving}
                className={secondaryButtonClass}
              >
                <RefreshCw size={16} />
                Regenerate
              </button>

              <button
                type="button"
                onClick={handleSaveDraft}
                disabled={isSaving}
                className={primaryButtonClass}
              >
                {isSaving ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    Save as Draft
                  </>
                )}
              </button>
            </div>
          </div>

          <p className="text-right text-xs text-zinc-500">
            Saved drafts are not published and are not used for answers until
            you publish them.
          </p>
        </section>
      )}
    </form>
  );
}