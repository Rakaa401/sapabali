export default function GuideLoading() {
  return (
    <main className="bg-stone-50 pb-16" aria-busy="true">
      <div className="mx-auto max-w-5xl px-6 pt-8 sm:pt-12">
        <div className="h-4 w-40 animate-pulse rounded bg-stone-200" />
        <div className="mt-8 h-9 w-64 animate-pulse rounded bg-stone-200" />
        <div className="mt-3 h-4 w-full max-w-xl animate-pulse rounded bg-stone-200" />
        <div className="mt-8 flex gap-2 overflow-hidden">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-10 w-28 shrink-0 animate-pulse rounded-full bg-stone-200" />
          ))}
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-44 animate-pulse rounded-xl bg-stone-200" />
          ))}
        </div>
      </div>
      <span className="sr-only">Loading visitor guide</span>
    </main>
  );
}
