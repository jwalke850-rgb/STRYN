-- STRYN Operator Console — V1 schema.
-- Single-operator app: the server talks to Postgres with the service-role key,
-- so RLS is enabled with no policies (deny-all for anon/authenticated keys).

create extension if not exists pgcrypto;

create table clients (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  name text not null,
  company text,
  role text,
  engagement_type text,
  status text not null default 'prospect' check (status in ('prospect','active','paused','alumni')),
  pipeline_stage text check (pipeline_stage in ('lead','conversation','proposal','won','lost')),
  pipeline_value numeric,
  monthly_fee numeric,
  next_session_at timestamptz,
  current_issue text,
  beliefs text[] not null default '{}',
  real_constraint text,
  strategic_beacon text,
  operating_code text[] not null default '{}',
  drift text,
  notes text,
  aliases text[] not null default '{}'
);

create table sessions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  client_id uuid not null references clients(id) on delete cascade,
  held_at date not null default current_date,
  title text,
  status text not null default 'draft' check (status in ('draft','prepped','processed')),
  pre_notes text,
  prep jsonb,
  raw_notes text,
  analysis jsonb,
  processed_at timestamptz
);
create index sessions_client_idx on sessions (client_id, held_at desc);

create table commitments (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  client_id uuid not null references clients(id) on delete cascade,
  session_id uuid references sessions(id) on delete set null,
  owner text not null default 'client' check (owner in ('client','operator')),
  text text not null,
  due_date date,
  status text not null default 'open' check (status in ('open','done','dropped')),
  completed_at timestamptz
);
create index commitments_open_idx on commitments (status, due_date);

create table journal_entries (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  client_id uuid not null references clients(id) on delete cascade,
  session_id uuid references sessions(id) on delete set null,
  entry_date date not null default current_date,
  kind text not null check (kind in ('win','loss','lesson','decision','drift')),
  body text not null
);

create table theme_mentions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  client_id uuid not null references clients(id) on delete cascade,
  session_id uuid not null references sessions(id) on delete cascade,
  theme text not null,
  category text not null,
  evidence text not null,
  occurred_at date not null
);
create index theme_mentions_theme_idx on theme_mentions (theme, occurred_at desc);

create table content_items (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  source_session_id uuid references sessions(id) on delete set null,
  format text not null check (format in ('youtube','linkedin','worksheet','stryn_material')),
  title text not null,
  hook text not null,
  insight text not null,
  outline text[] not null default '{}',
  themes text[] not null default '{}',
  status text not null default 'idea' check (status in ('idea','drafting','ready','published','discarded')),
  redaction_flags text[] not null default '{}'
);

create table assets (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  title text not null,
  kind text not null check (kind in ('framework','worksheet','video','script','chapter','tool')),
  description text,
  url text,
  themes text[] not null default '{}'
);

create table pattern_briefs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  headline text not null,
  insights jsonb not null default '[]',
  asset_gaps jsonb not null default '[]'
);

alter table clients enable row level security;
alter table sessions enable row level security;
alter table commitments enable row level security;
alter table journal_entries enable row level security;
alter table theme_mentions enable row level security;
alter table content_items enable row level security;
alter table assets enable row level security;
alter table pattern_briefs enable row level security;
