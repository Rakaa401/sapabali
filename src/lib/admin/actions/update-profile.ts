"use server";

import { revalidatePath } from "next/cache";
import { logActivity } from "@/lib/activity/log";
import { getAdminSession } from "../session";
import type { ActionState } from "../types";
import { validateProfileName } from "../validation";

export async function updateProfile(fullName: string): Promise<ActionState> {
  const nameError = validateProfileName(fullName);
  if (nameError) return { ok: false, error: nameError, fieldErrors: { fullName: nameError } };

  const session = await getAdminSession();
  if (!session?.profile) return { ok: false, error: "You do not have permission to do this." };

  const newName = fullName.trim();
  const { data, error } = await session.supabase
    .from("admin_users")
    .update({ full_name: newName })
    .eq("id", session.user.id)
    .select("id");

  if (error) return { ok: false, error: error.message };
  if (!data || data.length === 0) {
    return { ok: false, error: "Could not update the profile. Check the admin update policy." };
  }

  await logActivity(session.supabase, {
    action: "settings_profile_updated",
    description: `Updated profile name to "${newName}"`,
    resourceLabel: newName,
    metadata: { from: session.profile.full_name, to: newName },
  });

  revalidatePath("/admin/settings");
  return { ok: true, message: "Profile updated." };
}
