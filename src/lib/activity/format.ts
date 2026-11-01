const WIB = "Asia/Jakarta";

export function formatWibTime(iso: string) {
  return (
    new Date(iso).toLocaleTimeString("en-GB", {
      timeZone: WIB,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }) + " WIB"
  );
}

export function formatWibDay(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    timeZone: WIB,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
