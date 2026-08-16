# Setup

This app has no server to run yourself. It's a static React site (deployed
to Vercel) backed by Firebase (Firestore for data, Firebase Auth for your
one owner login) — both free-tier, nothing to provision or maintain.

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

## 4. Deploy to Vercel

1. Go to https://vercel.com → sign up/in (GitHub login is easiest) → **Add
   New… → Project** → import `thatguy-bridger/Portfolio`.
2. Vercel auto-detects Vite; leave the build settings as-is.
3. Before deploying, add the same six `VITE_FIREBASE_*` variables from your
   `.env.local` under **Environment Variables**.
4. Deploy. You'll get a free `*.vercel.app` URL immediately — sign in at
   `/login` there the same way to confirm it works end-to-end.

## 5. Point portfolio.bridgerjones.com at it

1. In the Vercel project: **Settings → Domains → Add** →
   `portfolio.bridgerjones.com`. Vercel will show you a DNS target
   (typically a CNAME to `cname.vercel-dns.com`).
2. In Namecheap: **Domain List → Manage** (bridgerjones.com) →
   **Advanced DNS → Add New Record**:
   - Type: `CNAME Record`
   - Host: `portfolio`
   - Value: `cname.vercel-dns.com` (use the exact value Vercel shows you)
   - TTL: Automatic
3. Save. DNS usually propagates within a few minutes to a few hours; Vercel
   auto-issues an SSL certificate once it sees the record.

That's it — `portfolio.bridgerjones.com` will always show whatever you last
hit **Publish** on at `/edit`.
