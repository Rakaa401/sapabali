import "server-only";
import { getGeminiClient } from "@/lib/ai/gemini";
import { buildSystemPrompt, buildUserPrompt, contextText } from "./prompt";
import type { RetrievalResult } from "./retrieval";
import type { ChatLanguage } from "./types";

const PRIMARY_MODEL = process.env.GEMINI_MODEL || "gemini-3.6-flash";
const FALLBACK_MODELS = (process.env.GEMINI_FALLBACK_MODELS || "gemini-3.5-flash,gemini-3.1-flash-lite")
  .split(",")
  .map((model) => model.trim())
  .filter(Boolean);
const MODELS = Array.from(new Set([PRIMARY_MODEL, ...FALLBACK_MODELS]));

const REQUEST_TIMEOUT_MS = 15_000; // per model
const TOTAL_DEADLINE_MS = 35_000; // total semua percobaan
const MAX_ANSWER_CHARS = 1500;

const ANSWER_SCHEMA = {
  type: "object",
  properties: {
    can_answer: { type: "boolean" },
    answer: { type: "string" },
    source_ids: { type: "array", items: { type: "string" } },
  },
  required: ["can_answer", "answer", "source_ids"],
};

export interface GenerationUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export type GenerationResult =
  | { kind: "answer"; answer: string; labels: string[]; model: string; usage: GenerationUsage }
  // Model menolak menjawab, atau outputnya tidak lolos validasi => pakai fallback aman
  | { kind: "unanswerable"; reason: string; model: string; usage: GenerationUsage };

export class GenerationUnavailableError extends Error {
  constructor(message = "The AI service is temporarily unavailable.") {
    super(message);
    this.name = "GenerationUnavailableError";
  }
}

function errorText(error: unknown): string {
  if (error instanceof Error) {
    const body = (error as { body?: unknown }).body;
    return `${error.message} ${typeof body === "string" ? body : ""}`;
  }
  return String(error);
}

// Quota, timeout, atau server sibuk: pindah ke model berikutnya.
function isRetryableWithNextModel(error: unknown): boolean {
  return /rate limit|quota|resource_exhausted|\b429\b|timed out|timeout|aborted|high demand|temporarily unavailable|service_unavailable|overloaded|\b503\b|\b500\b|\b504\b/i.test(
    errorText(error),
  );
}

/* Validasi output model                                               */

type ValidatedOutput =
  | { ok: true; answer: string; labels: string[] }
  | { ok: false; reason: string };

function cleanAnswer(answer: string): string {
  return answer
    .replace(/\[S\d+\]/gi, "")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/ {2,}/g, " ")
    .trim();
}

export function validateModelOutput(
  parsed: unknown,
  allowedLabels: Set<string>,
  context: string,
): ValidatedOutput {
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return { ok: false, reason: "not_an_object" };
  }

  const value = parsed as Record<string, unknown>;

  if (typeof value.can_answer !== "boolean") return { ok: false, reason: "bad_can_answer" };
  if (!value.can_answer) return { ok: false, reason: "model_declined" };
  if (typeof value.answer !== "string") return { ok: false, reason: "bad_answer" };
  if (!Array.isArray(value.source_ids) || !value.source_ids.every((id) => typeof id === "string")) {
    return { ok: false, reason: "bad_source_ids" };
  }

  const answer = cleanAnswer(value.answer);

  if (answer.length === 0) return { ok: false, reason: "empty_answer" };
  if (answer.length > MAX_ANSWER_CHARS) return { ok: false, reason: "answer_too_long" };

  // Hanya label yang benar-benar ada di konteks yang dihitung. Label karangan dibuang.
  const labels = Array.from(new Set((value.source_ids as string[]).map((id) => id.trim().toUpperCase()))).filter(
    (id) => allowedLabels.has(id),
  );

  if (labels.length === 0) return { ok: false, reason: "no_valid_source" };

  // URL di jawaban harus persis ada di konteks. Kalau tidak, dianggap karangan.
  const urls = answer.match(/https?:\/\/[^\s)\]>"']+/gi) ?? [];

  for (const url of urls) {
    if (!context.includes(url.replace(/[.,;:!?]+$/, ""))) {
      return { ok: false, reason: "unsupported_url" };
    }
  }

  return { ok: true, answer, labels };
}

/* Generate                                                            */

export async function generateGroundedAnswer(input: {
  destinationName: string;
  language: ChatLanguage;
  question: string;
  retrieval: RetrievalResult;
}): Promise<GenerationResult> {
  const { destinationName, language, question, retrieval } = input;
  const allowedLabels = new Set(retrieval.chunks.map((chunk) => chunk.label));
  const context = contextText(retrieval.chunks);
  const emptyUsage: GenerationUsage = { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };

  // Mode pengembangan tanpa memanggil Gemini
  if (process.env.AI_MOCK === "true") {
    const first = retrieval.chunks[0];
    return {
      kind: "answer",
      answer: first.content.slice(0, 280),
      labels: [first.label],
      model: "mock",
      usage: emptyUsage,
    };
  }

  const ai = getGeminiClient();
  const systemPrompt = buildSystemPrompt(destinationName, language);
  const userPrompt = buildUserPrompt(destinationName, question, retrieval.chunks, retrieval.items);

  const startedAt = Date.now();
  let lastError: unknown;

  for (const model of MODELS) {
    if (Date.now() - startedAt > TOTAL_DEADLINE_MS) break;

    // gemini-2.5-* memakai mekanisme thinking yang berbeda
    const supportsThinkingLevel = !model.startsWith("gemini-2.5");

    try {
      const interaction = await ai.interactions.create(
        {
          model,
          input: userPrompt,
          system_instruction: systemPrompt,
          response_format: {
            type: "text",
            mime_type: "application/json",
            schema: ANSWER_SCHEMA,
          },
          generation_config: {
            temperature: 0.1,
            max_output_tokens: 1024,
            ...(supportsThinkingLevel ? { thinking_level: "low" } : {}),
          },
          store: false,
          automatic_continuation: false,
        },
        {
          timeout_ms: REQUEST_TIMEOUT_MS,
          retries: { strategy: "none" },
        },
      );

      const usage: GenerationUsage = {
        prompt_tokens: interaction.usage?.total_input_tokens ?? 0,
        completion_tokens: interaction.usage?.total_output_tokens ?? 0,
        total_tokens: interaction.usage?.total_tokens ?? 0,
      };

      const text = interaction.output_text;

      if (!text) {
        return { kind: "unanswerable", reason: "empty_response", model, usage };
      }

      let parsed: unknown;

      try {
        parsed = JSON.parse(text);
      } catch {
        return { kind: "unanswerable", reason: "malformed_json", model, usage };
      }

      const checked = validateModelOutput(parsed, allowedLabels, context);

      if (!checked.ok) {
        return { kind: "unanswerable", reason: checked.reason, model, usage };
      }

      return { kind: "answer", answer: checked.answer, labels: checked.labels, model, usage };
    } catch (error) {
      lastError = error;

      if (!isRetryableWithNextModel(error)) {
        // Error lain (auth, request salah, dll): tidak ada gunanya mencoba model lain
        throw new GenerationUnavailableError();
      }

      console.warn(`[VISITOR CHAT] ${model} failed, trying next model.`);
    }
  }

  console.error("[VISITOR CHAT] all models failed", lastError);
  throw new GenerationUnavailableError();
}
