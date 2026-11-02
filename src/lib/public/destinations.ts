import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

// Hanya kolom yang aman ditampilkan ke publik
export interface PublicDestination {
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
}

// Ambil destinasi berdasarkan slug. Selalu difilter status = 'published',
// jadi draft/archived tidak pernah tampil di halaman publik (termasuk saat admin sedang login).
// cache() = dipakai bareng oleh generateMetadata dan page tanpa query dobel.
export const getPublicDestination = cache(async (slug: string): Promise<PublicDestination | null> => {
  if (!slug || slug.length > 200) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("destinations")
    .select("id, name, slug, description, category, address, regency, latitude, longitude, image_url")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  // error database = bukan "tidak ketemu", biar muncul halaman error (bukan 404 palsu)
  if (error) throw new Error("Could not load destination.");
  return (data as PublicDestination | null) ?? null;
});
