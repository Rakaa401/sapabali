// Daftar tipe aktivitas. Harus sama dengan check constraint di migration 0005.
export const ACTIVITY_ACTIONS = {
  admin_login: { label: "Admin login", resource: "auth" },
  admin_logout: { label: "Admin logout", resource: "auth" },
  knowledge_created: { label: "Knowledge created", resource: "knowledge" },
  knowledge_updated: { label: "Knowledge updated", resource: "knowledge" },
  knowledge_deleted: { label: "Knowledge deleted", resource: "knowledge" },
  knowledge_published: { label: "Knowledge published", resource: "knowledge" },
  knowledge_unpublished: { label: "Knowledge unpublished", resource: "knowledge" },
  destination_created: { label: "Destination created", resource: "destination" },
  destination_updated: { label: "Destination updated", resource: "destination" },
  destination_deleted: { label: "Destination deleted", resource: "destination" },
  settings_profile_updated: { label: "Profile updated", resource: "settings" },
  settings_password_changed: { label: "Password changed", resource: "settings" },
} as const;

export type ActivityAction = keyof typeof ACTIVITY_ACTIONS;

// Aksi yang boleh dicatat dari server action (sisanya dicatat trigger database)
export type AppActivityAction =
  | "admin_login"
  | "admin_logout"
  | "settings_profile_updated"
  | "settings_password_changed";

export interface ActivityLog {
  id: string;
  admin_id: string | null;
  admin_name: string | null;
  admin_email: string | null;
  action: string;
  resource_type: string;
  resource_id: string | null;
  resource_label: string | null;
  description: string;
  metadata: Record<string, unknown>;
  created_at: string;
}
