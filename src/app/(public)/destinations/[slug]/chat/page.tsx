import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ChatPanel from "@/components/chat/ChatPanel";
import { getPublicDestination } from "@/lib/public/destinations";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const destination = await getPublicDestination(slug);
  if (!destination) return { title: "Destination not found" };
  return { title: `AI Cultural Guide | ${destination.name}` };
}

export default async function CulturalGuideChatPage({ params }: Props) {
  const { slug } = await params;
  const destination = await getPublicDestination(slug);
  if (!destination) notFound();

  return (
    <main className="mx-auto flex h-dvh max-w-3xl flex-col bg-stone-50 text-stone-900">
      <header className="shrink-0 border-b border-stone-200 bg-white px-4 py-3">
        <Link href={`/destinations/${destination.slug}`} className="text-xs text-emerald-700 hover:underline">
          &larr; {destination.name}
        </Link>
        <h1 className="text-lg font-semibold">AI Cultural Guide</h1>
      </header>
      <ChatPanel destinationId={destination.id} destinationName={destination.name} />
    </main>
  );
}
