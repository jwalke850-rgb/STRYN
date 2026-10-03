import { daysAgo } from "./dates.ts";
import type { Asset, Client, ThemeMention } from "./types";

export interface ThemeStat {
  theme: string;
  category: string;
  mentions: number;
  clients: number;
  mentions90: number;
  clients90: number;
  mentions30: number;
  rising: boolean; // last 30 days running hotter than the prior 60
  byEngagement: Record<string, number>; // distinct clients per engagement type
  lastSeen: string;
  covered: Asset[];
  evidence: string[];
}

export interface CategoryStat {
  category: string;
  clients90: number;
  mentions90: number;
  themes: string[];
}

export const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");

/** Does an asset cover a theme? Exact tag match, or one label contains the other. */
function covers(asset: Asset, theme: string): boolean {
  return asset.themes.some((t) => {
    const a = norm(t);
    return a === theme || (a.length > 4 && theme.includes(a)) || (theme.length > 4 && a.includes(theme));
  });
}

export function computePatterns(mentions: ThemeMention[], clients: Client[], assets: Asset[], now = new Date()) {
  const engagement = new Map(clients.map((c) => [c.id, c.engagement_type ? norm(c.engagement_type) : "unspecified"]));
  const d90 = daysAgo(90, now).toISOString().slice(0, 10);
  const d30 = daysAgo(30, now).toISOString().slice(0, 10);

  const groups = new Map<string, ThemeMention[]>();
  for (const m of mentions) {
    const key = norm(m.theme);
    groups.set(key, [...(groups.get(key) ?? []), m]);
  }

  const themes: ThemeStat[] = [...groups.entries()].map(([theme, ms]) => {
    const recent = ms.filter((m) => m.occurred_at >= d90);
    const last30 = ms.filter((m) => m.occurred_at >= d30);
    const clientIds = new Set(ms.map((m) => m.client_id));
    const byEngagement: Record<string, number> = {};
    for (const id of clientIds) {
      const e = engagement.get(id) ?? "unspecified";
      byEngagement[e] = (byEngagement[e] ?? 0) + 1;
    }
    const prior60 = recent.length - last30.length;
    const categories = ms.map((m) => norm(m.category));
    return {
      theme,
      category: mode(categories),
      mentions: ms.length,
      clients: clientIds.size,
      mentions90: recent.length,
      clients90: new Set(recent.map((m) => m.client_id)).size,
      mentions30: last30.length,
      rising: last30.length >= 2 && last30.length / 30 > prior60 / 60,
      byEngagement,
      lastSeen: ms.reduce((a, m) => (m.occurred_at > a ? m.occurred_at : a), ""),
      covered: assets.filter((a) => covers(a, theme)),
      evidence: ms.slice(-5).map((m) => m.evidence),
    };
  });
  themes.sort((a, b) => b.clients90 - a.clients90 || b.mentions - a.mentions);

  const catMap = new Map<string, { clients: Set<string>; mentions: number; themes: Set<string> }>();
  for (const m of mentions.filter((m) => m.occurred_at >= d90)) {
    const c = norm(m.category);
    const entry = catMap.get(c) ?? { clients: new Set(), mentions: 0, themes: new Set() };
    entry.clients.add(m.client_id);
    entry.mentions++;
    entry.themes.add(norm(m.theme));
    catMap.set(c, entry);
  }
  const categories: CategoryStat[] = [...catMap.entries()]
    .map(([category, e]) => ({ category, clients90: e.clients.size, mentions90: e.mentions, themes: [...e.themes] }))
    .sort((a, b) => b.clients90 - a.clients90 || b.mentions90 - a.mentions90);

  const gaps = themes.filter((t) => t.covered.length === 0 && t.mentions >= 3).sort((a, b) => b.mentions - a.mentions);

  return { themes, categories, gaps, signals: signals(themes, categories, gaps) };
}

/** The plain-English lines that make Pattern Intelligence useful at a glance. */
function signals(themes: ThemeStat[], categories: CategoryStat[], gaps: ThemeStat[]): string[] {
  const out: string[] = [];
  for (const c of categories.filter((c) => c.clients90 >= 3).slice(0, 3)) {
    out.push(`${c.clients90} clients have hit some version of the same ${c.category} problem in the last 90 days.`);
  }
  for (const t of themes) {
    for (const [eng, n] of Object.entries(t.byEngagement)) {
      if (n >= 3 && eng !== "unspecified") out.push(`"${cap(t.theme)}" has appeared in ${n} ${eng} engagements.`);
    }
  }
  for (const g of gaps.slice(0, 3)) {
    out.push(`You have discussed ${g.theme} ${g.mentions} times but do not currently have a STRYN asset for it.`);
  }
  for (const t of themes.filter((t) => t.rising).slice(0, 2)) {
    out.push(`"${cap(t.theme)}" is rising: ${t.mentions30} mentions in the last 30 days.`);
  }
  return out;
}

function mode(xs: string[]): string {
  const counts = new Map<string, number>();
  for (const x of xs) counts.set(x, (counts.get(x) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "";
}

export const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
