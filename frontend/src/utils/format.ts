export function formatRuntime(minutes: number | null): string {
  if (!minutes) return "";
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
}

export function formatRating(value: number | string | null, suffix = ""): string {
  if (value === null || value === undefined || value === "") return "Not available";
  return `${value}${suffix}`;
}

export function formatScore(value: number | string | null | undefined, digits = 1, fallback = "—"): string {
  if (value === null || value === undefined || value === "") return fallback;
  const n = typeof value === "number" ? value : parseFloat(String(value));
  return Number.isNaN(n) ? fallback : n.toFixed(digits);
}

export function formatYear(dateStr: string | null): string {
  if (!dateStr) return "";
  return dateStr.slice(0, 4);
}

export const FALLBACK_POSTER =
  "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='342' height='513'%3E%3Crect width='100%25' height='100%25' fill='%23171A21'/%3E%3Ctext x='50%25' y='50%25' fill='%239AA0AC' font-family='sans-serif' font-size='16' text-anchor='middle' dy='.3em'%3ENo poster%3C/text%3E%3C/svg%3E";

export const FALLBACK_BACKDROP =
  "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1280' height='720'%3E%3Crect width='100%25' height='100%25' fill='%23111318'/%3E%3C/svg%3E";
