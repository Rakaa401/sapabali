"use client";

import { useState, useTransition } from "react";
import { updateProfile } from "@/lib/admin/actions/update-profile";
import { validateProfileName } from "@/lib/admin/validation";
import { Field, Notice, inputClass } from "./Field";

export default function ProfileForm({
  initialName,
  email,
  role,
}: {
  initialName: string;
  email: string;
  role: string;
}) {
  const [name, setName] = useState(initialName);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSuccess(null);
    const invalid = validateProfileName(name);
    setError(invalid);
    if (invalid) return;

    startTransition(async () => {
      const result = await updateProfile(name);
      if (result.ok) setSuccess(result.message);
      else setError(result.error);
    });
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <Field label="Full name" htmlFor="full_name" error={error ?? undefined}>
        <input id="full_name" className={inputClass} value={name} onChange={(e) => { setName(e.target.value); setSuccess(null); }} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Email" htmlFor="email" hint="Email is managed by Supabase Auth.">
          <input id="email" className={inputClass} value={email} disabled readOnly />
        </Field>
        <Field label="Role" htmlFor="role">
          <input id="role" className={inputClass} value={role} disabled readOnly />
        </Field>
      </div>
      {success && <Notice type="success">{success}</Notice>}
      <button type="submit" disabled={pending} className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2 disabled:opacity-60">
        {pending ? "Saving..." : "Save name"}
      </button>
    </form>
  );
}
