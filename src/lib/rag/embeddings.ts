
import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error("GEMINI_API_KEY is not configured.");
}

const ai = new GoogleGenAI({ apiKey });

export async function generateEmbedding(content: string): Promise<number[]> {
  const response = await ai.models.embedContent({
    model: process.env.GEMINI_MODEL || "gemini-embedding-001",
    contents: content,
    config: {
      taskType: "RETRIEVAL_DOCUMENT",
      outputDimensionality: 768,
    },
  });

  const values = response.embeddings?.[0]?.values;

  if (!values || values.length !== 768) {
    throw new Error("Gemini returned an invalid embedding.");
  }

  return values;
}
