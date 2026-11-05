import { cache } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, ExternalLink, FileText, Info } from "lucide-react";
import LanguageSwitcher from "@/components/public/guide/LanguageSwitcher";
import { getPublicDestination } from "@/lib/public/destinations";
import {
  buildHref,
  categoryLabel,
  firstParam,
  formatDate,
  getDictionary,
  guidePath,
  itemPath,
  languageName,
  resolveLanguage,
} from "@/lib/public/i18n";
import { getPublicKnowledgeItem } from "@/lib/public/knowledge";

type Props = {
  params: Promise<{ slug: string; id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

// Dipakai bareng generateMetadata dan page tanpa query dobel
const getItem = cache((slug: string, id: string) => getPublicKnowledgeItem(slug, id));

// Hanya tampilkan tautan sumber kalau http(s), supaya tidak ada javascript: atau skema aneh
function safeUrl(value: string | null): string | null {
  return value && /^https?:\/\//i.test(value) ? value : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, id } = await params;
  const item = await getItem(slug, id);
  if (!item) return { title: "Information not available" };
  return { title: item.title };
}

export default async function KnowledgeDetailPage({ params, searchParams }: Props) {
  const [{ slug, id }, sp] = await Promise.all([params, searchParams]);

  const lang = resolveLanguage(sp.lang);
  const t = getDictionary(lang);
  const category = firstParam(sp.category)?.trim() || undefined;
  const page = Math.floor(Number(firstParam(sp.page))) || 1;

  // Draft, unpublished, belum indexed, atau destinasi tidak published => null => 404
  const [destination, item] = await Promise.all([getPublicDestination(slug), getItem(slug, id)]);
  if (!destination || !item) notFound();

  const backHref = buildHref(guidePath(slug), { lang, category, page });
  const source = safeUrl(item.source_url);
  const hasSource = Boolean(item.source_name || source);

  return (
    <main className="min-h-screen bg-stone-50 pb-16 text-stone-900">
      {/* Pita atas: kembali dan bahasa */}
      <div className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-6 py-3">
          <Link
            href={backHref}
            className="-ml-2 inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2 text-sm font-medium text-emerald-700 hover:bg-emerald-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
          >
            <ArrowLeft size={16} aria-hidden />
            {t.backToGuide}
          </Link>
          <LanguageSwitcher basePath={itemPath(slug, id)} current={lang} params={{ category, page }} />
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-6 pt-8 sm:pt-10">
      <article className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:p-10">
          <header>
            <p className="text-sm font-medium text-emerald-700">{destination.name}</p>

            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
              {item.category && (
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 font-medium text-emerald-800">
                  {categoryLabel(item.category, lang)}
                </span>
              )}
              <span className="rounded-full bg-stone-100 px-2.5 py-1 font-medium text-stone-600">
                {t.writtenIn(languageName(item.language))}
              </span>
            </div>

            <h1
              className="mt-4 text-balance text-3xl font-bold leading-tight tracking-tight sm:text-4xl"
              lang={item.language}
            >
              {item.title}
            </h1>
          </header>

          {/* Konten ini tidak ada versi terjemahannya: katakan apa adanya */}
          {item.language !== lang && (
            <div
              role="note"
              className="mt-6 flex gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm leading-relaxed text-amber-900"
            >
              <Info size={18} aria-hidden className="mt-0.5 shrink-0" />
              <p>{t.notTranslated(languageName(item.language), languageName(lang))}</p>
            </div>
          )}

          <div
            className="mt-8 whitespace-pre-line text-base leading-8 text-stone-800 sm:text-lg sm:leading-9"
            lang={item.language}
          >
            {item.content}
          </div>

          {/* Sumber dan tanggal */}
          <dl className="mt-10 grid gap-4 rounded-xl bg-stone-50 p-4 text-sm sm:grid-cols-2 sm:p-5">
            {hasSource && (
              <div className="flex gap-3">
                <FileText size={18} aria-hidden className="mt-0.5 shrink-0 text-stone-400" />
                <div className="min-w-0">
                  <dt className="text-stone-500">{t.source}</dt>
                  <dd className="mt-0.5 break-words font-medium text-stone-900">
                    {item.source_name}
                    {source && (
                      <a
                        href={source}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`inline-flex items-center gap-1 font-medium text-emerald-700 hover:underline focus:outline-none focus-visible:rounded focus-visible:ring-2 focus-visible:ring-emerald-600 ${
                          item.source_name ? "ml-2" : ""
                        }`}
                      >
                        {t.sourceLink}
                        <ExternalLink size={14} aria-hidden />
                      </a>
                    )}
                  </dd>
                </div>
              </div>
            )}
            <div className="flex gap-3">
              <CalendarDays size={18} aria-hidden className="mt-0.5 shrink-0 text-stone-400" />
              <div>
                <dt className="text-stone-500">{t.updated}</dt>
                <dd className="mt-0.5 font-medium text-stone-900">
                  <time dateTime={item.updated_at}>{formatDate(item.updated_at, lang)}</time>
                </dd>
              </div>
            </div>
          </dl>
        </article>

        <Link
          href={backHref}
          className="mt-6 flex min-h-11 items-center justify-center gap-2 rounded-lg border border-stone-300 bg-white px-4 py-2.5 text-sm font-semibold text-stone-800 transition hover:border-emerald-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 sm:w-fit"
        >
          <ArrowLeft size={16} aria-hidden />
          {t.backToGuide}
        </Link>
      </div>
    </main>
  );
}
