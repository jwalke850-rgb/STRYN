import { createAsset, deleteAsset } from "@/app/actions";
import { db } from "@/lib/db";
import { ASSET_KINDS } from "@/lib/types";
import { Badge, Card, Empty, Field, PageHeader } from "@/components/ui";
import { SubmitButton } from "@/components/forms";

export const dynamic = "force-dynamic";

export default async function Assets() {
  const assets = await db().list("assets", { orderBy: { column: "title" } });
  return (
    <>
      <PageHeader eyebrow="STRYN Assets" title="Your intellectual property">
        <span className="text-xs text-muted">Tag assets with themes so Pattern Intelligence knows what you already cover.</span>
      </PageHeader>
      <div className="grid gap-6 lg:grid-cols-3">
        <Card title="Register an asset">
          <form action={createAsset} className="space-y-3">
            <Field label="Title">
              <input name="title" required placeholder="The Decision Rights Map" />
            </Field>
            <Field label="Kind">
              <select name="kind">
                {ASSET_KINDS.map((k) => (
                  <option key={k}>{k}</option>
                ))}
              </select>
            </Field>
            <Field label="Themes covered (comma separated)">
              <input name="themes" placeholder="decision rights, founder dependence" />
            </Field>
            <Field label="Link">
              <input name="url" type="url" placeholder="https://" />
            </Field>
            <Field label="Description">
              <textarea name="description" rows={3} />
            </Field>
            <SubmitButton>Add asset</SubmitButton>
          </form>
        </Card>
        <Card title={`Library · ${assets.length}`} className="lg:col-span-2">
          {assets.length ? (
            <ul className="divide-y divide-line">
              {assets.map((a) => (
                <li key={a.id} className="group flex items-start justify-between gap-3 py-3">
                  <div>
                    <p className="font-medium">
                      {a.url ? (
                        <a href={a.url} target="_blank" rel="noreferrer" className="hover:text-accent">
                          {a.title}
                        </a>
                      ) : (
                        a.title
                      )}{" "}
                      <Badge>{a.kind}</Badge>
                    </p>
                    {a.description && <p className="mt-1 text-sm text-muted">{a.description}</p>}
                    <div className="mt-2 flex flex-wrap gap-1">
                      {a.themes.map((t) => (
                        <Badge key={t} tone="accent">
                          {t}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <form action={deleteAsset.bind(null, a.id)} className="opacity-0 group-hover:opacity-100">
                    <button className="text-xs text-muted hover:text-bad">remove</button>
                  </form>
                </li>
              ))}
            </ul>
          ) : (
            <Empty>No assets registered. Add your frameworks, worksheets, videos and chapters.</Empty>
          )}
        </Card>
      </div>
    </>
  );
}
