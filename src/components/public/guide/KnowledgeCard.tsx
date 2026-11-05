import Link from "next/link";
import type { PublicKnowledgeItem } from "@/lib/public/knowledge";
import {
  categoryLabel,
  formatDate,
  getDictionary,
  languageName,
  type Lang,
} from "@/lib/public/i18n";

type Props = { item: PublicKnowledgeItem; href: string; lang: Lang };

export default function KnowledgeCard({ item, href, lang }: Props) {
  const t = getDictionary(lang);

  return (
    <article className="relative flex w-full flex-col rounded-xl border border-stone-200 bg-white p-5 shadow-sm transition hover:border-emerald-400 hover:shadow-md">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        {item.category && (
          <span className="rounded-full bg-emerald-50 px-2.5 py-1 font-medium text-emerald-800">
            {categoryLabel(item.category, lang)}
          </span>
        )}

        <span
          className="rounded-full bg-stone-100 px-2.5 py-1 font-medium text-stone-600"
          lang={item.language}
        >
          {languageName(item.language)}
        </span>
      </div>

      <h3
        className="mt-3 text-lg font-semibold leading-snug text-stone-900"
        lang={item.language}
      >
        <Link
          href={href}
          className="after:absolute after:inset-0 focus:outline-none focus-visible:rounded-md focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
        >
          {item.title}
        </Link>
      </h3>

      <p
        className="mt-2 flex-1 text-sm leading-relaxed text-stone-600"
        lang={item.language}
      >
        {item.excerpt}
      </p>

      <div className="mt-4 flex items-center justify-between gap-3 text-xs text-stone-500">
        <span>
          {t.updated} {formatDate(item.updated_at, lang)}
        </span>

        <span className="inline-flex shrink-0 items-center gap-1 font-medium text-emerald-700">
          {t.readMore}
          <span aria-hidden>→</span>
        </span>
      </div>
    </article>
  );
}