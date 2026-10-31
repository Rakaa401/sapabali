
import LogoutButton from "@/components/admin/logout-button";

export default function AdminPage() {
  return (
    <main className="flex min-h-screen items-start justify-between bg-zinc-950 p-8 text-white">
      <div>
        <h1 className="text-2xl font-semibold">SapaBali Admin</h1>
        <p className="mt-2 text-zinc-400">
          Authentication and admin authorization are working.
        </p>
      </div>

      <LogoutButton />
    </main>
  );
}
