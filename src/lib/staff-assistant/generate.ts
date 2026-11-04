import "server-only";
import { getGeminiClient } from "@/lib/ai/gemini";
import { GenerationUnavailableError, validateModelOutput } from "@/lib/visitor-chat/generate";
import type { GenerationUsage } from "@/lib/visitor-chat/generate";
import { contextText } from "@/lib/visitor-chat/prompt";
import type { RetrievalResult } from "@/lib/visitor-chat/retrieval";
import { buildStaffSystemPrompt, buildStaffUserPrompt } from "./prompt";

// Pola panggilan Gemini sama dengan generate.ts milik chat pengunjung
const PRIMARY_MODEL = process.env.GEMINI_MODEL || "gemini-3.6-flash";
const FALLBACK_MODELS = (process.env.GEMINI_FALLBACK_MODELS || "gemini-3.5-flash,gemini-3.1-flash-lite")
  .split(",")
  .map((model) => model.trim())
  .filter(Boolean);
const MODELS = Array.from(new Set([PRIMARY_MODEL, ...FALLBACK_MODELS]));

const REQUEST_TIMEOUT_MS = 15_000; // per model
const TOTAL_DEADLINE_MS = 35_000; // total semua percobaan

const ANSWER_SCHEMA = {
  type: "object",
  properties: {
    can_answer: { type: "boolean" },
    answer: { type: "string" },
    source_ids: { type: "array", items: { type: "string" } },
  },
  required: ["can_answer", "answer", "source_ids"],
};

export type StaffGenerationResult =
  | { kind: "answer"; explanation: string; labels: string[]; model: string; usage: GenerationUsage }
  // Model menolak, atau outputnya tidak lolos validasi => pakai fallback aman
  | { kind: "unanswerable"; reason: string; model: string; usage: GenerationUsage };

function errorText(error: unknown): string {
  if (error instanceof Error) {
    const body = (error as { body?: unknown }).body;
    return `${error.message} ${typeof body === "string" ? body : ""}`;
  }
  return String(error);
}

// Quota, timeout, atau server sibuk: pindah ke model berikutnya
function isRetryableWithNextModel(error: unknown): boolean {
  return /rate limit|quota|resource_exhausted|\b429\b|timed out|timeout|aborted|high demand|temporarily unavailable|service_unavailable|overloaded|\b503\b|\b500\b|\b504\b/i.test(
    errorText(error),
  );
}

export async function generateStaffExplanation(input: {
  destinationName: string;
  situation: string;
  retrieval: RetrievalResult;
}): Promise<StaffGenerationResult> {
  const { destinationName, situation, retrieval } = input;
  const allowedLabels = new Set(retrieval.chunks.map((chunk) => chunk.label));
  const context = contextText(retrieval.chunks);
  const emptyUsage: GenerationUsage = { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };

  // Mode pengembangan tanpa memanggil Gemini (flag yang sama dengan chat pengunjung)
  if (process.env.AI_MOCK === "true") {
    const first = retrieval.chunks[0];
    return {
      kind: "answer",
      explanation: `(Mock) ${first.content.slice(0, 240)}`,
      labels: [first.label],
      model: "mock",
      usage: emptyUsage,
    };
  }

  const ai = getGeminiClient();
  const systemPrompt = buildStaffSystemPrompt(destinationName);
  const userPrompt = buildStaffUserPrompt(destinationName, situation, retrieval.chunks, retrieval.items);

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
            temperature: 0.2,
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
      if (!text) return { kind: "unanswerable", reason: "empty_response", model, usage };

      let parsed: unknown;
      try {
        parsed = JSON.parse(text);
      } catch {
        return { kind: "unanswerable", reason: "malformed_json", model, usage };
      }

      // Validasi yang sama dengan chat: label sumber harus ada di konteks, URL tidak boleh karangan
      const checked = validateModelOutput(parsed, allowedLabels, context);
      if (!checked.ok) return { kind: "unanswerable", reason: checked.reason, model, usage };

      return { kind: "answer", explanation: checked.answer, labels: checked.labels, model, usage };
    } catch (error) {
      lastError = error;

      if (!isRetryableWithNextModel(error)) {
        // Error lain (auth, request salah, dll): tidak ada gunanya mencoba model lain
        throw new GenerationUnavailableError();
      }
      console.warn(`[STAFF ASSISTANT] ${model} failed, trying next model.`);
    }
  }

  console.error("[STAFF ASSISTANT] all models failed", lastError);
  throw new GenerationUnavailableError();
}
