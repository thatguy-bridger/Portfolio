-- Portfolio rewrite — publish history + throttled draft revisions (Phase 5).
--
-- Migrations are append-only (see 0001_init.sql's own note) — this file only
-- adds to the schema, never edits 0001/0002.
--
-- Design choice: extend the existing `revision_history` table with an
-- `event_type` column rather than adding a separate `publish_history` table.
-- A publish snapshot and a draft-save snapshot are the exact same shape —
-- "this page's blocks, at this moment in time" — so a second table would
-- just duplicate owner_type/owner_id/blocks/created_at verbatim. Keeping
-- one table lets a page's History UI render a single chronological timeline
-- (draft saves interleaved with publishes) with one query and one diff
-- function (src/lib/history/diff.ts) working over both kinds of row, and
-- lets rollback simply be "find a row with event_type='publish', copy its
-- blocks back onto published_blocks, and log that copy as a new publish
-- event" rather than needing a join across two tables.
alter table public.revision_history
  add column event_type text not null default 'draft_save'
    check (event_type in ('draft_save', 'publish'));

-- The history UI and the rollback endpoint both filter/order by
-- (owner, event_type, recency) — e.g. "list only this page's publishes,
-- newest first" for the rollback list, or "has a draft_save been logged for
-- this page in the last 2 minutes" for the autosave throttle
-- (src/pages/api/admin/pages/[id].ts). The existing
-- revision_history_owner_idx (owner_type, owner_id, created_at desc) from
-- 0001_init.sql still serves the full-timeline read; this one adds
-- event_type as a leading column for the event_type-filtered reads.
create index revision_history_owner_event_idx
  on public.revision_history (owner_type, owner_id, event_type, created_at desc);
