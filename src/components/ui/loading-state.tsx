
import { LoaderCircle } from "lucide-react";

export default function LoadingState({
  message = "Loading...",
}: {
  message?: string;
}) {
  return (
    <div className="flex min-h-48 flex-col items-center justify-center gap-3 text-zinc-500">
      <LoaderCircle size={24} className="animate-spin text-emerald-600" />
      <p className="text-sm">{message}</p>
    </div>
  );
}
