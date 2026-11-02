import Link from "next/link";
import { buildHref, categoryLabel, getDictionary, guidePath, type Lang } from "@/lib/public/i18n";

type Props = {
  slug: string;
  lang: Lang;
  categories: { name: string; count: number }[];
  active?: string;
};

export default function CategoryNav({ slug, lang, categories, active }: Props) {
  const t = getDictionary(lang);
  const base = guidePath(slug);

  const pill = (isActive: boolean) =>
    `flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 py-2 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 ${
      isActive
        ? "border-emerald-700 bg-emerald-700 text-white"
        : "border-stone-300 bg-white text-stone-700 hover:border-emerald-600"
    }`;

  return (
    <nav aria-label={t.categories}>
      {/* Mobile: scroll horizontal. Desktop: membungkus ke baris berikutnya */}
      <ul className="-mx-6 flex gap-2 overflow-x-auto px-6 pb-2 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
        <li>
          <Link
            href={buildHref(base, { lang })}
            aria-current={!active ? "true" : undefined}
            className={pill(!active)}
          >
            {t.allCategories}
          </Link>
        </li>
        {categories.map((c) => {
          const isActive = active === c.name;
          return (
            <li key={c.name}>
              <Link
                href={buildHref(base, { lang, category: c.name })}
                aria-current={isActive ? "true" : undefined}
                className={pill(isActive)}
              >
                {categoryLabel(c.name, lang)}
                <span
                  className={`rounded-full px-1.5 text-xs ${
                    isActive ? "bg-white/20" : c.count === 0 ? "bg-stone-100 text-stone-400" : "bg-stone-100 text-stone-600"
                  }`}
                >
                  {c.count}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
