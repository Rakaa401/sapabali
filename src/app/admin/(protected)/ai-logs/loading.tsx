export default function Loading() {
  return (
    <main className="mx-auto max-w-6xl p-6" aria-busy="true">
      <div className="mb-6 h-8 w-40 animate-pulse rounded bg-slate-200" />
      <div className="mb-4 h-10 w-full animate-pulse rounded bg-slate-100" />
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-14 animate-pulse rounded bg-slate-100" />
        ))}
      </div>
      <span className="sr-only">Loading AI logs</span>
    </main>
  );
}
