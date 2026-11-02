import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import CategoryNav from "@/components/public/guide/CategoryNav";
import KnowledgeCard from "@/components/public/guide/KnowledgeCard";
import LanguageSwitcher from "@/components/public/guide/LanguageSwitcher";
import { CATEGORIES } from "@/lib/knowledge/constants";
import { getPublicDestination } from "@/lib/public/destinations";
import {
  buildHref,
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
  return { title: `${t.guideTitle} | ${destination.name} | SapaBali` };
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
  const queryParams = { category };
  const pageHref = (p: number) => buildHref(base, { lang, category, page: p });

  return (
    <main className="bg-stone-50 pb-16 text-stone-900">
      <div className="mx-auto max-w-5xl px-6 pt-8 sm:pt-12">
        <div className="flex items-start justify-between gap-4">
          <Link
            href={buildHref(`/destinations/${encodeURIComponent(slug)}`, { lang })}
            className="text-sm font-medium text-emerald-700 hover:underline"
          >
            &larr; {t.backToDestination}
          </Link>
          <LanguageSwitcher basePath={base} current={lang} params={queryParams} />
        </div>

        <header className="mt-6">
          <p className="text-sm font-medium text-stone-500">{destination.name}</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">{t.guideTitle}</h1>
          <p className="mt-3 max-w-2xl text-stone-600">{t.guideIntro}</p>
        </header>

        <div className="mt-8">
          <CategoryNav slug={slug} lang={lang} categories={categories} active={category} />
        </div>

        {list.total === 0 ? (
          <section className="mt-8 rounded-xl border border-dashed border-stone-300 bg-white p-8 text-center">
            <p className="font-medium text-stone-800">{category ? t.emptyCategory : t.emptyAll}</p>

            {otherCount > 0 && (
              <div className="mx-auto mt-4 max-w-lg text-sm text-stone-600">
                <p>{t.noContentInLanguage(languageName(lang))}</p>
                <p className="mt-1">{t.availableInOther(otherCount, languageName(other))}</p>
                <Link
                  href={buildHref(base, { lang: other, category })}
                  className="mt-3 inline-block rounded-md bg-emerald-700 px-4 py-2 font-medium text-white hover:bg-emerald-800"
                >
                  {t.viewIn(languageName(other))}
                </Link>
              </div>
            )}
          </section>
        ) : (
          <>
            <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
              <nav aria-label="Pagination" className="mt-8 flex items-center justify-between gap-4 text-sm">
                {page > 1 ? (
                  <Link
                    href={pageHref(page - 1)}
                    className="rounded-md border border-stone-300 bg-white px-4 py-2 font-medium hover:border-emerald-600"
                  >
                    {t.previous}
                  </Link>
                ) : (
                  <span aria-hidden className="w-24" />
                )}
                <span className="text-stone-600">{t.pageOf(list.page, list.totalPages)}</span>
                {page < list.totalPages ? (
                  <Link
                    href={pageHref(page + 1)}
                    className="rounded-md border border-stone-300 bg-white px-4 py-2 font-medium hover:border-emerald-600"
                  >
                    {t.next}
                  </Link>
                ) : (
                  <span aria-hidden className="w-24" />
                )}
              </nav>
            )}
          </>
        )}
      </div>
    </main>
  );
}
