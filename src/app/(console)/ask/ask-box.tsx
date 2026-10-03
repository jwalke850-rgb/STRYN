"use client";

import Link from "next/link";
import { useActionState } from "react";
import { askArchive } from "@/app/actions";
import { SubmitButton } from "@/components/forms";
import { Card } from "@/components/ui";

const EXAMPLES = [
  "Show me every time a client struggled with founder dependence.",
  "Which clients are defending an outdated role?",
  "Where have decision rights come up, and what moves worked?",
  "Which commitments keep slipping, and with whom?",
];

export function AskBox() {
  const [state, action] = useActionState(askArchive, undefined);
  return (
    <>
      <form action={action} className="flex gap-2">
        <input name="question" defaultValue={state?.question} placeholder={EXAMPLES[0]} className="flex-1 !py-2.5 !text-base" autoFocus />
        <SubmitButton pending="Searching…">Ask</SubmitButton>
      </form>
      {!state && (
        <div className="mt-4 flex flex-wrap gap-2">
          {EXAMPLES.map((q) => (
            <form key={q} action={action}>
              <input type="hidden" name="question" value={q} />
              <button className="rounded-full border border-line px-3 py-1 text-xs text-muted hover:border-accent hover:text-text">{q}</button>
            </form>
          ))}
        </div>
      )}
      {state?.error && <p className="mt-4 rounded border border-bad/40 bg-bad/10 px-3 py-2 text-sm text-bad">{state.error}</p>}
      {state?.answer && (
        <div className="mt-6 space-y-6">
          <Card title="Answer">
            <p className="whitespace-pre-wrap leading-relaxed">{state.answer.answer}</p>
          </Card>
          {state.answer.matches.length > 0 && (
            <Card title={`Matches · ${state.answer.matches.length}`}>
              <ul className="divide-y divide-line">
                {state.answer.matches.map((m, i) => {
                  const ref = state.answer!.refs[m.ref.replace(/[[\]]/g, "")];
                  return (
                    <li key={i} className="py-3">
                      {ref ? (
                        <Link href={ref.href} className="text-sm font-medium text-accent hover:underline">
                          {ref.label}
                        </Link>
                      ) : (
                        <span className="text-sm text-muted">{m.ref}</span>
                      )}
                      <p className="mt-1 text-sm">“{m.excerpt}”</p>
                      <p className="mt-1 text-xs text-muted">{m.why}</p>
                    </li>
                  );
                })}
              </ul>
            </Card>
          )}
        </div>
      )}
    </>
  );
}
