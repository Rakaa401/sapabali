export function slugify(text: string) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

// Slug wajib unik di database, jadi ditambah akhiran acak
export function makeSlug(title: string) {
  const base = slugify(title) || "knowledge";
  return `${base}-${Math.random().toString(36).slice(2, 6)}`;
}
