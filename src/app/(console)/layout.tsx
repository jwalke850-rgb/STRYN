import { Nav } from "@/components/nav";
import { logout } from "@/app/actions";
import { db } from "@/lib/db";
import { aiConfigured } from "@/lib/ai/client";
import { SPINE, SPINE_LABELS } from "@/lib/types";

export default function ConsoleLayout({ children }: LayoutProps<"/">) {
  const warnings = [
    !aiConfigured() && "ANTHROPIC_API_KEY not set — AI features are disabled.",
    db().kind === "local" && "Local data store (.data/stryn.json). Set SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY to use Supabase.",
  ].filter(Boolean);

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <aside className="border-b border-line bg-panel md:sticky md:top-0 md:h-screen md:w-60 md:shrink-0 md:border-b-0 md:border-r">
        <div className="flex h-full flex-col gap-6 p-4">
          <div>
            <p className="text-lg font-bold tracking-[0.3em]">STRYN</p>
            <p className="text-[11px] uppercase tracking-[0.2em] text-muted">Operator Console</p>
          </div>
          <Nav />
          <div className="mt-auto hidden space-y-4 md:block">
            <ol className="space-y-1 text-[11px] uppercase tracking-[0.14em] text-muted">
              {SPINE.map((s, i) => (
                <li key={s}>
                  <span className="text-accent">{i + 1}</span> {SPINE_LABELS[s]}
                </li>
              ))}
            </ol>
            {process.env.OPERATOR_PASSWORD && (
              <form action={logout}>
                <button className="text-xs text-muted hover:text-text">Log out</button>
              </form>
            )}
          </div>
        </div>
      </aside>
      <main className="min-w-0 flex-1">
        {warnings.length > 0 && (
          <div className="border-b border-line bg-panel-2 px-6 py-2 text-xs text-muted">
            {warnings.map((w) => (
              <p key={w as string}>{w}</p>
            ))}
          </div>
        )}
        <div className="mx-auto max-w-6xl px-4 py-6 md:px-8">{children}</div>
      </main>
    </div>
  );
}
