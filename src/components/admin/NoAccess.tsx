import Link from "next/link";

export default function NoAccess({ what }: { what: string }) {
  return (
    <main className="mx-auto max-w-xl p-6">
      <h1 className="text-2xl font-semibold text-slate-900">No access</h1>
      <p className="mt-2 text-sm text-slate-600">
        This account is not an admin, so it cannot open {what}. Log in with an admin account.
      </p>
      <Link href="/admin/login" className="mt-4 inline-block text-sm text-emerald-700 hover:underline">
        Go to login
      </Link>
    </main>
  );
}
