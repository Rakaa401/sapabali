import "server-only";
import { createHash } from "node:crypto";
import { createServiceClient } from "@/lib/supabase/service";

export class RateLimitUnavailableError extends Error {
  constructor() {
    super("Rate limiting is unavailable.");
    this.name = "RateLimitUnavailableError";
  }
}

const GLOBAL_HOURLY_LIMIT = Number(process.env.VISITOR_CHAT_GLOBAL_HOURLY_LIMIT) || 500;

// Per pengunjung: 6 pertanyaan per menit dan 60 per jam.
// Global: batas total per jam untuk melindungi kuota Gemini.
const BUCKETS = [
  { scope: "ip", label: "m", limit: 6, windowSeconds: 60 },
  { scope: "ip", label: "h", limit: 60, windowSeconds: 3600 },
  { scope: "global", label: "h", limit: GLOBAL_HOURLY_LIMIT, windowSeconds: 3600 },
] as const;

// IP tidak disimpan mentah: hanya hash dengan salt.
function clientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = forwarded || request.headers.get("x-real-ip") || "unknown";
  const salt = process.env.CHAT_RATE_LIMIT_SALT || "sapabali-visitor-chat";

  return createHash("sha256").update(`${salt}:${ip}`).digest("hex").slice(0, 32);
}

export type RateLimitResult =
  | { allowed: true }
  | { allowed: false; retryAfterSeconds: number };

// Gagal tertutup: kalau pengecekan tidak bisa dilakukan, request ditolak (bukan dilewatkan),
// karena tiap request chat memakai kuota Gemini.
export async function checkRateLimit(request: Request): Promise<RateLimitResult> {
  let supabase;

  try {
    supabase = createServiceClient();
  } catch {
    throw new RateLimitUnavailableError();
  }

  const ipKey = clientKey(request);

  for (const bucket of BUCKETS) {
    const key = bucket.scope === "global" ? `global:${bucket.label}` : `${ipKey}:${bucket.label}`;

    const { data, error } = await supabase.rpc("check_visitor_chat_rate_limit", {
      p_key: key,
      p_limit: bucket.limit,
      p_window_seconds: bucket.windowSeconds,
    });

    const row = Array.isArray(data) ? data[0] : data;

    if (error || !row || typeof row.allowed !== "boolean") {
      console.error("[VISITOR CHAT RATE LIMIT ERROR]", error);
      throw new RateLimitUnavailableError();
    }

    // Berhenti di bucket pertama yang penuh, supaya request yang sudah ditolak
    // tidak ikut menghabiskan bucket berikutnya (terutama bucket global).
    if (!row.allowed) {
      return { allowed: false, retryAfterSeconds: Math.max(Number(row.retry_after_seconds) || 1, 1) };
    }
  }

  return { allowed: true };
}
