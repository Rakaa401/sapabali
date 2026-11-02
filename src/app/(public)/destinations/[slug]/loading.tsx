export default function Loading() {
  return (
    <main className="bg-stone-50 pb-16" aria-busy="true">
      <div className="bg-stone-800">
        <div className="mx-auto flex min-h-[22rem] max-w-5xl flex-col justify-end gap-3 px-6 pb-14 pt-24 sm:min-h-[30rem]">
          <div className="h-6 w-24 animate-pulse rounded-full bg-white/20" />
          <div className="h-10 w-2/3 animate-pulse rounded bg-white/20" />
          <div className="h-4 w-1/2 animate-pulse rounded bg-white/15" />
        </div>
      </div>
      <div className="mx-auto max-w-5xl px-6">
        <div className="-mt-8 grid gap-4 sm:grid-cols-2">
          <div className="h-32 animate-pulse rounded-xl bg-stone-200" />
          <div className="h-32 animate-pulse rounded-xl bg-stone-200" />
        </div>
        <div className="mt-10 space-y-3">
          <div className="h-5 w-48 animate-pulse rounded bg-stone-200" />
          <div className="h-4 w-full animate-pulse rounded bg-stone-200" />
          <div className="h-4 w-5/6 animate-pulse rounded bg-stone-200" />
        </div>
      </div>
      <span className="sr-only">Loading destination</span>
    </main>
  );
}
