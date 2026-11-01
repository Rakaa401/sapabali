export default function Loading() {
  return (
    <main className="mx-auto " aria-busy="true">
      <div className="mb-6 h-8 w-40 animate-pulse rounded bg-slate-200" />
      <div className="mb-6 h-10 w-full animate-pulse rounded bg-slate-100" />
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-16 animate-pulse rounded bg-slate-100" />
        ))}
      </div>
      <span className="sr-only">Loading activity</span>
    </main>
  );
}
