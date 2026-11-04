import { MAX_SITUATION_LENGTH } from "./types";

export const MIN_SITUATION_LENGTH = 5;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface StaffRequestData {
  destinationId: string;
  situation: string;
  language: "en"; // bahasa keluaran: penjelasan untuk pengunjung selalu bahasa Inggris
}

export type ParsedStaffRequest =
  | { ok: true; data: StaffRequestData }
  | { ok: false; message: string };

// 07.2: validasi situasi, destinasi, dan bahasa
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

  return { ok: true, data: { destinationId: body.destinationId, situation, language: "en" } };
}
