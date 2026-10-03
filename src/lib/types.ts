// Domain model for the STRYN Operator Console.
// Every table row has id + created_at; JSON-ish fields are stored as jsonb in Supabase.

export const SPINE = ["reduce", "reframe", "move", "pressure_test", "integrate"] as const;
export type SpineStep = (typeof SPINE)[number];

export const SPINE_LABELS: Record<SpineStep, string> = {
  reduce: "Reduce",
  reframe: "Reframe",
  move: "Move",
  pressure_test: "Pressure-test",
  integrate: "Integrate",
};

export type ClientStatus = "prospect" | "active" | "paused" | "alumni";
export const CLIENT_STATUSES: ClientStatus[] = ["prospect", "active", "paused", "alumni"];

export type PipelineStage = "lead" | "conversation" | "proposal" | "won" | "lost";
export const PIPELINE_STAGES: PipelineStage[] = ["lead", "conversation", "proposal", "won", "lost"];

export interface Client {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  company: string | null;
  role: string | null;
  engagement_type: string | null; // e.g. "executive", "founder", "leadership team"
  status: ClientStatus;
  pipeline_stage: PipelineStage | null;
  pipeline_value: number | null; // expected contract value for prospects
  monthly_fee: number | null; // recurring revenue for active clients
  next_session_at: string | null;
  // The operating record
  current_issue: string | null;
  beliefs: string[]; // assumptions / beliefs currently in play
  real_constraint: string | null;
  strategic_beacon: string | null;
  operating_code: string[];
  drift: string | null; // where the client is drifting from the beacon
  notes: string | null;
  aliases: string[]; // extra names to redact (people, companies, products)
}

export interface SpineAnalysis {
  reduce: string;
  reframe: string;
  move: string;
  pressure_test: string;
  integrate: string;
}

export interface PrepSheet {
  what_changed: string[];
  drift: string[];
  pressure_test: string[];
  likely_questions: string[];
  commitments_to_check: string[];
  opening_question: string;
  next_move: string;
}

export interface SessionAnalysis {
  summary: string;
  spine: SpineAnalysis;
  what_changed: string[];
  drift: string[];
  breakthroughs: string[];
  record_updates: {
    current_issue: string | null;
    real_constraint: string | null;
    beliefs: string[] | null;
    drift: string | null;
    strategic_beacon_suggestion: string | null;
    operating_code_suggestions: string[];
  };
  next_session_focus: string;
}

export type SessionStatus = "draft" | "prepped" | "processed";

export interface Session {
  id: string;
  created_at: string;
  client_id: string;
  held_at: string; // date of the session
  title: string | null;
  status: SessionStatus;
  pre_notes: string | null;
  prep: PrepSheet | null;
  raw_notes: string | null;
  analysis: SessionAnalysis | null;
  processed_at: string | null;
}

export type CommitmentOwner = "client" | "operator";
export type CommitmentStatus = "open" | "done" | "dropped";

export interface Commitment {
  id: string;
  created_at: string;
  client_id: string;
  session_id: string | null;
  owner: CommitmentOwner; // operator-owned commitments are your deliverables
  text: string;
  due_date: string | null;
  status: CommitmentStatus;
  completed_at: string | null;
}

export type JournalKind = "win" | "loss" | "lesson" | "decision" | "drift";
export const JOURNAL_KINDS: JournalKind[] = ["win", "loss", "lesson", "decision", "drift"];

export interface JournalEntry {
  id: string;
  created_at: string;
  client_id: string;
  session_id: string | null;
  entry_date: string;
  kind: JournalKind;
  body: string;
}

export interface ThemeMention {
  id: string;
  created_at: string;
  client_id: string;
  session_id: string;
  theme: string; // canonical, lower-case label e.g. "decision rights"
  category: string; // broad family e.g. "alignment", "identity", "structure"
  evidence: string; // anonymised one-liner of how it showed up
  occurred_at: string;
}

export type ContentFormat = "youtube" | "linkedin" | "worksheet" | "stryn_material";
export const CONTENT_FORMATS: ContentFormat[] = ["youtube", "linkedin", "worksheet", "stryn_material"];
export const CONTENT_FORMAT_LABELS: Record<ContentFormat, string> = {
  youtube: "YouTube",
  linkedin: "LinkedIn",
  worksheet: "Worksheet",
  stryn_material: "STRYN material",
};

export type ContentStatus = "idea" | "drafting" | "ready" | "published" | "discarded";
export const CONTENT_STATUSES: ContentStatus[] = ["idea", "drafting", "ready", "published", "discarded"];

export interface ContentItem {
  id: string;
  created_at: string;
  source_session_id: string | null; // provenance only — never rendered alongside the content
  format: ContentFormat;
  title: string;
  hook: string;
  insight: string; // anonymised core insight
  outline: string[];
  themes: string[];
  status: ContentStatus;
  redaction_flags: string[]; // names that survived anonymisation — review before use
}

export type AssetKind = "framework" | "worksheet" | "video" | "script" | "chapter" | "tool";
export const ASSET_KINDS: AssetKind[] = ["framework", "worksheet", "video", "script", "chapter", "tool"];

export interface Asset {
  id: string;
  created_at: string;
  title: string;
  kind: AssetKind;
  description: string | null;
  url: string | null;
  themes: string[];
}

export interface PatternBrief {
  id: string;
  created_at: string;
  headline: string;
  insights: { observation: string; evidence: string; implication: string }[];
  asset_gaps: { theme: string; why: string; suggested_asset: string }[];
}

export interface Tables {
  clients: Client;
  sessions: Session;
  commitments: Commitment;
  journal_entries: JournalEntry;
  theme_mentions: ThemeMention;
  content_items: ContentItem;
  assets: Asset;
  pattern_briefs: PatternBrief;
}
export type TableName = keyof Tables;
