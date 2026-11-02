import Link from "next/link";

export default function DestinationNotFound() {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-6 text-center">
      <p className="text-sm font-medium text-emerald-700">404</p>
      <h1 className="mt-2 text-2xl font-semibold text-stone-900">Destination not found</h1>
      <p className="mt-2 text-sm text-stone-600">
        This link may be incorrect, or the destination is not available yet. Try scanning the QR code again or ask the
        destination staff.
      </p>
      <Link href="/" className="mt-6 rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800">
        Back to home
      </Link>
    </main>
  );
}
