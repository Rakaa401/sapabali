import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buildStaffSources, retrieveStaffContext } from "@/lib/staff-assistant/context";
import { generateStaffExplanation } from "@/lib/staff-assistant/generate";
import { logStaffRequest } from "@/lib/staff-assistant/log";
import { parseStaffRequest } from "@/lib/staff-assistant/validation";
import { GenerationUnavailableError } from "@/lib/visitor-chat/generate";
import { RateLimitUnavailableError, checkRateLimit } from "@/lib/visitor-chat/rate-limit";

// POST /api/staff/assistant
// Body:    { destinationId, situation, language?: "en" }
// Sukses:  { ok: true, explanation, sources, fallback }
// Gagal:   { ok: false, error: { code, message }, retryAfterSeconds? }

const MAX_BODY_CHARS = 4000;

// Dipakai kalau data destinasi tidak cukup. Tidak menyebut aturan apa pun.
const FALLBACK_EXPLANATION =
  "Thank you for your patience. I want to give you the correct information, so I will check with our coordinator and come back to you shortly.";

type ErrorCode =
  | "INVALID_REQUEST"
  | "RATE_LIMITED"
  | "SERVICE_UNAVAILABLE"
  | "DESTINATION_NOT_FOUND"
  | "INTERNAL_ERROR";

const ERROR_MESSAGES: Record<ErrorCode, string> = {
  INVALID_REQUEST: "Permintaan tidak valid.",
  RATE_LIMITED: "Terlalu banyak permintaan. Tunggu sebentar lalu coba lagi.",
  SERVICE_UNAVAILABLE: "Layanan AI sedang tidak tersedia. Coba lagi sebentar lagi.",
  DESTINATION_NOT_FOUND: "Destinasi tidak ditemukan.",
  INTERNAL_ERROR: "Terjadi kesalahan. Coba lagi.",
};

function respond(body: unknown, status = 200, headers: Record<string, string> = {}) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store", ...headers } });
}

function fail(code: ErrorCode, status: number, options: { message?: string; retryAfterSeconds?: number } = {}) {
  return respond(
    {
      ok: false,
      error: { code, message: options.message ?? ERROR_MESSAGES[code] },
      ...(options.retryAfterSeconds ? { retryAfterSeconds: options.retryAfterSeconds } : {}),
    },
    status,
    options.retryAfterSeconds ? { "Retry-After": String(options.retryAfterSeconds) } : {},
  );
}

export async function POST(request: Request) {
  // 1. Baca dan validasi body
  const rawText = await request.text().catch(() => "");
  if (rawText.length > MAX_BODY_CHARS) {
    return fail("INVALID_REQUEST", 400, { message: "Permintaan terlalu besar." });
  }

  let json: unknown;
  try {
    json = JSON.parse(rawText);
  } catch {
    return fail("INVALID_REQUEST", 400, { message: "Isi permintaan harus berupa JSON." });
  }

  const parsed = parseStaffRequest(json);
  if (!parsed.ok) return fail("INVALID_REQUEST", 400, { message: parsed.message });
  const { destinationId, situation } = parsed.data;

  const startedAt = Date.now();

  try {
    // 2. Rate limit (sebelum query database dan panggilan AI). Memakai batas yang sama dengan chat.
    try {
      const limit = await checkRateLimit(request);
      if (!limit.allowed) {
        return fail("RATE_LIMITED", 429, {
          retryAfterSeconds: limit.retryAfterSeconds,
          message: `Terlalu banyak permintaan. Coba lagi dalam ${limit.retryAfterSeconds} detik.`,
        });
      }
    } catch (error) {
      if (error instanceof RateLimitUnavailableError) {
        return fail("SERVICE_UNAVAILABLE", 503, { retryAfterSeconds: 30 });
      }
      throw error;
    }

    // 3. Destinasi harus ada dan Published
    const supabase = await createClient();
    const { data: destination, error: destinationError } = await supabase
      .from("destinations")
      .select("id, name, slug")
      .eq("id", destinationId)
      .eq("status", "published")
      .maybeSingle();

    if (destinationError) {
      console.error("[STAFF ASSISTANT DESTINATION ERROR]", destinationError);
      return fail("INTERNAL_ERROR", 500);
    }
    if (!destination) return fail("DESTINATION_NOT_FOUND", 404);

    const baseMetadata = {
      destination_id: destination.id,
      destination_name: destination.name,
    };

    const respondFallback = async (
      reason: string,
      model?: string,
      usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number },
    ) => {
      await logStaffRequest({
        query: situation,
        response: FALLBACK_EXPLANATION,
        model: model ?? null,
        usage,
        startedAt,
        status: "success",
        metadata: { ...baseMetadata, fallback: true, reason },
      });
      return respond({ ok: true, explanation: FALLBACK_EXPLANATION, sources: [], fallback: true });
    };

    // 4. Cari konteks (07.3)
    let retrieval;
    try {
      retrieval = await retrieveStaffContext(supabase, destination.id, situation);
    } catch (error) {
      console.error("[STAFF ASSISTANT RETRIEVAL ERROR]", error);
      await logStaffRequest({
        query: situation,
        startedAt,
        status: "error",
        errorMessage: "retrieval_failed",
        metadata: { ...baseMetadata, stage: "retrieval" },
      });
      return fail("SERVICE_UNAVAILABLE", 503, { retryAfterSeconds: 15 });
    }

    // Data kosong atau kurang relevan: jangan panggil AI, jangan mengarang aturan
    if (!retrieval.sufficient) return respondFallback(retrieval.reason);

    // 5. Susun penjelasan bahasa Inggris (07.4)
    let generation;
    try {
      generation = await generateStaffExplanation({
        destinationName: destination.name,
        situation,
        retrieval,
      });
    } catch (error) {
      if (error instanceof GenerationUnavailableError) {
        await logStaffRequest({
          query: situation,
          startedAt,
          status: "error",
          errorMessage: "generation_unavailable",
          metadata: { ...baseMetadata, stage: "generation" },
        });
        return fail("SERVICE_UNAVAILABLE", 503, { retryAfterSeconds: 15 });
      }
      throw error;
    }

    // Model menolak atau outputnya tidak lolos validasi: pakai fallback aman
    if (generation.kind === "unanswerable") {
      return respondFallback(generation.reason, generation.model, generation.usage);
    }

    // 6. Sumber hanya dari label yang benar-benar dipakai dan ada di hasil pencarian
    const sources = buildStaffSources(generation.labels, retrieval, destination.slug);
    if (sources.length === 0) {
      return respondFallback("no_resolvable_source", generation.model, generation.usage);
    }

    await logStaffRequest({
      query: situation,
      response: generation.explanation,
      model: generation.model,
      usage: generation.usage,
      startedAt,
      status: "success",
      metadata: { ...baseMetadata, fallback: false, source_ids: sources.map((s) => s.id) },
    });

    return respond({ ok: true, explanation: generation.explanation, sources, fallback: false });
  } catch (error) {
    console.error("[STAFF ASSISTANT ROUTE ERROR]", error);
    return fail("INTERNAL_ERROR", 500);
  }
}
