"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { AIError } from "@/lib/ai/client";
import { ask, generateBrief, mineSession, runPrep, runProcess, type AskAnswer } from "@/lib/engine";
import { AUTH_COOKIE, authToken } from "@/lib/auth";
import { today } from "@/lib/dates";
import type {
  AssetKind,
  ClientStatus,
  CommitmentOwner,
  CommitmentStatus,
  ContentStatus,
  JournalKind,
  PipelineStage,
} from "@/lib/types";

export type ActionState = { error?: string; ok?: string } | undefined;

const str = (f: FormData, k: string) => {
  const v = f.get(k);
  return typeof v === "string" && v.trim() ? v.trim() : null;
};
const num = (f: FormData, k: string) => {
  const v = str(f, k);
  const n = v === null ? NaN : Number(v.replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) ? n : null;
};
const lines = (f: FormData, k: string) =>
  (str(f, k) ?? "")
    .split("\n")
    .map((l) => l.replace(/^[-*•]\s*/, "").trim())
    .filter(Boolean);
const csv = (f: FormData, k: string) =>
  (str(f, k) ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

function failure(err: unknown): ActionState {
  if (err instanceof AIError) return { error: err.message };
  console.error(err);
  return { error: err instanceof Error ? err.message : "Something went wrong." };
}

// ---------- auth ----------

export async function login(_: ActionState, form: FormData): Promise<ActionState> {
  const password = process.env.OPERATOR_PASSWORD;
  if (!password || str(form, "password") !== password) return { error: "Wrong password." };
  (await cookies()).set(AUTH_COOKIE, await authToken(password), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });
  const next = str(form, "next");
  redirect(next?.startsWith("/") && !next.startsWith("//") ? next : "/");
}

export async function logout() {
  (await cookies()).delete(AUTH_COOKIE);
  redirect("/login");
}

// ---------- clients ----------

function clientFields(form: FormData) {
  return {
    name: str(form, "name") ?? "Unnamed",
    company: str(form, "company"),
    role: str(form, "role"),
    engagement_type: str(form, "engagement_type")?.toLowerCase() ?? null,
    status: (str(form, "status") ?? "prospect") as ClientStatus,
    pipeline_stage: str(form, "pipeline_stage") as PipelineStage | null,
    pipeline_value: num(form, "pipeline_value"),
    monthly_fee: num(form, "monthly_fee"),
    next_session_at: str(form, "next_session_at") ? new Date(str(form, "next_session_at")!).toISOString() : null,
    aliases: (str(form, "aliases") ?? "").split(",").map((s) => s.trim()).filter(Boolean),
  };
}

export async function createClient(form: FormData) {
  const [client] = await db().insert("clients", [
    {
      ...clientFields(form),
      updated_at: new Date().toISOString(),
      current_issue: str(form, "current_issue"),
      beliefs: [],
      real_constraint: null,
      strategic_beacon: null,
      operating_code: [],
      drift: null,
      notes: str(form, "notes"),
    },
  ]);
  redirect(`/clients/${client.id}`);
}

export async function updateClientProfile(id: string, form: FormData) {
  await db().update("clients", id, { ...clientFields(form), updated_at: new Date().toISOString() });
  revalidatePath("/", "layout");
  redirect(`/clients/${id}`);
}

export async function updateClientRecord(id: string, form: FormData) {
  await db().update("clients", id, {
    current_issue: str(form, "current_issue"),
    real_constraint: str(form, "real_constraint"),
    strategic_beacon: str(form, "strategic_beacon"),
    drift: str(form, "drift"),
    beliefs: lines(form, "beliefs"),
    operating_code: lines(form, "operating_code"),
    notes: str(form, "notes"),
    updated_at: new Date().toISOString(),
  });
  revalidatePath(`/clients/${id}`);
}

export async function deleteClient(id: string) {
  await db().remove("clients", id);
  redirect("/clients");
}

/** Accept a Beacon / Operating Code suggestion produced by the Session Engine. */
export async function applySuggestion(clientId: string, sessionId: string, kind: "beacon" | "code", value: string) {
  const store = db();
  const client = await store.get("clients", clientId);
  if (!client) return;
  if (kind === "beacon") await store.update("clients", clientId, { strategic_beacon: value });
  else if (!client.operating_code.includes(value)) await store.update("clients", clientId, { operating_code: [...client.operating_code, value] });
  revalidatePath(`/sessions/${sessionId}`);
  revalidatePath(`/clients/${clientId}`);
}

// ---------- sessions ----------

export async function createSession(clientId: string, form: FormData) {
  const [session] = await db().insert("sessions", [
    {
      client_id: clientId,
      held_at: str(form, "held_at") ?? today(),
      title: str(form, "title"),
      status: "draft",
      pre_notes: null,
      prep: null,
      raw_notes: null,
      analysis: null,
      processed_at: null,
    },
  ]);
  redirect(`/sessions/${session.id}`);
}

export async function updateSessionMeta(id: string, form: FormData) {
  await db().update("sessions", id, { held_at: str(form, "held_at") ?? today(), title: str(form, "title") });
  revalidatePath(`/sessions/${id}`);
}

export async function deleteSession(id: string, clientId: string) {
  await db().remove("sessions", id);
  redirect(`/clients/${clientId}`);
}

export async function prepSession(id: string, _: ActionState, form: FormData): Promise<ActionState> {
  try {
    await runPrep(id, str(form, "pre_notes") ?? "");
  } catch (err) {
    return failure(err);
  }
  revalidatePath(`/sessions/${id}`);
  return { ok: "Prep sheet ready." };
}

export async function processSession(id: string, _: ActionState, form: FormData): Promise<ActionState> {
  const notes = str(form, "raw_notes");
  if (!notes) return { error: "Paste the session notes or transcript first." };
  try {
    const s = await runProcess(id, notes);
    revalidatePath(`/clients/${s.client_id}`);
  } catch (err) {
    return failure(err);
  }
  revalidatePath(`/sessions/${id}`);
  revalidatePath("/");
  return { ok: "Session processed and client record updated." };
}

export async function mineSessionAction(id: string, _: ActionState): Promise<ActionState> {
  try {
    const items = await mineSession(id);
    revalidatePath("/content");
    return { ok: `${items.length} content idea${items.length === 1 ? "" : "s"} added to the Content Mine.` };
  } catch (err) {
    return failure(err);
  }
}

// ---------- commitments & journal ----------

export async function addCommitment(clientId: string, form: FormData) {
  const text = str(form, "text");
  if (!text) return;
  await db().insert("commitments", [
    {
      client_id: clientId,
      session_id: str(form, "session_id"),
      owner: (str(form, "owner") ?? "client") as CommitmentOwner,
      text,
      due_date: str(form, "due_date"),
      status: "open",
      completed_at: null,
    },
  ]);
  revalidatePath("/", "layout");
}

export async function setCommitmentStatus(id: string, status: CommitmentStatus) {
  await db().update("commitments", id, { status, completed_at: status === "open" ? null : new Date().toISOString() });
  revalidatePath("/", "layout");
}

export async function addJournalEntry(clientId: string, form: FormData) {
  const body = str(form, "body");
  if (!body) return;
  await db().insert("journal_entries", [
    { client_id: clientId, session_id: null, entry_date: str(form, "entry_date") ?? today(), kind: (str(form, "kind") ?? "lesson") as JournalKind, body },
  ]);
  revalidatePath(`/clients/${clientId}`);
}

export async function deleteJournalEntry(id: string, clientId: string) {
  await db().remove("journal_entries", id);
  revalidatePath(`/clients/${clientId}`);
}

// ---------- content ----------

export async function setContentStatus(id: string, status: ContentStatus) {
  await db().update("content_items", id, { status });
  revalidatePath("/content");
  revalidatePath("/");
}

// ---------- assets ----------

export async function createAsset(form: FormData) {
  const title = str(form, "title");
  if (!title) return;
  await db().insert("assets", [
    { title, kind: (str(form, "kind") ?? "framework") as AssetKind, description: str(form, "description"), url: str(form, "url"), themes: csv(form, "themes") },
  ]);
  revalidatePath("/assets");
  revalidatePath("/patterns");
}

export async function deleteAsset(id: string) {
  await db().remove("assets", id);
  revalidatePath("/assets");
  revalidatePath("/patterns");
}

// ---------- intelligence ----------

export type AskState = { question?: string; answer?: AskAnswer; error?: string } | undefined;

export async function askArchive(_: AskState, form: FormData): Promise<AskState> {
  const question = str(form, "question");
  if (!question) return { error: "Ask a question." };
  try {
    return { question, answer: await ask(question) };
  } catch (err) {
    return { question, ...failure(err) };
  }
}

export async function generateBriefAction(_: ActionState): Promise<ActionState> {
  try {
    await generateBrief();
  } catch (err) {
    return failure(err);
  }
  revalidatePath("/patterns");
  return { ok: "Brief generated." };
}
