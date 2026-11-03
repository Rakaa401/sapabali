import type { ChatErrorCode, ChatLanguage } from "./types";

const ERRORS: Record<ChatLanguage, Record<ChatErrorCode, string>> = {
  en: {
    INVALID_REQUEST: "Your question could not be processed. Please check it and try again.",
    DESTINATION_NOT_FOUND: "This destination is not available.",
    RATE_LIMITED: "You are asking too quickly. Please wait a moment and try again.",
    SERVICE_UNAVAILABLE: "The AI guide is temporarily unavailable. Please try again shortly.",
    INTERNAL_ERROR: "Something went wrong. Please try again.",
  },
  id: {
    INVALID_REQUEST: "Pertanyaan kamu tidak dapat diproses. Periksa lagi lalu coba kembali.",
    DESTINATION_NOT_FOUND: "Destinasi ini tidak tersedia.",
    RATE_LIMITED: "Kamu bertanya terlalu cepat. Tunggu sebentar lalu coba lagi.",
    SERVICE_UNAVAILABLE: "Pemandu AI sedang tidak tersedia. Silakan coba lagi sebentar lagi.",
    INTERNAL_ERROR: "Terjadi kesalahan. Silakan coba lagi.",
  },
};

export function errorMessage(code: ChatErrorCode, language: ChatLanguage): string {
  return ERRORS[language][code];
}

export function questionTooShortMessage(language: ChatLanguage, min: number): string {
  return language === "id"
    ? `Pertanyaan terlalu pendek. Tulis minimal ${min} karakter.`
    : `Your question is too short. Please write at least ${min} characters.`;
}

export function questionTooLongMessage(language: ChatLanguage, max: number): string {
  return language === "id"
    ? `Pertanyaan terlalu panjang. Maksimal ${max} karakter.`
    : `Your question is too long. The limit is ${max} characters.`;
}

// Jawaban aman saat tidak ada informasi terverifikasi yang cukup relevan.
// Sengaja tidak menebak aturan, dan tidak menggeneralisasi dari destinasi lain.
export function fallbackMessage(language: ChatLanguage, destinationName: string): string {
  if (language === "id") {
    return (
      `Maaf, saya belum menemukan informasi terverifikasi tentang hal itu untuk ${destinationName}. ` +
      "Supaya tidak memberi informasi yang keliru, saya tidak akan menebak.\n\n" +
      "Silakan tanyakan langsung kepada petugas atau pengelola di lokasi. " +
      "Kamu juga bisa membuka Panduan Pengunjung, atau mencoba pertanyaan lain tentang aturan, etika, cara berpakaian, dan adat di sini."
    );
  }

  return (
    `Sorry, I could not find verified information about that for ${destinationName}. ` +
    "To avoid giving you incorrect information, I won't guess.\n\n" +
    "Please ask the staff or managers at the site directly. " +
    "You can also open the Visitor Guide, or try another question about rules, etiquette, dress code, and customs here."
  );
}
