import type { ChatAnswer, ChatRequest } from "@/types/chat";

export class ChatError extends Error {}

// Mode contoh dipakai selama backend (06.2 dan 06.3) belum ada.
// Matikan dengan mengisi NEXT_PUBLIC_CHAT_MOCK=false di .env.local lalu restart npm run dev.
const USE_MOCK = process.env.NEXT_PUBLIC_CHAT_MOCK !== "false";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function mockAsk(req: ChatRequest): Promise<ChatAnswer> {
  await sleep(1200);

  // ketik "test error" untuk mencoba tampilan error
  if (req.question.trim().toLowerCase() === "test error") {
    throw new ChatError("Simulated error: the AI service could not be reached.");
  }

  const answer =
    req.language === "id"
      ? "Ini jawaban contoh. Backend AI belum tersambung, jadi isi jawaban ini bukan informasi resmi destinasi."
      : "This is a sample answer. The AI backend is not connected yet, so this is not official destination information.";

  return {
    answer,
    sources: [
      { id: "mock-1", title: "Dress Code (sample)", source_name: "Sample source", source_url: "https://example.com/dress-code", href: null },
      { id: "mock-2", title: "Visitor Rules (sample)", source_name: null, source_url: null, href: null },
    ],
  };
}

async function realAsk(req: ChatRequest): Promise<ChatAnswer> {
  let res: Response;
  try {
    res = await fetch("/api/visitor/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req),
    });
  } catch {
    throw new ChatError("Could not reach the server. Check your connection and try again.");
  }

  const data = await res.json().catch(() => null);
  if (!res.ok || !data || typeof data.answer !== "string") {
    throw new ChatError(typeof data?.error === "string" ? data.error : "Could not get an answer. Please try again.");
  }
  return { answer: data.answer, sources: Array.isArray(data.sources) ? data.sources : [] };
}

export const askGuide = USE_MOCK ? mockAsk : realAsk;
