import Link from "next/link";
import { generateBriefAction } from "@/app/actions";
import { db } from "@/lib/db";
import { computePatterns, cap } from "@/lib/patterns";
import { fmtDate, fmtDateTime } from "@/lib/dates";
import { Badge, Card, Empty, PageHeader, btnPrimary } from "@/components/ui";
import { ActionForm, SubmitButton } from "@/components/forms";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export default async function Patterns() {
  const store = db();
  const [mentions, clients, assets, briefs] = await Promise.all([
    store.list("theme_mentions"),
    store.list("clients"),
    store.list("assets"),
    store.list("pattern_briefs", { orderBy: { column: "created_at", ascending: false }, limit: 1 }),
  ]);
  const { themes, categories, gaps, signals } = computePatterns(mentions, clients, assets);
  const brief = briefs[0];

  return (
    <>
      <PageHeader eyebrow="Pattern Intelligence" title="Your practice, turning into IP">
        <ActionForm action={generateBriefAction}>
          <SubmitButton className={btnPrimary} pending="Reading across every client…">
            {brief ? "Regenerate brief" : "Generate brief"}
          </SubmitButton>
        </ActionForm>
      </PageHeader>

      {mentions.length === 0 ? (
        <Card>
          <Empty>Pattern Intelligence builds from themes extracted when sessions are processed. Process a few sessions to begin.</Empty>
        </Card>
      ) : (
        <>
          <Card title="Signals" className="mb-6">
            {signals.length ? (
              <ul className="space-y-2">
                {signals.map((s) => (
                  <li key={s} className="border-l-2 border-accent pl-3">
                    {s}
                  </li>
                ))}
              </ul>
            ) : (
              <Empty>No strong cross-client signals yet. They appear once themes repeat across 3+ clients.</Empty>
            )}
          </Card>

          {brief && (
            <Card title={`Brief · ${fmtDateTime(brief.created_at)}`} className="mb-6">
              <p className="mb-5 text-lg">{brief.headline}</p>
              <div className="space-y-4">
                {brief.insights.map((i, n) => (
                  <div key={n} className="rounded-md border border-line bg-panel-2 p-3">
                    <p className="font-medium">{i.observation}</p>
                    <p className="mt-1 text-sm text-muted">{i.evidence}</p>
                    <p className="mt-2 text-sm text-accent">→ {i.implication}</p>
                  </div>
                ))}
              </div>
              {brief.asset_gaps.length > 0 && (
                <>
                  <p className="mb-2 mt-6 text-[11px] uppercase tracking-[0.14em] text-muted">Assets to build</p>
                  <ul className="space-y-3">
                    {brief.asset_gaps.map((g, n) => (
                      <li key={n} className="text-sm">
                        <Badge tone="bad">{g.theme}</Badge> <span className="text-muted">{g.why}</span>
                        <p className="mt-1">{g.suggested_asset}</p>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </Card>
          )}

          <div className="grid gap-6 lg:grid-cols-3">
            <Card title="Problem families · 90 days">
              <ul className="space-y-3 text-sm">
                {categories.map((c) => (
                  <li key={c.category}>
                    <div className="flex justify-between">
                      <span className="font-medium">{cap(c.category)}</span>
                      <span className="text-xs tabular-nums text-muted">{c.clients90} clients</span>
                    </div>
                    <p className="text-xs text-muted">{c.themes.join(", ")}</p>
                  </li>
                ))}
              </ul>
            </Card>

            <Card title="Asset gaps" className="lg:col-span-2" action={<Link href="/assets" className="text-xs text-accent">Register assets →</Link>}>
              {gaps.length ? (
                <ul className="divide-y divide-line">
                  {gaps.map((g) => (
                    <li key={g.theme} className="flex items-center justify-between gap-3 py-2 text-sm">
                      <span>
                        You have discussed <strong>{g.theme}</strong> {g.mentions} times across {g.clients} clients
                      </span>
                      <Badge tone="bad">no asset</Badge>
                    </li>
                  ))}
                </ul>
              ) : (
                <Empty>Every theme discussed 3+ times is covered by a registered STRYN asset.</Empty>
              )}
            </Card>
          </div>

          <Card title="All themes" className="mt-6">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-[11px] uppercase tracking-[0.12em] text-muted">
                  <tr>
                    <th className="pb-2 font-medium">Theme</th>
                    <th className="pb-2 font-medium">Family</th>
                    <th className="pb-2 text-right font-medium">Clients 90d</th>
                    <th className="pb-2 text-right font-medium">All mentions</th>
                    <th className="pb-2 font-medium pl-4">By engagement</th>
                    <th className="pb-2 font-medium">Asset</th>
                    <th className="pb-2 font-medium">Last seen</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {themes.map((t) => (
                    <tr key={t.theme} className="align-top">
                      <td className="py-2 pr-3">
                        <details>
                          <summary className="cursor-pointer font-medium">
                            {cap(t.theme)} {t.rising && <Badge tone="accent">rising</Badge>}
                          </summary>
                          <ul className="mt-2 space-y-1 text-xs text-muted">
                            {t.evidence.map((e, i) => (
                              <li key={i}>“{e}”</li>
                            ))}
                          </ul>
                        </details>
                      </td>
                      <td className="py-2 pr-3 text-muted">{t.category}</td>
                      <td className="py-2 text-right tabular-nums">{t.clients90}</td>
                      <td className="py-2 text-right tabular-nums">{t.mentions}</td>
                      <td className="py-2 pl-4 text-xs text-muted">
                        {Object.entries(t.byEngagement)
                          .map(([e, n]) => `${e} ${n}`)
                          .join(" · ")}
                      </td>
                      <td className="py-2 pr-3 text-xs">{t.covered.length ? t.covered.map((a) => a.title).join(", ") : <span className="text-bad">—</span>}</td>
                      <td className="whitespace-nowrap py-2 text-xs text-muted">{fmtDate(t.lastSeen)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </>
  );
}
