# Setup

This app is an Astro site (server-rendered, deployed on Vercel) backed by
**Supabase** (Postgres database + file storage for your content) and
**Firebase Auth** (just your one owner login — nothing else from Firebase is
used anymore). Both have free tiers, nothing to run yourself.

Two things happen once you're set up:

- **`/admin`** — the editor. Sign in, edit your site, changes autosave as a
  draft. Hit **Publish** to make them go live.
- **`/`** — the public site. Always shows the last **published** version.
  Nobody can edit it without signing in. Because Astro renders per-request,
  a publish is live immediately — no rebuild wait. On a brand-new database
  there's no homepage yet: sign in, create a page at path `/` in
  **Admin → Pages**, add some content, and hit **Publish** — until then `/`
  (and every other unpublished path) shows a 404, by design.

## 1. Firebase (Auth only)

If you still have the Firebase project from the old app, you can reuse it —
you only need the **Authentication** piece now; Firestore/Storage from the
old setup are unused and safe to ignore or delete.

1. https://console.firebase.google.com → your project (or **Add project** if
   starting fresh).
2. Left sidebar → **Build → Authentication**. Confirm the **Email/Password**
   provider is enabled, and that your owner account exists under the
   **Users** tab (add one if not — that's your only sign-in, no public
   sign-up).
3. Left sidebar → **Project settings** (gear icon) → **Your apps** → the web
   app already registered (or register one, no hosting needed) → copy the
   `firebaseConfig` values.
4. Still in **Project settings → Service accounts** → **Generate new private
   key**. This downloads a JSON file — you'll need its *entire contents* as
   one line for `FIREBASE_SERVICE_ACCOUNT_JSON` below. One way to flatten it:
   ```bash
   node -e "console.log(JSON.stringify(require('/path/to/downloaded-key.json')))"
   ```
   Keep this file private — it's a real credential, not a public config
   value like the ones in step 3.

## 2. Supabase (database + file storage)

1. https://supabase.com → **New project** → pick a name/region/password
   (the DB password isn't something you'll need day-to-day, just save it
   somewhere).
2. Once it's provisioned: left sidebar → **SQL Editor** → **New query** →
   paste the contents of [`supabase/migrations/0001_init.sql`](./supabase/migrations/0001_init.sql)
   → **Run**. This creates the tables the app needs. (Later migrations in
   `supabase/migrations/` get added the same way, in order, as new phases
   ship — or install the [Supabase CLI](https://supabase.com/docs/guides/local-development/cli/getting-started)
   and run `supabase db push` if you'd rather not copy-paste each one.)
3. Left sidebar → **Project Settings → API** → copy the **Project URL** and
   the **`service_role` secret** key (not the `anon` key — the app only ever
   talks to Supabase from the server, using the service-role key, so the
   browser never gets any Supabase credentials at all).
4. Left sidebar → **SQL Editor** → **New query** → paste the contents of
   [`supabase/migrations/0002_media_storage.sql`](./supabase/migrations/0002_media_storage.sql)
   → **Run**. This creates the `media` Storage bucket the media library
   uploads into (public read, so uploaded images render on the live site;
   writes only ever happen server-side via `/api/admin/media`, using the
   same service-role key as everything else — nothing here needs a separate
   credential). No env var to add: the bucket name (`media`) is a plain
   constant in `src/lib/media.ts`, not configuration.

## 3. Configure the app locally

```bash
cp .env.example .env.local
```

Fill in `.env.local`:

| .env.local key                  | Where it comes from                          |
|----------------------------------|-----------------------------------------------|
| `PUBLIC_FIREBASE_API_KEY`        | Firebase `firebaseConfig.apiKey`               |
| `PUBLIC_FIREBASE_AUTH_DOMAIN`    | Firebase `firebaseConfig.authDomain`           |
| `PUBLIC_FIREBASE_PROJECT_ID`     | Firebase `firebaseConfig.projectId`            |
| `PUBLIC_FIREBASE_APP_ID`         | Firebase `firebaseConfig.appId`                |
| `FIREBASE_SERVICE_ACCOUNT_JSON`  | The flattened service-account JSON, step 1.4   |
| `SUPABASE_URL`                   | Supabase Project URL, step 2.3                 |
| `SUPABASE_SERVICE_ROLE_KEY`      | Supabase `service_role` secret, step 2.3       |

Then:

```bash
npm install
npm run dev
```

Visit `http://localhost:4321/admin/login`, sign in, and you should land on
`/admin` showing "Supabase: ✅ Connected" — that confirms both Firebase Auth
and the Supabase connection are wired correctly before you deploy anywhere.

## 4. Deploy on Vercel

1. https://vercel.com → **Add New… → Project** → import
   `thatguy-bridger/Portfolio` (Vercel's GitHub integration will ask to
   install itself on the repo/org the first time).
2. Framework preset should auto-detect as **Astro** — leave build settings
   at their defaults.
3. Before the first deploy (or right after, then redeploy): **Settings →
   Environment Variables**, add all seven keys from the table above with
   their real values, for both **Production** and **Preview** environments.
4. Deploy. From here on, **every push to `main` deploys automatically** —
   no workflow file, no manual steps. (The old `.github/workflows/deploy.yml`
   for GitHub Pages has been removed; it's no longer needed.)
5. Visit the `*.vercel.app` URL Vercel gives you, sign in at `/admin/login`,
   confirm the same "Supabase: ✅ Connected" check passes there too.

## 5. Point portfolio.bridgerjones.com at it

1. In the Vercel project: **Settings → Domains → Add** →
   `portfolio.bridgerjones.com`. Vercel will show you the DNS record it
   needs (usually a `CNAME` to `cname.vercel-dns.com`).
2. In Namecheap: **Domain List → Manage** (bridgerjones.com) →
   **Advanced DNS**. Remove the old `CNAME` record pointing at
   `thatguy-bridger.github.io` (from the GitHub Pages setup) and add the new
   one Vercel showed you:
   - Type: `CNAME Record`
   - Host: `portfolio`
   - Value: (whatever Vercel showed, e.g. `cname.vercel-dns.com.`)
   - TTL: Automatic
3. Back in Vercel, wait for the domain to show **Valid Configuration** (DNS
   propagation can take anywhere from a few minutes to a few hours) — it
   issues HTTPS automatically once that happens.

That's it — `portfolio.bridgerjones.com` will show whatever's currently
published, live, with no rebuild delay.
