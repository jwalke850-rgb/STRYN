import { setContentStatus } from "@/app/actions";
import { db } from "@/lib/db";
import { fmtDate } from "@/lib/dates";
import { CONTENT_FORMATS, CONTENT_FORMAT_LABELS, CONTENT_STATUSES, type ContentStatus } from "@/lib/types";
import { Badge, Card, Empty, PageHeader } from "@/components/ui";

export const dynamic = "force-dynamic";

const NEXT: Partial<Record<ContentStatus, ContentStatus>> = { idea: "drafting", drafting: "ready", ready: "published" };

export default async function ContentMine(props: PageProps<"/content">) {
  const { status = "backlog", format } = await props.searchParams;
  const all = await db().list("content_items", { orderBy: { column: "created_at", ascending: false } });
  const items = all.filter(
    (i) =>
      (status === "backlog" ? ["idea", "drafting", "ready"].includes(i.status) : status === "all" || i.status === status) &&
      (!format || i.format === format),
  );
  const href = (s: string, f?: string) => `/content?status=${s}${f ? `&format=${f}` : ""}`;
  const fmt = typeof format === "string" ? format : undefined;

  return (
    <>
      <PageHeader eyebrow="Content Mine" title="The gold you're already generating">
        <span className="text-xs text-muted">Every processed session is anonymised and mined automatically. Nothing is published.</span>
      </PageHeader>

      <div className="mb-4 flex flex-wrap gap-2 text-sm">
        {["backlog", ...CONTENT_STATUSES, "all"].map((s) => (
          <a key={s} href={href(s, fmt)} className={`rounded px-2 py-1 ${status === s ? "bg-panel-2 text-text" : "text-muted hover:text-text"}`}>
            {s} <span className="text-xs text-muted">{s === "backlog" ? all.filter((i) => ["idea", "drafting", "ready"].includes(i.status)).length : s === "all" ? all.length : all.filter((i) => i.status === s).length}</span>
          </a>
        ))}
        <span className="mx-2 border-l border-line" />
        <a href={href(String(status))} className={`rounded px-2 py-1 ${!fmt ? "bg-panel-2" : "text-muted"}`}>
          all formats
        </a>
        {CONTENT_FORMATS.map((f) => (
          <a key={f} href={href(String(status), f)} className={`rounded px-2 py-1 ${fmt === f ? "bg-panel-2" : "text-muted hover:text-text"}`}>
            {CONTENT_FORMAT_LABELS[f]}
          </a>
        ))}
      </div>

      {items.length === 0 ? (
        <Card>
          <Empty>Nothing here. Process a session in the Session Engine and the Content Mine fills itself.</Empty>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {items.map((i) => (
            <Card
              key={i.id}
              title={
                <span className="flex items-center gap-2">
                  {CONTENT_FORMAT_LABELS[i.format]} · {i.status}
                </span>
              }
              action={<span className="text-[11px] text-muted">{fmtDate(i.created_at)}</span>}
            >
              {i.redaction_flags.length > 0 && (
                <p className="mb-3 rounded border border-bad/40 bg-bad/10 px-2 py-1 text-xs text-bad">
                  Review before use — possible identifying terms: {i.redaction_flags.join(", ")}
                </p>
              )}
              <h3 className="font-semibold">{i.title}</h3>
              <p className="mt-1 text-sm italic text-accent">{i.hook}</p>
              <p className="mt-3 text-sm">{i.insight}</p>
              <ul className="mt-3 list-inside list-disc space-y-0.5 text-sm text-muted">
                {i.outline.map((o, n) => (
                  <li key={n}>{o}</li>
                ))}
              </ul>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap gap-1">
                  {i.themes.map((t) => (
                    <Badge key={t}>{t}</Badge>
                  ))}
                </div>
                <div className="flex gap-3 text-xs">
                  {NEXT[i.status] && (
                    <form action={setContentStatus.bind(null, i.id, NEXT[i.status]!)}>
                      <button className="text-accent hover:underline">→ {NEXT[i.status]}</button>
                    </form>
                  )}
                  {i.status !== "discarded" && (
                    <form action={setContentStatus.bind(null, i.id, "discarded")}>
                      <button className="text-muted hover:text-bad">discard</button>
                    </form>
                  )}
                  {i.status === "discarded" && (
                    <form action={setContentStatus.bind(null, i.id, "idea")}>
                      <button className="text-muted hover:text-text">restore</button>
                    </form>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
