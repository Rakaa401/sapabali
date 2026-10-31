export function validateProfileName(name: string): string | null {
  const n = name.trim();
  if (n.length < 2) return "Name must be at least 2 characters.";
  if (n.length > 100) return "Name must be 100 characters or fewer.";
  return null;
}

export interface PasswordInput {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export type PasswordErrors = Partial<Record<keyof PasswordInput, string>>;

// Dipakai di browser dan di server action
export function validatePasswordChange(i: PasswordInput): PasswordErrors {
  const e: PasswordErrors = {};
  if (!i.currentPassword) e.currentPassword = "Enter your current password.";
  if (i.newPassword.length < 8) e.newPassword = "New password must be at least 8 characters.";
  else if (i.newPassword.length > 72) e.newPassword = "New password must be 72 characters or fewer.";
  else if (i.newPassword === i.currentPassword) e.newPassword = "New password must be different from the current one.";
  if (i.confirmPassword !== i.newPassword) e.confirmPassword = "Passwords do not match.";
  return e;
}
