import {
  MAX_QUESTION_LENGTH,
  MIN_QUESTION_LENGTH,
  type ChatLanguage,
} from "./types";
import { errorMessage, questionTooLongMessage, questionTooShortMessage } from "./messages";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export interface ChatRequestData {
  destinationId: string;
  question: string;
  language: ChatLanguage;
}

export type ParsedChatRequest =
  | { ok: true; data: ChatRequestData }
  | { ok: false; message: string; language: ChatLanguage };

// Hapus karakter kontrol dan rapikan spasi. Teks hasilnya yang divalidasi dan dikirim ke model.
function normalizeQuestion(value: string): string {
  return value
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F\u200B-\u200F\u202A-\u202E\u2066-\u2069]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function parseChatRequest(raw: unknown): ParsedChatRequest {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { ok: false, message: errorMessage("INVALID_REQUEST", "en"), language: "en" };
  }

  const body = raw as Record<string, unknown>;
  const language: ChatLanguage = body.language === "id" ? "id" : "en";

  if (body.language !== "id" && body.language !== "en") {
    return { ok: false, message: errorMessage("INVALID_REQUEST", language), language };
  }

  if (typeof body.destinationId !== "string" || !UUID_RE.test(body.destinationId)) {
    return { ok: false, message: errorMessage("INVALID_REQUEST", language), language };
  }

  if (typeof body.question !== "string") {
    return { ok: false, message: errorMessage("INVALID_REQUEST", language), language };
  }

  const question = normalizeQuestion(body.question);

  if (question.length < MIN_QUESTION_LENGTH) {
    return { ok: false, message: questionTooShortMessage(language, MIN_QUESTION_LENGTH), language };
  }

  if (question.length > MAX_QUESTION_LENGTH) {
    return { ok: false, message: questionTooLongMessage(language, MAX_QUESTION_LENGTH), language };
  }

  return {
    ok: true,
    data: { destinationId: body.destinationId, question, language: body.language },
  };
}
