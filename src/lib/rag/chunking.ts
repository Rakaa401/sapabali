
import { preprocessKnowledgeContent } from "./preprocessing";

const CHUNK_SIZE = 1200;
const CHUNK_OVERLAP = 200;

export function splitIntoChunks(content: string): string[] {
  const text = preprocessKnowledgeContent(content);
  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    let end = Math.min(start + CHUNK_SIZE, text.length);

    if (end < text.length) {
      const paragraphBoundary = text.lastIndexOf("\n\n", end);
      const lineBoundary = text.lastIndexOf("\n", end);
      const wordBoundary = text.lastIndexOf(" ", end);

      if (paragraphBoundary > start + CHUNK_SIZE * 0.7) {
        end = paragraphBoundary;
      } else if (lineBoundary > start + CHUNK_SIZE * 0.7) {
        end = lineBoundary;
      } else if (wordBoundary > start + CHUNK_SIZE * 0.7) {
        end = wordBoundary;
      }
    }

    const chunk = text.slice(start, end).trim();

    if (chunk) chunks.push(chunk);

    if (end >= text.length) break;

    start = Math.max(end - CHUNK_OVERLAP, start + 1);
  }

  return chunks;
}
