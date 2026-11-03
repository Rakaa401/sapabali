export type ChatLanguage = "id" | "en";

// Satu sumber yang dipakai AI untuk menjawab (06.5 akan mengisi ini dari hasil retrieval)
export interface ChatSource {
  id: string;
  title: string;
  source_name: string | null;
  source_url: string | null;
  href?: string | null; // link ke halaman detail knowledge publik, kalau ada
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: ChatSource[];
}

// Kontrak ke POST /api/visitor/chat (06.2). Samakan dengan API yang dibuat tim.
export interface ChatRequest {
  question: string;
  destinationId: string;
  language: ChatLanguage;
}

export interface ChatAnswer {
  answer: string;
  sources: ChatSource[];
}
