import Link from "next/link";
import { notFound } from "next/navigation";
import { applySuggestion, deleteSession, mineSessionAction, prepSession, processSession, updateSessionMeta } from "@/app/actions";
import { db } from "@/lib/db";
import { fmtDate } from "@/lib/dates";
import { SPINE, SPINE_LABELS } from "@/lib/types";
import { Badge, BulletList, Card, PageHeader, btn, btnGhost } from "@/components/ui";
import { ActionForm, SubmitButton } from "@/components/forms";
import { CommitmentList } from "@/components/commitments";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export default async function SessionPage(props: PageProps<"/sessions/[id]">) {
  const { id } = await props.params;
  const store = db();
  const session = await store.get("sessions", id);
  if (!session) notFound();
  const [client, commitments, journal, themes] = await Promise.all([
    store.get("clients", session.client_id),
    store.list("commitments", { where: { session_id: id } }),
    store.list("journal_entries", { where: { session_id: id } }),
    store.list("theme_mentions", { where: { session_id: id } }),
  ]);
  if (!client) notFound();
  const { prep, analysis } = session;
  const suggestions = analysis?.record_updates;

  return (
    <>
      <PageHeader
        eyebrow={`Session Engine · ${client.name}`}
        title={
          <>
            {session.title ?? "Untitled session"}
            <span className="ml-3 text-base font-normal text-muted">{fmtDate(session.held_at)}</span>
          </>
        }
      >
        <Badge tone={session.status === "processed" ? "good" : session.status === "prepped" ? "accent" : "neutral"}>{session.status}</Badge>
        <Link href={`/clients/${client.id}`} className={btn}>
          Client Console
        </Link>
      </PageHeader>

      <details className="mb-6 text-sm">
        <summary className={`cursor-pointer ${btnGhost}`}>Edit date / title · delete</summary>
        <div className="mt-3 flex flex-wrap items-end gap-3">
          <form action={updateSessionMeta.bind(null, id)} className="flex flex-wrap items-end gap-2">
            <input type="date" name="held_at" defaultValue={session.held_at} className="!w-auto" />
            <input name="title" defaultValue={session.title ?? ""} placeholder="Title" className="!w-72" />
            <SubmitButton className={btn}>Save</SubmitButton>
          </form>
          <form action={deleteSession.bind(null, id, client.id)}>
            <button className="text-xs text-bad hover:underline">Delete session</button>
          </form>
        </div>
      </details>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* BEFORE */}
        <Card title="1 · Before the session — dump notes">
          <ActionForm action={prepSession.bind(null, id)} className="space-y-3">
            <textarea
              name="pre_notes"
              rows={8}
              defaultValue={session.pre_notes ?? ""}
              placeholder="Whatever is in your head: emails since last time, what you've noticed, hunches, what they said in passing…"
            />
            <SubmitButton pending="Structuring prep sheet…">{prep ? "Regenerate prep sheet" : "Generate prep sheet"}</SubmitButton>
          </ActionForm>
        </Card>

        {/* AFTER */}
        <Card title="2 · After the session — notes or transcript">
          <ActionForm action={processSession.bind(null, id)} className="space-y-3">
            <textarea name="raw_notes" rows={8} defaultValue={session.raw_notes ?? ""} placeholder="Paste your notes or the transcript." />
            <div className="flex flex-wrap items-center gap-3">
              <SubmitButton pending="Processing through the spine…">{analysis ? "Reprocess" : "Process & update client record"}</SubmitButton>
              {analysis && <span className="text-xs text-muted">Reprocessing replaces this session&apos;s generated commitments, journal and themes.</span>}
            </div>
          </ActionForm>
        </Card>
      </div>

      {prep && (
        <Card title="Prep sheet" className="mt-6">
          <div className="mb-5 rounded-md border border-accent/40 bg-accent/5 p-4">
            <p className="text-[11px] uppercase tracking-[0.14em] text-accent">Opening question</p>
            <p className="mt-1 text-lg">{prep.opening_question}</p>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <PrepBlock label="What changed" items={prep.what_changed} />
            <PrepBlock label="Where drift exists" items={prep.drift} />
            <PrepBlock label="Deserves pressure-testing" items={prep.pressure_test} />
            <PrepBlock label="Likely questions" items={prep.likely_questions} />
            <PrepBlock label="Commitments to check" items={prep.commitments_to_check} />
            <div>
              <p className="mb-2 text-[11px] uppercase tracking-[0.14em] text-muted">Next move</p>
              <p className="text-sm">{prep.next_move}</p>
            </div>
          </div>
        </Card>
      )}

      {analysis && (
        <>
          <Card title="STRYN spine" className="mt-6">
            <p className="mb-5 text-sm text-muted">{analysis.summary}</p>
            <ol className="grid gap-3 md:grid-cols-5">
              {SPINE.map((step, i) => (
                <li key={step} className="rounded-md border border-line bg-panel-2 p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-accent">
                    {i + 1} · {SPINE_LABELS[step]}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed">{analysis.spine[step]}</p>
                </li>
              ))}
            </ol>
          </Card>

          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            <Card title="What changed">
              <BulletList items={analysis.what_changed} />
            </Card>
            <Card title="Drift">
              <BulletList items={analysis.drift} empty="No drift flagged." />
            </Card>
            <Card title="Breakthroughs">
              <BulletList items={analysis.breakthroughs} empty="None this time." />
            </Card>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <Card title="Record updates applied">
              <dl className="space-y-3 text-sm">
                {suggestions?.current_issue && <Update label="Current issue" value={suggestions.current_issue} />}
                {suggestions?.real_constraint && <Update label="Real constraint" value={suggestions.real_constraint} />}
                {suggestions?.drift && <Update label="Drift" value={suggestions.drift} />}
                {suggestions?.beliefs && <Update label="Beliefs" value={suggestions.beliefs.join(" · ")} />}
                {!suggestions?.current_issue && !suggestions?.real_constraint && !suggestions?.drift && !suggestions?.beliefs && (
                  <p className="text-muted">No changes to the core record.</p>
                )}
              </dl>
              {(suggestions?.strategic_beacon_suggestion || (suggestions?.operating_code_suggestions.length ?? 0) > 0) && (
                <div className="mt-5 border-t border-line pt-4">
                  <p className="mb-3 text-[11px] uppercase tracking-[0.14em] text-accent">Suggestions — your call</p>
                  {suggestions?.strategic_beacon_suggestion && (
                    <Suggestion
                      label="Strategic Beacon"
                      value={suggestions.strategic_beacon_suggestion}
                      applied={client.strategic_beacon === suggestions.strategic_beacon_suggestion}
                      action={applySuggestion.bind(null, client.id, id, "beacon", suggestions.strategic_beacon_suggestion)}
                    />
                  )}
                  {suggestions?.operating_code_suggestions.map((code) => (
                    <Suggestion
                      key={code}
                      label="Operating Code"
                      value={code}
                      applied={client.operating_code.includes(code)}
                      action={applySuggestion.bind(null, client.id, id, "code", code)}
                    />
                  ))}
                </div>
              )}
            </Card>

            <Card title="Commitments from this session">
              <CommitmentList items={commitments} empty="No commitments captured." />
            </Card>

            <Card title="War Journal entries">
              <BulletList items={journal.map((j) => `${j.kind.toUpperCase()}: ${j.body}`)} empty="None." />
            </Card>

            <Card title="Themes detected" action={<MineButton id={id} />}>
              <ul className="space-y-2 text-sm">
                {themes.map((t) => (
                  <li key={t.id}>
                    <Badge tone="accent">{t.theme}</Badge> <span className="text-xs text-muted">{t.category}</span>
                    <p className="mt-0.5 text-muted">{t.evidence}</p>
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-xs text-muted">Next session focus: {analysis.next_session_focus}</p>
            </Card>
          </div>
        </>
      )}
    </>
  );
}

function PrepBlock({ label, items }: { label: string; items: string[] }) {
  return (
    <div>
      <p className="mb-2 text-[11px] uppercase tracking-[0.14em] text-muted">{label}</p>
      <BulletList items={items} empty="Nothing flagged." />
    </div>
  );
}

function Update({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-[0.12em] text-muted">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function Suggestion({ label, value, applied, action }: { label: string; value: string; applied: boolean; action: () => Promise<void> }) {
  return (
    <form action={action} className="mb-3 flex items-start justify-between gap-3 text-sm">
      <div>
        <p className="text-[11px] uppercase tracking-[0.12em] text-muted">{label}</p>
        <p>{value}</p>
      </div>
      {applied ? <Badge tone="good">applied</Badge> : <SubmitButton className={btn}>Apply</SubmitButton>}
    </form>
  );
}

function MineButton({ id }: { id: string }) {
  return (
    <ActionForm action={mineSessionAction.bind(null, id)} className="text-right">
      <SubmitButton className={btnGhost} pending="Mining…">
        Mine again for content →
      </SubmitButton>
    </ActionForm>
  );
}
