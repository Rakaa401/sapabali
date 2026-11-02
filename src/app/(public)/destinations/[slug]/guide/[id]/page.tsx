import { cache } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
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

  return (
    <main className="min-h-screen bg-stone-50 pb-16 text-stone-900">
      <div className="mx-auto max-w-3xl px-6 pt-8 sm:pt-12">
        <div className="flex items-start justify-between gap-4">
          <Link href={backHref} className="text-sm font-medium text-emerald-700 hover:underline">
            &larr; {t.backToGuide}
          </Link>
          <LanguageSwitcher
            basePath={itemPath(slug, id)}
            current={lang}
            params={{ category, page }}
          />
        </div>

        <article className="mt-6">
          <p className="text-sm font-medium text-stone-500">{destination.name}</p>

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

          <h1 className="mt-3 text-3xl font-semibold leading-tight tracking-tight sm:text-4xl" lang={item.language}>
            {item.title}
          </h1>

          {/* Konten ini tidak ada versi terjemahannya: katakan apa adanya */}
          {item.language !== lang && (
            <p role="note" className="mt-5 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              {t.notTranslated(languageName(item.language), languageName(lang))}
            </p>
          )}

          <div className="mt-6 whitespace-pre-line text-base leading-relaxed text-stone-800" lang={item.language}>
            {item.content}
          </div>

          <dl className="mt-10 space-y-3 border-t border-stone-200 pt-6 text-sm">
            {item.source_name && (
              <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-3">
                <dt className="w-24 shrink-0 text-stone-500">{t.source}</dt>
                <dd className="font-medium">
                  {item.source_name}
                  {source && (
                    <>
                      {" "}
                      <a
                        href={source}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-emerald-700 hover:underline"
                      >
                        ({t.sourceLink})
                      </a>
                    </>
                  )}
                </dd>
              </div>
            )}
            {!item.source_name && source && (
              <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-3">
                <dt className="w-24 shrink-0 text-stone-500">{t.source}</dt>
                <dd>
                  <a href={source} target="_blank" rel="noopener noreferrer" className="font-medium text-emerald-700 hover:underline">
                    {t.sourceLink}
                  </a>
                </dd>
              </div>
            )}
            <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-3">
              <dt className="w-24 shrink-0 text-stone-500">{t.updated}</dt>
              <dd className="font-medium">
                <time dateTime={item.updated_at}>{formatDate(item.updated_at, lang)}</time>
              </dd>
            </div>
          </dl>
        </article>
      </div>
    </main>
  );
}
