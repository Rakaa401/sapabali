// Verifikasi layanan embedding (04.1).

import {
  EMBEDDING_DIMENSIONS,
  EMBEDDING_MODEL,
  EmbeddingError,
  generateEmbedding,
  generateQueryEmbedding,
} from "../src/lib/rag/embeddings";

function norm(vector: number[]) {
  return Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0));
}

function cosine(a: number[], b: number[]) {
  return a.reduce((sum, value, i) => sum + value * b[i], 0) / (norm(a) * norm(b));
}

async function timed<T>(label: string, run: () => Promise<T>) {
  const startedAt = Date.now();
  const result = await run();
  console.log(`  ${label}: ${Date.now() - startedAt} ms`);
  return result;
}

async function main() {
  console.log(`Model: ${EMBEDDING_MODEL}`);
  console.log(`Expected dimensions: ${EMBEDDING_DIMENSIONS}\n`);

  const relevantDoc =
    "Pura Tanah Lot adalah pura laut di Tabanan, Bali. Pengunjung wajib berpakaian sopan dan memakai selendang saat memasuki area pura.";
  const unrelatedDoc =
    "Resep nasi goreng: tumis bawang putih, tambahkan nasi, telur, dan kecap manis, lalu aduk hingga merata.";
  const query = "Apa aturan berpakaian saat berkunjung ke Pura Tanah Lot?";

  const [docA, docB, queryVector] = await Promise.all([
    timed("document (relevant)", () => generateEmbedding(relevantDoc)),
    timed("document (unrelated)", () => generateEmbedding(unrelatedDoc)),
    timed("query", () => generateQueryEmbedding(query)),
  ]);

  let failed = false;

  for (const [label, vector] of [
    ["document (relevant)", docA],
    ["document (unrelated)", docB],
    ["query", queryVector],
  ] as const) {
    const dimensionOk = vector.length === EMBEDDING_DIMENSIONS;
    const vectorNorm = norm(vector);
    const normOk = Math.abs(vectorNorm - 1) < 1e-3;

    console.log(
      `\n${label}\n  dimensions: ${vector.length} ${dimensionOk ? "OK" : "WRONG"}` +
        `\n  norm: ${vectorNorm.toFixed(4)} ${normOk ? "OK" : "NOT NORMALIZED"}` +
        `\n  first values: ${vector
          .slice(0, 3)
          .map((value) => value.toFixed(4))
          .join(", ")}`,
    );

    if (!dimensionOk || !normOk) failed = true;
  }

  const relevantScore = cosine(queryVector, docA);
  const unrelatedScore = cosine(queryVector, docB);
  const rankingOk = relevantScore > unrelatedScore;

  console.log(
    `\nSimilarity query vs relevant doc : ${relevantScore.toFixed(4)}` +
      `\nSimilarity query vs unrelated doc: ${unrelatedScore.toFixed(4)}` +
      `\nRelevant ranks higher: ${rankingOk ? "OK" : "FAILED"}`,
  );

  if (!rankingOk) failed = true;

  console.log(failed ? "\nRESULT: FAILED" : "\nRESULT: PASSED");
  process.exit(failed ? 1 : 0);
}

main().catch((error) => {
  if (error instanceof EmbeddingError) {
    console.error(
      `\nEmbeddingError${error.status ? ` (${error.status})` : ""}: ${error.message}`,
    );
  } else {
    console.error("\nUnexpected error:", error instanceof Error ? error.message : error);
  }
  process.exit(1);
});