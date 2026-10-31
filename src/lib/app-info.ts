import pkg from "../../package.json";

// Hanya dipakai di server component. Nilai rahasia (API key) TIDAK pernah dikirim ke browser,
// yang ditampilkan cuma status "configured / not configured".
export function getAppInfo() {
  return {
    name: "SapaBali",
    version: pkg.version,
    aiProvider: process.env.AI_PROVIDER || "Google Gemini",
    aiModel: process.env.GEMINI_MODEL || null,
    aiKeyConfigured: Boolean(process.env.GEMINI_API_KEY),
  };
}
