// Struktur data mengikuti schema di pipeline 01.4 (snake_case = nama kolom database)

export type KnowledgeStatus = "draft" | "published" | "unpublished";
export type IndexingStatus = "pending" | "indexing" | "indexed" | "failed" | "stale";
export type Language = "id" | "en";

export interface Destination {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  location: string | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface KnowledgeItem {
  id: string;
  destination_id: string;
  title: string;
  content: string;
  category: string;
  language: Language;
  source_name: string | null;
  source_url: string | null;
  source_description: string | null;
  status: KnowledgeStatus;
  indexing_status: IndexingStatus;
  created_at: string;
  updated_at: string;
}

// Data yang diisi lewat form (sisanya diisi sistem/database)
export type KnowledgeFormValues = Pick<
  KnowledgeItem,
  | "title"
  | "content"
  | "category"
  | "language"
  | "destination_id"
  | "source_name"
  | "source_url"
  | "source_description"
>;
