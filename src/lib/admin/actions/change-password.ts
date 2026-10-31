"use server";

import { getAdminSession } from "../session";
import type { ActionState } from "../types";
import { validatePasswordChange, type PasswordInput } from "../validation";

export async function changePassword(input: PasswordInput): Promise<ActionState> {
  const fieldErrors = validatePasswordChange(input);
  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, error: "Fix the highlighted fields.", fieldErrors: fieldErrors as Record<string, string> };
  }

  const session = await getAdminSession();
  if (!session?.profile || !session.user.email) {
    return { ok: false, error: "You do not have permission to do this." };
  }

  // Pastikan yang ganti password benar-benar pemilik akun: cek password lama dulu
  const { error: verifyError } = await session.supabase.auth.signInWithPassword({
    email: session.user.email,
    password: input.currentPassword,
  });
  if (verifyError) {
    const message =
      verifyError.status === 429
        ? "Too many attempts. Wait a moment and try again."
        : "Current password is incorrect.";
    return { ok: false, error: message, fieldErrors: { currentPassword: message } };
  }

  const { error } = await session.supabase.auth.updateUser({ password: input.newPassword });
  if (error) return { ok: false, error: error.message };

  return { ok: true, message: "Password changed." };
}
