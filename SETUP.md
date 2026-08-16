# Setup

This app has no server to run yourself. It's a static React site (deployed
via GitHub Pages) backed by Firebase (Firestore for data, Firebase Auth for
your one owner login) — both free, nothing to provision or maintain.

Two things happen once you're set up:

- **`/edit`** — the builder. Sign in, edit your site live, changes autosave
  as a draft. Hit **Publish** to make them go live.
- **`/`** — the public site. Always shows the last **published** version.
  Nobody can edit it without signing in.

## 1. Create the Firebase project

1. Go to https://console.firebase.google.com → **Add project** → name it
   anything (e.g. `portfolio-builder`) → finish the wizard (Analytics is
   optional, skip if you don't want it).
2. In the left sidebar: **Build → Firestore Database → Create database** →
   start in **production mode** → pick any region close to you.
3. In the left sidebar: **Build → Authentication → Get started** → enable
   the **Email/Password** sign-in provider.
4. Still in Authentication, go to the **Users** tab → **Add user** → enter
   the email + password you want to sign in with. This is your one owner
   account — there's no public sign-up.
5. In the left sidebar: **Project settings** (gear icon) → scroll to
   **Your apps** → click the **</>** (web) icon → register an app (any
   nickname, no hosting needed) → copy the `firebaseConfig` values shown.

## 2. Set the Firestore security rules

In the Firebase console: **Firestore Database → Rules**, replace the
contents with what's in [`firestore.rules`](./firestore.rules) in this repo,
then **Publish**. This makes the published site publicly readable while
only your signed-in account can write anything.

## 3. Configure the app locally

```bash
cp .env.example .env.local
```

Fill in `.env.local` with the `firebaseConfig` values from step 1.5:

| .env.local key                     | firebaseConfig field |
|-------------------------------------|-----------------------|
| `VITE_FIREBASE_API_KEY`             | `apiKey`              |
| `VITE_FIREBASE_AUTH_DOMAIN`         | `authDomain`          |
| `VITE_FIREBASE_PROJECT_ID`          | `projectId`           |
| `VITE_FIREBASE_STORAGE_BUCKET`      | `storageBucket`       |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `messagingSenderId`   |
| `VITE_FIREBASE_APP_ID`              | `appId`               |

Then:

```bash
npm install
npm run dev
```

Visit `http://localhost:5173/login`, sign in with the user you created in
step 1.4, and you'll land in `/edit`. Try editing some text and watch the
"Saving… / Saved" indicator, then hit **Publish** and check `/` updates.

## 4. Deploy via GitHub Pages

Deployment is automatic: [`.github/workflows/deploy.yml`](./.github/workflows/deploy.yml)
builds and publishes the app on every push to `main` (and can also be run
manually from the **Actions** tab).

> **Note:** GitHub Pages via Actions is free for **public** repositories.
> If `thatguy-bridger/Portfolio` is private, either make it public or
> you'll need a paid GitHub plan (Pro/Team/Enterprise) that includes Pages
> for private repos.

1. Add your Firebase config as **repository secrets** (not the same as
   `.env.local` — GitHub Actions can't read that file): on GitHub, go to
   **Settings → Secrets and variables → Actions → New repository secret**,
   and add each of these six, with the same values as your `.env.local`:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`
2. Go to **Settings → Pages → Build and deployment → Source**, and set it
   to **GitHub Actions** (not "Deploy from a branch").
3. Merge this work into `main` (or, to test first, go to the **Actions**
   tab → **Deploy to GitHub Pages** → **Run workflow** and pick this
   branch). Watch the workflow run — it builds the app and publishes it.
4. Once it succeeds, your site is live at `https://thatguy-bridger.github.io/Portfolio/`
   until the custom domain below takes over. Sign in at `/login` there to
   confirm it works end-to-end.

## 5. Point portfolio.bridgerjones.com at it

The repo already includes a [`public/CNAME`](./public/CNAME) file containing
`portfolio.bridgerjones.com`, so every deploy tells GitHub Pages to serve
that domain — you don't need to re-enter it after each deploy.

1. In Namecheap: **Domain List → Manage** (bridgerjones.com) →
   **Advanced DNS → Add New Record**:
   - Type: `CNAME Record`
   - Host: `portfolio`
   - Value: `thatguy-bridger.github.io.`
   - TTL: Automatic
2. Save, then in GitHub: **Settings → Pages**, confirm the custom domain
   shows `portfolio.bridgerjones.com` with a green checkmark (DNS check
   passed), and tick **Enforce HTTPS** once it's available (GitHub
   auto-issues the certificate — this can take anywhere from a few minutes
   to a few hours after DNS propagates).

That's it — `portfolio.bridgerjones.com` will always show whatever you last
hit **Publish** on at `/edit`.
