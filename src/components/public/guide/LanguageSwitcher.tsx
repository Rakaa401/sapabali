import Link from "next/link";
import { LANGUAGE_OPTIONS, buildHref, getDictionary, type Lang } from "@/lib/public/i18n";

type Props = {
  basePath: string;
  current: Lang;
  // Query lain yang ikut dipertahankan saat ganti bahasa (misalnya category)
  params?: Record<string, string | number | null | undefined>;
  onDark?: boolean;
};

// Server component: bahasa disimpan di URL (?lang=), jadi tahan refresh, bisa dibagikan, dan ikut saat scan QR.
export default function LanguageSwitcher({ basePath, current, params = {}, onDark = false }: Props) {
  const t = getDictionary(current);

  return (
    <nav aria-label={t.languageLabel}>
      <ul
        className={`flex rounded-full border p-0.5 text-xs font-semibold ${
          onDark ? "border-white/30 bg-black/25 backdrop-blur" : "border-stone-300 bg-white"
        }`}
      >
        {LANGUAGE_OPTIONS.map((option) => {
          const active = option.value === current;
          return (
            <li key={option.value}>
              <Link
                href={buildHref(basePath, { ...params, lang: option.value })}
                lang={option.value}
                hrefLang={option.value}
                aria-current={active ? "page" : undefined}
                aria-label={option.label}
                scroll={false}
             className={`block rounded-full px-3 py-1.5 transition focus:outline-none focus-visible:ring-2 ${
  onDark ? "focus-visible:ring-white" : "focus-visible:ring-emerald-600"
} ${
                  active
                    ? "bg-emerald-700 text-white"
                    : onDark
                      ? "text-white/85 hover:bg-white/15"
                      : "text-stone-600 hover:bg-stone-100"
                }`}
              >
                {option.short}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
