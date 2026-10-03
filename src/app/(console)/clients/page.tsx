import Link from "next/link";
import { db } from "@/lib/db";
import { fmtDate, fmtDateTime, money } from "@/lib/dates";
import { CLIENT_STATUSES } from "@/lib/types";
import { Badge, Card, Empty, PageHeader, btnPrimary } from "@/components/ui";

export const dynamic = "force-dynamic";

const TONE = { active: "good", prospect: "accent", paused: "neutral", alumni: "neutral" } as const;

export default async function Clients() {
  const store = db();
  const [clients, sessions, commitments] = await Promise.all([
    store.list("clients", { orderBy: { column: "name" } }),
    store.list("sessions", { orderBy: { column: "held_at", ascending: false } }),
    store.list("commitments", { where: { status: "open" } }),
  ]);
  const last = new Map<string, string>();
  for (const s of sessions) if (!last.has(s.client_id)) last.set(s.client_id, s.held_at);
  const open = new Map<string, number>();
  for (const c of commitments) open.set(c.client_id, (open.get(c.client_id) ?? 0) + 1);

  return (
    <>
      <PageHeader eyebrow="Client Console" title="Clients & prospects">
        <Link href="/clients/new" className={btnPrimary}>
          New client
        </Link>
      </PageHeader>
      {clients.length === 0 && (
        <Card>
          <Empty>No clients yet. Add your first client, or run <code>npm run seed</code> to load demo data.</Empty>
        </Card>
      )}
      <div className="space-y-6">
        {CLIENT_STATUSES.map((status) => {
          const group = clients.filter((c) => c.status === status);
          if (!group.length) return null;
          return (
            <Card key={status} title={`${status} · ${group.length}`}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-[11px] uppercase tracking-[0.12em] text-muted">
                    <tr>
                      <th className="pb-2 font-medium">Client</th>
                      <th className="pb-2 font-medium">Current issue</th>
                      <th className="pb-2 font-medium">Last session</th>
                      <th className="pb-2 font-medium">Next</th>
                      <th className="pb-2 text-right font-medium">Open</th>
                      <th className="pb-2 text-right font-medium">{status === "prospect" ? "Pipeline" : "Fee"}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {group.map((c) => (
                      <tr key={c.id} className="align-top">
                        <td className="py-2 pr-4">
                          <Link href={`/clients/${c.id}`} className="font-medium hover:text-accent">
                            {c.name}
                          </Link>
                          <p className="text-xs text-muted">
                            {[c.role, c.company].filter(Boolean).join(" · ")}
                            {c.engagement_type && <> · {c.engagement_type}</>}
                          </p>
                        </td>
                        <td className="max-w-sm py-2 pr-4 text-muted">{c.current_issue ?? "—"}</td>
                        <td className="whitespace-nowrap py-2 pr-4 text-muted">{fmtDate(last.get(c.id))}</td>
                        <td className="whitespace-nowrap py-2 pr-4 text-muted">{fmtDateTime(c.next_session_at)}</td>
                        <td className="py-2 text-right">{open.get(c.id) ? <Badge tone={TONE[c.status]}>{open.get(c.id)}</Badge> : "—"}</td>
                        <td className="whitespace-nowrap py-2 text-right tabular-nums text-muted">
                          {status === "prospect" ? (
                            <>
                              {c.pipeline_stage && <span className="mr-2 text-xs">{c.pipeline_stage}</span>}
                              {money(c.pipeline_value)}
                            </>
                          ) : (
                            money(c.monthly_fee)
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          );
        })}
      </div>
    </>
  );
}
