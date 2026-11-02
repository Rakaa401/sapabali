"use client";

export default function DestinationError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-6 text-center">
      <h1 className="text-2xl font-semibold text-stone-900">Something went wrong</h1>
      <p className="mt-2 text-sm text-stone-600">We could not load this destination. Please try again.</p>
      <button
        type="button"
        onClick={reset}
        className="mt-6 rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800"
      >
        Try again
      </button>
    </main>
  );
}
