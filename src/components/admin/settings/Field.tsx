export const inputClass =
  "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 disabled:bg-slate-100 disabled:text-slate-500";

export function Field({
  label,
  htmlFor,
  error,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1 block text-sm font-medium text-slate-800">{label}</label>
      {children}
      {hint && !error && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
      {error && <p className="mt-1 text-sm text-red-700">{error}</p>}
    </div>
  );
}

export function Notice({ type, children }: { type: "success" | "error"; children: React.ReactNode }) {
  const style = type === "success" ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-800";
  return (
    <p role={type === "success" ? "status" : "alert"} className={`rounded-md px-4 py-3 text-sm ${style}`}>
      {children}
    </p>
  );
}
