import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { ArrowRight, BookOpen, ExternalLink, MapPin, MessageCircle } from "lucide-react";
import LanguageSwitcher from "@/components/public/guide/LanguageSwitcher";
import { getPublicDestination } from "@/lib/public/destinations";
import { buildHref, guidePath, resolveLanguage, type Lang } from "@/lib/public/i18n";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const en = {
  guideTitle: "Visitor guide",
  guideDesc: "Rules, etiquette, dress code, and local customs to know before you visit.",
  guideCta: "Open the guide",
  aiTitle: "Ask the AI Cultural Guide",
  aiDesc: "Ask in Indonesian or English. Answers come from this destination's verified information.",
  aiCta: "Start a conversation",
  about: "About this destination",
  noDescription: "No description available yet.",
  location: "Location",
  address: "Address",
  regency: "Regency",
  noLocation: "Location details are not available yet.",
  openMaps: "Open in Google Maps",
};

const id: typeof en = {
  guideTitle: "Panduan pengunjung",
  guideDesc: "Aturan, etika, cara berpakaian, dan adat setempat yang perlu kamu tahu sebelum berkunjung.",
  guideCta: "Buka panduan",
  aiTitle: "Tanya Pemandu Budaya AI",
  aiDesc: "Tanya dalam bahasa Indonesia atau Inggris. Jawabannya berasal dari informasi terverifikasi destinasi ini.",
  aiCta: "Mulai bertanya",
  about: "Tentang destinasi ini",
  noDescription: "Belum ada deskripsi.",
  location: "Lokasi",
  address: "Alamat",
  regency: "Kabupaten/Kota",
  noLocation: "Informasi lokasi belum tersedia.",
  openMaps: "Buka di Google Maps",
};

const COPY: Record<Lang, typeof en> = { en, id };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const destination = await getPublicDestination(slug);
  if (!destination) return { title: "Destination not found" };

  // Root layout sudah menambahkan " | SapaBali", jadi tidak ditulis lagi di sini
  return {
    title: destination.name,
    description:
      destination.description?.slice(0, 160) ??
      `Visitor guide and cultural etiquette for ${destination.name}.`,
  };
}

function ActionCard({
  href,
  icon,
  title,
  description,
  cta,
  primary = false,
}: {
  href: string;
  icon: ReactNode;
  title: string;
  description: string;
  cta: string;
  primary?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`group flex gap-4 rounded-2xl border p-5 shadow-md transition focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 sm:p-6 ${
        primary
          ? "border-emerald-700 bg-emerald-700 text-white hover:bg-emerald-800"
          : "border-stone-200 bg-white hover:border-emerald-600 hover:shadow-lg"
      }`}
    >
      <span
        aria-hidden
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
          primary ? "bg-white/15" : "bg-emerald-50 text-emerald-700"
        }`}
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-lg font-semibold leading-snug">{title}</span>
        <span className={`mt-1 block text-sm leading-relaxed ${primary ? "text-emerald-50" : "text-stone-600"}`}>
          {description}
        </span>
        <span
          className={`mt-3 inline-flex items-center gap-1.5 text-sm font-semibold ${primary ? "" : "text-emerald-700"}`}
        >
          {cta}
          <ArrowRight size={16} aria-hidden className="transition group-hover:translate-x-0.5" />
        </span>
      </span>
    </Link>
  );
}

export default async function DestinationLandingPage({ params, searchParams }: Props) {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  const lang = resolveLanguage(sp.lang);
  const t = COPY[lang];

  const destination = await getPublicDestination(slug);
  if (!destination) notFound();

  const d = destination;
  const regencyInAddress =
    d.regency && d.address ? d.address.toLowerCase().includes(d.regency.toLowerCase()) : false;
  const location = regencyInAddress ? (d.address ?? "") : [d.address, d.regency].filter(Boolean).join(", ");
  const hasCoords = d.latitude !== null && d.longitude !== null;
  const mapsHref = hasCoords
    ? `https://www.google.com/maps/search/?api=1&query=${d.latitude},${d.longitude}`
    : location
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${d.name} ${location}`)}`
      : null;

  return (
    <main className="min-h-screen bg-stone-50 pb-16 text-stone-900">
      {/* Hero */}
      <section className="relative isolate overflow-hidden bg-stone-900 text-white">
        {d.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={d.image_url} alt="" className="absolute inset-0 -z-20 h-full w-full object-cover" />
        ) : (
          <div className="absolute inset-0 -z-20 bg-gradient-to-br from-emerald-800 to-stone-900" />
        )}
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />

        <div className="mx-auto max-w-5xl px-5 sm:px-6">
          <div className="flex justify-end pt-5">
            <LanguageSwitcher basePath={`/destinations/${encodeURIComponent(d.slug)}`} current={lang} onDark />
          </div>

          <div className="flex min-h-[15rem] flex-col justify-end pb-16 pt-10 sm:min-h-[24rem] sm:pb-20">
            {d.category && (
              <span className="mb-3 w-fit rounded-full bg-white/20 px-3 py-1 text-xs font-medium backdrop-blur">
                {d.category}
              </span>
            )}
            <h1 className="text-balance text-3xl font-bold leading-tight tracking-tight sm:text-5xl">{d.name}</h1>
            {location && (
              <p className="mt-3 flex max-w-2xl items-start gap-2 text-sm text-white/90 sm:text-base">
                <MapPin size={18} aria-hidden className="mt-0.5 shrink-0" />
                <span>{location}</span>
              </p>
            )}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-5 sm:px-6">
        {/* Dua aksi utama, menimpa bagian bawah hero */}
        <nav aria-label={t.guideTitle} className="relative z-10 -mt-10 grid gap-4 sm:grid-cols-2">
          <ActionCard
            href={buildHref(guidePath(d.slug), { lang })}
            icon={<BookOpen size={24} />}
            title={t.guideTitle}
            description={t.guideDesc}
            cta={t.guideCta}
          />
          <ActionCard
            primary
            href={buildHref(`/destinations/${encodeURIComponent(d.slug)}/chat`, { lang })}
            icon={<MessageCircle size={24} />}
            title={t.aiTitle}
            description={t.aiDesc}
            cta={t.aiCta}
          />
        </nav>

        {/* Deskripsi dan lokasi */}
        <div className="mt-10 grid gap-8 lg:grid-cols-3 lg:gap-12">
          <section className="lg:col-span-2">
            <h2 className="text-2xl font-semibold tracking-tight">{t.about}</h2>
            {d.description ? (
              <p className="mt-4 max-w-prose whitespace-pre-line text-base leading-7 text-stone-700 sm:text-lg sm:leading-8">
                {d.description}
              </p>
            ) : (
              <p className="mt-4 text-stone-500">{t.noDescription}</p>
            )}
          </section>

          <aside className="h-fit rounded-2xl border border-stone-200 bg-white p-5 sm:p-6">
            <h2 className="flex items-center gap-2 text-base font-semibold">
              <MapPin size={18} aria-hidden className="text-emerald-700" />
              {t.location}
            </h2>

            <dl className="mt-4 space-y-4 text-sm">
              {d.address && (
                <div>
                  <dt className="text-stone-500">{t.address}</dt>
                  <dd className="mt-0.5 font-medium text-stone-900">{d.address}</dd>
                </div>
              )}
              {d.regency && (
                <div>
                  <dt className="text-stone-500">{t.regency}</dt>
                  <dd className="mt-0.5 font-medium text-stone-900">{d.regency}</dd>
                </div>
              )}
            </dl>
            {!d.address && !d.regency && <p className="mt-4 text-sm text-stone-500">{t.noLocation}</p>}

            {mapsHref && (
              <a
                href={mapsHref}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 flex min-h-11 items-center justify-center gap-2 rounded-lg bg-stone-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-stone-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
              >
                {t.openMaps}
                <ExternalLink size={16} aria-hidden />
              </a>
            )}
          </aside>
        </div>
      </div>
    </main>
  );
}
