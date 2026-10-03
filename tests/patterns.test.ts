import { test } from "node:test";
import assert from "node:assert/strict";
import { computePatterns } from "../src/lib/patterns.ts";
import type { Asset, Client, ThemeMention } from "../src/lib/types.ts";

const now = new Date("2026-10-01T12:00:00Z");
const daysAgo = (n: number) => new Date(now.getTime() - n * 86_400_000).toISOString().slice(0, 10);
const clients = Array.from({ length: 8 }, (_, i) => ({ id: `c${i}`, engagement_type: i < 4 ? "executive" : "founder" }) as Client);
let n = 0;
const m = (client: number, theme: string, category: string, ago: number): ThemeMention => ({
  id: `m${n++}`,
  created_at: "",
  client_id: `c${client}`,
  session_id: `s${n}`,
  theme,
  category,
  evidence: `${theme} evidence`,
  occurred_at: daysAgo(ago),
});

test("produces the three headline signals", () => {
  const mentions = [
    ...[0, 1, 2, 3, 4, 5, 6].map((c) => m(c, `alignment flavour ${c}`, "alignment", 20 + c)),
    ...[0, 1, 2, 3].map((c) => m(c, "identity defending an outdated role", "identity", 30)),
    ...Array.from({ length: 11 }, (_, i) => m(i % 8, "decision rights", "decision rights", 5 + i * 10)),
  ];
  const assets: Asset[] = [{ id: "a", created_at: "", title: "Ch.3", kind: "chapter", description: null, url: null, themes: ["identity defending an outdated role"] }];
  const { signals, gaps } = computePatterns(mentions, clients, assets, now);

  assert.ok(signals.includes("7 clients have hit some version of the same alignment problem in the last 90 days."), signals.join("\n"));
  assert.ok(signals.includes('"Identity defending an outdated role" has appeared in 4 executive engagements.'));
  assert.ok(signals.includes("You have discussed decision rights 11 times but do not currently have a STRYN asset for it."));
  assert.deepEqual(gaps.map((g) => g.theme), ["decision rights"]);
});

test("ignores mentions older than 90 days for the 90-day counts", () => {
  const { themes } = computePatterns([m(0, "x", "y", 200), m(1, "x", "y", 10)], clients, [], now);
  assert.equal(themes[0].mentions, 2);
  assert.equal(themes[0].clients90, 1);
});

test("asset coverage matches by containment", () => {
  const assets: Asset[] = [{ id: "a", created_at: "", title: "Map", kind: "tool", description: null, url: null, themes: ["Decision Rights"] }];
  const { themes } = computePatterns([m(0, "unclear decision rights", "decision rights", 3)], clients, assets, now);
  assert.equal(themes[0].covered.length, 1);
});
