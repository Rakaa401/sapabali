import "server-only";

import { getGeminiClient } from "@/lib/ai/gemini";
import { STRUCTURING_SYSTEM_PROMPT } from "@/lib/ai/structuring-prompt";

export interface StructuringResult {
  suggested_title: string;
  summary: string;
  organized_content: string;
  suggested_category: string;
  important_rules: string[];
  ambiguous_information: string[];
}

export interface StructuringInput {
  content: string;
  source_name?: string;
  source_url?: string;
  destination_name: string;
  language: "id" | "en";
}

export interface StructuringUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}
const STRUCTURING_SCHEMA = {
  type: "object",
  properties: {
    suggested_title: {
      type: "string",
      minLength: 1,
    },
    summary: {
      type: "string",
      minLength: 1,
    },
    organized_content: {
      type: "string",
      minLength: 1,
    },
    suggested_category: {
      type: "string",
      minLength: 1,
    },
    important_rules: {
      type: "array",
      items: {
        type: "string",
        minLength: 1,
      },
    },
    ambiguous_information: {
      type: "array",
      items: {
        type: "string",
        minLength: 1,
      },
    },
  },
  required: [
    "suggested_title",
    "summary",
    "organized_content",
    "suggested_category",
    "important_rules",
    "ambiguous_information",
  ],
};

/* ------------------------------------------------------------------ */
/* Config                                                              */
/* ------------------------------------------------------------------ */

const PRIMARY_MODEL = process.env.GEMINI_MODEL || "gemini-3.6-flash";

// Comma-separated fallback list, tried in order after the primary model.
const FALLBACK_MODELS = (
  process.env.GEMINI_FALLBACK_MODELS ||
  "gemini-3.5-flash,gemini-3.1-flash-lite"
)
  .split(",")
  .map((model) => model.trim())
  .filter(Boolean);

// Duplicate-free list of models to try, in order.
const MODELS = Array.from(new Set([PRIMARY_MODEL, ...FALLBACK_MODELS]));

const REQUEST_TIMEOUT_MS = 20_000; // per attempt
const TOTAL_DEADLINE_MS = 100_000; // overall budget for all attempts
const RETRY_DELAY_MS = 2_000;

/* ------------------------------------------------------------------ */
/* Validation helpers                                                  */
/* ------------------------------------------------------------------ */

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isStringArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) &&
    value.every(isNonEmptyString)
  );
}

export function validateStructuringResult(
  value: unknown,
): value is StructuringResult {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const result = value as Record<string, unknown>;

  const expectedKeys = [
    "suggested_title",
    "summary",
    "organized_content",
    "suggested_category",
    "important_rules",
    "ambiguous_information",
  ];

  if (
    Object.keys(result).length !== expectedKeys.length ||
    !expectedKeys.every((key) => Object.hasOwn(result, key))
  ) {
    return false;
  }

  return (
    isNonEmptyString(result.suggested_title) &&
    isNonEmptyString(result.summary) &&
    isNonEmptyString(result.organized_content) &&
    isNonEmptyString(result.suggested_category) &&
    isStringArray(result.important_rules) &&
    isStringArray(result.ambiguous_information)
  );
}

/* ------------------------------------------------------------------ */
/* Error classification                                                */
/* ------------------------------------------------------------------ */

function errorText(error: unknown): string {
  if (error instanceof Error) {
    const body = (error as { body?: unknown }).body;
    return `${error.message} ${typeof body === "string" ? body : ""}`;
  }
  return String(error);
}

// Quota exhausted: retrying the same model is pointless, switch model.
function isQuotaError(error: unknown): boolean {
  return /rate limit|quota|resource_exhausted|\b429\b/i.test(errorText(error));
}

// Request hung with no response: retrying the same model wastes time, switch model.
function isTimeoutError(error: unknown): boolean {
  return /timed out|timeout|aborted/i.test(errorText(error));
}

// Google explicitly said it is busy: worth one retry, then switch model.
function isOverloadedError(error: unknown): boolean {
  return /high demand|temporarily unavailable|service_unavailable|overloaded|\b503\b/i.test(
    errorText(error),
  );
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/* ------------------------------------------------------------------ */
/* Mock (development only, no API call)                                */
/* ------------------------------------------------------------------ */

function buildMockResult(input: StructuringInput): StructuringResult {
  return {
    suggested_title: "Judul contoh",
    summary: "Ringkasan contoh untuk keperluan pengembangan tampilan.",
    organized_content: input.content,
    suggested_category: "General",
    important_rules: ["Aturan contoh"],
    ambiguous_information: [],
  };
}

/* ------------------------------------------------------------------ */
/* Main                                                                */
/* ------------------------------------------------------------------ */

export async function structureKnowledge(
  input: StructuringInput,
  onUsage?: (usage: StructuringUsage) => void,
  onModel?: (model: string) => void,
): Promise<StructuringResult> {
  if (process.env.AI_MOCK === "true") {
    onModel?.("mock");
    return buildMockResult(input);
  }

  const ai = getGeminiClient();

  const prompt = [
    `Destination: ${input.destination_name}`,
    `Language: ${input.language === "id" ? "Bahasa Indonesia" : "English"}`,
    `Source name: ${input.source_name || "Not provided"}`,
    `Source URL: ${input.source_url || "Not provided"}`,
    "",
    "RAW SOURCE MATERIAL:",
    input.content,
  ].join("\n");

  const startedAt = Date.now();
  let lastError: unknown;

  for (const model of MODELS) {
    // gemini-2.5-* uses a different thinking mechanism; do not send thinking_level.
    const supportsThinkingLevel = !model.startsWith("gemini-2.5");

    for (let attempt = 0; attempt < 2; attempt++) {
      if (Date.now() - startedAt > TOTAL_DEADLINE_MS) {
        throw lastError ?? new Error("Request timed out.");
      }

      try {
        onModel?.(model);

        const interaction = await ai.interactions.create(
          {
            model,
            input: prompt,
            system_instruction: STRUCTURING_SYSTEM_PROMPT,
            response_format: {
              type: "text",
              mime_type: "application/json",
              schema: STRUCTURING_SCHEMA,
            },
            generation_config: {
              temperature: 0.1,
              max_output_tokens: 8192,
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

        onUsage?.({
          prompt_tokens: interaction.usage?.total_input_tokens ?? 0,
          completion_tokens: interaction.usage?.total_output_tokens ?? 0,
          total_tokens: interaction.usage?.total_tokens ?? 0,
        });

        const text = interaction.output_text;

        if (!text) {
          throw new Error("Gemini returned an empty response.");
        }

        let parsed: unknown;

        try {
          parsed = JSON.parse(text);
        } catch {
          throw new Error("Gemini returned malformed JSON. Please try again.");
        }

        if (!validateStructuringResult(parsed)) {
          throw new Error(
            "Gemini response does not match the required knowledge structure.",
          );
        }

        return parsed;
      } catch (error) {
        lastError = error;

        const quota = isQuotaError(error);
        const timeout = isTimeoutError(error);
        const overloaded = isOverloadedError(error);

        // Non-retryable errors (bad JSON, validation, auth, etc.): fail now.
        if (!quota && !timeout && !overloaded) {
          throw error;
        }

        console.warn(
          `[AI STRUCTURING] ${model} attempt ${attempt + 1} failed (${
            quota ? "quota" : timeout ? "timeout" : "overloaded"
          }).`,
        );

        // Quota or timeout: go straight to the next model.
        if (quota || timeout) break;

        // Overloaded: short pause, then retry the same model once.
        if (attempt === 0) await sleep(RETRY_DELAY_MS);
      }
    }
  }

  // All models and attempts exhausted. The route logs this error once.
  throw lastError ?? new Error("AI structuring failed.");
}