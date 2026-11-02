import { notFound } from "next/navigation";
import DestinationForm from "@/components/admin/destinations/DestinationForm";
import DestinationQrCode from "@/components/admin/destinations/DestinationQrCode";
import { getDestinationById } from "@/lib/destinations/queries";

export default async function EditDestinationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const destination = await getDestinationById(id);

  if (!destination) {
    notFound();
  }

  return (
    <main className="mx-auto w-full max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">
          Edit destination
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Update destination information and publication settings.
        </p>
      </div>

      <DestinationForm mode="edit" initialData={destination} />

      <DestinationQrCode
        slug={destination.slug}
        name={destination.name}
        status={destination.status}
      />
    </main>
  );
}
