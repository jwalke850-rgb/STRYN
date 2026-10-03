# STRYN Operator Console

A private operating system for an advisory practice. It isn't a CRM.
Every client, session and insight goes through the same spine:

**Reduce → Reframe → Move → Pressure-test → Integrate**

Built with Next.js (App Router) + Supabase + the Claude API.

## What's in V1

| Area | What it does |
| --- | --- |
| **Operator Dashboard** (`/`) | Active clients, monthly revenue, open pipeline, next sessions, follow-ups due, what you owe (unfinished deliverables), sessions not yet processed, quiet clients, content backlog, recurring themes and Pattern Intelligence signals. |
| **Client Console** (`/clients/[id]`) | Profile, Strategic Beacon, current issue, real constraint, drift, assumptions/beliefs, Operating Code, agreed moves, session history, accountability (commitments) and War Journal. |
| **Session Engine** (`/sessions/[id]`) | *Before:* dump notes and Claude builds a prep sheet covering what changed, drift, what to pressure-test, likely questions, commitments to check, the opening question and the next move. *After:* paste notes or a transcript and Claude runs them through the spine, then updates the client record: issue, constraint, beliefs, drift, new commitments (client's and yours), closes commitments the notes show are done, writes War Journal entries and tags themes. Strategic Beacon and Operating Code changes come back as suggestions you apply yourself. |
| **Content Mine** (`/content`) | Each processed session is anonymised and mined for YouTube topics, LinkedIn posts, worksheets and STRYN material. Anonymisation runs twice: first a deterministic pass that strips every client's name, company, aliases, emails, phones, URLs and money amounts before anything reaches Claude, then Claude's own contextual pass. Any idea that still contains a known name gets a "review before use" flag. Nothing is published. |
| **Pattern Intelligence** (`/patterns`) | Cross-client theme statistics, e.g. *"7 clients have hit some version of the same alignment problem in the last 90 days"*, *"'Identity defending an outdated role' has appeared in 4 executive engagements"*, *"You have discussed decision rights 11 times but do not currently have a STRYN asset for it."* An on-demand Claude brief adds the narrative and names the assets to build. |
| **Ask the Archive** (`/ask`) | Conversational search across clients, sessions, notes and the War Journal, e.g. *"Show me every time a client struggled with founder dependence."* Answers cite and link the matching sessions. |
| **STRYN Assets** (`/assets`) | Register your frameworks, worksheets, videos and chapters, tagged by theme, so Pattern Intelligence knows which themes you already cover. |

## Quick start (no setup)

```bash
npm install
npm run seed      # optional: loads demo clients, sessions and themes
npm run dev       # http://localhost:3000
```

With no env vars set, data goes in `.data/stryn.json` (gitignored) and the AI features show a
"not configured" message. To turn the AI on:

```bash
cp .env.example .env.local
# set ANTHROPIC_API_KEY
```

## Moving to Supabase

1. Create a Supabase project.
2. Run `supabase/migrations/0001_operator_console.sql` in the SQL editor (or `supabase db push`).
3. In `.env.local`, set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.
4. Restart. Run `npm run seed` if you want the demo data there too.

The app talks to Supabase only from the server, using the service-role key. RLS is on with no
policies, so the anon key can read nothing.

## Deploying

Set `OPERATOR_PASSWORD` before you deploy. It gates every page (see `src/proxy.ts`).
Claude calls on long transcripts can take a minute or two; the Session Engine, Ask and Patterns
routes set `maxDuration = 300`, so on Vercel use a plan that allows it. The local JSON store
isn't meant for serverless hosting. Use Supabase in production.

## Doctrine: the V2 hook

Put Markdown files in `doctrine/` (The Operator's Edge, the STRYN Bible, worksheets, frameworks,
scripts). They are appended to the system prompt of every Claude call and prompt-cached, so the
whole system reasons in your language and frameworks. See `doctrine/README.md`.

## How it works

- `src/lib/types.ts`: the domain model.
- `src/lib/db/`: a narrow storage interface with two backends (local JSON, Supabase), chosen by env.
- `src/lib/ai/`: the Claude client (`claude-opus-5-5`, adaptive thinking, structured outputs
  validated with Zod, server-side refusal fallback), the doctrine loader and the output schemas.
- `src/lib/engine.ts`: Session Engine prep and processing, Content Mine, Ask and Pattern brief.
- `src/lib/patterns.ts`: deterministic Pattern Intelligence statistics and signals.
- `src/lib/redact.ts`: the deterministic anonymisation pass.
- `src/app/actions.ts`: server actions. Pages live under `src/app/(console)/`.

Theme labels stay consistent over time because every processing call receives the list of
existing labels and is told to reuse them. That consistency is what makes the counts meaningful.

## Scripts

| | |
| --- | --- |
| `npm run dev` / `build` / `start` | Next.js |
| `npm run seed` | Demo data into whichever store is configured (`-- --force` to add to a non-empty store) |
| `npm test` | Unit tests (redaction, pattern statistics, local store) |
| `npm run lint` / `typecheck` | ESLint / TypeScript |

## Roadmap

- **V2:** upload doctrine files from the UI, embeddings/pgvector retrieval once the archive outgrows
  long-context search, audio transcription, Supabase Auth.
- **Client-facing layer:** an owner logs in and sees their Strategic Beacon, current moves,
  pressure tests, War Journal and drift. The fields that must stay private (operator notes,
  redaction aliases, raw transcripts) are already separate columns, so they're easy to withhold.
