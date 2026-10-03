import Link from "next/link";
import { notFound } from "next/navigation";
import { addCommitment, addJournalEntry, createSession, deleteJournalEntry, updateClientRecord } from "@/app/actions";
import { db } from "@/lib/db";
import { fmtDate, fmtDateTime, money, today } from "@/lib/dates";
import { JOURNAL_KINDS } from "@/lib/types";
import { Badge, BulletList, Card, Empty, Field, PageHeader, btn } from "@/components/ui";
import { SubmitButton } from "@/components/forms";
import { CommitmentList } from "@/components/commitments";

export const dynamic = "force-dynamic";

const KIND_TONE = { win: "good", loss: "bad", lesson: "accent", decision: "neutral", drift: "bad" } as const;

export default async function ClientConsole(props: PageProps<"/clients/[id]">) {
  const { id } = await props.params;
  const store = db();
  const client = await store.get("clients", id);
  if (!client) notFound();
  const [sessions, commitments, journal, mentions] = await Promise.all([
    store.list("sessions", { where: { client_id: id }, orderBy: { column: "held_at", ascending: false } }),
    store.list("commitments", { where: { client_id: id }, orderBy: { column: "created_at", ascending: false } }),
    store.list("journal_entries", { where: { client_id: id }, orderBy: { column: "entry_date", ascending: false } }),
    store.list("theme_mentions", { where: { client_id: id } }),
  ]);
  const open = commitments.filter((c) => c.status === "open");
  const closed = commitments.filter((c) => c.status !== "open").slice(0, 10);
  const latest = sessions.find((s) => s.analysis);
  const themeCounts = new Map<string, number>();
  for (const m of mentions) themeCounts.set(m.theme, (themeCounts.get(m.theme) ?? 0) + 1);
  const topThemes = [...themeCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);

  return (
    <>
      <PageHeader
        eyebrow="Client Console"
        title={
          <>
            {client.name}
            <span className="ml-3 text-base font-normal text-muted">{[client.role, client.company].filter(Boolean).join(" · ")}</span>
          </>
        }
      >
        <Badge tone={client.status === "active" ? "good" : "neutral"}>{client.status}</Badge>
        {client.engagement_type && <Badge>{client.engagement_type}</Badge>}
        <Link href={`/clients/${id}/edit`} className={btn}>
          Edit profile
        </Link>
        <form action={createSession.bind(null, id)} className="flex items-center gap-2">
          <input type="date" name="held_at" defaultValue={today()} className="!w-auto !py-1" />
          <SubmitButton pending="Creating…">New session</SubmitButton>
        </form>
      </PageHeader>

      <div className="mb-6 rounded-lg border border-accent/40 bg-accent/5 p-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">Strategic Beacon</p>
        <p className="mt-2 text-lg leading-snug">{client.strategic_beacon ?? <span className="text-muted">Not defined yet. Every drift call depends on this.</span>}</p>
        <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted">
          <span>Next session: {fmtDateTime(client.next_session_at)}</span>
          {client.monthly_fee ? <span>Fee: {money(client.monthly_fee)}/mo</span> : null}
          {client.pipeline_stage && client.pipeline_stage !== "won" && <span>Pipeline: {client.pipeline_stage} · {money(client.pipeline_value)}</span>}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="grid gap-4 md:grid-cols-3">
            <Card title="Current issue">
              <p className="text-sm">{client.current_issue ?? <span className="text-muted">—</span>}</p>
            </Card>
            <Card title="Real constraint">
              <p className="text-sm">{client.real_constraint ?? <span className="text-muted">Not yet identified</span>}</p>
            </Card>
            <Card title="Drift">
              <p className="text-sm">{client.drift ?? <span className="text-muted">None recorded</span>}</p>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card title="Assumptions & beliefs in play">
              <BulletList items={client.beliefs} empty="None captured yet." />
            </Card>
            <Card title="Operating Code">
              <BulletList items={client.operating_code} empty="No principles codified yet." />
            </Card>
          </div>

          <details className="rounded-lg border border-line bg-panel">
            <summary className="cursor-pointer px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted hover:text-text">
              Edit operating record
            </summary>
            <form action={updateClientRecord.bind(null, id)} className="grid gap-4 border-t border-line p-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <Field label="Strategic Beacon">
                  <textarea name="strategic_beacon" rows={2} defaultValue={client.strategic_beacon ?? ""} />
                </Field>
              </div>
              <Field label="Current issue">
                <textarea name="current_issue" rows={3} defaultValue={client.current_issue ?? ""} />
              </Field>
              <Field label="Real constraint">
                <textarea name="real_constraint" rows={3} defaultValue={client.real_constraint ?? ""} />
              </Field>
              <Field label="Beliefs (one per line)">
                <textarea name="beliefs" rows={5} defaultValue={client.beliefs.join("\n")} />
              </Field>
              <Field label="Operating Code (one per line)">
                <textarea name="operating_code" rows={5} defaultValue={client.operating_code.join("\n")} />
              </Field>
              <Field label="Drift">
                <textarea name="drift" rows={2} defaultValue={client.drift ?? ""} />
              </Field>
              <Field label="Operator notes">
                <textarea name="notes" rows={2} defaultValue={client.notes ?? ""} />
              </Field>
              <div className="md:col-span-2">
                <SubmitButton>Save record</SubmitButton>
              </div>
            </form>
          </details>

          {latest?.analysis && (
            <Card title={`Agreed moves · ${fmtDate(latest.held_at)}`} action={<Link href={`/sessions/${latest.id}`} className="text-xs text-accent">Session →</Link>}>
              <p className="text-sm">{latest.analysis.spine.move}</p>
              <p className="mt-3 text-xs uppercase tracking-[0.12em] text-muted">Next focus</p>
              <p className="text-sm">{latest.analysis.next_session_focus}</p>
            </Card>
          )}

          <Card title={`Session history · ${sessions.length}`}>
            {sessions.length ? (
              <ul className="divide-y divide-line">
                {sessions.map((s) => (
                  <li key={s.id} className="py-2.5">
                    <Link href={`/sessions/${s.id}`} className="flex items-baseline justify-between gap-3 hover:text-accent">
                      <span className="text-sm font-medium">{s.title ?? "Untitled session"}</span>
                      <span className="flex shrink-0 items-center gap-2 text-xs text-muted">
                        <Badge tone={s.status === "processed" ? "good" : s.status === "prepped" ? "accent" : "neutral"}>{s.status}</Badge>
                        {fmtDate(s.held_at)}
                      </span>
                    </Link>
                    {s.analysis && <p className="mt-1 line-clamp-2 text-sm text-muted">{s.analysis.summary}</p>}
                  </li>
                ))}
              </ul>
            ) : (
              <Empty>No sessions yet. Create one to prep with the Session Engine.</Empty>
            )}
          </Card>

          <Card title="War Journal" id="journal">
            <form action={addJournalEntry.bind(null, id)} className="mb-4 grid gap-2 md:grid-cols-[8rem_9rem_1fr_auto]">
              <select name="kind" defaultValue="lesson">
                {JOURNAL_KINDS.map((k) => (
                  <option key={k}>{k}</option>
                ))}
              </select>
              <input type="date" name="entry_date" defaultValue={today()} />
              <input name="body" placeholder="What happened, and what it means" required />
              <SubmitButton pending="…">Add</SubmitButton>
            </form>
            {journal.length ? (
              <ul className="space-y-3">
                {journal.map((j) => (
                  <li key={j.id} className="group flex gap-3 text-sm">
                    <span className="w-20 shrink-0 text-xs text-muted tabular-nums">{fmtDate(j.entry_date)}</span>
                    <span className="w-16 shrink-0">
                      <Badge tone={KIND_TONE[j.kind]}>{j.kind}</Badge>
                    </span>
                    <span className="flex-1">{j.body}</span>
                    <form action={deleteJournalEntry.bind(null, j.id, id)} className="opacity-0 group-hover:opacity-100">
                      <button className="text-xs text-muted hover:text-bad">×</button>
                    </form>
                  </li>
                ))}
              </ul>
            ) : (
              <Empty>The War Journal fills itself as sessions are processed.</Empty>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card title={`Accountability · ${open.length} open`}>
            <form action={addCommitment.bind(null, id)} className="mb-4 space-y-2">
              <input name="text" placeholder="New commitment" required />
              <div className="flex gap-2">
                <select name="owner" defaultValue="client" className="!w-28">
                  <option value="client">client</option>
                  <option value="operator">you owe</option>
                </select>
                <input type="date" name="due_date" />
                <SubmitButton pending="…">Add</SubmitButton>
              </div>
            </form>
            <CommitmentList items={open} />
            {closed.length > 0 && (
              <>
                <p className="mb-1 mt-5 text-[11px] uppercase tracking-[0.12em] text-muted">Recently closed</p>
                <CommitmentList items={closed} />
              </>
            )}
          </Card>

          <Card title="Recurring themes">
            {topThemes.length ? (
              <div className="flex flex-wrap gap-1.5">
                {topThemes.map(([t, n]) => (
                  <Badge key={t}>
                    {t} · {n}
                  </Badge>
                ))}
              </div>
            ) : (
              <Empty>None yet.</Empty>
            )}
          </Card>

          {client.notes && (
            <Card title="Operator notes">
              <p className="whitespace-pre-wrap text-sm text-muted">{client.notes}</p>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
