export default function LoadingState({
  message = "Loading...",
}: {
  message?: string;
}) {
  return (
    <div className="w-full space-y-6" role="status" aria-busy="true">
      <div className="h-8 w-48 animate-pulse rounded bg-zinc-200" />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-xl bg-zinc-100" />
        ))}
      </div>

      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-14 animate-pulse rounded-xl bg-zinc-100" />
        ))}
      </div>

      <span className="sr-only">{message}</span>
    </div>
  );
}