// Mengikuti tabel public.ai_logs
export type AiLogStatus = "success" | "error";

export interface AiLog {
  id: string;
  user_id: string | null;
  query: string;
  response: string | null;
  model: string | null;
  provider: string | null;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  latency_ms: number | null;
  status: AiLogStatus;
  error_message: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}
