"use client";

import { useEffect, useRef, useState } from "react";
import { askGuide } from "@/lib/chat/client";
import { CHAT_TEXT, MAX_QUESTION_LENGTH } from "@/lib/chat/text";
import type { ChatLanguage, ChatMessage } from "@/types/chat";
import MessageBubble, { TypingBubble } from "./MessageBubble";

export default function ChatPanel({
  destinationId,
  destinationName,
}: {
  destinationId: string;
  destinationName: string;
}) {
  const [language, setLanguage] = useState<ChatLanguage>("en");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const t = CHAT_TEXT[language];
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const counter = useRef(0);
  const nextId = () => `m-${Date.now()}-${counter.current++}`;

  // scroll ke pesan terbaru
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loading, error]);

  // textarea tumbuh mengikuti isi (maks 160px)
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [input]);

  async function send(raw: string) {
    const question = raw.trim();
    if (!question || loading) return; // cegah kirim ganda

    const userMessage: ChatMessage = { id: nextId(), role: "user", content: question };
    setError(null);
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const result = await askGuide({ question, destinationId, language });
      setMessages((prev) => [
        ...prev,
        { id: nextId(), role: "assistant", content: result.answer, sources: result.sources },
      ]);
    } catch (e) {
      // gagal: pesan dikembalikan ke kotak input supaya tidak perlu mengetik ulang
      setMessages((prev) => prev.filter((m) => m.id !== userMessage.id));
      setInput((current) => current || question);
      setError(e instanceof Error && e.message ? e.message : t.errorGeneric);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      void send(input);
    }
  }

  function clearConversation() {
    setMessages([]);
    setError(null);
    setInput("");
  }

  const isEmpty = messages.length === 0 && !loading;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Toolbar: bahasa dan hapus percakapan */}
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-stone-200 bg-white px-4 py-2">
        <div className="flex items-center gap-2 text-xs text-stone-600">
          <span>{t.languageLabel}</span>
          <div className="inline-flex overflow-hidden rounded-md border border-stone-300">
            {(["id", "en"] as const).map((lang) => (
              <button
                key={lang}
                type="button"
                aria-pressed={language === lang}
                onClick={() => setLanguage(lang)}
                className={`px-3 py-1 text-xs font-medium uppercase focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 ${
                  language === lang ? "bg-emerald-700 text-white" : "bg-white text-stone-700 hover:bg-stone-50"
                }`}
              >
                {lang}
              </button>
            ))}
          </div>
        </div>
        <button
          type="button"
          onClick={clearConversation}
          disabled={messages.length === 0 && !error}
          className="text-xs font-medium text-stone-600 hover:text-stone-900 hover:underline disabled:cursor-not-allowed disabled:opacity-40 disabled:no-underline"
        >
          {t.clear}
        </button>
      </div>

      {/* Daftar pesan */}
      <div
        role="log"
        aria-live="polite"
        aria-label={t.logLabel}
        className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-5"
      >
        {isEmpty ? (
          <div className="mx-auto max-w-md pt-6 text-center">
            <h2 className="text-lg font-semibold text-stone-900">
              {t.emptyTitle.replace("{name}", destinationName)}
            </h2>
            <p className="mt-1 text-sm text-stone-600">{t.emptyHint}</p>
            <p className="mt-6 text-xs font-medium text-stone-500">{t.suggestionsTitle}</p>
            <div className="mt-2 flex flex-wrap justify-center gap-2">
              {t.suggestions.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => void send(q)}
                  className="rounded-full border border-stone-300 bg-white px-3 py-1.5 text-left text-xs text-stone-700 transition hover:border-emerald-600 hover:text-emerald-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m) => (
            <MessageBubble key={m.id} message={m} sourcesLabel={t.sources} openSourceLabel={t.openSource} />
          ))
        )}
        {loading && <TypingBubble label={t.typing} />}
        <div ref={bottomRef} />
      </div>

      {error && (
        <p role="alert" className="mx-4 mb-2 shrink-0 rounded-md bg-red-50 px-4 py-2 text-sm text-red-800">
          {error}
        </p>
      )}

      {/* Input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void send(input);
        }}
        className="shrink-0 border-t border-stone-200 bg-white px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
      >
        <div className="flex items-end gap-2">
          <label htmlFor="chat-input" className="sr-only">
            {t.inputLabel}
          </label>
          <textarea
            id="chat-input"
            ref={textareaRef}
            rows={1}
            value={input}
            maxLength={MAX_QUESTION_LENGTH}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t.placeholder}
            className="max-h-40 min-h-[2.75rem] flex-1 resize-none rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
          />
          <button
            type="submit"
            disabled={loading || input.trim().length === 0}
            className="h-11 shrink-0 rounded-xl bg-emerald-700 px-5 text-sm font-medium text-white transition hover:bg-emerald-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {t.send}
          </button>
        </div>
        <div className="mt-2 flex items-start justify-between gap-3">
          <p className="text-[11px] leading-snug text-stone-500">{t.disclaimer}</p>
          {input.length > MAX_QUESTION_LENGTH - 100 && (
            <span className="shrink-0 text-[11px] text-stone-500">
              {input.length}/{MAX_QUESTION_LENGTH}
            </span>
          )}
        </div>
      </form>
    </div>
  );
}
