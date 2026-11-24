const vndFormatter = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
});

export function formatVND(amount: number): string {
  return vndFormatter.format(amount);
}

/** Short form for axis ticks: 1500000 -> "1,5tr", 250000 -> "250k". */
export function formatCompactVND(amount: number): string {
  const abs = Math.abs(amount);
  const fmt = (n: number, unit: string) =>
    `${Number(n.toFixed(1)).toLocaleString("vi-VN")}${unit}`;
  if (abs >= 1e9) return fmt(amount / 1e9, " tỷ");
  if (abs >= 1e6) return fmt(amount / 1e6, "tr");
  if (abs >= 1e3) return fmt(amount / 1e3, "k");
  return String(amount);
}

/** "2026-11-24" -> "24/11/2026". Parsed manually to avoid timezone shifts. */
export function formatDate(isoDate: string): string {
  const [y, m, d] = isoDate.split("-");
  return `${d}/${m}/${y}`;
}

/** "2026-11" -> "Tháng 11/2026" */
export function formatMonth(monthKey: string): string {
  const [y, m] = monthKey.split("-");
  return `Tháng ${Number(m)}/${y}`;
}

/** Local "today" as YYYY-MM-DD. Call only in event handlers / client state init. */
export function todayISO(): string {
  const now = new Date();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${m}-${d}`;
}
