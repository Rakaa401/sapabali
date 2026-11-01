
const CHUNK_SIZE = 1200;
const CHUNK_OVERLAP = 200;

export function splitIntoChunks(content: string): string[] {
  const text = content.replace(/\s+/g, " ").trim();

  if (!text) return [];

  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    let end = Math.min(start + CHUNK_SIZE, text.length);

    if (end < text.length) {
      const boundary = text.lastIndexOf(" ", end);
      if (boundary > start + CHUNK_SIZE * 0.7) {
        end = boundary;
      }
    }

    const chunk = text.slice(start, end).trim();

    if (chunk) chunks.push(chunk);

    if (end >= text.length) break;

    start = Math.max(end - CHUNK_OVERLAP, start + 1);
  }

  return chunks;
}
