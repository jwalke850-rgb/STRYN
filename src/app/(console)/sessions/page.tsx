import Link from "next/link";
import { createSession } from "@/app/actions";
import { db } from "@/lib/db";
import { fmtDate, today } from "@/lib/dates";
import { SPINE, SPINE_LABELS } from "@/lib/types";
import { Badge, Card, Empty, PageHeader } from "@/components/ui";
import { SubmitButton } from "@/components/forms";

export const dynamic = "force-dynamic";

export default async function Sessions() {
  const store = db();
  const [sessions, clients] = await Promise.all([
    store.list("sessions", { orderBy: { column: "held_at", ascending: false } }),
    store.list("clients", { orderBy: { column: "name" } }),
  ]);
  const byId = new Map(clients.map((c) => [c.id, c]));
  const live = clients.filter((c) => c.status === "active" || c.status === "prospect");

  async function start(form: FormData) {
    "use server";
    await createSession(String(form.get("client_id")), form);
  }

  return (
    <>
      <PageHeader eyebrow="STRYN Session Engine" title="Sessions" />

      <Card title="Start a session" className="mb-6">
        {live.length ? (
          <form action={start} className="flex flex-wrap items-end gap-3">
            <div className="min-w-56 flex-1">
              <label>Client</label>
              <select name="client_id">
                {live.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                    {c.company ? ` — ${c.company}` : ""}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label>Date</label>
              <input type="date" name="held_at" defaultValue={today()} />
            </div>
            <SubmitButton>Open Session Engine</SubmitButton>
          </form>
        ) : (
          <Empty>
            Add an active client or prospect first. <Link href="/clients/new" className="text-accent">New client →</Link>
          </Empty>
        )}
        <p className="mt-4 text-xs text-muted">
          Before: dump notes → prep sheet. After: paste notes → {SPINE.map((s) => SPINE_LABELS[s]).join(" → ")} → client record updated.
        </p>
      </Card>

      <Card title={`All sessions · ${sessions.length}`}>
        {sessions.length ? (
          <ul className="divide-y divide-line">
            {sessions.map((s) => (
              <li key={s.id}>
                <Link href={`/sessions/${s.id}`} className="flex items-baseline justify-between gap-4 py-2.5 hover:text-accent">
                  <span className="min-w-0">
                    <span className="text-sm font-medium">{byId.get(s.client_id)?.name}</span>
                    <span className="ml-2 text-sm text-muted">{s.title ?? "Untitled"}</span>
                  </span>
                  <span className="flex shrink-0 items-center gap-2 text-xs text-muted">
                    <Badge tone={s.status === "processed" ? "good" : s.status === "prepped" ? "accent" : "neutral"}>{s.status}</Badge>
                    {fmtDate(s.held_at)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <Empty>No sessions yet.</Empty>
        )}
      </Card>
    </>
  );
}
