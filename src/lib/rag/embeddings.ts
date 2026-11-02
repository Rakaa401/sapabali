

if (typeof window !== "undefined") {
  throw new Error("rag/embeddings must only be imported on the server.");
}

export const EMBEDDING_MODEL =
  process.env.GEMINI_EMBEDDING_MODEL || "gemini-embedding-001";

// HARUS sama dengan kolom knowledge_chunks.embedding (extensions.vector(768)).
// gemini-embedding-001 default-nya 3072 dimensi, jadi 768 diminta eksplisit.
export const EMBEDDING_DIMENSIONS = 768;

const API_BASE = "https://generativelanguage.googleapis.com/v1beta";
const REQUEST_TIMEOUT_MS = 15_000;
const MAX_RETRIES = 2;

type TaskType = "RETRIEVAL_DOCUMENT" | "RETRIEVAL_QUERY";

export class EmbeddingError extends Error {
  readonly status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "EmbeddingError";
    this.status = status;
  }
}

function getApiKey(): string {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new EmbeddingError("GEMINI_API_KEY is not configured.");
  }

  return apiKey;
}

// Pesan sengaja generik: tidak menyertakan URL, header, atau isi respons
// supaya key dan teks input tidak bocor lewat log atau UI.
function describeStatus(status: number): string {
  if (status === 400) {
    return "The embedding request was rejected (invalid request or API key).";
  }
  if (status === 401 || status === 403) {
    return "The embedding service rejected the credentials or this key cannot use the model.";
  }
  if (status === 404) {
    return `Embedding model "${EMBEDDING_MODEL}" was not found.`;
  }
  if (status === 429) {
    return "Embedding rate limit or quota exceeded. Try again shortly.";
  }
  if (status >= 500) {
    return "The embedding service is temporarily unavailable.";
  }
  return `The embedding service returned an unexpected error (${status}).`;
}

// Dimensi selain 3072 tidak ter-normalisasi oleh API, jadi dinormalisasi di sini
// agar cosine similarity konsisten.
function normalize(vector: number[]): number[] {
  const norm = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0));

  if (!Number.isFinite(norm) || norm === 0) {
    throw new EmbeddingError("The embedding vector is empty or invalid.");
  }

  return vector.map((value) => value / norm);
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function embed(text: string, taskType: TaskType): Promise<number[]> {
  const input = text.trim();

  if (!input) {
    throw new EmbeddingError("Cannot create an embedding for empty text.");
  }

  const apiKey = getApiKey();
  let lastError: EmbeddingError | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      await sleep(600 * attempt);
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(
        `${API_BASE}/models/${EMBEDDING_MODEL}:embedContent`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            // Key lewat header, bukan query string, supaya tidak muncul di URL/log.
            "x-goog-api-key": apiKey,
          },
          body: JSON.stringify({
            model: `models/${EMBEDDING_MODEL}`,
            content: { parts: [{ text: input }] },
            taskType,
            outputDimensionality: EMBEDDING_DIMENSIONS,
          }),
          signal: controller.signal,
          cache: "no-store",
        },
      );

      if (!response.ok) {
        lastError = new EmbeddingError(
          describeStatus(response.status),
          response.status,
        );

        const retryable = response.status === 429 || response.status >= 500;

        if (retryable && attempt < MAX_RETRIES) continue;

        throw lastError;
      }

      const data = (await response.json()) as {
        embedding?: { values?: unknown };
      };
      const values = data.embedding?.values;

      if (
        !Array.isArray(values) ||
        !values.every((value) => typeof value === "number")
      ) {
        throw new EmbeddingError(
          "The embedding service returned an invalid response.",
        );
      }

      if (values.length !== EMBEDDING_DIMENSIONS) {
        throw new EmbeddingError(
          `Embedding dimension mismatch: expected ${EMBEDDING_DIMENSIONS}, received ${values.length}.`,
        );
      }

      return normalize(values as number[]);
    } catch (error) {
      if (error instanceof EmbeddingError) throw error;

      const aborted = error instanceof Error && error.name === "AbortError";

      lastError = aborted
        ? new EmbeddingError(
            `Embedding request timed out after ${REQUEST_TIMEOUT_MS / 1000}s.`,
            504,
          )
        : new EmbeddingError("Could not reach the embedding service.");

      if (attempt < MAX_RETRIES) continue;

      throw lastError;
    } finally {
      clearTimeout(timer);
    }
  }

  throw lastError ?? new EmbeddingError("Embedding generation failed.");
}

// Untuk indexing chunk knowledge (dipakai index-knowledge.ts).
export function generateEmbedding(text: string): Promise<number[]> {
  return embed(text, "RETRIEVAL_DOCUMENT");
}

// Untuk pertanyaan user saat retrieval.
export function generateQueryEmbedding(text: string): Promise<number[]> {
  return embed(text, "RETRIEVAL_QUERY");
}