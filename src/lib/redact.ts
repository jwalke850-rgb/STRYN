import type { Client } from "./types";

interface Term {
  pattern: RegExp;
  raw: string;
  replacement: string;
}

const STOP = new Set(["the", "and", "group", "inc", "ltd", "llc", "co", "company", "partners", "holdings"]);

function escape(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Single name parts match case-sensitively so a client called "Will" doesn't redact "will".
function term(raw: string, replacement: string, caseSensitive = false): Term | null {
  const t = raw.trim();
  if (t.length < 3 || STOP.has(t.toLowerCase())) return null;
  return { raw: t, replacement, pattern: new RegExp(`\\b${escape(t)}(?:'s)?\\b`, caseSensitive ? "g" : "gi") };
}

/** Identifying terms for every client: full names, name parts, companies and aliases. */
export function identifyingTerms(clients: Client[]): Term[] {
  const terms: Term[] = [];
  for (const c of clients) {
    const push = (t: Term | null) => t && terms.push(t);
    push(term(c.name, "[CLIENT]"));
    for (const part of c.name.split(/\s+/)) push(term(part, "[CLIENT]", true));
    if (c.company) {
      push(term(c.company, "[COMPANY]"));
      // The first word of a company name is usually the distinctive one ("Northline" Freight).
      const first = c.company.split(/\s+/)[0];
      if (first.length >= 4) push(term(first, "[COMPANY]", true));
    }
    for (const a of c.aliases ?? []) push(term(a, "[REDACTED]"));
  }
  // Longest first so "Acme Logistics" is replaced before "Acme".
  return terms.sort((a, b) => b.raw.length - a.raw.length);
}

const PATTERNS: [RegExp, string][] = [
  [/[\w.+-]+@[\w-]+\.[\w.-]+/g, "[EMAIL]"],
  [/\+?\d[\d\s().-]{7,}\d/g, "[PHONE]"],
  [/https?:\/\/\S+/g, "[URL]"],
  [/[$£€]\s?\d[\d,.]*\s?(?:k|m|mm|bn|million|billion)?\b/gi, "[AMOUNT]"],
];

/**
 * Deterministic first pass before anything goes to the Content Mine: known
 * client names, companies, aliases, emails, phones, URLs and money amounts.
 * Claude does a second, contextual anonymisation pass on top of this.
 */
export function redact(text: string, terms: Term[]): string {
  let out = text;
  for (const t of terms) out = out.replace(t.pattern, t.replacement);
  for (const [p, r] of PATTERNS) out = out.replace(p, r);
  return out;
}

/** Identifying terms that survived into generated text, for the review flag. */
export function leaks(text: string, terms: Term[]): string[] {
  const found = new Set<string>();
  for (const t of terms) {
    t.pattern.lastIndex = 0;
    if (t.pattern.test(text)) found.add(t.raw);
  }
  return [...found];
}
