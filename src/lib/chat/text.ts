import type { ChatLanguage } from "@/types/chat";

export const MAX_QUESTION_LENGTH = 500;

interface ChatText {
  title: string;
  logLabel: string;
  placeholder: string;
  inputLabel: string;
  send: string;
  clear: string;
  emptyTitle: string; // {name} diganti nama destinasi
  emptyHint: string;
  suggestionsTitle: string;
  suggestions: string[];
  sources: string;
  openSource: string;
  typing: string;
  errorGeneric: string;
  disclaimer: string;
  languageLabel: string;
}

export const CHAT_TEXT: Record<ChatLanguage, ChatText> = {
  id: {
    title: "Pemandu Budaya AI",
    logLabel: "Percakapan dengan pemandu budaya AI",
    placeholder: "Tulis pertanyaanmu...",
    inputLabel: "Pertanyaan",
    send: "Kirim",
    clear: "Hapus percakapan",
    emptyTitle: "Tanya apa saja tentang {name}",
    emptyHint: "Jawaban berasal dari informasi terverifikasi untuk destinasi ini.",
    suggestionsTitle: "Coba tanyakan:",
    suggestions: [
      "Apa aturan berpakaian di sini?",
      "Apa yang tidak boleh dilakukan pengunjung?",
      "Bagaimana etika saat melihat upacara?",
      "Apakah ada area yang dilarang dimasuki?",
    ],
    sources: "Sumber",
    openSource: "Buka sumber",
    typing: "Pemandu AI sedang menulis jawaban",
    errorGeneric: "Pertanyaan belum terkirim. Coba lagi sebentar lagi.",
    disclaimer: "Jawaban AI bisa belum lengkap. Untuk hal penting, tanyakan langsung ke petugas destinasi.",
    languageLabel: "Bahasa",
  },
  en: {
    title: "AI Cultural Guide",
    logLabel: "Conversation with the AI cultural guide",
    placeholder: "Type your question...",
    inputLabel: "Question",
    send: "Send",
    clear: "Clear conversation",
    emptyTitle: "Ask anything about {name}",
    emptyHint: "Answers come from verified information for this destination.",
    suggestionsTitle: "Try asking:",
    suggestions: [
      "What is the dress code here?",
      "What should visitors not do?",
      "What is the etiquette when watching a ceremony?",
      "Are there areas visitors cannot enter?",
    ],
    sources: "Sources",
    openSource: "Open source",
    typing: "The AI guide is writing an answer",
    errorGeneric: "Your question was not sent. Please try again in a moment.",
    disclaimer: "AI answers may be incomplete. For important matters, ask the destination staff directly.",
    languageLabel: "Language",
  },
};
