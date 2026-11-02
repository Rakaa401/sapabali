
export class PreprocessingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PreprocessingError";
  }
}

export function preprocessKnowledgeContent(content: string): string {
  if (typeof content !== "string") {
    throw new PreprocessingError("Knowledge content must be a string.");
  }

  const normalized = content
    .replace(/\r\n?/g, "\n")
    .replace(/[\t\f\v ]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \u00A0]+\n/g, "\n")
    .trim();

  if (!normalized) {
    throw new PreprocessingError("Knowledge content cannot be empty.");
  }

  return normalized;
}
