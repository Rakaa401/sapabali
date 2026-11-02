import Link from "next/link";

// Tampil kalau knowledge tidak ada, belum published, sudah di-unpublish, atau id tidak valid.
// Sengaja dua bahasa karena not-found.tsx tidak menerima searchParams.
export default function KnowledgeNotFound() {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-6 text-center">
      <p className="text-sm font-medium text-emerald-700">404</p>
      <h1 className="mt-2 text-2xl font-semibold text-stone-900">Information not available</h1>
      <p className="mt-1 text-lg font-medium text-stone-700">Informasi tidak tersedia</p>
      <p className="mt-3 text-sm text-stone-600">
        This information may have been removed or is not published. Please go back to the visitor guide.
      </p>
      <p className="mt-1 text-sm text-stone-600">
        Informasi ini mungkin sudah dihapus atau belum dipublikasikan. Silakan kembali ke panduan pengunjung.
      </p>
      <Link href="/" className="mt-6 rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800">
        SapaBali
      </Link>
    </main>
  );
}
