import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import StaffAssistant from "@/components/public/staff/StaffAssistant";
import { getPublicDestination } from "@/lib/public/destinations";
import { STAFF_TEXT as T } from "@/lib/staff-assistant/text";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const destination = await getPublicDestination(slug);
  if (!destination) return { title: "Destination not found" };
  return { title: `${T.title} | ${destination.name}` };
}

export default async function StaffAssistantPage({ params }: Props) {
  const { slug } = await params;
  const destination = await getPublicDestination(slug);
  if (!destination) notFound();

  return (
    <main className="min-h-dvh bg-stone-50 text-stone-900">
      <div className="mx-auto max-w-3xl px-4 py-6 sm:py-10">
        <Link
          href={`/destinations/${destination.slug}`}
          className="inline-flex items-center gap-1 text-xs text-emerald-700 hover:underline"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          {T.back} &middot; {destination.name}
        </Link>

        <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">{T.title}</h1>
        <p className="mt-2 max-w-2xl text-sm text-stone-600">{T.intro}</p>

        <div className="mt-6">
          <StaffAssistant destinationId={destination.id} />
        </div>
      </div>
    </main>
  );
}
