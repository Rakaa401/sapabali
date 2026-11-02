import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublicDestination } from "@/lib/public/destinations";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const destination = await getPublicDestination(slug);
  if (!destination) return { title: "Destination not found" };

  return {
    title: `${destination.name} | SapaBali`,
    description:
      destination.description?.slice(0, 160) ??
      `Visitor guide and cultural etiquette for ${destination.name}.`,
  };
}

export default async function DestinationLandingPage({ params }: Props) {
  const { slug } = await params;
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
    <main className="bg-stone-50 pb-16 text-stone-900">
      {/* Hero */}
      <section className="relative isolate overflow-hidden bg-stone-900 text-white">
        {d.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={d.image_url} alt="" className="absolute inset-0 -z-20 h-full w-full object-cover" />
        ) : (
          <div className="absolute inset-0 -z-20 bg-gradient-to-br from-emerald-800 to-stone-900" />
        )}
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/75 via-black/35 to-black/10" />

        <div className="mx-auto flex min-h-[22rem] max-w-5xl flex-col justify-end px-6 pb-14 pt-24 sm:min-h-[30rem] sm:pb-20">
          {d.category && (
            <span className="mb-3 w-fit rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur">
              {d.category}
            </span>
          )}
          <h1 className="text-3xl font-semibold tracking-tight sm:text-5xl">{d.name}</h1>
          {location && <p className="mt-3 max-w-2xl text-sm text-white/85 sm:text-base">{location}</p>}
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-6">
        {/* Navigasi utama: Visitor Guide dan AI Cultural Guide */}
        <nav aria-label="Destination sections" className="relative z-10 -mt-8 grid gap-4 sm:grid-cols-2">
          <Link
            href={`/destinations/${d.slug}/guide`}
            className="group rounded-xl border border-stone-200 bg-white p-5 shadow-sm transition hover:border-emerald-600 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
          >
            <h2 className="text-lg font-semibold">Visitor guide</h2>
            <p className="mt-1 text-sm text-stone-600">
              Rules, etiquette, dress code, and local customs before you visit.
            </p>
            <span className="mt-3 inline-block text-sm font-medium text-emerald-700 group-hover:underline">
              Open the guide
            </span>
          </Link>

          <Link
            href={`/destinations/${d.slug}/chat`}
            className="group rounded-xl border border-emerald-700 bg-emerald-700 p-5 text-white shadow-sm transition hover:bg-emerald-800 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
          >
            <h2 className="text-lg font-semibold">Ask the AI Cultural Guide</h2>
            <p className="mt-1 text-sm text-emerald-50">
              Ask questions in Indonesian or English. Answers come from this destination&rsquo;s verified information.
            </p>
            <span className="mt-3 inline-block text-sm font-medium group-hover:underline">
              Start a conversation
            </span>
          </Link>
        </nav>

        {/* Deskripsi dan lokasi */}
        <div className="mt-10 grid gap-10 lg:grid-cols-3">
          <section className="lg:col-span-2">
            <h2 className="text-xl font-semibold">About this destination</h2>
            {d.description ? (
              <p className="mt-3 whitespace-pre-line leading-relaxed text-stone-700">{d.description}</p>
            ) : (
              <p className="mt-3 text-stone-500">No description available yet.</p>
            )}
          </section>

          <aside className="h-fit rounded-xl border border-stone-200 bg-white p-5">
            <h2 className="text-base font-semibold">Location</h2>
            <dl className="mt-3 space-y-3 text-sm">
              {d.address && (
                <div>
                  <dt className="text-stone-500">Address</dt>
                  <dd className="mt-0.5 font-medium">{d.address}</dd>
                </div>
              )}
              {d.regency && (
                <div>
                  <dt className="text-stone-500">Regency</dt>
                  <dd className="mt-0.5 font-medium">{d.regency}</dd>
                </div>
              )}
              {!d.address && !d.regency && <p className="text-stone-500">Location details are not available yet.</p>}
            </dl>
            {mapsHref && (
              <a
                href={mapsHref}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-block text-sm font-medium text-emerald-700 hover:underline"
              >
                Open in Google Maps
              </a>
            )}
          </aside>
        </div>
      </div>
    </main>
  );
}
