import "server-only";
import type { createClient } from "@/lib/supabase/server";
import { generateQueryEmbedding } from "@/lib/rag/embeddings";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

function envNumber(name: string, fallback: number, min: number, max: number): number {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value >= min && value <= max ? value : fallback;
}

// Batas bawah: di bawah ini sebuah chunk dianggap tidak relevan dan tidak dipakai sama sekali.
const MIN_SIMILARITY = envNumber("VISITOR_CHAT_MIN_SIMILARITY", 0.55, 0.1, 0.95);
// Hasil terbaik harus minimal segini supaya Gemini boleh dipanggil. Kalau tidak, langsung fallback.
const STRONG_SIMILARITY = envNumber("VISITOR_CHAT_STRONG_SIMILARITY", 0.62, 0.1, 0.99);

const MATCH_COUNT = 8;
const MAX_CONTEXT_CHUNKS = 4;
// Chunk yang terlalu jauh di bawah hasil terbaik dibuang walau lolos batas bawah.
const RELATIVE_WINDOW = 0.1;

interface MatchRow {
  chunk_id: string;
  knowledge_item_id: string;
  destination_id: string;
  chunk_content: string;
  similarity: number;
}

export interface RetrievedChunk {
  label: string; // S1, S2, ... dipakai di prompt dan untuk memetakan sumber
  knowledgeItemId: string;
  content: string;
  similarity: number;
}

export interface RetrievedItem {
  id: string;
  title: string;
  sourceName: string | null;
  sourceUrl: string | null;
  language: "id" | "en";
  category: string | null;
}

export interface RetrievalResult {
  chunks: RetrievedChunk[];
  items: Map<string, RetrievedItem>;
  topSimilarity: number;
  similarities: number[];
  // false = kosong atau kurang relevan => jangan panggil LLM
  sufficient: boolean;
  reason: "ok" | "no_results" | "low_relevance";
}

export class RetrievalError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RetrievalError";
  }
}

export async function retrieveContext(
  supabase: SupabaseServerClient,
  destinationId: string,
  question: string,
): Promise<RetrievalResult> {
  // generateQueryEmbedding memakai model dan dimensi yang sama dengan indexing (768).
  const embedding = await generateQueryEmbedding(question);

  const { data, error } = await supabase.rpc("match_knowledge_chunks", {
    query_embedding: embedding,
    filter_destination_id: destinationId,
    match_threshold: MIN_SIMILARITY,
    match_count: MATCH_COUNT,
  });

  if (error) {
    console.error("[VISITOR CHAT RETRIEVAL ERROR]", error);
    throw new RetrievalError("Knowledge retrieval failed.");
  }

  // Filter destinasi dicek lagi di sini sebagai lapisan kedua, walau SQL sudah memfilter.
  const rows = ((data ?? []) as MatchRow[])
    .filter((row) => row.destination_id === destinationId && row.similarity >= MIN_SIMILARITY)
    .sort((a, b) => b.similarity - a.similarity);

  const empty = (reason: RetrievalResult["reason"], top = 0, sims: number[] = []): RetrievalResult => ({
    chunks: [],
    items: new Map(),
    topSimilarity: top,
    similarities: sims,
    sufficient: false,
    reason,
  });

  if (rows.length === 0) return empty("no_results");

  const top = rows[0].similarity;
  const similarities = rows.map((row) => Number(row.similarity.toFixed(3)));

  if (top < STRONG_SIMILARITY) return empty("low_relevance", top, similarities);

  const selected = rows
    .filter((row) => row.similarity >= top - RELATIVE_WINDOW)
    .slice(0, MAX_CONTEXT_CHUNKS);

  // Metadata sumber diambil lewat RLS publik, jadi item yang tidak lagi published ikut tersaring.
  const itemIds = Array.from(new Set(selected.map((row) => row.knowledge_item_id)));

  const { data: itemRows, error: itemError } = await supabase
    .from("knowledge_items")
    .select("id, title, source_name, source_url, language, category")
    .in("id", itemIds);

  if (itemError) {
    console.error("[VISITOR CHAT SOURCE ERROR]", itemError);
    throw new RetrievalError("Source lookup failed.");
  }

  const items = new Map<string, RetrievedItem>();

  for (const row of (itemRows ?? []) as Array<{
    id: string;
    title: string;
    source_name: string | null;
    source_url: string | null;
    language: string;
    category: string | null;
  }>) {
    items.set(row.id, {
      id: row.id,
      title: row.title,
      sourceName: row.source_name,
      sourceUrl: row.source_url,
      language: row.language === "en" ? "en" : "id",
      category: row.category,
    });
  }

  const chunks: RetrievedChunk[] = selected
    .filter((row) => items.has(row.knowledge_item_id))
    .map((row, index) => ({
      label: `S${index + 1}`,
      knowledgeItemId: row.knowledge_item_id,
      content: row.chunk_content,
      similarity: row.similarity,
    }));

  if (chunks.length === 0) return empty("no_results", top, similarities);

  return { chunks, items, topSimilarity: top, similarities, sufficient: true, reason: "ok" };
}
