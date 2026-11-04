import "server-only";
import { createServiceClient } from "@/lib/supabase/service";
import type { GenerationUsage } from "@/lib/visitor-chat/generate";

// Mencatat request Staff Assistant ke ai_logs (tampil di /admin/ai-logs).
// Tabel ai_logs tidak punya policy insert untuk client biasa, jadi memakai service client di server.
// Best-effort: gagal mencatat tidak boleh menggagalkan jawaban.
export async function logStaffRequest(values: {
  query: string;
  response?: string | null;
  model?: string | null;
  usage?: GenerationUsage;
  startedAt: number;
  status: "success" | "error";
  errorMessage?: string | null;
  metadata?: Record<string, unknown>;
}) {
  try {
    const supabase = createServiceClient();
    const { error } = await supabase.from("ai_logs").insert({
      user_id: null,
      query: values.query,
      response: values.response ?? null,
      model: values.model ?? null,
      provider: "google",
      prompt_tokens: values.usage?.prompt_tokens ?? 0,
      completion_tokens: values.usage?.completion_tokens ?? 0,
      total_tokens: values.usage?.total_tokens ?? 0,
      latency_ms: Date.now() - values.startedAt,
      status: values.status,
      error_message: values.errorMessage ?? null,
      metadata: { feature: "staff_assistant", ...(values.metadata ?? {}) },
    });
    if (error) console.error("[STAFF ASSISTANT LOG ERROR]", error);
  } catch (error) {
    console.error("[STAFF ASSISTANT LOG ERROR]", error);
  }
}
