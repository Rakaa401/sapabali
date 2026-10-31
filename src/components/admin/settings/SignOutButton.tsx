"use client";

import { useTransition } from "react";
import { signOut } from "@/lib/admin/actions/sign-out";

export default function SignOutButton() {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(async () => { await signOut(); })}
      className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-600 disabled:opacity-60"
    >
      {pending ? "Signing out..." : "Log out"}
    </button>
  );
}
