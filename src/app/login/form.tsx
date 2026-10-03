"use client";

import { useActionState } from "react";
import { login } from "@/app/actions";
import { SubmitButton } from "@/components/forms";

export function LoginForm({ next }: { next: string }) {
  const [state, action] = useActionState(login, undefined);
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="next" value={next} />
      <div>
        <label htmlFor="password">Password</label>
        <input id="password" name="password" type="password" autoFocus required />
      </div>
      {state?.error && <p className="text-sm text-bad">{state.error}</p>}
      <SubmitButton pending="Checking…">Enter</SubmitButton>
    </form>
  );
}
