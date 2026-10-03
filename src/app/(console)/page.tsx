import Link from "next/link";
import { db } from "@/lib/db";
import { computePatterns, cap } from "@/lib/patterns";
import { DAY, fmtDate, fmtDateTime, money } from "@/lib/dates";
import { Badge, Card, Empty, PageHeader, Stat, btnPrimary } from "@/components/ui";
import { CommitmentList } from "@/components/commitments";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const d = await load();
  return <DashboardView {...d} />;
}

async function load() {
  const store = db();
  const [clients, sessions, commitments, content, mentions, assets] = await Promise.all([
    store.list("clients"),
    store.list("sessions", { orderBy: { column: "held_at", ascending: false } }),
    store.list("commitments", { where: { status: "open" }, orderBy: { column: "due_date", ascending: true } }),
    store.list("content_items"),
    store.list("theme_mentions"),
    store.list("assets"),
  ]);
  const byId = new Map(clients.map((c) => [c.id, c]));
  const now = Date.now();

  const active = clients.filter((c) => c.status === "active");
  const mrr = active.reduce((n, c) => n + (c.monthly_fee ?? 0), 0);
  const openPipeline = clients.filter((c) => c.pipeline_stage && !["won", "lost"].includes(c.pipeline_stage));
  const pipelineValue = openPipeline.reduce((n, c) => n + (c.pipeline_value ?? 0), 0);

  const upcoming = clients
    .filter((c) => c.next_session_at && new Date(c.next_session_at).getTime() > now - DAY)
    .sort((a, b) => a.next_session_at!.localeCompare(b.next_session_at!))
    .slice(0, 8);

  const followUps = commitments.filter((c) => c.owner === "client" && c.due_date && new Date(c.due_date).getTime() < now + 7 * DAY);
  const deliverables = commitments.filter((c) => c.owner === "operator");

  const lastSession = new Map<string, string>();
  for (const s of sessions) if (!lastSession.has(s.client_id)) lastSession.set(s.client_id, s.held_at);
  const quiet = active.filter((c) => {
    const last = lastSession.get(c.id);
    return !last || now - new Date(last).getTime() > 30 * DAY;
  });

  const backlog = content.filter((c) => ["idea", "drafting", "ready"].includes(c.status));
  const unprocessed = sessions.filter((s) => s.status !== "processed" && new Date(s.held_at).getTime() < now);
  const { signals, themes } = computePatterns(mentions, clients, assets);
  return { byId, active, mrr, openPipeline, pipelineValue, upcoming, followUps, deliverables, quiet, backlog, unprocessed, signals, themes };
}

function DashboardView({
  byId,
  active,
  mrr,
  openPipeline,
  pipelineValue,
  upcoming,
  followUps,
  deliverables,
  quiet,
  backlog,
  unprocessed,
  signals,
  themes,
}: Awaited<ReturnType<typeof load>>) {
  return (
    <>
      <PageHeader eyebrow="Operator Dashboard" title="Where the practice stands">
        <Link href="/clients/new" className={btnPrimary}>
          New client
        </Link>
      </PageHeader>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        <Stat label="Active clients" value={active.length} href="/clients" />
        <Stat label="Monthly revenue" value={money(mrr)} hint="active retainers" />
        <Stat label="Open pipeline" value={money(pipelineValue)} hint={`${openPipeline.length} prospects`} href="/clients" />
        <Stat label="Follow-ups due" value={followUps.length} hint="next 7 days + overdue" />
        <Stat label="You owe" value={deliverables.length} hint="unfinished deliverables" />
        <Stat label="Content backlog" value={backlog.length} href="/content" />
      </div>

      {signals.length > 0 && (
        <Card title="Pattern Intelligence" className="mt-6" action={<Link href="/patterns" className="text-xs text-accent">Open →</Link>}>
          <ul className="space-y-2">
            {signals.slice(0, 5).map((s) => (
              <li key={s} className="border-l-2 border-accent pl-3 text-sm">
                {s}
              </li>
            ))}
          </ul>
        </Card>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card title="Next sessions">
          {upcoming.length ? (
            <ul className="divide-y divide-line">
              {upcoming.map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                  <Link href={`/clients/${c.id}`} className="font-medium hover:text-accent">
                    {c.name}
                    {c.company && <span className="ml-2 font-normal text-muted">{c.company}</span>}
                  </Link>
                  <span className="text-muted tabular-nums">{fmtDateTime(c.next_session_at)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <Empty>No sessions scheduled. Set “next session” on a client profile.</Empty>
          )}
        </Card>

        <Card title="Follow-ups due">
          <CommitmentList items={followUps} clients={byId} empty="No client commitments due this week." />
        </Card>

        <Card title="Unfinished deliverables (you owe)">
          <CommitmentList items={deliverables} clients={byId} empty="Nothing owed. Clean." />
        </Card>

        <Card title="Needs attention">
          <div className="space-y-4">
            <div>
              <p className="mb-2 text-xs text-muted">Sessions held but not processed</p>
              {unprocessed.length ? (
                <ul className="space-y-1 text-sm">
                  {unprocessed.slice(0, 6).map((s) => (
                    <li key={s.id}>
                      <Link href={`/sessions/${s.id}`} className="hover:text-accent">
                        {byId.get(s.client_id)?.name} · {fmtDate(s.held_at)}
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <Empty>All caught up.</Empty>
              )}
            </div>
            <div>
              <p className="mb-2 text-xs text-muted">Active clients with no session in 30+ days</p>
              {quiet.length ? (
                <div className="flex flex-wrap gap-2">
                  {quiet.map((c) => (
                    <Link key={c.id} href={`/clients/${c.id}`}>
                      <Badge tone="bad">{c.name}</Badge>
                    </Link>
                  ))}
                </div>
              ) : (
                <Empty>Every active client has been seen recently.</Empty>
              )}
            </div>
          </div>
        </Card>

        <Card title="Pipeline">
          {openPipeline.length ? (
            <ul className="divide-y divide-line">
              {openPipeline.map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                  <Link href={`/clients/${c.id}`} className="hover:text-accent">
                    {c.name}
                  </Link>
                  <span className="flex items-center gap-2">
                    <Badge>{c.pipeline_stage}</Badge>
                    <span className="tabular-nums text-muted">{money(c.pipeline_value)}</span>
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <Empty>No open pipeline.</Empty>
          )}
        </Card>

        <Card title="Recurring themes (90 days)" action={<Link href="/patterns" className="text-xs text-accent">All →</Link>}>
          {themes.length ? (
            <ul className="space-y-1.5 text-sm">
              {themes.slice(0, 8).map((t) => (
                <li key={t.theme} className="flex items-center justify-between gap-3">
                  <span>
                    {cap(t.theme)}
                    {t.covered.length === 0 && t.mentions >= 3 && <span className="ml-2 text-xs text-bad">no asset</span>}
                  </span>
                  <span className="text-xs tabular-nums text-muted">
                    {t.clients90} clients · {t.mentions90} mentions
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <Empty>Themes appear here once sessions are processed.</Empty>
          )}
        </Card>
      </div>
    </>
  );
}
