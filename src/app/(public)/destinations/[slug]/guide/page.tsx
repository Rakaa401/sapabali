import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, BookOpen, ChevronLeft, ChevronRight } from "lucide-react";
import CategoryNav from "@/components/public/guide/CategoryNav";
import KnowledgeCard from "@/components/public/guide/KnowledgeCard";
import LanguageSwitcher from "@/components/public/guide/LanguageSwitcher";
import { CATEGORIES } from "@/lib/knowledge/constants";
import { getPublicDestination } from "@/lib/public/destinations";
import {
  buildHref,
  categoryLabel,
  firstParam,
  getDictionary,
  guidePath,
  isStandardCategory,
  itemPath,
  languageName,
  otherLanguage,
  resolveLanguage,
} from "@/lib/public/i18n";
import { getPublicKnowledgeCategories, getPublicKnowledgeList } from "@/lib/public/knowledge";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  const destination = await getPublicDestination(slug);
  if (!destination) return { title: "Destination not found" };

  const t = getDictionary(resolveLanguage(sp.lang));
  return { title: `${t.guideTitle} | ${destination.name}` };
}

export default async function VisitorGuidePage({ params, searchParams }: Props) {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);

  const lang = resolveLanguage(sp.lang);
  const t = getDictionary(lang);
  const category = firstParam(sp.category)?.trim() || undefined;
  const page = Math.max(1, Math.floor(Number(firstParam(sp.page))) || 1);

  const destination = await getPublicDestination(slug);
  if (!destination) notFound();

  const [list, categoryRows] = await Promise.all([
    getPublicKnowledgeList({ destinationSlug: slug, language: lang, category, page }),
    getPublicKnowledgeCategories(slug, lang),
  ]);

  // Halaman di luar jangkauan (misalnya ?page=99): arahkan ke halaman terakhir
  if (list.items.length === 0 && list.total > 0) {
    redirect(buildHref(guidePath(slug), { lang, category, page: list.totalPages }));
  }

  // Kategori standar selalu tampil (walau kosong), kategori custom ikut kalau punya konten
  const counts = new Map(categoryRows.map((r) => [r.category, r.count]));
  const categories = [
    ...CATEGORIES.map((name) => ({ name: name as string, count: counts.get(name) ?? 0 })),
    ...categoryRows.filter((r) => !isStandardCategory(r.category)).map((r) => ({ name: r.category, count: r.count })),
  ];

  // Konten kosong di bahasa ini: cek apakah ada di bahasa lain, lalu tawarkan, tanpa mencampur bahasa diam-diam
  const other = otherLanguage(lang);
  let otherCount = 0;
  if (list.total === 0) {
    const otherList = await getPublicKnowledgeList({
      destinationSlug: slug,
      language: other,
      category,
      pageSize: 1,
    });
    otherCount = otherList.total;
  }

  const base = guidePath(slug);
  const pageHref = (p: number) => buildHref(base, { lang, category, page: p });

  const sectionTitle = category
    ? categoryLabel(category, lang)
    : lang === "id"
      ? "Semua informasi"
      : "All information";
  const countText =
    lang === "id"
      ? `${list.total} informasi`
      : `${list.total} ${list.total === 1 ? "entry" : "entries"}`;

  const pagerButton =
    "inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-stone-300 bg-white px-4 py-2 font-medium text-stone-800 transition hover:border-emerald-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600";

  return (
    <main className="min-h-screen bg-stone-50 pb-16 text-stone-900">
      {/* Pita atas: navigasi, judul, dan kategori */}
      <div className="border-b border-stone-200 bg-white">
        <div className="mx-auto max-w-5xl px-6 pb-4 pt-4 sm:pt-6">
          <div className="flex items-center justify-between gap-4">
            <Link
              href={buildHref(`/destinations/${encodeURIComponent(slug)}`, { lang })}
              className="-ml-2 inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2 text-sm font-medium text-emerald-700 hover:bg-emerald-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
            >
              <ArrowLeft size={16} aria-hidden />
              {t.backToDestination}
            </Link>
            <LanguageSwitcher basePath={base} current={lang} params={{ category }} />
          </div>

          <header className="mt-4 sm:mt-6">
            <p className="text-sm font-medium text-emerald-700">{destination.name}</p>
            <h1 className="mt-1 text-balance text-3xl font-bold tracking-tight sm:text-4xl">{t.guideTitle}</h1>
            <p className="mt-3 max-w-2xl text-base leading-relaxed text-stone-600 sm:text-lg">{t.guideIntro}</p>
          </header>

          <div className="mt-6">
            <CategoryNav slug={slug} lang={lang} categories={categories} active={category} />
          </div>
        </div>
      </div>

      {/* Isi */}
      <div className="mx-auto max-w-5xl px-6 pt-8">
        {list.total === 0 ? (
          <section className="rounded-2xl border border-dashed border-stone-300 bg-white px-6 py-10 text-center sm:py-14">
            <span
              aria-hidden
              className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-stone-100 text-stone-500"
            >
              <BookOpen size={22} />
            </span>
            <p className="mx-auto mt-4 max-w-md text-base font-medium text-stone-800">
              {category ? t.emptyCategory : t.emptyAll}
            </p>

            {otherCount > 0 && (
              <div className="mx-auto mt-5 max-w-lg text-sm leading-relaxed text-stone-600">
                <p>{t.noContentInLanguage(languageName(lang))}</p>
                <p className="mt-1">{t.availableInOther(otherCount, languageName(other))}</p>
                <Link
                  href={buildHref(base, { lang: other, category })}
                  className="mt-4 inline-flex min-h-11 items-center rounded-lg bg-emerald-700 px-5 py-2 font-semibold text-white transition hover:bg-emerald-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
                >
                  {t.viewIn(languageName(other))}
                </Link>
              </div>
            )}
          </section>
        ) : (
          <>
            <div className="flex items-baseline justify-between gap-4">
              <h2 className="text-lg font-semibold tracking-tight sm:text-xl">{sectionTitle}</h2>
              <p className="shrink-0 text-sm text-stone-500">{countText}</p>
            </div>

            <ul className="mt-4 grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
              {list.items.map((item) => (
                <li key={item.id} className="flex">
                  <KnowledgeCard
                    item={item}
                    lang={lang}
                    href={buildHref(itemPath(slug, item.id), { lang, category, page })}
                  />
                </li>
              ))}
            </ul>

            {list.totalPages > 1 && (
              <nav aria-label="Pagination" className="mt-10 flex items-center justify-between gap-3 text-sm">
                {page > 1 ? (
                  <Link href={pageHref(page - 1)} className={pagerButton}>
                    <ChevronLeft size={16} aria-hidden />
                    {t.previous}
                  </Link>
                ) : (
                  <span aria-hidden className="w-28" />
                )}

                <span className="text-center text-stone-600">{t.pageOf(list.page, list.totalPages)}</span>

                {page < list.totalPages ? (
                  <Link href={pageHref(page + 1)} className={`${pagerButton} justify-end`}>
                    {t.next}
                    <ChevronRight size={16} aria-hidden />
                  </Link>
                ) : (
                  <span aria-hidden className="w-28" />
                )}
              </nav>
            )}
          </>
        )}
      </div>
    </main>
  );
}
