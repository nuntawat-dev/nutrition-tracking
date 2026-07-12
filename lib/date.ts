const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function isValidDate(s: unknown): s is string {
  return typeof s === "string" && DATE_RE.test(s);
}

/** Server-local YYYY-MM-DD, used only as a fallback when the client omits one. */
export function serverToday(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
