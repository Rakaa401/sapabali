import { createClient } from "@/lib/supabase/server";

export type Destination = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category: string | null;
  address: string | null;
  regency: string | null;
  latitude: number | null;
  longitude: number | null;
  image_url: string | null;
  status: "draft" | "published" | "archived";
  created_at: string;
  updated_at: string;
};

export async function getDestinations() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("destinations")
    .select(
      "id, name, slug, description, category, address, regency, latitude, longitude, image_url, status, created_at, updated_at"
    )
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error("Failed to load destinations");
  }

  return (data ?? []) as Destination[];
}

export async function getDestinationById(id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("destinations")
    .select(
      "id, name, slug, description, category, address, regency, latitude, longitude, image_url, status, created_at, updated_at"
    )
    .eq("id", id)
    .single();

  if (error) {
    return null;
  }

  return data as Destination;
}