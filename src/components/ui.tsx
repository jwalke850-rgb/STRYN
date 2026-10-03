import Link from "next/link";
import type { ReactNode } from "react";

export function PageHeader({ eyebrow, title, children }: { eyebrow?: string; title: ReactNode; children?: ReactNode }) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-line pb-5">
      <div>
        {eyebrow && <p className="mb-1 text-[11px] font-medium uppercase tracking-[0.18em] text-accent">{eyebrow}</p>}
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </header>
  );
}

export function Card({ title, action, children, className = "", id }: { title?: ReactNode; action?: ReactNode; children: ReactNode; className?: string; id?: string }) {
  return (
    <section id={id} className={`rounded-lg border border-line bg-panel ${className}`}>
      {title && (
        <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-2.5">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">{title}</h2>
          {action}
        </div>
      )}
      <div className="p-4">{children}</div>
    </section>
  );
}

export function Stat({ label, value, hint, href }: { label: string; value: ReactNode; hint?: ReactNode; href?: string }) {
  const body = (
    <div className="h-full rounded-lg border border-line bg-panel px-4 py-3 transition-colors hover:border-accent/50">
      <p className="text-[11px] uppercase tracking-[0.14em] text-muted">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-muted">{hint}</p>}
    </div>
  );
  return href ? <Link href={href}>{body}</Link> : body;
}

const TONES = {
  neutral: "border-line text-muted",
  accent: "border-accent/40 text-accent",
  good: "border-good/40 text-good",
  bad: "border-bad/40 text-bad",
} as const;

export function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: keyof typeof TONES }) {
  return <span className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[11px] font-medium ${TONES[tone]}`}>{children}</span>;
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="text-sm text-muted">{children}</p>;
}

export function BulletList({ items, empty = "—" }: { items: string[] | null | undefined; empty?: string }) {
  if (!items?.length) return <Empty>{empty}</Empty>;
  return (
    <ul className="space-y-1.5 text-sm">
      {items.map((x, i) => (
        <li key={i} className="flex gap-2">
          <span className="mt-[0.55em] h-1 w-1 shrink-0 rounded-full bg-accent" />
          <span>{x}</span>
        </li>
      ))}
    </ul>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <label>{label}</label>
      {children}
    </div>
  );
}

export const btn =
  "inline-flex items-center justify-center gap-1.5 rounded-md border border-line bg-panel-2 px-3 py-1.5 text-sm font-medium hover:border-accent/60 disabled:opacity-50";
export const btnPrimary =
  "inline-flex items-center justify-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-sm font-semibold text-accent-ink hover:brightness-110 disabled:opacity-50";
export const btnGhost = "text-xs text-muted hover:text-text";
