// Mengikuti schema Supabase (0001 + 0003_knowledge_items_ui_fields)

export type KnowledgeStatus = "draft" | "published" | "unpublished";
export type IndexingStatus = "pending" | "indexing" | "indexed" | "failed" | "stale";
export type Language = "id" | "en";

export interface Destination {
  id: string;
  name: string;
  slug: string;
  status: "draft" | "published" | "archived";
}

export interface KnowledgeItem {
  id: string;
  destination_id: string | null;
  title: string;
  slug: string;
  content: string;
  category: string | null;
  language: Language;
  source_name: string | null;
  source_url: string | null;
  source_description: string | null;
  source_type: string;
  status: KnowledgeStatus;
  indexing_status: IndexingStatus;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export type KnowledgeWithDestination = KnowledgeItem & {
  destination: { name: string } | null;
};

// Nilai form: semua string ("" = kosong)
export interface KnowledgeFormValues {
  title: string;
  content: string;
  category: string;
  language: Language;
  destination_id: string;
  source_name: string;
  source_url: string;
  source_description: string;
}
