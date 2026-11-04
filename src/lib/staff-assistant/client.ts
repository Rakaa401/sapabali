import type { StaffAnswer, StaffLength, StaffRequest, StaffSource } from "./types";

export class StaffAssistantError extends Error {
  retryAfterSeconds?: number;
  constructor(message: string, retryAfterSeconds?: number) {
    super(message);
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

// Selama API belum dipakai, UI memakai jawaban contoh.
// Isi NEXT_PUBLIC_STAFF_MOCK=false di .env lalu restart npm run dev untuk memakai API sungguhan.
const USE_MOCK = process.env.NEXT_PUBLIC_STAFF_MOCK !== "false";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const MOCK_TEXT: Record<StaffLength, string[]> = {
  normal: [
    "(Sample output. The AI backend is not connected yet, so this is not real destination information.)\n\n" +
      "Good afternoon, and thank you for visiting. May I kindly ask for your cooperation? " +
      "In this area, visitors are asked to dress respectfully. We can lend you a sarong at the entrance. " +
      "Thank you very much for understanding.",
    "(Sample output, not real destination information.)\n\n" +
      "Hello, welcome. To help everyone enjoy this place respectfully, we kindly ask visitors to cover their shoulders and knees. " +
      "A sarong is available at the entrance if you need one. Thank you for your understanding.",
  ],
  short: [
    "(Sample, short.) Excuse me, could you please wear a sarong here? We can lend you one at the entrance. Thank you!",
    "(Sample, short.) Hello! Visitors are kindly asked to cover shoulders and knees here. A sarong is available at the entrance.",
  ],
};

async function mockAsk(req: StaffRequest): Promise<StaffAnswer> {
  await sleep(1500);

  // tulis "test error" untuk mencoba tampilan error
  if (req.situation.trim().toLowerCase() === "test error") {
    throw new StaffAssistantError("Simulasi error: layanan AI tidak bisa dihubungi.");
  }

  const length: StaffLength = req.length === "short" ? "short" : "normal";
  const options = MOCK_TEXT[length];
  const text = req.regenerate ? options[Math.floor(Math.random() * options.length)] : options[0];

  return {
    explanation: text,
    fallback: false,
    length,
    sources: [
      { id: "mock-1", title: "Dress Code (sample)", sourceName: "Sample source", sourceUrl: "https://example.com/dress-code", detailPath: null },
    ],
  };
}

function normalizeSources(value: unknown): StaffSource[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const r = item as Record<string, unknown>;
    if (typeof r.id !== "string" || typeof r.title !== "string") return [];
    const path = typeof r.detailPath === "string" ? r.detailPath : null;
    return [
      {
        id: r.id,
        title: r.title,
        sourceName: typeof r.sourceName === "string" ? r.sourceName : null,
        sourceUrl: typeof r.sourceUrl === "string" ? r.sourceUrl : null,
        // hanya link internal yang diawali satu "/"
        detailPath: path && path.startsWith("/") && !path.startsWith("//") ? path : null,
      },
    ];
  });
}

async function realAsk(req: StaffRequest): Promise<StaffAnswer> {
  let res: Response;
  try {
    res = await fetch("/api/staff/assistant", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...req, language: "en" }),
    });
  } catch {
    throw new StaffAssistantError("Tidak bisa terhubung ke server. Periksa koneksi lalu coba lagi.");
  }

  const data = await res.json().catch(() => null);
  const text =
    typeof data?.explanation === "string" ? data.explanation : typeof data?.answer === "string" ? data.answer : null;

  if (res.ok && data?.ok === true && text) {
    return {
      explanation: text,
      sources: normalizeSources(data.sources),
      fallback: data.fallback === true,
      length: data.length === "short" ? "short" : "normal",
    };
  }

  // Error dari server: { ok: false, error: { code, message }, retryAfterSeconds? }
  const message =
    typeof data?.error?.message === "string" ? data.error.message : "Penjelasan belum berhasil dibuat. Coba lagi.";
  const retry = typeof data?.retryAfterSeconds === "number" ? data.retryAfterSeconds : undefined;
  throw new StaffAssistantError(message, retry);
}

export const askStaffAssistant = USE_MOCK ? mockAsk : realAsk;
