import { CATEGORIES } from "@/lib/knowledge/constants";

export type Lang = "id" | "en";

// Bahasa default kalau ?lang= tidak ada atau tidak valid.
export const DEFAULT_LANGUAGE: Lang = "id";

export const LANGUAGE_OPTIONS: { value: Lang; label: string; short: string }[] = [
  { value: "id", label: "Bahasa Indonesia", short: "ID" },
  { value: "en", label: "English", short: "EN" },
];

type ParamValue = string | string[] | undefined;

export function firstParam(value: ParamValue): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export function resolveLanguage(value: ParamValue): Lang {
  const v = firstParam(value);
  return v === "id" || v === "en" ? v : DEFAULT_LANGUAGE;
}

export function otherLanguage(lang: Lang): Lang {
  return lang === "id" ? "en" : "id";
}

export function languageName(lang: Lang): string {
  return LANGUAGE_OPTIONS.find((o) => o.value === lang)?.label ?? lang;
}

// Bangun URL + query string. Nilai kosong dan page=1 dibuang supaya URL tetap bersih.
export function buildHref(
  path: string,
  params: Record<string, string | number | null | undefined> = {},
): string {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    if (key === "page" && Number(value) <= 1) continue;
    qs.set(key, String(value));
  }
  const s = qs.toString();
  return s ? `${path}?${s}` : path;
}

export function guidePath(slug: string) {
  return `/destinations/${encodeURIComponent(slug)}/guide`;
}

export function itemPath(slug: string, id: string) {
  return `${guidePath(slug)}/${encodeURIComponent(id)}`;
}

// Nama kategori di database tetap bahasa Inggris (nilai filter). Hanya tampilannya yang diterjemahkan.
const CATEGORY_LABELS_ID: Record<string, string> = {
  "Visitor Rules": "Aturan Pengunjung",
  "Cultural Etiquette": "Etika Budaya",
  "Dress Code": "Aturan Berpakaian",
  "Local Customs": "Adat Setempat",
  "Sacred or Restricted Areas": "Area Suci atau Terbatas",
  "General Information": "Informasi Umum",
};

export function categoryLabel(category: string, lang: Lang): string {
  return lang === "id" ? (CATEGORY_LABELS_ID[category] ?? category) : category;
}

export function isStandardCategory(category: string) {
  return (CATEGORIES as readonly string[]).includes(category);
}

export function formatDate(iso: string, lang: Lang): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(lang === "id" ? "id-ID" : "en-GB", { dateStyle: "long" }).format(date);
}

const en = {
  languageLabel: "Language",
  guideTitle: "Visitor guide",
  guideIntro: "Rules, etiquette, dress code, and local customs. Only information that has been published by the destination is shown here.",
  backToDestination: "Back to destination",
  backToGuide: "Back to guide",
  categories: "Categories",
  allCategories: "All",
  emptyAll: "No visitor information has been published for this destination yet.",
  emptyCategory: "No verified information has been published in this category yet.",
  noContentInLanguage: (language: string) => `There is no published content in ${language} here yet.`,
  availableInOther: (count: number, language: string) =>
    `${count} ${count === 1 ? "entry is" : "entries are"} available in ${language}. They are written in ${language} and are not translations of this page.`,
  viewIn: (language: string) => `View in ${language}`,
  readMore: "Read more",
  updated: "Updated",
  source: "Source",
  sourceLink: "Open source",
  previous: "Previous",
  next: "Next",
  pageOf: (page: number, total: number) => `Page ${page} of ${total}`,
  writtenIn: (language: string) => `Written in ${language}`,
  notTranslated: (language: string, requested: string) =>
    `This information is only available in ${language}. It has not been translated into ${requested}, so please read it as written.`,
  unavailableTitle: "Information not available",
  unavailableBody: "This information may have been removed or is not published. Please go back to the visitor guide.",
  loading: "Loading visitor guide",
};

export type Dictionary = typeof en;

const id: Dictionary = {
  languageLabel: "Bahasa",
  guideTitle: "Panduan pengunjung",
  guideIntro: "Aturan, etika, cara berpakaian, dan adat setempat. Hanya informasi yang sudah dipublikasikan oleh pengelola destinasi yang ditampilkan di sini.",
  backToDestination: "Kembali ke destinasi",
  backToGuide: "Kembali ke panduan",
  categories: "Kategori",
  allCategories: "Semua",
  emptyAll: "Belum ada informasi pengunjung yang dipublikasikan untuk destinasi ini.",
  emptyCategory: "Belum ada informasi terverifikasi yang dipublikasikan di kategori ini.",
  noContentInLanguage: (language) => `Belum ada konten berbahasa ${language} yang dipublikasikan di sini.`,
  availableInOther: (count, language) =>
    `Ada ${count} informasi dalam bahasa ${language}. Isinya ditulis dalam bahasa ${language} dan bukan terjemahan dari halaman ini.`,
  viewIn: (language) => `Lihat dalam ${language}`,
  readMore: "Baca selengkapnya",
  updated: "Diperbarui",
  source: "Sumber",
  sourceLink: "Buka sumber",
  previous: "Sebelumnya",
  next: "Berikutnya",
  pageOf: (page, total) => `Halaman ${page} dari ${total}`,
  writtenIn: (language) => `Ditulis dalam ${language}`,
  notTranslated: (language, requested) =>
    `Informasi ini hanya tersedia dalam ${language}. Belum diterjemahkan ke ${requested}, jadi mohon dibaca apa adanya.`,
  unavailableTitle: "Informasi tidak tersedia",
  unavailableBody: "Informasi ini mungkin sudah dihapus atau belum dipublikasikan. Silakan kembali ke panduan pengunjung.",
  loading: "Memuat panduan pengunjung",
};

export function getDictionary(lang: Lang): Dictionary {
  return lang === "id" ? id : en;
}
