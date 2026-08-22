-- Portfolio rewrite — initial schema (Phase 0).
--
-- Auth model: there is no Supabase Auth usage at all here. Every table has
-- Row Level Security enabled with zero policies, which means the anon and
-- authenticated Postgres roles get nothing — not even a public SELECT. The
-- ONLY caller that ever touches these tables is the Astro server, using the
-- service-role key (which bypasses RLS by design), and the Astro server only
-- allows that after verifying a Firebase session cookie itself (see
-- src/middleware.ts). So "signed in" is decided once, by Firebase, on the
-- server — Postgres just refuses everyone else outright.

create extension if not exists pgcrypto;

create type content_status as enum ('draft', 'published');

-- ============================================================
-- Pages (freeform block-canvas driven, see Phase 2)
-- ============================================================
create table public.pages (
  id uuid primary key default gen_random_uuid(),
  path text not null unique,
  title text not null,
  status content_status not null default 'draft',
  draft_blocks jsonb not null default '[]'::jsonb,
  published_blocks jsonb,
  draft_updated_at timestamptz,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- Contact form submissions
-- ============================================================
create table public.contact_submissions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  message text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

-- ============================================================
-- Media library (filled out in Phase 4) — one row per uploaded file,
-- storage_path points into a Supabase Storage bucket created separately.
-- ============================================================
create table public.media_library (
  id uuid primary key default gen_random_uuid(),
  storage_path text not null,
  file_name text not null,
  content_type text not null,
  size_bytes bigint not null,
  width int,
  height int,
  created_at timestamptz not null default now()
);

-- ============================================================
-- Revision history (filled out in Phase 5) — one row per saved change,
-- diffable against the previous row for the same owner_id.
-- ============================================================
create table public.revision_history (
  id uuid primary key default gen_random_uuid(),
  owner_type text not null check (owner_type in ('page')),
  owner_id uuid not null,
  blocks jsonb not null,
  created_at timestamptz not null default now()
);
create index revision_history_owner_idx on public.revision_history (owner_type, owner_id, created_at desc);

-- ============================================================
-- Row Level Security — enabled, no policies (see note at top of file)
-- ============================================================
alter table public.pages enable row level security;
alter table public.contact_submissions enable row level security;
alter table public.media_library enable row level security;
alter table public.revision_history enable row level security;
