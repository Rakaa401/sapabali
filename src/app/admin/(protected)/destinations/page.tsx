import DestinationTable from "@/components/admin/destinations/DestinationTable";
import { getDestinations } from "@/lib/destinations/queries";

export default async function DestinationsPage() {
  const destinations = await getDestinations();

  return (
    <main className="mx-auto w-full max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">
          Destinations
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Manage destinations and places across Bali.
        </p>
      </div>

      <DestinationTable initialItems={destinations} />
    </main>
  );
}