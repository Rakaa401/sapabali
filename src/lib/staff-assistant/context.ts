import "server-only";
import type { createClient } from "@/lib/supabase/server";
import { retrieveContext, type RetrievalResult } from "@/lib/visitor-chat/retrieval";

type ServerClient = Awaited<ReturnType<typeof createClient>>;

export interface StaffSourceRef {
  id: string;
  title: string;
  sourceName: string | null;
  sourceUrl: string | null;
  category: string | null;
  language: "id" | "en";
  detailPath: string;
}

// Hanya tautan http(s) yang boleh tampil sebagai sumber eksternal
function safeUrl(value: string | null): string | null {
  return value && /^https?:\/\//i.test(value) ? value : null;
}

// 07.3: cari knowledge Published milik destinasi ini yang relevan dengan situasi.
// Memakai pencarian yang sama dengan chat pengunjung: filter destinasi, ambang kemiripan,
// dan metadata sumber. retrieval.sufficient === false berarti data tidak cukup, jangan panggil AI.
export async function retrieveStaffContext(
  supabase: ServerClient,
  destinationId: string,
  situation: string,
): Promise<RetrievalResult> {
  return retrieveContext(supabase, destinationId, situation);
}

// Sumber hanya dari label yang benar-benar dipakai model dan ada di hasil pencarian
export function buildStaffSources(
  labels: string[],
  retrieval: RetrievalResult,
  destinationSlug: string,
): StaffSourceRef[] {
  const wanted = new Set(labels);
  const seen = new Set<string>();
  const sources: StaffSourceRef[] = [];

  for (const chunk of retrieval.chunks) {
    if (!wanted.has(chunk.label) || seen.has(chunk.knowledgeItemId)) continue;
    const item = retrieval.items.get(chunk.knowledgeItemId);
    if (!item) continue;

    seen.add(item.id);
    sources.push({
      id: item.id,
      title: item.title,
      sourceName: item.sourceName,
      sourceUrl: safeUrl(item.sourceUrl),
      category: item.category,
      language: item.language,
      detailPath: `/destinations/${encodeURIComponent(destinationSlug)}/guide/${encodeURIComponent(item.id)}?lang=id`,
    });
  }
  return sources;
}
