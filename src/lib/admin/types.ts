export type ActionState =
  | { ok: true; message: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };
