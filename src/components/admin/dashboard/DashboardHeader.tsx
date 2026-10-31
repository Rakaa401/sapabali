import Link from "next/link";
import { Plus } from "lucide-react";

export default function DashboardHeader() {
  const today = new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  return (
    <header className="flex flex-col gap-4 border-b border-zinc-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-xs font-medium uppercase tracking-widest text-emerald-700">
          Sapabali Administration
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-950">
          Overview
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Monitor your knowledge base and manage your Bali travel information.
        </p>
      </div>

      <div className="flex items-center gap-4">
        <span className="hidden text-sm text-zinc-400 md:block">{today}</span>
         <Link href="/admin/knowledge/new" className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800">
          New knowladge
        </Link>
      </div>
    </header>
  );
}