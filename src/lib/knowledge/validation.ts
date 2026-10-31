import type { KnowledgeFormValues } from "@/types/knowledge";
import { CATEGORIES } from "./constants";

export type FieldErrors = Partial<Record<keyof KnowledgeFormValues, string>>;

// Dipakai di browser (form) dan di server (Server Action)
export function validateKnowledge(v: KnowledgeFormValues): FieldErrors {
  const e: FieldErrors = {};
  const title = v.title.trim();
  const content = v.content.trim();

  if (title.length < 3) e.title = "Title must be at least 3 characters.";
  else if (title.length > 200) e.title = "Title must be 200 characters or fewer.";

  if (content.length < 20) e.content = "Content must be at least 20 characters.";
  else if (content.length > 20000) e.content = "Content must be 20,000 characters or fewer.";

  if (!(CATEGORIES as readonly string[]).includes(v.category)) e.category = "Choose a category.";
  if (v.language !== "id" && v.language !== "en") e.language = "Choose a language.";
  if (!v.destination_id) e.destination_id = "Choose a destination.";

  if (v.source_url.trim() && !/^https?:\/\/\S+$/.test(v.source_url.trim())) {
    e.source_url = "Source URL must start with http:// or https://.";
  }
  return e;
}
