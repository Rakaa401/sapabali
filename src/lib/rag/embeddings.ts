import { getGeminiClient, getGeminiErrorMessage } from "@/lib/ai/gemini";

export async function generateEmbedding(content: string): Promise<number[]> {
  try {
    const response = await getGeminiClient().models.embedContent({
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
  } catch (error) {
    throw new Error(getGeminiErrorMessage(error));
  }
}