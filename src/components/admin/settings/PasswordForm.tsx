"use client";

import { useState, useTransition } from "react";
import { changePassword } from "@/lib/admin/actions/change-password";
import { validatePasswordChange, type PasswordErrors } from "@/lib/admin/validation";
import { Field, Notice, inputClass } from "./Field";

const empty = { currentPassword: "", newPassword: "", confirmPassword: "" };

export default function PasswordForm() {
  const [values, setValues] = useState(empty);
  const [errors, setErrors] = useState<PasswordErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const set = (key: keyof typeof empty) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setValues((prev) => ({ ...prev, [key]: e.target.value }));
    setSuccess(null);
  };

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setSuccess(null);

    const found = validatePasswordChange(values);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    startTransition(async () => {
      const result = await changePassword(values);
      if (result.ok) {
        setValues(empty);
        setErrors({});
        setSuccess(result.message);
      } else {
        setErrors((result.fieldErrors ?? {}) as PasswordErrors);
        setFormError(result.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <Field label="Current password" htmlFor="current_password" error={errors.currentPassword}>
        <input id="current_password" type="password" autoComplete="current-password" className={inputClass} value={values.currentPassword} onChange={set("currentPassword")} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="New password" htmlFor="new_password" error={errors.newPassword} hint="At least 8 characters.">
          <input id="new_password" type="password" autoComplete="new-password" className={inputClass} value={values.newPassword} onChange={set("newPassword")} />
        </Field>
        <Field label="Confirm new password" htmlFor="confirm_password" error={errors.confirmPassword}>
          <input id="confirm_password" type="password" autoComplete="new-password" className={inputClass} value={values.confirmPassword} onChange={set("confirmPassword")} />
        </Field>
      </div>
      {formError && !Object.keys(errors).length && <Notice type="error">{formError}</Notice>}
      {success && <Notice type="success">{success}</Notice>}
      <button type="submit" disabled={pending} className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2 disabled:opacity-60">
        {pending ? "Changing..." : "Change password"}
      </button>
    </form>
  );
}
