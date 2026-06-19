# 🚀 Launch Summer Pact for you + your friend

This gets you from "demo on my laptop" to a **real shared pact** where you both
sign in with your own email and see each other's XP, receipts, streaks, nudges,
and boss fights live.

Total time: ~25–30 minutes. You need a (free) Supabase account and a (free)
Vercel account. No credit card required for either.

---

## Step 1 — Create the Supabase project (the shared database)

1. Go to **[supabase.com](https://supabase.com)** → sign in (Google works) →
   **New project**.
2. Name it `summer-pact`, set a database password (save it somewhere), pick the
   region closest to you, and create it. Wait ~2 minutes for it to spin up.

## Step 2 — Create the database tables

1. In your project, open **SQL Editor** (left sidebar) → **New query**.
2. Open the file [`supabase/schema.sql`](supabase/schema.sql) from this project,
   **copy the entire contents**, paste into the editor, and click **Run**.
3. You should see "Success. No rows returned." This created all the tables,
   security rules, the `join_pact` function, and the `proofs` storage bucket.

## Step 3 — Turn on email login

1. Go to **Authentication → Sign In / Providers** and make sure **Email** is
   enabled (it is by default). Magic links work out of the box.
2. Go to **Authentication → URL Configuration** and under **Redirect URLs**
   add these two (you'll get the Vercel one in Step 6 — come back and add it):
   - `http://localhost:3000/**`
   - `https://YOUR-APP.vercel.app/**`

> Tip: while testing, Supabase's built-in email sender is rate-limited. For just
> two people it's fine. If links are slow, check the **Authentication → Users**
> area or your spam folder.

## Step 4 — Grab your API keys

1. Go to **Project Settings → API**.
2. Copy two values:
   - **Project URL** (e.g. `https://abcdxyz.supabase.co`)
   - **anon public** key (a long string — safe to expose; your data is
     protected by the security rules from Step 2).

## Step 5 — Test it locally first (recommended)

1. In the project folder, create a file called `.env.local` (copy from
   `.env.example`) and fill in:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://abcdxyz.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   NEXT_PUBLIC_SUPABASE_PROOF_BUCKET=proofs
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   ```
2. Run:
   ```bash
   npm install
   npm run dev
   ```
3. Open http://localhost:3000 → **Sign in** → enter your email → click the
   magic link in your inbox → set your name → **Create a new pact** → copy the
   invite code. 🎉 You're live locally. (The "Demo mode" banner is gone — that's
   how you know Supabase is connected.)

## Step 6 — Deploy to the internet with Vercel

1. **Put the code on GitHub** (so Vercel can read it). In the project folder:
   ```bash
   git init
   git add .
   git commit -m "Summer Pact"
   ```
   Then create an empty repo at [github.com/new](https://github.com/new) and run
   the two commands GitHub shows you (`git remote add origin …` and
   `git push -u origin main`).
2. Go to **[vercel.com](https://vercel.com)** → sign in with GitHub → **Add New
   → Project** → import your `summer-pact` repo.
3. Before clicking Deploy, expand **Environment Variables** and add the same
   four from Step 5 — but set `NEXT_PUBLIC_SITE_URL` to your Vercel URL (you can
   edit it right after the first deploy once you know the exact URL):
   ```
   NEXT_PUBLIC_SUPABASE_URL          = https://abcdxyz.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY     = your-anon-key
   NEXT_PUBLIC_SUPABASE_PROOF_BUCKET = proofs
   NEXT_PUBLIC_SITE_URL              = https://YOUR-APP.vercel.app
   ```
4. Click **Deploy**. In ~1 minute you'll get a live URL like
   `https://summer-pact-xyz.vercel.app`.
5. **Go back to Supabase → Authentication → URL Configuration** and make sure
   that exact Vercel URL is in the Redirect URLs (Step 3). Without this, magic
   links from production won't log you in.

## Step 7 — You both join the same pact

1. **You:** open the Vercel URL → sign in with your email → create your pact →
   set 2–4 goals. Copy your **invite code** (it's on the Pact page too).
2. **Your friend:** open the same Vercel URL on their phone/laptop → sign in
   with *their* email → on onboarding choose **Join with a code** → paste your
   invite code → add their goals.
3. Done. You're now in one shared pact. Submit a receipt and your friend will
   see your XP, streak, and latest receipt update — and vice versa. 🤝

---

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| Still seeing the "Demo mode" banner | Env vars aren't loaded. Locally: restart `npm run dev` after editing `.env.local`. On Vercel: add the vars then **Redeploy**. |
| Magic link logs me out / "auth error" | The URL you're using isn't in Supabase → Auth → URL Configuration → Redirect URLs. Add it (with `/**`). |
| Friend can't join — "No pact found" | Codes are case-insensitive but must match exactly. Re-copy it from your Pact page. |
| "This pact is full" | A pact is capped at 2 people. If you tested with extra logins, remove stray rows in Supabase → Table Editor → `pact_members`. |
| Proof image won't upload | Make sure the `proofs` storage bucket exists and is **public** (Step 2 creates it; check Supabase → Storage). |
| Want to start fresh | In Supabase → Table Editor, delete rows from `pact_members`, `pacts`, `goals`, `check_ins`. Or just create a new pact. |

That's it — have a great summer. **Receipts, not vibes.** 🌅
