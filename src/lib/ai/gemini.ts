import "server-only";
import { GoogleGenAI } from "@google/genai";

let client: GoogleGenAI | null = null;

export function getGeminiClient(): GoogleGenAI {
  if (client) return client;

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("Gemini API key is not configured.");
  }

client = new GoogleGenAI({
  apiKey,
  httpOptions: {
    timeout: 60000,
    retryOptions: {
      attempts: 1,
    },
  },
});

  return client;
}

export function getGeminiErrorMessage(error: unknown): string {
  const err = error as {
    status?: number;
    code?: string;
    message?: string;
    error?: {
      code?: string;
      message?: string;
    };
    cause?: {
      status?: number;
      code?: string;
      message?: string;
    };
  };

  const status =
    err?.status ??
    err?.cause?.status ??
    0;

  const code =
    err?.code ??
    err?.error?.code ??
    err?.cause?.code ??
    "";

  const message = [
    err?.message,
    err?.error?.message,
    err?.cause?.message,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (status === 429 || code === "resource_exhausted") {
    return "Gemini rate limit or quota exceeded. Please try again later.";
  }

  if (status === 503 || code === "service_unavailable" || message.includes("high demand")) {
    return "Gemini is currently experiencing high demand. Please try again shortly.";
  }

  if (status === 403) {
    return "Gemini access denied. Check API permissions and billing quota.";
  }

  if (status === 401) {
    return "Gemini authentication failed. Check the API key.";
  }

  if (status === 408 || status === 504 || error instanceof Error && error.name === "AbortError") {
    return "Gemini request timed out. Please try again.";
  }

  if (status >= 500) {
    return "Gemini service is temporarily unavailable.";
  }

  return "Gemini request failed. Please try again.";
}