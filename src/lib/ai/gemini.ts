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
      timeout: 30000,
    },
  });

  return client;
}

export function getGeminiErrorMessage(error: unknown): string {
  const status =
    typeof error === "object" && error !== null && "status" in error
      ? Number(error.status)
      : 0;

  if (status === 429) {
    return "Gemini rate limit or quota exceeded. Please try again later.";
  }

  if (status === 403) {
    return "Gemini access denied. Check API permissions and billing quota.";
  }

  if (status === 401) {
    return "Gemini authentication failed. Check the API key.";
  }

  if (status === 408 || status === 504) {
    return "Gemini request timed out. Please try again.";
  }

  if (status >= 500) {
    return "Gemini service is temporarily unavailable.";
  }

  if (error instanceof Error && error.name === "AbortError") {
    return "Gemini request timed out. Please try again.";
  }

  return "Gemini request failed. Please try again.";
}