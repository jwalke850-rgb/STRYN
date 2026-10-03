import * as z from "zod/v4";

const spine = z.object({
  reduce: z.string().describe("Strip the situation to its essential issue. What is actually going on, in one or two sentences."),
  reframe: z.string().describe("The more useful way to see it. Name the belief or frame that needs to shift."),
  move: z.string().describe("The concrete move(s) agreed or implied. Specific, owned, time-bound where possible."),
  pressure_test: z.string().describe("What could break the move. Weak assumptions, avoidance, hidden costs, who resists."),
  integrate: z.string().describe("How this becomes part of how they operate: rhythm, rule, Operating Code, or structure."),
});

export const prepSchema = z.object({
  what_changed: z.array(z.string()).describe("What has changed since the last session, per the notes and record."),
  drift: z.array(z.string()).describe("Where the client is drifting from their Strategic Beacon, agreed moves, or Operating Code."),
  pressure_test: z.array(z.string()).describe("Claims, plans or beliefs that deserve pressure-testing in this session."),
  likely_questions: z.array(z.string()).describe("Sharp questions to ask, in the operator's voice. Direct, not therapeutic."),
  commitments_to_check: z.array(z.string()).describe("Open commitments to hold them accountable on, with the angle to take."),
  opening_question: z.string().describe("The single best opening question for the session."),
  next_move: z.string().describe("The move this session should most likely land on."),
});

export const processSchema = z.object({
  title: z.string().describe("Short title for this session, 3-8 words."),
  summary: z.string().describe("Three to five sentence summary of the session."),
  spine,
  what_changed: z.array(z.string()),
  drift: z.array(z.string()),
  breakthroughs: z.array(z.string()).describe("Moments where something genuinely shifted. Empty if none."),
  record_updates: z.object({
    current_issue: z.string().nullable().describe("Updated current issue, or null if unchanged."),
    real_constraint: z.string().nullable().describe("Updated real constraint (the thing actually limiting progress), or null if unchanged."),
    beliefs: z.array(z.string()).nullable().describe("Full replacement list of assumptions/beliefs now in play, or null if unchanged."),
    drift: z.string().nullable().describe("One-line drift status vs the Strategic Beacon, or null if unchanged."),
    strategic_beacon_suggestion: z.string().nullable().describe("Only if the session clearly redefined where they are heading. Otherwise null."),
    operating_code_suggestions: z.array(z.string()).describe("New Operating Code principles that emerged, phrased as rules. Usually 0-2."),
  }),
  new_commitments: z.array(
    z.object({
      owner: z.enum(["client", "operator"]).describe("operator = something the advisor owes (a deliverable)."),
      text: z.string(),
      due_date: z.string().nullable().describe("ISO date YYYY-MM-DD if a deadline was stated or clearly implied, else null."),
    }),
  ),
  commitment_updates: z.array(
    z.object({
      id: z.string().describe("Exact id of an existing open commitment."),
      status: z.enum(["done", "dropped", "open"]),
    }),
  ).describe("Status changes to existing open commitments that the notes make clear. Only include ids from the provided list."),
  journal: z.array(
    z.object({
      kind: z.enum(["win", "loss", "lesson", "decision", "drift"]),
      body: z.string(),
    }),
  ).describe("War Journal entries: notable wins, losses, lessons, decisions, drift. Usually 1-4."),
  themes: z.array(
    z.object({
      theme: z.string().describe("Canonical lower-case label. Reuse an existing label when it fits; only coin a new one when nothing does."),
      category: z.string().describe("Broad family, lower-case: e.g. alignment, identity, decision rights, structure, strategy, execution, leadership, founder dependence, energy."),
      evidence: z.string().describe("Anonymised one-liner of how it showed up. No names, companies, or identifying specifics."),
    }),
  ).describe("Recurring advisory patterns present in this session. Usually 2-5."),
  next_session_focus: z.string(),
});

export const contentSchema = z.object({
  items: z.array(
    z.object({
      format: z.enum(["youtube", "linkedin", "worksheet", "stryn_material"]),
      title: z.string(),
      hook: z.string().describe("The opening line or angle that earns attention. No clickbait."),
      insight: z.string().describe("The anonymised core insight in 2-4 sentences."),
      outline: z.array(z.string()).describe("3-7 bullet outline."),
      themes: z.array(z.string()).describe("Canonical lower-case theme labels."),
    }),
  ).describe("Only genuinely useful ideas. 0-5 items. Return an empty list rather than filler."),
});

export const askSchema = z.object({
  answer: z.string().describe("Direct answer in plain prose. Reference sessions by their bracketed ref, e.g. [S3]."),
  matches: z.array(
    z.object({
      ref: z.string().describe("The bracketed ref of the matching record, e.g. S3 or J12."),
      excerpt: z.string().describe("The specific part of the record that matches."),
      why: z.string().describe("One line on why it is relevant."),
    }),
  ),
});

export const briefSchema = z.object({
  headline: z.string().describe("The single most important pattern across the practice right now."),
  insights: z.array(
    z.object({
      observation: z.string().describe("A specific, quantified observation, e.g. '7 clients hit a version of the same alignment problem in the last 90 days.'"),
      evidence: z.string().describe("The anonymised evidence behind it."),
      implication: z.string().describe("What the operator should do with it."),
    }),
  ),
  asset_gaps: z.array(
    z.object({
      theme: z.string(),
      why: z.string().describe("e.g. 'Discussed 11 times; no STRYN asset covers it.'"),
      suggested_asset: z.string().describe("The asset to build: name, format and the core idea."),
    }),
  ),
});

export type ProcessResult = z.infer<typeof processSchema>;
export type ContentResult = z.infer<typeof contentSchema>;
export type AskResult = z.infer<typeof askSchema>;
