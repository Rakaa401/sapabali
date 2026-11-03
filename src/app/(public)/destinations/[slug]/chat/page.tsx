import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import ChatInterface from "@/components/public/chat/ChatInterface";
import LanguageSwitcher from "@/components/public/guide/LanguageSwitcher";
import { getPublicDestination } from "@/lib/public/destinations";
import { buildHref, resolveLanguage } from "@/lib/public/i18n";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const TITLE = { en: "AI Cultural Guide", id: "Pemandu Budaya AI" } as const;
const BACK = { en: "Back", id: "Kembali" } as const;

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  const destination = await getPublicDestination(slug);
  if (!destination) return { title: "Destination not found" };

  return { title: `${TITLE[resolveLanguage(sp.lang)]} | ${destination.name}` };
}

export default async function ChatPage({ params, searchParams }: Props) {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  const lang = resolveLanguage(sp.lang);

  const destination = await getPublicDestination(slug);
  if (!destination) notFound();

  return (
    // h-dvh: tinggi layar yang benar di HP (tidak terpotong bar browser). Daftar pesan scroll sendiri.
    <main className="flex h-dvh flex-col bg-stone-50 text-stone-900">
      <header className="shrink-0 border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-2 sm:px-6">
          <div className="flex min-w-0 items-center gap-2">
            <Link
              href={buildHref(`/destinations/${encodeURIComponent(slug)}`, { lang })}
              aria-label={`${BACK[lang]}: ${destination.name}`}
              className="-ml-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-emerald-700 hover:bg-emerald-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
            >
              <ArrowLeft size={20} aria-hidden />
            </Link>
            <div className="min-w-0">
              <h1 className="truncate text-base font-semibold leading-tight">{TITLE[lang]}</h1>
              <p className="truncate text-xs text-stone-500">{destination.name}</p>
            </div>
          </div>

          <LanguageSwitcher basePath={`/destinations/${encodeURIComponent(slug)}/chat`} current={lang} />
        </div>
      </header>

      {/* key = bahasa: ganti bahasa memulai percakapan baru, supaya jawaban tidak bercampur bahasa */}
      <ChatInterface key={lang} destinationId={destination.id} language={lang} />
    </main>
  );
}
