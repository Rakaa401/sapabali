
import { AlertCircle } from "lucide-react";
import type { ReactNode } from "react";

export default function ErrorState({
  title = "Something went wrong",
  description = "An unexpected error occurred. Please try again.",
  action,
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-red-200 bg-red-50/50 px-6 py-10 text-center">
      <div className="mb-4 rounded-full bg-red-100 p-3 text-red-600">
        <AlertCircle size={24} />
      </div>
      <h3 className="text-base font-semibold text-zinc-900">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-zinc-500">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
