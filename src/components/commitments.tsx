import Link from "next/link";
import { setCommitmentStatus } from "@/app/actions";
import { fmtDate, isOverdue } from "@/lib/dates";
import type { Client, Commitment } from "@/lib/types";
import { Badge, Empty } from "./ui";

export function CommitmentList({ items, clients, empty = "Nothing open." }: { items: Commitment[]; clients?: Map<string, Client>; empty?: string }) {
  if (!items.length) return <Empty>{empty}</Empty>;
  return (
    <ul className="divide-y divide-line">
      {items.map((c) => {
        const done = c.status !== "open";
        return (
          <li key={c.id} className="flex items-start gap-3 py-2">
            <form action={setCommitmentStatus.bind(null, c.id, done ? "open" : "done")}>
              <button
                title={done ? "Reopen" : "Mark done"}
                className={`mt-0.5 h-4 w-4 rounded border ${done ? "border-good bg-good/30" : "border-line hover:border-accent"}`}
              />
            </form>
            <div className="min-w-0 flex-1">
              <p className={`text-sm ${done ? "text-muted line-through" : ""}`}>{c.text}</p>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted">
                {clients && (
                  <Link href={`/clients/${c.client_id}`} className="hover:text-text">
                    {clients.get(c.client_id)?.name ?? "Unknown"}
                  </Link>
                )}
                <Badge tone={c.owner === "operator" ? "accent" : "neutral"}>{c.owner === "operator" ? "you owe" : "client"}</Badge>
                {c.due_date && <Badge tone={!done && isOverdue(c.due_date) ? "bad" : "neutral"}>due {fmtDate(c.due_date)}</Badge>}
                {c.status === "dropped" && <Badge>dropped</Badge>}
              </div>
            </div>
            {!done && (
              <form action={setCommitmentStatus.bind(null, c.id, "dropped")}>
                <button className="text-xs text-muted hover:text-bad" title="Drop">
                  drop
                </button>
              </form>
            )}
          </li>
        );
      })}
    </ul>
  );
}
