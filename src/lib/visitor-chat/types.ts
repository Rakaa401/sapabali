// Dipakai bersama oleh server (API) dan client (UI). Jangan impor kode server di sini.

export type ChatLanguage = "id" | "en";

export const MIN_QUESTION_LENGTH = 3;
export const MAX_QUESTION_LENGTH = 500;

export interface ChatSource {
  id: string;
  title: string;
  sourceName: string | null;
  sourceUrl: string | null;
  language: ChatLanguage;
  category: string | null;
  // Path halaman detail publik, contoh: /destinations/pantai-kuta/guide/<id>?lang=id
  detailPath: string;
}

export interface ChatSuccessResponse {
  ok: true;
  answer: string;
  sources: ChatSource[];
  // true = pertanyaan tidak didukung informasi terverifikasi; answer berisi pesan aman
  fallback: boolean;
}

export type ChatErrorCode =
  | "INVALID_REQUEST"
  | "DESTINATION_NOT_FOUND"
  | "RATE_LIMITED"
  | "SERVICE_UNAVAILABLE"
  | "INTERNAL_ERROR";

export interface ChatErrorResponse {
  ok: false;
  error: { code: ChatErrorCode; message: string };
  retryAfterSeconds?: number;
}

export type ChatResponse = ChatSuccessResponse | ChatErrorResponse;
