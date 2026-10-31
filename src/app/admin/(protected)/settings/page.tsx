import { redirect } from "next/navigation";
import PasswordForm from "@/components/admin/settings/PasswordForm";
import ProfileForm from "@/components/admin/settings/ProfileForm";
import SignOutButton from "@/components/admin/settings/SignOutButton";
import { getAdminSession } from "@/lib/admin/session";
import { getAppInfo } from "@/lib/app-info";

function formatWib(iso?: string | null) {
  if (!iso) return "-";
  return (
    new Date(iso).toLocaleString("en-GB", {
      timeZone: "Asia/Jakarta",
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }) + " WIB"
  );
}

export default async function AdminSettingsPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  // Sudah login tapi bukan admin: tolak
  if (!session.profile) {
    return (
      <main className="mx-auto max-w-xl p-6">
        <h1 className="text-2xl font-semibold text-slate-900">No access</h1>
        <p className="mt-2 text-sm text-slate-600">
          This account is not an admin, so it cannot open settings. Log in with an admin account.
        </p>
        <div className="mt-4"><SignOutButton /></div>
      </main>
    );
  }

  const { user, profile } = session;
  const info = getAppInfo();

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Settings</h1>
        <p className="mt-1 text-sm text-slate-600">Manage your admin account and see how the app is set up.</p>
      </div>

      <Section title="Profile">
        <ProfileForm initialName={profile.full_name ?? ""} email={user.email ?? ""} role={profile.role} />
      </Section>

      <Section title="Change password">
        <PasswordForm />
      </Section>

      <Section title="Application">
        <dl className="grid gap-x-6 gap-y-4 text-sm sm:grid-cols-2">
          <Meta label="Application name" value={info.name} />
          <Meta label="Version" value={info.version} />
          <Meta label="AI provider" value={info.aiProvider} />
          <Meta label="AI model" value={info.aiModel ?? "Not configured yet"} />
          <Meta label="AI API key" value={info.aiKeyConfigured ? "Configured (hidden)" : "Not configured"} />
        </dl>
      </Section>

      <Section title="Session">
        <dl className="grid gap-x-6 gap-y-4 text-sm sm:grid-cols-2">
          <Meta label="Signed in as" value={user.email ?? "-"} />
          <Meta label="Last sign in" value={formatWib(user.last_sign_in_at)} />
          <Meta label="Account created" value={formatWib(profile.created_at)} />
        </dl>
        <div className="mt-5"><SignOutButton /></div>
      </Section>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5">
      <h2 className="mb-4 text-lg font-medium text-slate-900">{title}</h2>
      {children}
    </section>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-slate-500">{label}</dt>
      <dd className="mt-0.5 break-words font-medium text-slate-900">{value}</dd>
    </div>
  );
}
