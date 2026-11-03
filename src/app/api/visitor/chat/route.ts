import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { EmbeddingError } from "@/lib/rag/embeddings";
import { GenerationUnavailableError, generateGroundedAnswer } from "@/lib/visitor-chat/generate";
import type { GenerationUsage } from "@/lib/visitor-chat/generate";
import { errorMessage, fallbackMessage } from "@/lib/visitor-chat/messages";
import { RateLimitUnavailableError, checkRateLimit } from "@/lib/visitor-chat/rate-limit";
import { RetrievalError, retrieveContext } from "@/lib/visitor-chat/retrieval";
import type { RetrievalResult } from "@/lib/visitor-chat/retrieval";
import type {
  ChatErrorCode,
  ChatLanguage,
  ChatResponse,
  ChatSource,
} from "@/lib/visitor-chat/types";
import { parseChatRequest } from "@/lib/visitor-chat/validation";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_BODY_CHARS = 4000;

function respond(body: ChatResponse, status = 200, headers: Record<string, string> = {}) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store", ...headers },
  });
}

function fail(
  code: ChatErrorCode,
  language: ChatLanguage,
  status: number,
  options: { retryAfterSeconds?: number; message?: string } = {},
) {
  return respond(
    {
      ok: false,
      error: { code, message: options.message ?? errorMessage(code, language) },
      ...(options.retryAfterSeconds ? { retryAfterSeconds: options.retryAfterSeconds } : {}),
    },
    status,
    options.retryAfterSeconds ? { "Retry-After": String(options.retryAfterSeconds) } : {},
  );
}

// Hanya tautan http(s) yang boleh ditampilkan sebagai sumber eksternal
function safeUrl(value: string | null): string | null {
  return value && /^https?:\/\//i.test(value) ? value : null;
}

interface LogValues {
  query: string;
  response: string | null;
  model: string | null;
  usage: GenerationUsage;
  startedAt: number;
  status: "success" | "error";
  errorMessage?: string;
  metadata: Record<string, unknown>;
}

// Log tidak boleh membuat request gagal
async function logChat(values: LogValues) {
  try {
    const supabase = createServiceClient();
    const { error } = await supabase.rpc("log_visitor_chat", {
      p_query: values.query,
      p_response: values.response,
      p_model: values.model,
      p_prompt_tokens: values.usage.prompt_tokens,
      p_completion_tokens: values.usage.completion_tokens,
      p_total_tokens: values.usage.total_tokens,
      p_latency_ms: Date.now() - values.startedAt,
      p_status: values.status,
      p_error_message: values.errorMessage ?? null,
      p_metadata: values.metadata,
    });

    if (error) console.error("[VISITOR CHAT LOGGING ERROR]", error);
  } catch (error) {
    console.error("[VISITOR CHAT LOGGING ERROR]", error);
  }
}

const NO_USAGE: GenerationUsage = { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };

export async function POST(request: Request) {
  const startedAt = Date.now();

  // 1. Baca dan validasi body
  let rawText: string;

  try {
    rawText = await request.text();
  } catch {
    return fail("INVALID_REQUEST", "en", 400);
  }

  if (rawText.length > MAX_BODY_CHARS) {
    return fail("INVALID_REQUEST", "en", 413);
  }

  let rawBody: unknown;

  try {
    rawBody = JSON.parse(rawText);
  } catch {
    return fail("INVALID_REQUEST", "en", 400);
  }

  const parsed = parseChatRequest(rawBody);

  if (!parsed.ok) {
    return fail("INVALID_REQUEST", parsed.language, 400, { message: parsed.message });
  }

  const { destinationId, question, language } = parsed.data;

  try {
    // 2. Rate limit (sebelum query database dan panggilan AI)
    try {
      const limit = await checkRateLimit(request);

      if (!limit.allowed) {
        return fail("RATE_LIMITED", language, 429, { retryAfterSeconds: limit.retryAfterSeconds });
      }
    } catch (error) {
      if (error instanceof RateLimitUnavailableError) {
        return fail("SERVICE_UNAVAILABLE", language, 503, { retryAfterSeconds: 30 });
      }
      throw error;
    }

    // 3. Destinasi harus ada dan published
    const supabase = await createClient();

    const { data: destination, error: destinationError } = await supabase
      .from("destinations")
      .select("id, name, slug")
      .eq("id", destinationId)
      .eq("status", "published")
      .maybeSingle();

    if (destinationError) {
      console.error("[VISITOR CHAT DESTINATION ERROR]", destinationError);
      return fail("INTERNAL_ERROR", language, 500);
    }

    if (!destination) {
      return fail("DESTINATION_NOT_FOUND", language, 404);
    }

    // 4. Retrieval
    let retrieval: RetrievalResult;

    try {
      retrieval = await retrieveContext(supabase, destination.id, question);
    } catch (error) {
      if (error instanceof EmbeddingError || error instanceof RetrievalError) {
        await logChat({
          query: question,
          response: null,
          model: null,
          usage: NO_USAGE,
          startedAt,
          status: "error",
          errorMessage: error.message,
          metadata: { destination_id: destination.id, destination_name: destination.name, language, stage: "retrieval" },
        });
        return fail("SERVICE_UNAVAILABLE", language, 503, { retryAfterSeconds: 15 });
      }
      throw error;
    }

    const baseMetadata = {
      destination_id: destination.id,
      destination_name: destination.name,
      language,
      top_similarity: Number(retrieval.topSimilarity.toFixed(3)),
      similarities: retrieval.similarities,
    };

    const respondFallback = async (reason: string, model: string | null, usage: GenerationUsage) => {
      const answer = fallbackMessage(language, destination.name);

      await logChat({
        query: question,
        response: answer,
        model,
        usage,
        startedAt,
        status: "success",
        metadata: { ...baseMetadata, fallback: true, fallback_reason: reason },
      });

      return respond({ ok: true, answer, sources: [], fallback: true });
    };

    // 5. Tidak ada konteks yang cukup relevan: lewati LLM sepenuhnya
    if (!retrieval.sufficient) {
      return await respondFallback(retrieval.reason, null, NO_USAGE);
    }

    // 6. Generate jawaban yang terikat pada konteks
    let generation;

    try {
      generation = await generateGroundedAnswer({
        destinationName: destination.name,
        language,
        question,
        retrieval,
      });
    } catch (error) {
      if (error instanceof GenerationUnavailableError) {
        await logChat({
          query: question,
          response: null,
          model: null,
          usage: NO_USAGE,
          startedAt,
          status: "error",
          errorMessage: error.message,
          metadata: { ...baseMetadata, stage: "generation" },
        });
        return fail("SERVICE_UNAVAILABLE", language, 503, { retryAfterSeconds: 15 });
      }
      throw error;
    }

    if (generation.kind === "unanswerable") {
      return await respondFallback(generation.reason, generation.model, generation.usage);
    }

    // 7. Sumber dibangun dari hasil retrieval, bukan dari teks model
    const chunkByLabel = new Map(retrieval.chunks.map((chunk) => [chunk.label, chunk]));
    const seen = new Set<string>();
    const sources: ChatSource[] = [];

    for (const label of generation.labels) {
      const chunk = chunkByLabel.get(label);
      const item = chunk ? retrieval.items.get(chunk.knowledgeItemId) : undefined;

      if (!item || seen.has(item.id)) continue;
      seen.add(item.id);

      sources.push({
        id: item.id,
        title: item.title,
        sourceName: item.sourceName,
        sourceUrl: safeUrl(item.sourceUrl),
        language: item.language,
        category: item.category,
        detailPath: `/destinations/${encodeURIComponent(destination.slug)}/guide/${encodeURIComponent(item.id)}?lang=${language}`,
      });
    }

    if (sources.length === 0) {
      return await respondFallback("no_resolvable_source", generation.model, generation.usage);
    }

    await logChat({
      query: question,
      response: generation.answer,
      model: generation.model,
      usage: generation.usage,
      startedAt,
      status: "success",
      metadata: {
        ...baseMetadata,
        fallback: false,
        source_ids: sources.map((source) => source.id),
      },
    });

    return respond({ ok: true, answer: generation.answer, sources, fallback: false });
  } catch (error) {
    console.error("[VISITOR CHAT ROUTE ERROR]", error);
    return fail("INTERNAL_ERROR", language, 500);
  }
}
