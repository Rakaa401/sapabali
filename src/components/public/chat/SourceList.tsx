import Link from "next/link";
import { ExternalLink, FileText } from "lucide-react";
import type { ChatLanguage, ChatSource } from "@/lib/visitor-chat/types";

type Props = {
  sources: ChatSource[];
  lang: ChatLanguage;
};

const COPY = {
  en: { title: "Sources", open: "Open source", writtenIn: { id: "Indonesian", en: "English" } },
  id: { title: "Sumber", open: "Buka sumber", writtenIn: { id: "Bahasa Indonesia", en: "Inggris" } },
} as const;

// Semua data berasal dari hasil retrieval di server, bukan dari teks yang ditulis model.
export default function SourceList({ sources, lang }: Props) {
  const t = COPY[lang];

  if (sources.length === 0) return null;

  return (
    <div className="mt-3 border-t border-stone-200 pt-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">{t.title}</p>
      <ul className="mt-2 space-y-2">
        {sources.map((source) => (
          <li key={source.id} className="rounded-lg bg-stone-50 px-3 py-2 text-sm">
            <Link
              href={source.detailPath}
              className="flex items-start gap-2 font-medium text-emerald-800 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
            >
              <FileText size={16} aria-hidden className="mt-0.5 shrink-0" />
              <span className="min-w-0 break-words">{source.title}</span>
            </Link>

            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 pl-6 text-xs text-stone-500">
              {source.sourceName && <span className="break-words">{source.sourceName}</span>}
              <span lang={source.language}>{t.writtenIn[source.language]}</span>
              {source.sourceUrl && (
                <a
                  href={source.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-medium text-emerald-700 hover:underline"
                >
                  {t.open}
                  <ExternalLink size={12} aria-hidden />
                </a>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
