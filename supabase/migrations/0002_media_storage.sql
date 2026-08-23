-- Portfolio rewrite — media library storage bucket (Phase 4).
--
-- Migrations are append-only (see 0001_init.sql) — this file only adds to
-- the schema, never edits 0001.
--
-- The `media` bucket holds every file an admin uploads through
-- /api/admin/media (see src/lib/media.ts for the shared bucket-name
-- constant). It's a *public* bucket purely so uploaded images are directly
-- fetchable by anonymous visitors on the live site (getPublicUrl gives a
-- stable, unsigned URL) — that public-read policy is the ONLY access anon/
-- authenticated Postgres roles get. Every write (upload/delete) goes through
-- Astro's /api/admin/media endpoints using the service-role key, which
-- bypasses storage RLS entirely, same "the server is the only trusted
-- writer" convention as every other table in this app (see 0001_init.sql's
-- top-of-file note). There is deliberately no insert/update/delete policy
-- for anon/authenticated below.
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

create policy "media public read"
  on storage.objects for select
  to public
  using (bucket_id = 'media');
