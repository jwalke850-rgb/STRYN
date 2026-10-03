@AGENTS.md

# STRYN Operator Console

- Domain model: `src/lib/types.ts`. Storage goes through the `Store` interface in `src/lib/db/`; keep both backends (local JSON and Supabase) behaving the same, and mirror schema changes in `supabase/migrations/`.
- Claude calls go through `structured()` in `src/lib/ai/client.ts` with a Zod schema from `src/lib/ai/schemas.ts`.
- Anything sent to the Content Mine passes through `redact()` first.
- Checks: `npm run lint && npm run typecheck && npm test && npm run build`.
