import { MAX_SITUATION_LENGTH, type StaffLength } from "./types";

export const MIN_SITUATION_LENGTH = 5;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface StaffRequestData {
  destinationId: string;
  situation: string;
  language: "en"; // bahasa keluaran: penjelasan untuk pengunjung selalu bahasa Inggris
  length: StaffLength;
  regenerate: boolean;
}

export type ParsedStaffRequest =
  | { ok: true; data: StaffRequestData }
  | { ok: false; message: string };

// Validasi situasi, destinasi, bahasa keluaran, panjang, dan regenerate
export function parseStaffRequest(raw: unknown): ParsedStaffRequest {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { ok: false, message: "Isi permintaan tidak valid." };
  }
  const body = raw as Record<string, unknown>;

  if (typeof body.destinationId !== "string" || !UUID.test(body.destinationId)) {
    return { ok: false, message: "Destinasi tidak valid." };
  }

  // bahasa keluaran opsional, tetapi kalau diisi harus "en"
  if (body.language !== undefined && body.language !== "en") {
    return { ok: false, message: "Bahasa keluaran yang didukung hanya English (en)." };
  }

  // panjang penjelasan opsional: "normal" (default) atau "short"
  if (body.length !== undefined && body.length !== "normal" && body.length !== "short") {
    return { ok: false, message: "Panjang penjelasan harus 'normal' atau 'short'." };
  }
  const length: StaffLength = body.length === "short" ? "short" : "normal";

  if (body.regenerate !== undefined && typeof body.regenerate !== "boolean") {
    return { ok: false, message: "Nilai regenerate harus true atau false." };
  }
  const regenerate = body.regenerate === true;

  if (typeof body.situation !== "string") {
    return { ok: false, message: "Situasi wajib diisi." };
  }
  const situation = body.situation.replace(/\r\n/g, "\n").trim();

  if (situation.length < MIN_SITUATION_LENGTH) {
    return { ok: false, message: `Situasi minimal ${MIN_SITUATION_LENGTH} karakter.` };
  }
  if (situation.length > MAX_SITUATION_LENGTH) {
    return { ok: false, message: `Situasi maksimal ${MAX_SITUATION_LENGTH} karakter.` };
  }

  return {
    ok: true,
    data: { destinationId: body.destinationId, situation, language: "en", length, regenerate },
  };
}
