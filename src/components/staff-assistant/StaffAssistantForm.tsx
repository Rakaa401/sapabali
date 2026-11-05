
"use client";

import { useState } from "react";
import {
  Sparkles,
  Copy,
  Check,
  RotateCcw,
  Trash2,
  MessageSquareText,
  Loader2,
  AlertCircle,
  Languages,
  ArrowRight,
} from "lucide-react";
import { MAX_SITUATION_LENGTH } from "@/lib/staff-assistant/types";

const exampleSituation =
  "A visitor is visiting a Balinese temple. They are wearing shorts and asking whether they are allowed to enter the temple.";

const demoResponse =
  "Welcome to our temple. Before entering, visitors are kindly asked to wear appropriate clothing as a sign of respect for this sacred place. If you are wearing shorts, you may need to use a sarong, which is available at the entrance. Thank you for understanding and respecting our local traditions.";

export default function StaffAssistantForm() {
  const [situation, setSituation] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  async function handleGenerate() {
    if (!situation.trim() || loading) return;

    setLoading(true);
    setError("");
    setResponse("");
    setCopied(false);

    try {
      await new Promise((resolve) => setTimeout(resolve, 900));
      setResponse(demoResponse);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    if (!response) return;

    try {
      await navigator.clipboard.writeText(response);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Unable to copy the response. Please copy it manually.");
    }
  }

  function handleClear() {
    setSituation("");
    setResponse("");
    setError("");
    setCopied(false);
  }

  function handleExample() {
    setSituation(exampleSituation);
    setResponse("");
    setError("");
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div>
        <div className="mb-3 flex items-center gap-2 text-sm font-medium text-emerald-700">
          <span>AI Tools</span>
          <span className="text-zinc-400">/</span>
          <span>Staff Assistant</span>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-950">
              Staff Assistant
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
              Turn everyday visitor situations into clear, polite English
              explanations while respecting Balinese culture and local
              traditions.
            </p>
          </div>

          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            English communication
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
              <MessageSquareText size={20} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-zinc-950">
                Describe the situation
              </h2>
              <p className="mt-0.5 text-xs text-zinc-500">
                Explain what the visitor is asking or experiencing.
              </p>
            </div>
          </div>

          <div className="mt-6">
            <div className="mb-2 flex items-center justify-between">
              <label
                htmlFor="situation"
                className="text-sm font-medium text-zinc-700"
              >
                Visitor situation
              </label>
              <span className="text-xs text-zinc-400">
              {situation.length}/{MAX_SITUATION_LENGTH}
              </span>
            </div>

            <textarea
              id="situation"
              value={situation}
             onChange={(event) =>
  setSituation(event.target.value.slice(0, MAX_SITUATION_LENGTH))
}
              placeholder="Example: A visitor is asking why they need to wear a sarong before entering the temple..."
              rows={9}
              className="w-full resize-y rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm leading-6 text-zinc-800 outline-none transition placeholder:text-zinc-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
            />

            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleExample}
                className="inline-flex items-center gap-2 text-xs font-medium text-emerald-700 transition hover:text-emerald-800"
              >
                <Sparkles size={14} />
                Try an example
                <ArrowRight size={13} />
              </button>

              <button
                type="button"
                onClick={handleClear}
                disabled={!situation && !response}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 transition hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Trash2 size={13} />
                Clear all
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGenerate}
            disabled={!situation.trim() || loading}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 size={17} className="animate-spin" />
                Generating explanation...
              </>
            ) : (
              <>
                <Sparkles size={17} />
                Generate explanation
              </>
            )}
          </button>

          <p className="mt-3 text-center text-xs text-zinc-400">
            Responses should preserve the original situation and respect local
            cultural context.
          </p>
        </section>

        <section className="flex min-h-[420px] flex-col rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                <Languages size={20} />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-zinc-950">
                  English explanation
                </h2>
                <p className="mt-0.5 text-xs text-zinc-500">
                  Ready-to-use visitor communication
                </p>
              </div>
            </div>

            {response && (
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-2 text-xs font-medium text-zinc-600 transition hover:bg-zinc-50"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? "Copied" : "Copy"}
              </button>
            )}
          </div>

          <div className="mt-6 flex flex-1 flex-col rounded-xl border border-zinc-100 bg-zinc-50/70 p-4 sm:p-5">
            {loading ? (
              <div className="flex flex-1 flex-col items-center justify-center text-center">
                <Loader2 size={25} className="animate-spin text-emerald-600" />
                <p className="mt-4 text-sm font-medium text-zinc-700">
                  Preparing your explanation
                </p>
                <p className="mt-1 text-xs text-zinc-400">
                  Please wait a moment...
                </p>
              </div>
            ) : error ? (
              <div className="flex flex-1 flex-col items-center justify-center text-center">
                <AlertCircle size={24} className="text-red-500" />
                <p className="mt-3 text-sm font-medium text-red-700">
                  Unable to generate response
                </p>
                <p className="mt-1 text-xs text-zinc-500">{error}</p>
                <button
                  type="button"
                  onClick={handleGenerate}
                  className="mt-4 text-xs font-semibold text-emerald-700 hover:text-emerald-800"
                >
                  Try again
                </button>
              </div>
            ) : response ? (
              <div className="flex flex-1 flex-col">
                <div className="mb-4 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span className="text-xs font-medium text-emerald-700">
                    Explanation generated
                  </span>
                </div>

                <p className="text-sm leading-7 text-zinc-700">{response}</p>

                <div className="mt-auto flex justify-end pt-6">
                  <button
                    type="button"
                    onClick={handleGenerate}
                    disabled={loading}
                    className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-zinc-500 transition hover:bg-white hover:text-zinc-900"
                  >
                    <RotateCcw size={14} />
                    Regenerate
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center px-4 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-zinc-200 bg-white text-zinc-400">
                  <Languages size={22} />
                </div>
                <h3 className="mt-4 text-sm font-semibold text-zinc-800">
                  Your explanation will appear here
                </h3>
                <p className="mt-2 max-w-xs text-xs leading-5 text-zinc-400">
                  Describe a visitor situation and generate a clear English
                  explanation for your response.
                </p>
              </div>
            )}
          </div>

          <p className="mt-3 text-xs text-zinc-400">
            Always review the explanation before sharing it with visitors.
          </p>
        </section>
      </div>
    </div>
  );
}
