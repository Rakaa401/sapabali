// Dipakai di server component, jadi aman memakai zona waktu tetap (WIB)
export function formatWib(iso: string) {
  return (
    new Date(iso).toLocaleString("en-GB", {
      timeZone: "Asia/Jakarta",
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }) + " WIB"
  );
}

export function formatLatency(ms: number | null) {
  if (ms === null || ms === undefined) return "-";
  return ms < 1000 ? `${ms} ms` : `${(ms / 1000).toFixed(2)} s`;
}

export function formatNumber(n: number) {
  return n.toLocaleString("en-US");
}

export function truncate(text: string | null, max = 140) {
  if (!text) return "";
  return text.length > max ? `${text.slice(0, max).trimEnd()}...` : text;
}
