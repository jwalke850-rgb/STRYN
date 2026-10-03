export const DAY = 86_400_000;

export function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function daysAgo(n: number, from = new Date()): Date {
  return new Date(from.getTime() - n * DAY);
}

export function fmtDate(d: string | null | undefined): string {
  if (!d) return "—";
  const date = new Date(d.length === 10 ? `${d}T12:00:00` : d);
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function fmtDateTime(d: string | null | undefined): string {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

export function isOverdue(due: string | null, now = new Date()): boolean {
  return Boolean(due) && new Date(`${due}T23:59:59`) < now;
}

export function money(n: number | null | undefined): string {
  if (n === null || n === undefined) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: process.env.NEXT_PUBLIC_CURRENCY ?? "USD", maximumFractionDigits: 0 }).format(n);
}
