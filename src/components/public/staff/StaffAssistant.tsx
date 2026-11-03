"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { askStaffAssistant } from "@/lib/staff-assistant/client";
import { STAFF_TEXT as T } from "@/lib/staff-assistant/text";
import { MAX_SITUATION_LENGTH, type StaffAnswer } from "@/lib/staff-assistant/types";

const isHttp = (url: string) => /^https?:\/\//i.test(url);

export default function StaffAssistant({ destinationId }: { destinationId: string }) {
  const [situation, setSituation] = useState("");
  const [result, setResult] = useState<StaffAnswer | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (copyTimer.current) clearTimeout(copyTimer.current);
    };
  }, []);

  async function generate() {
    const text = situation.trim();
    if (!text || loading) return; // cegah kirim ganda

    setError(null);
    setResult(null);
    setCopyState("idle");
    setLoading(true);

    try {
      setResult(await askStaffAssistant({ situation: text, destinationId }));
    } catch (e) {
      // input tidak dihapus supaya petugas tidak perlu mengetik ulang
      setError(e instanceof Error && e.message ? e.message : T.errorGeneric);
    } finally {
      setLoading(false);
    }
  }

  async function copy() {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.explanation);
      setCopyState("copied");
    } catch {
      setCopyState("failed");
    }
    if (copyTimer.current) clearTimeout(copyTimer.current);
    copyTimer.current = setTimeout(() => setCopyState("idle"), 2500);
  }

  function clearAll() {
    setSituation("");
    setResult(null);
    setError(null);
    setCopyState("idle");
    textareaRef.current?.focus();
  }

  function useExample(text: string) {
    setSituation(text);
    setError(null);
    textareaRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      void generate();
    }
  }

  const canGenerate = situation.trim().length > 0 && !loading;

  return (
    <div className="space-y-6">
      {/* Input situasi */}
      <section className="rounded-xl border border-stone-200 bg-white p-4 sm:p-5">
        <label htmlFor="situation" className="text-sm font-medium text-stone-900">
          {T.situationLabel}
        </label>
        <textarea
          id="situation"
          ref={textareaRef}
          rows={5}
          value={situation}
          maxLength={MAX_SITUATION_LENGTH}
          onChange={(e) => setSituation(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={T.placeholder}
          className="mt-2 w-full resize-y rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-emerald-600"
        />
        <div className="mt-1 flex items-center justify-between text-xs text-stone-500">
          <span>{T.hint}</span>
          <span aria-live="off">
            {situation.length}/{MAX_SITUATION_LENGTH}
          </span>
        </div>

        <div className="mt-4">
          <p className="text-xs font-medium text-stone-500">{T.examplesTitle}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {T.examples.map((ex) => (
              <button
                key={ex}
                type="button"
                onClick={() => useExample(ex)}
                className="rounded-full border border-stone-300 bg-white px-3 py-1.5 text-left text-xs text-stone-700 transition hover:border-emerald-600 hover:text-emerald-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
              >
                {ex}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => void generate()}
            disabled={!canGenerate}
            className="rounded-lg bg-emerald-700 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? T.generating : T.generate}
          </button>
          <button
            type="button"
            onClick={clearAll}
            disabled={loading || (situation.length === 0 && !result && !error)}
            className="rounded-lg border border-stone-300 px-5 py-2.5 text-sm font-medium text-stone-700 transition hover:bg-stone-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {T.clear}
          </button>
        </div>
      </section>

      {error && (
        <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      )}

      {/* Hasil */}
      <section aria-busy={loading} className="rounded-xl border border-stone-200 bg-white p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-medium text-stone-900">{T.resultTitle}</h2>
          {result && (
            <button
              type="button"
              onClick={() => void copy()}
              className="rounded-md border border-stone-300 px-3 py-1 text-xs font-medium text-stone-700 hover:bg-stone-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
            >
              {copyState === "copied" ? T.copied : T.copy}
            </button>
          )}
        </div>

        <div aria-live="polite" className="mt-3">
          {loading ? (
            <div className="space-y-2" role="status">
              <div className="h-4 w-full animate-pulse rounded bg-stone-200" />
              <div className="h-4 w-11/12 animate-pulse rounded bg-stone-200" />
              <div className="h-4 w-3/4 animate-pulse rounded bg-stone-200" />
              <span className="sr-only">{T.loadingResult}</span>
            </div>
          ) : result ? (
            <>
              {result.fallback && (
                <p className="mb-3 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-900">{T.fallbackNote}</p>
              )}
              <p lang="en" className="whitespace-pre-wrap break-words text-sm leading-relaxed text-stone-800">
                {result.explanation}
              </p>
              {copyState === "failed" && <p className="mt-2 text-xs text-red-700">{T.copyFailed}</p>}

              {result.sources.length > 0 && (
                <div className="mt-4 border-t border-stone-100 pt-3">
                  <p className="text-xs font-medium text-stone-500">{T.sources}</p>
                  <ul className="mt-1 space-y-1.5">
                    {result.sources.map((s) => (
                      <li key={s.id} className="text-xs text-stone-600">
                        {s.detailPath ? (
                          <Link href={s.detailPath} className="font-medium text-emerald-700 hover:underline">
                            {s.title}
                          </Link>
                        ) : (
                          <span className="font-medium text-stone-800">{s.title}</span>
                        )}
                        {s.sourceName && <span> &middot; {s.sourceName}</span>}
                        {s.sourceUrl && isHttp(s.sourceUrl) && (
                          <>
                            {" "}
                            <a href={s.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-emerald-700 hover:underline">
                              {T.openSource}
                            </a>
                          </>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-stone-500">{T.resultEmpty}</p>
          )}
        </div>

        <p className="mt-4 text-[11px] leading-snug text-stone-500">{T.disclaimer}</p>
      </section>
    </div>
  );
}
