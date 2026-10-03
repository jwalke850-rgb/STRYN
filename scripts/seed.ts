// Loads demo data into whichever store is configured (Supabase if env is set, else .data/stryn.json).
// Run: npm run seed            (refuses to run if clients already exist)
//      npm run seed -- --force (adds demo data anyway)
import { createLocalStore } from "../src/lib/db/local.ts";
import { createSupabaseStore } from "../src/lib/db/supabase.ts";
import type { Store } from "../src/lib/db/types.ts";
import type { SessionAnalysis } from "../src/lib/types.ts";

const store: Store =
  process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createSupabaseStore(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
    : createLocalStore();

const day = (offset: number) => new Date(Date.now() + offset * 86_400_000).toISOString().slice(0, 10);
const at = (offset: number, hour: number) => {
  const d = new Date(Date.now() + offset * 86_400_000);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
};

type Theme = [theme: string, category: string, evidence: string];

interface Demo {
  name: string;
  company: string;
  role: string;
  engagement_type: string;
  status: "active" | "prospect" | "paused";
  monthly_fee?: number;
  pipeline_stage?: "lead" | "conversation" | "proposal";
  pipeline_value?: number;
  next?: number;
  beacon?: string;
  issue: string;
  constraint?: string;
  beliefs: string[];
  code: string[];
  drift?: string;
  sessions: { ago: number; title: string; summary: string; spine: SessionAnalysis["spine"]; themes: Theme[]; notes: string }[];
  commitments: { owner: "client" | "operator"; text: string; due: number | null; status?: "open" | "done" }[];
  journal: { ago: number; kind: "win" | "loss" | "lesson" | "decision" | "drift"; body: string }[];
}

const demo: Demo[] = [
  {
    name: "Dana Whitfield",
    company: "Northline Freight",
    role: "CEO",
    engagement_type: "executive",
    status: "active",
    monthly_fee: 6000,
    next: 2,
    beacon: "A leadership team that runs the business without routing every decision through Dana by Q2.",
    issue: "Leadership team escalates every cross-functional decision back to Dana.",
    constraint: "Decision rights were never made explicit when the company doubled; Dana is still the default owner of everything.",
    beliefs: ["If I step back, quality drops.", "My team wants me involved.", "Speed comes from me deciding."],
    code: ["Decide who decides before deciding.", "Escalations come with a recommendation."],
    drift: "Re-absorbed the pricing decision she delegated two weeks ago.",
    sessions: [
      {
        ago: 75,
        title: "Everything routes through Dana",
        summary: "Dana mapped a week of decisions and found 31 landed on her desk; most could have been made two levels down.",
        spine: {
          reduce: "The business has outgrown a structure where the CEO is the default decision-maker.",
          reframe: "Her involvement is not quality control; it is the bottleneck.",
          move: "Draft a decision-rights map for the top 10 recurring decisions by next session.",
          pressure_test: "She will be tempted to keep 'just the important ones', which is all of them.",
          integrate: "Weekly leadership meeting reviews any decision that bounced back up.",
        },
        themes: [
          ["decision rights", "decision rights", "CEO is the default owner of most cross-functional decisions."],
          ["founder dependence", "structure", "Leadership team waits for the top before moving."],
          ["leadership team alignment", "alignment", "Functional heads optimise for their own area, not the whole."],
        ],
        notes: "Dana logged 31 decisions last week. Ops and sales both escalate pricing exceptions. She admitted she likes being needed.",
      },
      {
        ago: 40,
        title: "Delegated pricing, then took it back",
        summary: "Dana delegated pricing exceptions to the COO, then pulled the decision back after one deal went sideways.",
        spine: {
          reduce: "One bad outcome triggered a retreat to control.",
          reframe: "The test of delegation is surviving the first mistake, not avoiding it.",
          move: "Return pricing exceptions to the COO with an explicit guardrail and a monthly review.",
          pressure_test: "Will she hold when the next exception goes wrong in front of a major customer?",
          integrate: "Add 'Decide who decides before deciding' to her Operating Code.",
        },
        themes: [
          ["decision rights", "decision rights", "Delegated authority was revoked after one bad outcome."],
          ["identity defending an outdated role", "identity", "Executive still sees herself as the best operator in the room."],
        ],
        notes: "COO frustrated. Dana: 'I just can't watch margin leak.' Agreed guardrail: exceptions under 8% are COO's call.",
      },
      {
        ago: 12,
        title: "Leadership team stops waiting",
        summary: "Two of four functional heads are now making calls without escalation; the other two are still waiting for permission.",
        spine: {
          reduce: "Half the team has absorbed the new decision rights; half hasn't.",
          reframe: "The holdouts aren't resisting; they've never been told the old rules are dead.",
          move: "Dana states in the leadership meeting which decisions she will no longer take.",
          pressure_test: "Saying it is easy; refusing to answer the next escalation is the real test.",
          integrate: "Escalations must arrive with a recommendation.",
        },
        themes: [
          ["decision rights", "decision rights", "Half the leadership team is still waiting for permission."],
          ["leadership team alignment", "alignment", "Team has different understandings of who owns what."],
        ],
        notes: "Finance and HR heads still escalate. Dana noticed she answers out of habit within minutes.",
      },
    ],
    commitments: [
      { owner: "client", text: "Announce the 5 decisions she no longer takes at Monday leadership meeting", due: 1 },
      { owner: "client", text: "Refuse to answer escalations that arrive without a recommendation", due: 9 },
      { owner: "operator", text: "Send Dana the decision-rights map template", due: -1 },
      { owner: "client", text: "Draft decision-rights map for top 10 decisions", due: -60, status: "done" },
    ],
    journal: [
      { ago: 40, kind: "drift", body: "Took pricing back after one bad deal. Classic control retreat." },
      { ago: 12, kind: "win", body: "COO closed three pricing exceptions without escalation." },
    ],
  },
  {
    name: "Marcus Oyelaran",
    company: "Brightwater Health",
    role: "COO",
    engagement_type: "executive",
    status: "active",
    monthly_fee: 5000,
    next: 5,
    beacon: "Be the operator who builds the system, not the hero who fixes the fire.",
    issue: "Promoted from VP Ops; still personally fixing operational fires.",
    constraint: "His identity and credibility are built on firefighting.",
    beliefs: ["The team respects me because I can do their jobs.", "If I don't fix it, nobody will."],
    code: ["Fix the system, not the incident."],
    sessions: [
      {
        ago: 60,
        title: "The hero problem",
        summary: "Marcus spent 60% of last month inside incidents his directors should own.",
        spine: {
          reduce: "He's doing his old job instead of his new one.",
          reframe: "Every fire he fixes teaches the team to wait for him.",
          move: "Stay out of the next three incidents entirely; debrief after.",
          pressure_test: "The CEO praises the firefighting, which rewards the old behaviour.",
          integrate: "Weekly system review replaces incident heroics.",
        },
        themes: [
          ["identity defending an outdated role", "identity", "Newly promoted executive still operating as the best individual contributor."],
          ["decision rights", "decision rights", "Directors defer operational calls upward."],
          ["leadership team alignment", "alignment", "CEO and COO disagree on what 'good' looks like in the role."],
        ],
        notes: "Marcus: 'If I'm not in the room, it takes twice as long.' CEO thanked him publicly for fixing the outage.",
      },
      {
        ago: 20,
        title: "Stayed out of the fire",
        summary: "Marcus stayed out of two incidents; one went fine, one went badly and he jumped in.",
        spine: {
          reduce: "Partial progress; the bad incident pulled him back.",
          reframe: "Directors need to be allowed to struggle, or they'll never own it.",
          move: "Agree with the CEO what the COO role is actually for.",
          pressure_test: "Is he avoiding the harder conversation with the CEO by staying busy?",
          integrate: "Incidents get a named director owner before Marcus is informed.",
        },
        themes: [
          ["identity defending an outdated role", "identity", "Jumped back into execution when an incident went badly."],
          ["ceo-coo alignment", "alignment", "Role expectations between CEO and COO were never agreed."],
        ],
        notes: "He felt 'useless' watching the second incident unfold.",
      },
    ],
    commitments: [
      { owner: "client", text: "Hold role-definition conversation with the CEO", due: 3 },
      { owner: "operator", text: "Share the COO role charter example", due: 2 },
    ],
    journal: [{ ago: 20, kind: "lesson", body: "Watching the team struggle felt like failure. It's the job." }],
  },
  {
    name: "Priya Raman",
    company: "Fernway Software",
    role: "Founder & CEO",
    engagement_type: "founder",
    status: "active",
    monthly_fee: 4500,
    next: 9,
    beacon: "Fernway grows past 50 people without Priya in every sales call.",
    issue: "All enterprise deals require Priya on the call to close.",
    constraint: "No sales narrative exists outside Priya's head.",
    beliefs: ["Customers buy because of me.", "Nobody else can explain the vision."],
    code: [],
    sessions: [
      {
        ago: 50,
        title: "Founder-led sales ceiling",
        summary: "Every deal over $50k has needed Priya; pipeline is capped by her calendar.",
        spine: {
          reduce: "Revenue is capped by founder availability.",
          reframe: "The vision isn't unexplainable; it's undocumented.",
          move: "Record her pitch on five calls and turn it into a sales narrative.",
          pressure_test: "She may quietly keep 'just the strategic accounts'.",
          integrate: "Head of sales runs one deal end-to-end with Priya silent.",
        },
        themes: [
          ["founder dependence", "structure", "Deals can't close without the founder present."],
          ["decision rights", "decision rights", "Sales team can't approve discounts or scope changes."],
          ["go-to-market alignment", "alignment", "Product and sales tell different stories about the product."],
        ],
        notes: "Priya on 14 sales calls last month. Head of sales has never closed a deal solo.",
      },
      {
        ago: 15,
        title: "Head of sales closes solo",
        summary: "Head of sales closed a $70k deal without Priya. Priya was relieved and slightly threatened.",
        spine: {
          reduce: "The dependence is breakable; it just broke.",
          reframe: "Her value is now upstream: the narrative, not the call.",
          move: "Give sales discount authority up to 15%.",
          pressure_test: "Watch for her re-inserting herself in the next big deal.",
          integrate: "Founder joins deals only by invitation from sales.",
        },
        themes: [
          ["founder dependence", "structure", "First deal closed without the founder; founder felt displaced."],
          ["identity defending an outdated role", "identity", "Founder's identity tied to being the closer."],
          ["decision rights", "decision rights", "Discount authority sits only with the founder."],
        ],
        notes: "Priya: 'Honestly it stung a bit.'",
      },
    ],
    commitments: [{ owner: "client", text: "Grant head of sales discount authority up to 15%", due: -2 }],
    journal: [{ ago: 15, kind: "win", body: "First enterprise deal closed without the founder." }],
  },
  {
    name: "Tom Achterberg",
    company: "Achterberg Joinery",
    role: "Owner",
    engagement_type: "owner",
    status: "active",
    monthly_fee: 2500,
    next: 14,
    issue: "Family members in the business disagree about whether to grow or stay small.",
    beliefs: ["Growth means losing what makes us good."],
    code: [],
    sessions: [
      {
        ago: 30,
        title: "Grow or stay small",
        summary: "Tom and his brother want different futures for the business and have never said so directly.",
        spine: {
          reduce: "Two owners, two strategies, no decision.",
          reframe: "The disagreement is about identity, not numbers.",
          move: "Each brother writes their 5-year picture independently.",
          pressure_test: "Tom may soften his picture to avoid conflict.",
          integrate: "Quarterly owners' meeting with an explicit strategy agenda.",
        },
        themes: [
          ["owner alignment", "alignment", "Co-owners hold incompatible pictures of the future."],
          ["decision rights", "decision rights", "No agreed way to break a tie between owners."],
        ],
        notes: "Brother wants to open a second workshop. Tom wants to stay at 12 people.",
      },
    ],
    commitments: [{ owner: "client", text: "Write 5-year picture and share with brother", due: 5 }],
    journal: [],
  },
  {
    name: "Elena Vasquez",
    company: "Corran Capital",
    role: "Managing Partner",
    engagement_type: "executive",
    status: "active",
    monthly_fee: 7000,
    next: 1,
    beacon: "A partnership that decides as a team, not as five individuals.",
    issue: "Partners re-litigate investment decisions after they're made.",
    beliefs: ["Consensus is the same as alignment."],
    code: [],
    sessions: [
      {
        ago: 45,
        title: "Decisions don't stay decided",
        summary: "Three investment decisions were reopened last quarter by partners who weren't happy.",
        spine: {
          reduce: "There's no rule for when a decision is final.",
          reframe: "Re-litigation is a symptom of unclear decision rights, not bad partners.",
          move: "Propose a 'disagree and commit' rule at the partner offsite.",
          pressure_test: "The senior founding partner benefits from the ambiguity.",
          integrate: "Decision log with owner and date for every investment call.",
        },
        themes: [
          ["decision rights", "decision rights", "Partnership has no rule for when a decision is final."],
          ["partner alignment", "alignment", "Partners agree in the room and dissent afterwards."],
          ["identity defending an outdated role", "identity", "Founding partner still acts as sole decision-maker."],
        ],
        notes: "Senior partner reopened two deals. Elena reluctant to confront him.",
      },
      {
        ago: 8,
        title: "Offsite prep",
        summary: "Elena drafted the decision rule but is planning to soften it before the offsite.",
        spine: {
          reduce: "She's pre-negotiating against herself.",
          reframe: "The softened rule is the current dysfunction with a new name.",
          move: "Bring the hard version to the offsite and let partners push back live.",
          pressure_test: "If the senior partner refuses, what's her walk-away?",
          integrate: "Decision log reviewed at every partner meeting.",
        },
        themes: [
          ["decision rights", "decision rights", "Leader is softening decision rules to avoid conflict."],
          ["partner alignment", "alignment", "Partners haven't agreed how they decide together."],
        ],
        notes: "Draft rule: decisions final after 48h unless new facts.",
      },
    ],
    commitments: [{ owner: "client", text: "Bring the unsoftened decision rule to the offsite", due: 4 }],
    journal: [{ ago: 8, kind: "decision", body: "Going into the offsite with the hard version of the rule." }],
  },
  {
    name: "James Whitcombe",
    company: "Halden Retail Group",
    role: "Chief Commercial Officer",
    engagement_type: "executive",
    status: "active",
    monthly_fee: 5500,
    next: 7,
    issue: "Struggling to let go of the merchandising role he held for a decade.",
    beliefs: ["Nobody knows the buyers like I do."],
    code: [],
    sessions: [
      {
        ago: 25,
        title: "Still the head buyer",
        summary: "James is still approving every range decision despite having a head of merchandising.",
        spine: {
          reduce: "He hired his replacement and never let her replace him.",
          reframe: "His expertise has become the team's ceiling.",
          move: "Stop attending range reviews for one cycle.",
          pressure_test: "He'll find a reason the next range is 'too important'.",
          integrate: "Range sign-off sits with the head of merchandising.",
        },
        themes: [
          ["identity defending an outdated role", "identity", "Executive still performing his previous role a decade on."],
          ["decision rights", "decision rights", "Range decisions require his approval despite a new head of merchandising."],
          ["commercial team alignment", "alignment", "Team unsure who actually owns range decisions."],
        ],
        notes: "Head of merchandising considering leaving. James unaware.",
      },
    ],
    commitments: [{ owner: "client", text: "Skip next range review", due: 6 }],
    journal: [],
  },
  {
    name: "Sofia Lindqvist",
    company: "Kestrel Robotics",
    role: "Co-founder",
    engagement_type: "founder",
    status: "active",
    monthly_fee: 4000,
    next: 11,
    issue: "Co-founders disagree on whether to raise or stay bootstrapped.",
    beliefs: ["Raising money means losing control."],
    code: [],
    sessions: [
      {
        ago: 35,
        title: "Raise or bootstrap",
        summary: "Sofia and her co-founder have been circling the funding question for six months.",
        spine: {
          reduce: "The founders don't share a picture of what success looks like.",
          reframe: "The funding question is downstream of the ambition question.",
          move: "Each founder defines 'success in 5 years' separately, then compare.",
          pressure_test: "She may avoid stating her real ambition to keep the peace.",
          integrate: "Monthly founder alignment session.",
        },
        themes: [
          ["co-founder alignment", "alignment", "Co-founders disagree about the company's ambition."],
          ["founder dependence", "structure", "Engineering team waits on founders for every technical direction call."],
        ],
        notes: "Six months of circling. Board seat offer on the table.",
      },
    ],
    commitments: [{ owner: "client", text: "Write 'success in 5 years' and share with co-founder", due: -3 }],
    journal: [],
  },
  {
    name: "Rachel Okafor",
    company: "Meridian Partners",
    role: "CEO",
    engagement_type: "executive",
    status: "prospect",
    pipeline_stage: "proposal",
    pipeline_value: 48000,
    issue: "New CEO inheriting a leadership team loyal to the founder.",
    beliefs: [],
    code: [],
    sessions: [],
    commitments: [{ owner: "operator", text: "Send proposal for 6-month executive engagement", due: 2 }],
    journal: [],
  },
  {
    name: "Ben Hartley",
    company: "Hartley & Sons",
    role: "Managing Director",
    engagement_type: "owner",
    status: "prospect",
    pipeline_stage: "conversation",
    pipeline_value: 24000,
    issue: "Succession planning; next generation not ready.",
    beliefs: [],
    code: [],
    sessions: [],
    commitments: [],
    journal: [],
  },
];

async function main() {
  const existing = await store.list("clients");
  if (existing.length && !process.argv.includes("--force")) {
    console.log(`Store already has ${existing.length} clients. Re-run with --force to add demo data anyway.`);
    return;
  }
  const now = new Date().toISOString();

  for (const d of demo) {
    const [client] = await store.insert("clients", [
      {
        name: d.name,
        company: d.company,
        role: d.role,
        engagement_type: d.engagement_type,
        status: d.status,
        pipeline_stage: d.pipeline_stage ?? (d.status === "active" ? "won" : null),
        pipeline_value: d.pipeline_value ?? null,
        monthly_fee: d.monthly_fee ?? null,
        next_session_at: d.next !== undefined ? at(d.next, 10) : null,
        current_issue: d.issue,
        beliefs: d.beliefs,
        real_constraint: d.constraint ?? null,
        strategic_beacon: d.beacon ?? null,
        operating_code: d.code,
        drift: d.drift ?? null,
        notes: null,
        aliases: [],
        updated_at: now,
      },
    ]);

    for (const s of d.sessions) {
      const [session] = await store.insert("sessions", [
        {
          client_id: client.id,
          held_at: day(-s.ago),
          title: s.title,
          status: "processed",
          pre_notes: null,
          prep: null,
          raw_notes: s.notes,
          processed_at: now,
          analysis: {
            summary: s.summary,
            spine: s.spine,
            what_changed: [],
            drift: [],
            breakthroughs: [],
            record_updates: {
              current_issue: null,
              real_constraint: null,
              beliefs: null,
              drift: null,
              strategic_beacon_suggestion: null,
              operating_code_suggestions: [],
            },
            next_session_focus: s.spine.pressure_test,
          },
        },
      ]);
      await store.insert(
        "theme_mentions",
        s.themes.map(([theme, category, evidence]) => ({ client_id: client.id, session_id: session.id, theme, category, evidence, occurred_at: day(-s.ago) })),
      );
    }

    await store.insert(
      "commitments",
      d.commitments.map((c) => ({
        client_id: client.id,
        session_id: null,
        owner: c.owner,
        text: c.text,
        due_date: c.due === null ? null : day(c.due),
        status: c.status ?? "open",
        completed_at: c.status === "done" ? now : null,
      })),
    );
    await store.insert(
      "journal_entries",
      d.journal.map((j) => ({ client_id: client.id, session_id: null, entry_date: day(-j.ago), kind: j.kind, body: j.body })),
    );
  }

  await store.insert("assets", [
    { title: "Strategic Beacon Worksheet", kind: "worksheet", description: "Define the direction everything else is measured against.", url: null, themes: ["strategic drift", "owner alignment"] },
    { title: "The Operator's Edge — Ch. 3: Identity Lag", kind: "chapter", description: "Why leaders keep doing the job they were promoted out of.", url: null, themes: ["identity defending an outdated role"] },
  ]);

  await store.insert("content_items", [
    {
      source_session_id: null,
      format: "linkedin",
      title: "Your involvement isn't quality control. It's the bottleneck.",
      hook: "31 decisions landed on one CEO's desk last week. 25 of them didn't need to.",
      insight: "Leaders who grew the company by deciding fast often become the reason it can't grow further. The fix isn't stepping back; it's making decision rights explicit.",
      outline: ["The 31-decision audit", "Why 'just the important ones' is all of them", "Decide who decides before deciding"],
      themes: ["decision rights", "founder dependence"],
      status: "idea",
      redaction_flags: [],
    },
  ]);

  console.log(`Seeded ${demo.length} clients into the ${store.kind} store.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
