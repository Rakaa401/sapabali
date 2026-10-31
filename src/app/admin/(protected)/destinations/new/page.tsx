import DestinationForm from "@/components/admin/destinations/DestinationForm";

export default function NewDestinationPage() {
  return (
    <main className="mx-auto w-full max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">
          Create destination
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Add a new destination to the SapaBali directory.
        </p>
      </div>

      <DestinationForm mode="create" />
    </main>
  );
}