import type { Destination, KnowledgeItem } from "@/types/knowledge";

// Kategori diambil dari pipeline 05.3. Nanti bisa diganti tabel categories (02.11).
export const CATEGORIES = [
  "Visitor Rules",
  "Cultural Etiquette",
  "Dress Code",
  "Local Customs",
  "Sacred or Restricted Areas",
  "General Information",
] as const;

export const LANGUAGES = [
  { value: "id", label: "Indonesian" },
  { value: "en", label: "English" },
] as const;

// Destinasi simulasi (sesuai 08.1: harus dilabeli jelas sebagai simulasi)
export const DUMMY_DESTINATIONS: Destination[] = [
  {
    id: "d1111111-1111-4111-8111-111111111111",
    name: "Pura Contoh (Simulasi)",
    slug: "pura-contoh",
    description: "Destinasi simulasi untuk keperluan demo. Bukan lokasi resmi.",
    location: "Bali, Indonesia",
    is_published: true,
    created_at: "2026-10-30T08:00:00Z",
    updated_at: "2026-10-30T08:00:00Z",
  },
];

const D1 = DUMMY_DESTINATIONS[0].id;

export const DUMMY_KNOWLEDGE: KnowledgeItem[] = [
  {
    id: "k0000001-0000-4000-8000-000000000001",
    destination_id: D1,
    title: "Aturan Berpakaian Saat Memasuki Area Pura",
    content:
      "Pengunjung wajib memakai kain dan selendang (sarung dan selendang pinggang) saat memasuki area utama pura. Pakaian harus menutup bahu dan lutut. Kain dan selendang dapat dipinjam di pintu masuk.\n\n(Konten simulasi untuk demo.)",
    category: "Dress Code",
    language: "id",
    source_name: "Pengelola Pura (simulasi)",
    source_url: "https://example.com/dress-code",
    source_description: "Papan informasi di pintu masuk (simulasi)",
    status: "published",
    indexing_status: "indexed",
    created_at: "2026-10-30T09:00:00Z",
    updated_at: "2026-10-31T02:15:00Z",
  },
  {
    id: "k0000002-0000-4000-8000-000000000002",
    destination_id: D1,
    title: "Dress Code When Entering the Temple Area",
    content:
      "Visitors must wear a sarong and a sash when entering the main temple area. Shoulders and knees must be covered. Sarongs and sashes can be borrowed at the entrance.\n\n(Simulated content for demo.)",
    category: "Dress Code",
    language: "en",
    source_name: "Pengelola Pura (simulasi)",
    source_url: "https://example.com/dress-code",
    source_description: "Entrance information board (simulated)",
    status: "published",
    indexing_status: "indexed",
    created_at: "2026-10-30T09:10:00Z",
    updated_at: "2026-10-31T02:20:00Z",
  },
  {
    id: "k0000003-0000-4000-8000-000000000003",
    destination_id: D1,
    title: "Area Utama Pura Tidak Terbuka untuk Semua Pengunjung",
    content:
      "Sesuai adat setempat, area utama pura memiliki pembatasan bagi pengunjung dalam kondisi tertentu menurut kepercayaan lokal. Petugas dapat membantu mengarahkan pengunjung ke area yang diperbolehkan.\n\n(Konten simulasi untuk demo.)",
    category: "Sacred or Restricted Areas",
    language: "id",
    source_name: "Tokoh adat (simulasi)",
    source_url: null,
    source_description: "Wawancara simulasi",
    status: "draft",
    indexing_status: "pending",
    created_at: "2026-10-31T01:00:00Z",
    updated_at: "2026-10-31T01:00:00Z",
  },
  {
    id: "k0000004-0000-4000-8000-000000000004",
    destination_id: D1,
    title: "Etika Berfoto di Dekat Area Persembahyangan",
    content:
      "Pengunjung tidak boleh berfoto tepat di depan orang yang sedang bersembahyang dan tidak boleh melangkahi sesajen (canang). Hindari menggunakan flash dan drone tanpa izin pengelola.\n\n(Konten simulasi untuk demo.)",
    category: "Cultural Etiquette",
    language: "id",
    source_name: "Pengelola Pura (simulasi)",
    source_url: "https://example.com/etiquette",
    source_description: null,
    status: "published",
    indexing_status: "failed",
    created_at: "2026-10-30T10:30:00Z",
    updated_at: "2026-10-30T12:00:00Z",
  },
  {
    id: "k0000005-0000-4000-8000-000000000005",
    destination_id: D1,
    title: "Jam Kunjungan dan Tiket Masuk",
    content:
      "Pura dibuka setiap hari pukul 08.00-18.00. Tiket masuk dijual di loket utama. Pada hari upacara tertentu, area dalam dapat ditutup untuk wisatawan.\n\n(Konten simulasi untuk demo.)",
    category: "General Information",
    language: "id",
    source_name: "Dinas Pariwisata (simulasi)",
    source_url: "https://example.com/info",
    source_description: "Laman resmi simulasi",
    status: "unpublished",
    indexing_status: "stale",
    created_at: "2026-10-29T07:00:00Z",
    updated_at: "2026-10-30T15:45:00Z",
  },
  {
    id: "k0000006-0000-4000-8000-000000000006",
    destination_id: D1,
    title: "Makna dan Cara Menghormati Canang Sari",
    content:
      "Canang sari adalah persembahan harian umat Hindu Bali. Jangan menginjak atau memindahkan canang yang diletakkan di tanah, pintu, atau tangga. Jika tidak sengaja, minta maaf secara sopan kepada warga sekitar.\n\n(Konten simulasi untuk demo.)",
    category: "Local Customs",
    language: "id",
    source_name: null,
    source_url: null,
    source_description: null,
    status: "draft",
    indexing_status: "pending",
    created_at: "2026-10-31T03:30:00Z",
    updated_at: "2026-10-31T03:30:00Z",
  },
];

export function getKnowledgeById(id: string) {
  return DUMMY_KNOWLEDGE.find((k) => k.id === id);
}

export function getDestinationName(id: string) {
  return (
    DUMMY_DESTINATIONS.find((d) => d.id === id)?.name ?? "Unknown destination"
  );
}

// Format tanggal tetap (UTC) supaya server & browser tidak beda hasil
export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    timeZone: "UTC",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
