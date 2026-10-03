import "server-only";
import { db } from "./db";
import { structured } from "./ai/client";
import { askSchema, briefSchema, contentSchema, prepSchema, processSchema, type AskResult } from "./ai/schemas";
import { identifyingTerms, leaks, redact } from "./redact";
import { computePatterns, norm } from "./patterns";
import { today } from "./dates";
import type { Client, Commitment, Session, SPINE } from "./types";
import { SPINE_LABELS } from "./types";

// ---------- context rendering ----------

const list = (xs: string[] | null | undefined) => (xs?.length ? xs.map((x) => `- ${x}`).join("\n") : "(none)");

function renderClient(c: Client): string {
  return `<client_record>
Name: ${c.name}${c.role ? `, ${c.role}` : ""}${c.company ? ` at ${c.company}` : ""}
Engagement: ${c.engagement_type ?? "unspecified"} (${c.status})
Strategic Beacon: ${c.strategic_beacon ?? "(not yet defined)"}
Current issue: ${c.current_issue ?? "(none recorded)"}
Real constraint: ${c.real_constraint ?? "(not yet identified)"}
Drift: ${c.drift ?? "(none recorded)"}
Assumptions / beliefs in play:
${list(c.beliefs)}
Operating Code:
${list(c.operating_code)}
Operator notes: ${c.notes ?? "(none)"}
</client_record>`;
}

function renderHistory(sessions: Session[]): string {
  const done = sessions.filter((s) => s.analysis).slice(0, 4);
  if (!done.length) return "<session_history>(no processed sessions yet)</session_history>";
  return `<session_history newest_first="true">\n${done
    .map((s) => {
      const a = s.analysis!;
      const spine = (Object.keys(SPINE_LABELS) as (typeof SPINE)[number][])
        .map((k) => `${SPINE_LABELS[k]}: ${a.spine[k]}`)
        .join("\n");
      return `<session date="${s.held_at}" title="${s.title ?? ""}">\n${a.summary}\n${spine}\nNext focus: ${a.next_session_focus}\n</session>`;
    })
    .join("\n")}\n</session_history>`;
}

function renderCommitments(cs: Commitment[]): string {
  if (!cs.length) return "<open_commitments>(none)</open_commitments>";
  return `<open_commitments>\n${cs
    .map((c) => `- id=${c.id} | owner=${c.owner} | due=${c.due_date ?? "none"} | ${c.text}`)
    .join("\n")}\n</open_commitments>`;
}

async function clientContext(clientId: string) {
  const store = db();
  const [client, sessions, commitments] = await Promise.all([
    store.get("clients", clientId),
    store.list("sessions", { where: { client_id: clientId }, orderBy: { column: "held_at", ascending: false } }),
    store.list("commitments", { where: { client_id: clientId, status: "open" } }),
  ]);
  if (!client) throw new Error("Client not found");
  return { client, sessions, commitments };
}

// ---------- Session Engine: before ----------

export async function runPrep(sessionId: string, preNotes: string) {
  const store = db();
  const session = await store.get("sessions", sessionId);
  if (!session) throw new Error("Session not found");
  const { client, sessions, commitments } = await clientContext(session.client_id);

  const prep = await structured({
    schema: prepSchema,
    effort: "high",
    input: [
      renderClient(client),
      renderHistory(sessions.filter((s) => s.id !== sessionId)),
      renderCommitments(commitments),
      `<pre_session_dump date="${session.held_at}">\n${preNotes || "(no new notes — prep from the record alone)"}\n</pre_session_dump>`,
    ].join("\n\n"),
    task: `Prepare the operator for the upcoming session with ${client.name}. Structure the pre-session dump against the record: what changed, where drift exists, what deserves pressure-testing, the questions to ask, which commitments to hold them to, the opening question, and the most likely next move. Keep every line tight and specific to this client.`,
  });

  return store.update("sessions", sessionId, { pre_notes: preNotes, prep, status: session.status === "processed" ? "processed" : "prepped" });
}

// ---------- Session Engine: after ----------

export async function runProcess(sessionId: string, rawNotes: string) {
  const store = db();
  const session = await store.get("sessions", sessionId);
  if (!session) throw new Error("Session not found");
  const { client, sessions, commitments } = await clientContext(session.client_id);
  const allMentions = await store.list("theme_mentions");
  const labelCounts = new Map<string, number>();
  for (const m of allMentions) labelCounts.set(norm(m.theme), (labelCounts.get(norm(m.theme)) ?? 0) + 1);
  const labels = [...labelCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 200).map(([t]) => t);

  const prepBlock = session.prep
    ? `<prep_sheet>\nPlanned move: ${session.prep.next_move}\nPressure-test: ${session.prep.pressure_test.join("; ")}\n</prep_sheet>`
    : "";

  const [result, content] = await Promise.allSettled([
    structured({
      schema: processSchema,
      effort: "high",
      input: [
        renderClient(client),
        renderHistory(sessions.filter((s) => s.id !== sessionId)),
        renderCommitments(commitments),
        prepBlock,
        `<existing_theme_labels>\n${labels.join("\n") || "(none yet)"}\n</existing_theme_labels>`,
        `<session_notes date="${session.held_at}">\n${rawNotes}\n</session_notes>`,
      ].join("\n\n"),
      task: `Process these session notes for ${client.name} through the STRYN spine (Reduce, Reframe, Move, Pressure-test, Integrate) and produce the updates to their record: changes to current issue, real constraint, beliefs and drift; new commitments (client- and operator-owned, with due dates where stated); status changes to the listed open commitments; War Journal entries; and the recurring themes present. Today is ${today()}. Only update a record field when the notes justify it; use null for unchanged.`,
    }),
    mineContent(rawNotes),
  ]);

  if (result.status === "rejected") throw result.reason;
  const r = result.value;

  // Reprocessing replaces what the previous run generated for this session.
  if (session.status === "processed") {
    const [oldJournal, oldThemes, oldCommitments, oldContent] = await Promise.all([
      store.list("journal_entries", { where: { session_id: sessionId } }),
      store.list("theme_mentions", { where: { session_id: sessionId } }),
      store.list("commitments", { where: { session_id: sessionId, status: "open" } }),
      store.list("content_items", { where: { source_session_id: sessionId, status: "idea" } }),
    ]);
    await Promise.all([
      ...oldJournal.map((x) => store.remove("journal_entries", x.id)),
      ...oldThemes.map((x) => store.remove("theme_mentions", x.id)),
      ...oldCommitments.map((x) => store.remove("commitments", x.id)),
      ...(content.status === "fulfilled" ? oldContent.map((x) => store.remove("content_items", x.id)) : []),
    ]);
  }

  const u = r.record_updates;
  const clientPatch: Partial<Client> = { updated_at: new Date().toISOString() };
  if (u.current_issue) clientPatch.current_issue = u.current_issue;
  if (u.real_constraint) clientPatch.real_constraint = u.real_constraint;
  if (u.beliefs) clientPatch.beliefs = u.beliefs;
  if (u.drift) clientPatch.drift = u.drift;

  const openIds = new Set(commitments.map((c) => c.id));
  const now = new Date().toISOString();

  await Promise.all([
    store.update("clients", client.id, clientPatch),
    store.insert(
      "commitments",
      r.new_commitments.map((c) => ({
        client_id: client.id,
        session_id: sessionId,
        owner: c.owner,
        text: c.text,
        due_date: /^\d{4}-\d{2}-\d{2}$/.test(c.due_date ?? "") ? c.due_date : null,
        status: "open" as const,
        completed_at: null,
      })),
    ),
    ...r.commitment_updates
      .filter((c) => openIds.has(c.id) && c.status !== "open")
      .map((c) => store.update("commitments", c.id, { status: c.status, completed_at: now })),
    store.insert(
      "journal_entries",
      r.journal.map((j) => ({ client_id: client.id, session_id: sessionId, entry_date: session.held_at, kind: j.kind, body: j.body })),
    ),
    store.insert(
      "theme_mentions",
      r.themes.map((t) => ({
        client_id: client.id,
        session_id: sessionId,
        theme: norm(t.theme),
        category: norm(t.category),
        evidence: t.evidence,
        occurred_at: session.held_at,
      })),
    ),
    content.status === "fulfilled" ? store.insert("content_items", content.value.map((c) => ({ ...c, source_session_id: sessionId }))) : null,
  ]);

  return store.update("sessions", sessionId, {
    raw_notes: rawNotes,
    title: session.title || r.title,
    status: "processed",
    processed_at: now,
    analysis: {
      summary: r.summary,
      spine: r.spine,
      what_changed: r.what_changed,
      drift: r.drift,
      breakthroughs: r.breakthroughs,
      record_updates: u,
      next_session_focus: r.next_session_focus,
    },
  });
}

// ---------- Content Mine ----------

export async function mineContent(rawNotes: string) {
  const clients = await db().list("clients");
  const terms = identifyingTerms(clients);
  const cleaned = redact(rawNotes, terms);

  const { items } = await structured({
    schema: contentSchema,
    effort: "medium",
    input: `<advisory_notes pre_redacted="true">\n${cleaned}\n</advisory_notes>`,
    task: `Mine these advisory notes for insight worth turning into the operator's public or productised material: YouTube topics, LinkedIn posts, worksheets, and future STRYN material. Extract the transferable pattern, not the client's story. Anonymise completely: no names, companies, industries-plus-size combinations, locations, dates, numbers, or details that would let the client recognise themselves or be recognised. Placeholders like [CLIENT] must never appear in the output; write about "a founder" or "an executive" instead. Only return ideas you would be proud to put out; an empty list is a fine answer.`,
  });

  return items.map((i) => ({
    ...i,
    themes: i.themes.map(norm),
    status: "idea" as const,
    redaction_flags: leaks(`${i.title} ${i.hook} ${i.insight} ${i.outline.join(" ")}`, terms),
  }));
}

export async function mineSession(sessionId: string) {
  const store = db();
  const session = await store.get("sessions", sessionId);
  if (!session?.raw_notes) throw new Error("This session has no notes to mine yet.");
  const items = await mineContent(session.raw_notes);
  return store.insert("content_items", items.map((i) => ({ ...i, source_session_id: sessionId })));
}

// ---------- Conversational search ----------

const CORPUS_BUDGET = 600_000; // characters (~150k tokens)

export interface AskAnswer extends AskResult {
  refs: Record<string, { href: string; label: string }>;
}

export async function ask(question: string): Promise<AskAnswer> {
  const store = db();
  const [clients, sessions, journal, mentions] = await Promise.all([
    store.list("clients"),
    store.list("sessions", { orderBy: { column: "held_at", ascending: false } }),
    store.list("journal_entries", { orderBy: { column: "entry_date", ascending: false } }),
    store.list("theme_mentions"),
  ]);
  const byId = new Map(clients.map((c) => [c.id, c]));
  const themesBySession = new Map<string, string[]>();
  for (const m of mentions) themesBySession.set(m.session_id, [...(themesBySession.get(m.session_id) ?? []), m.theme]);

  const refs: AskAnswer["refs"] = {};
  const blocks: { text: string; notes: string; score: number }[] = [];
  const words = question.toLowerCase().split(/\W+/).filter((w) => w.length > 3);
  const score = (s: string) => words.reduce((n, w) => n + (s.toLowerCase().includes(w) ? 1 : 0), 0);

  clients.forEach((c, i) => {
    const ref = `C${i + 1}`;
    refs[ref] = { href: `/clients/${c.id}`, label: c.name };
    const text = `[${ref}] CLIENT ${c.name} (${c.engagement_type ?? "unspecified"}, ${c.status})\nIssue: ${c.current_issue ?? ""}\nConstraint: ${c.real_constraint ?? ""}\nBeliefs: ${c.beliefs.join("; ")}\nBeacon: ${c.strategic_beacon ?? ""}`;
    blocks.push({ text, notes: "", score: score(text) });
  });

  sessions.forEach((s, i) => {
    const ref = `S${i + 1}`;
    const client = byId.get(s.client_id);
    refs[ref] = { href: `/sessions/${s.id}`, label: `${client?.name ?? "Unknown"} · ${s.held_at}` };
    const a = s.analysis;
    const digest = a
      ? `Summary: ${a.summary}\nReduce: ${a.spine.reduce}\nReframe: ${a.spine.reframe}\nMove: ${a.spine.move}\nPressure-test: ${a.spine.pressure_test}\nIntegrate: ${a.spine.integrate}`
      : s.pre_notes ?? "";
    const text = `[${ref}] SESSION ${s.held_at} with ${client?.name ?? "Unknown"}: ${s.title ?? ""}\nThemes: ${(themesBySession.get(s.id) ?? []).join(", ")}\n${digest}`;
    const notes = s.raw_notes ? `\nNotes:\n${s.raw_notes}` : "";
    blocks.push({ text, notes, score: score(text + notes) });
  });

  journal.forEach((j, i) => {
    const ref = `J${i + 1}`;
    const client = byId.get(j.client_id);
    refs[ref] = { href: `/clients/${j.client_id}#journal`, label: `${client?.name ?? "Unknown"} · journal ${j.entry_date}` };
    const text = `[${ref}] WAR JOURNAL ${j.entry_date} ${client?.name ?? ""} (${j.kind}): ${j.body}`;
    blocks.push({ text, notes: "", score: score(text) });
  });

  // Digests always go in; raw notes are added most-relevant-first until the budget is used.
  let used = blocks.reduce((n, b) => n + b.text.length, 0);
  const withNotes = new Set<number>();
  [...blocks.keys()]
    .filter((i) => blocks[i].notes)
    .sort((a, b) => blocks[b].score - blocks[a].score)
    .forEach((i) => {
      if (used + blocks[i].notes.length <= CORPUS_BUDGET) {
        used += blocks[i].notes.length;
        withNotes.add(i);
      }
    });
  const corpus = blocks.map((b, i) => b.text + (withNotes.has(i) ? b.notes : "")).join("\n\n");

  const result = await structured({
    schema: askSchema,
    effort: "medium",
    input: `<practice_archive>\n${corpus || "(the archive is empty)"}\n</practice_archive>`,
    task: `The operator asks: "${question}"\n\nAnswer from the archive only. Find every relevant record, including ones that describe the same thing in different words. Cite records by their ref. If nothing matches, say so plainly.`,
  });

  return { ...result, refs };
}

// ---------- Pattern Intelligence brief ----------

export async function generateBrief() {
  const store = db();
  const [mentions, clients, assets] = await Promise.all([store.list("theme_mentions"), store.list("clients"), store.list("assets")]);
  if (!mentions.length) throw new Error("Process a few sessions first. Pattern Intelligence needs themes to work with.");
  const { themes, categories, gaps } = computePatterns(mentions, clients, assets);

  const input = `<theme_stats as_of="${today()}">
${themes
  .slice(0, 60)
  .map(
    (t) =>
      `- "${t.theme}" [${t.category}] mentions=${t.mentions} clients=${t.clients} clients_90d=${t.clients90} mentions_30d=${t.mentions30} engagements=${JSON.stringify(t.byEngagement)} assets=${t.covered.map((a) => a.title).join(", ") || "NONE"}\n  evidence: ${t.evidence.join(" | ")}`,
  )
  .join("\n")}
</theme_stats>

<category_stats_90d>
${categories.map((c) => `- ${c.category}: ${c.clients90} clients, ${c.mentions90} mentions (${c.themes.join(", ")})`).join("\n")}
</category_stats_90d>

<uncovered_themes>
${gaps.map((g) => `- ${g.theme}: ${g.mentions} mentions`).join("\n") || "(none)"}
</uncovered_themes>

<stryn_assets>
${assets.map((a) => `- ${a.title} (${a.kind}) themes: ${a.themes.join(", ")}`).join("\n") || "(none registered)"}
</stryn_assets>`;

  const brief = await structured({
    schema: briefSchema,
    effort: "high",
    input,
    task: `Write the Pattern Intelligence brief for the operator's practice. Surface cross-client patterns, including themes that are the same underlying problem under different labels. Quantify every observation from the stats; never invent counts. Then identify the asset gaps: recurring themes where building a STRYN asset (framework, worksheet, video, chapter) would turn advisory work into intellectual property. Do not name clients.`,
  });

  return store.insert("pattern_briefs", [brief]).then((r) => r[0]);
}
