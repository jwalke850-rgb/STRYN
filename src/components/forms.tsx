"use client";

import { useActionState, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import type { ActionState } from "@/app/actions";
import { btnPrimary } from "./ui";

export function SubmitButton({ children, pending: pendingLabel, className = btnPrimary }: { children: ReactNode; pending?: string; className?: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={className}>
      {pending ? (
        <>
          <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
          {pendingLabel ?? "Working…"}
        </>
      ) : (
        children
      )}
    </button>
  );
}

/** A form bound to a server action that reports { ok | error } back inline. */
export function ActionForm({
  action,
  children,
  className,
}: {
  action: (state: ActionState, form: FormData) => Promise<ActionState>;
  children: ReactNode;
  className?: string;
}) {
  const [state, formAction] = useActionState(action, undefined);
  return (
    <form action={formAction} className={className}>
      {children}
      {state?.error && <p className="mt-3 rounded border border-bad/40 bg-bad/10 px-3 py-2 text-sm text-bad">{state.error}</p>}
      {state?.ok && <p className="mt-3 text-sm text-good">{state.ok}</p>}
    </form>
  );
}
