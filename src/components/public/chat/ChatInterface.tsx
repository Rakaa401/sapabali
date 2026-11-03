"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { FormEvent, KeyboardEvent } from "react";
import { Bot, CircleAlert, Info, LoaderCircle, Send, Trash2 } from "lucide-react";
import SourceList from "@/components/public/chat/SourceList";
import {
  MAX_QUESTION_LENGTH,
  MIN_QUESTION_LENGTH,
  type ChatLanguage,
  type ChatResponse,
  type ChatSource,
} from "@/lib/visitor-chat/types";

type Props = {
  destinationId: string;
  language: ChatLanguage;
};

type Message = {
  id: number;
  role: "user" | "assistant";
  content: string;
  sources?: ChatSource[];
  fallback?: boolean;
};

const COPY = {
  en: {
    welcomeTitle: "Ask about visiting",
    welcomeBody:
      "Ask about rules, etiquette, dress code, and local customs. Answers come only from the verified information published for this destination.",
    suggestionsTitle: "Try asking",
    suggestions: [
      "What should I wear here?",
      "What are the rules I need to follow?",
      "Are there areas visitors cannot enter?",
      "What etiquette should I follow?",
    ],
    placeholder: "Type your question...",
    send: "Send",
    sending: "Sending",
    thinking: "The guide is looking up verified information",
    clear: "Clear conversation",
    disclaimer: "Answers are written by AI from verified destination information. Always follow instructions from on-site staff.",
    tooShort: `Please write at least ${MIN_QUESTION_LENGTH} characters.`,
    network: "Could not reach the server. Check your connection and try again. Your question is kept below.",
    chatLabel: "Conversation",
    youSaid: "You",
    guideSaid: "AI Cultural Guide",
    fallbackLabel: "No verified information found",
  },
  id: {
    welcomeTitle: "Tanya seputar kunjungan",
    welcomeBody:
      "Tanyakan aturan, etika, cara berpakaian, dan adat setempat. Jawaban hanya berasal dari informasi terverifikasi yang dipublikasikan untuk destinasi ini.",
    suggestionsTitle: "Coba tanyakan",
    suggestions: [
      "Pakaian apa yang pantas dipakai di sini?",
      "Apa saja aturan yang harus saya ikuti?",
      "Apakah ada area yang tidak boleh dimasuki pengunjung?",
      "Bagaimana etika yang baik saat berkunjung?",
    ],
    placeholder: "Tulis pertanyaanmu...",
    send: "Kirim",
    sending: "Mengirim",
    thinking: "Pemandu sedang mencari informasi terverifikasi",
    clear: "Hapus percakapan",
    disclaimer: "Jawaban ditulis oleh AI dari informasi terverifikasi destinasi. Selalu ikuti arahan petugas di lokasi.",
    tooShort: `Tulis minimal ${MIN_QUESTION_LENGTH} karakter.`,
    network: "Tidak dapat terhubung ke server. Periksa koneksimu lalu coba lagi. Pertanyaanmu tetap ada di bawah.",
    chatLabel: "Percakapan",
    youSaid: "Kamu",
    guideSaid: "Pemandu Budaya AI",
    fallbackLabel: "Informasi terverifikasi tidak ditemukan",
  },
} as const;

export default function ChatInterface({ destinationId, language }: Props) {
  const t = COPY[language];

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inFlight = useRef(false); // mencegah kirim ganda, termasuk klik cepat sebelum state ter-update
  const abortRef = useRef<AbortController | null>(null);
  const nextId = useRef(1); // bukan crypto.randomUUID: tidak tersedia di http non-localhost
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loading]);

  // Tinggi textarea mengikuti isi, maksimal 8rem
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 128)}px`;
  }, [input]);

  // Batalkan request yang masih berjalan kalau halaman ditutup
  useEffect(() => () => abortRef.current?.abort(), []);

  const submit = useCallback(
    async (rawQuestion: string) => {
      const question = rawQuestion.trim();

      if (inFlight.current) return;

      if (question.length < MIN_QUESTION_LENGTH) {
        setError(t.tooShort);
        return;
      }

      inFlight.current = true;
      setLoading(true);
      setError(null);

      const userMessage: Message = { id: nextId.current++, role: "user", content: question };
      setMessages((prev) => [...prev, userMessage]);
      setInput("");

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const response = await fetch("/api/visitor/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ destinationId, question, language }),
          signal: controller.signal,
        });

        let data: ChatResponse | null = null;

        try {
          data = (await response.json()) as ChatResponse;
        } catch {
          data = null;
        }

        if (!data) throw new Error(t.network);
        if (!data.ok) throw new Error(data.error.message);

        setMessages((prev) => [
          ...prev,
          {
            id: nextId.current++,
            role: "assistant",
            content: data.answer,
            sources: data.sources,
            fallback: data.fallback,
          },
        ]);
      } catch (err) {
        if (controller.signal.aborted) return;

        // Gagal: buang pesan pengguna dan kembalikan teksnya ke kolom input supaya bisa dikirim ulang
        setMessages((prev) => prev.filter((message) => message.id !== userMessage.id));
        setInput(question);
        setError(err instanceof Error && err.message ? err.message : t.network);
      } finally {
        if (abortRef.current === controller) {
          inFlight.current = false;
          setLoading(false);
        }
      }
    },
    [destinationId, language, t.network, t.tooShort],
  );

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    void submit(input);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    // Enter = kirim, Shift+Enter = baris baru. Jangan kirim saat memilih teks lewat IME.
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      void submit(input);
    }
  }

  function clearConversation() {
    abortRef.current?.abort();
    inFlight.current = false;
    setMessages([]);
    setInput("");
    setError(null);
    setLoading(false);
  }

  const isEmpty = messages.length === 0;
  const remaining = MAX_QUESTION_LENGTH - input.length;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Daftar pesan */}
      <div
        role="log"
        aria-live="polite"
        aria-label={t.chatLabel}
        aria-busy={loading}
        className="flex-1 overflow-y-auto px-4 sm:px-6"
      >
        <div className="mx-auto max-w-3xl space-y-4 py-6">
          {isEmpty && !loading && (
            <section className="rounded-2xl border border-stone-200 bg-white p-5 sm:p-6">
              <span
                aria-hidden
                className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-50 text-emerald-700"
              >
                <Bot size={22} />
              </span>
              <h2 className="mt-3 text-lg font-semibold">{t.welcomeTitle}</h2>
              <p className="mt-1 text-sm leading-relaxed text-stone-600">{t.welcomeBody}</p>

              <p className="mt-5 text-xs font-semibold uppercase tracking-wide text-stone-500">{t.suggestionsTitle}</p>
              <ul className="mt-2 grid gap-2 sm:grid-cols-2">
                {t.suggestions.map((suggestion) => (
                  <li key={suggestion}>
                    <button
                      type="button"
                      onClick={() => void submit(suggestion)}
                      disabled={loading}
                      className="min-h-11 w-full rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-left text-sm font-medium text-stone-800 transition hover:border-emerald-600 hover:bg-emerald-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 disabled:opacity-60"
                    >
                      {suggestion}
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {messages.map((message) =>
            message.role === "user" ? (
              <div key={message.id} className="flex justify-end">
                <div className="max-w-[85%] rounded-2xl rounded-br-md bg-emerald-700 px-4 py-3 text-white sm:max-w-[75%]">
                  <p className="sr-only">{t.youSaid}</p>
                  <p className="whitespace-pre-wrap break-words text-[0.95rem] leading-relaxed">{message.content}</p>
                </div>
              </div>
            ) : (
              <div key={message.id} className="flex justify-start gap-2.5">
                <span
                  aria-hidden
                  className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700"
                >
                  <Bot size={18} />
                </span>
                <div
                  className={`min-w-0 max-w-[88%] rounded-2xl rounded-tl-md border px-4 py-3 sm:max-w-[80%] ${
                    message.fallback ? "border-amber-300 bg-amber-50" : "border-stone-200 bg-white"
                  }`}
                >
                  <p className="sr-only">{t.guideSaid}</p>

                  {message.fallback && (
                    <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-amber-900">
                      <Info size={14} aria-hidden />
                      {t.fallbackLabel}
                    </p>
                  )}

                  <p
                    className={`whitespace-pre-line break-words text-[0.95rem] leading-relaxed ${
                      message.fallback ? "text-amber-950" : "text-stone-800"
                    }`}
                  >
                    {message.content}
                  </p>

                  {message.sources && message.sources.length > 0 && (
                    <SourceList sources={message.sources} lang={language} />
                  )}
                </div>
              </div>
            ),
          )}

          {loading && (
            <div className="flex justify-start gap-2.5" role="status">
              <span
                aria-hidden
                className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700"
              >
                <Bot size={18} />
              </span>
              <div className="rounded-2xl rounded-tl-md border border-stone-200 bg-white px-4 py-3">
                <span className="sr-only">{t.thinking}</span>
                <span aria-hidden className="flex items-center gap-1.5">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-stone-400 [animation-delay:-0.3s]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-stone-400 [animation-delay:-0.15s]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-stone-400" />
                </span>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input */}
      <div className="shrink-0 border-t border-stone-200 bg-white px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-6">
        <div className="mx-auto max-w-3xl">
          {error && (
            <p
              role="alert"
              className="mb-3 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
            >
              <CircleAlert size={16} aria-hidden className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </p>
          )}

          <form onSubmit={handleSubmit} className="flex items-end gap-2">
            <div className="min-w-0 flex-1">
              <label htmlFor="chat-input" className="sr-only">
                {t.placeholder}
              </label>
              <textarea
                id="chat-input"
                ref={textareaRef}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
                maxLength={MAX_QUESTION_LENGTH}
                placeholder={t.placeholder}
                enterKeyHint="send"
                className="block max-h-32 w-full resize-none rounded-xl border border-stone-300 bg-white px-4 py-3 text-base text-stone-900 placeholder:text-stone-400 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/30"
              />
            </div>

            <button
              type="submit"
              disabled={loading || input.trim().length === 0}
              className="flex h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 text-sm font-semibold text-white transition hover:bg-emerald-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 sm:px-5"
            >
              {loading ? (
                <LoaderCircle size={18} aria-hidden className="animate-spin" />
              ) : (
                <Send size={18} aria-hidden />
              )}
              <span className="hidden sm:inline">{loading ? t.sending : t.send}</span>
              <span className="sr-only sm:hidden">{loading ? t.sending : t.send}</span>
            </button>
          </form>

          <div className="mt-2 flex items-start justify-between gap-3 text-xs text-stone-500">
            <p className="leading-relaxed">{t.disclaimer}</p>
            <div className="flex shrink-0 flex-col items-end gap-1">
              {remaining <= 100 && (
                <span className={remaining <= 20 ? "font-medium text-amber-700" : ""}>
                  {input.length}/{MAX_QUESTION_LENGTH}
                </span>
              )}
              {!isEmpty && (
                <button
                  type="button"
                  onClick={clearConversation}
                  className="inline-flex min-h-8 items-center gap-1 rounded-md px-1.5 font-medium text-stone-600 hover:bg-stone-100 hover:text-stone-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
                >
                  <Trash2 size={13} aria-hidden />
                  {t.clear}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
