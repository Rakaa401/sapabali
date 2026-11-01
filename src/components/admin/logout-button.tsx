"use client";

import { useTransition } from "react";
import { signOut } from "@/lib/admin/actions/sign-out";

export default function LogoutButton() {
  const [loading, startTransition] = useTransition();

  function handleLogout() {
    startTransition(async () => {
      // Server action: mencatat aktivitas logout, keluar, lalu redirect ke /admin/login
      await signOut();
    });
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loading}
      className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-300 transition hover:bg-zinc-800 disabled:opacity-50"
    >
      {loading ? "Signing out..." : "Sign out"}
    </button>
  );
}
