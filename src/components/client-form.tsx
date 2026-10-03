import { CLIENT_STATUSES, PIPELINE_STAGES, type Client } from "@/lib/types";
import { Field } from "./ui";
import { SubmitButton } from "./forms";

function localInput(iso: string | null | undefined) {
  if (!iso) return "";
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

export function ClientProfileForm({ action, client, submit }: { action: (f: FormData) => Promise<void>; client?: Client; submit: string }) {
  return (
    <form action={action} className="grid gap-4 md:grid-cols-2">
      <Field label="Name">
        <input name="name" required defaultValue={client?.name} />
      </Field>
      <Field label="Company">
        <input name="company" defaultValue={client?.company ?? ""} />
      </Field>
      <Field label="Role">
        <input name="role" defaultValue={client?.role ?? ""} placeholder="Founder & CEO" />
      </Field>
      <Field label="Engagement type">
        <input name="engagement_type" list="engagement-types" defaultValue={client?.engagement_type ?? ""} placeholder="executive" />
        <datalist id="engagement-types">
          <option value="executive" />
          <option value="founder" />
          <option value="owner" />
          <option value="leadership team" />
        </datalist>
      </Field>
      <Field label="Status">
        <select name="status" defaultValue={client?.status ?? "prospect"}>
          {CLIENT_STATUSES.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </Field>
      <Field label="Next session">
        <input type="datetime-local" name="next_session_at" defaultValue={localInput(client?.next_session_at)} />
      </Field>
      <Field label="Monthly fee (active)">
        <input name="monthly_fee" inputMode="decimal" defaultValue={client?.monthly_fee ?? ""} />
      </Field>
      <Field label="Pipeline stage">
        <select name="pipeline_stage" defaultValue={client?.pipeline_stage ?? ""}>
          <option value="">—</option>
          {PIPELINE_STAGES.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </Field>
      <Field label="Pipeline value">
        <input name="pipeline_value" inputMode="decimal" defaultValue={client?.pipeline_value ?? ""} />
      </Field>
      <Field label="Extra names to redact (comma separated)">
        <input name="aliases" defaultValue={client?.aliases?.join(", ") ?? ""} placeholder="co-founder name, product name…" />
      </Field>
      {!client && (
        <>
          <div className="md:col-span-2">
            <Field label="Presenting issue">
              <textarea name="current_issue" rows={2} />
            </Field>
          </div>
          <div className="md:col-span-2">
            <Field label="Notes">
              <textarea name="notes" rows={3} />
            </Field>
          </div>
        </>
      )}
      <div className="md:col-span-2">
        <SubmitButton>{submit}</SubmitButton>
      </div>
    </form>
  );
}
