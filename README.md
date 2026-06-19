# ☀️ Summer Pact — _Receipts, not vibes._

A private **2-person summer accountability game**. You and one friend set
individual goals, submit daily **receipts** of progress, earn XP, keep streaks
alive, nudge each other (kindly), and get weekly AI-style reviews with a
**boss fight** challenge.

Built with **Next.js (App Router) · TypeScript · Tailwind · Supabase · Recharts**.

> **Runs instantly with zero setup.** Without Supabase keys the app boots in
> **demo mode** — a fully interactive pact (you + "Riley") persisted in your
> browser's localStorage. Add Supabase keys whenever you want it real and
> multiplayer.

---

## Quick start

```bash
npm install
npm run dev
# open http://localhost:3000
```

You'll land on the marketing page. Hit **Create your pact** (or **Sign in →
Enter the demo**) to explore a pre-seeded, lively dashboard.

---

## Pages

| Route             | What it does                                                        |
| ----------------- | ------------------------------------------------------------------- |
| `/`               | Landing page — name, slogan, CTAs                                    |
| `/login`          | Supabase magic-link auth (or "Enter the demo" in demo mode)         |
| `/onboarding`     | 3-step wizard: name → create/join pact → first goal                 |
| `/dashboard`      | Cozy command center: XP, streak, weekly progress, friend status     |
| `/goals`          | Create / edit / archive 2–4 goals                                   |
| `/check-in`       | Submit a daily **receipt** (effort, mood, proof, next step) + XP    |
| `/pact`           | Both members side by side with status labels                        |
| `/nudges`         | Generate supportive (never shamey) nudges when a friend goes quiet  |
| `/save-me`        | "Save me from myself" panic button + 5-min task + sprint timer      |
| `/weekly-review`  | Weekly recap, XP chart, kind-but-honest reflection, boss fight      |
| `/archive`        | Whole-summer summary + "letter to future me"                        |

---

## XP rules

| Effort | Base XP |
| ------ | ------- |
| 1      | 5       |
| 2      | 10      |
| 3      | 20      |
| 4      | 35      |
| 5      | 50      |

- **+10 XP** if proof is uploaded
- **+15 XP** if tomorrow's tiny next step is included

(See [`src/lib/xp.ts`](src/lib/xp.ts).)

---

## Environment variables

Copy the example and fill in what you need:

```bash
cp .env.example .env.local
```

| Variable                            | Required? | Purpose                                   |
| ----------------------------------- | --------- | ----------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`          | for live  | Supabase project URL                      |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`     | for live  | Supabase anon/public key                  |
| `NEXT_PUBLIC_SUPABASE_PROOF_BUCKET` | optional  | Storage bucket for proof uploads (`proofs`) |
| `NEXT_PUBLIC_SITE_URL`              | for live  | Base URL for magic-link redirects         |
| `ANTHROPIC_API_KEY` / `OPENAI_API_KEY` | later  | Swap deterministic AI for a real model    |

**No Supabase vars → demo mode.** The app detects this via
[`isSupabaseConfigured()`](src/lib/supabase/config.ts) and falls back to the
local store, showing a "Demo mode" banner.

---

## Going live with Supabase (real shared 2-person mode)

**👉 Full step-by-step with screenshots-worth-of-detail: [LAUNCH.md](LAUNCH.md).**

Short version:

1. Create a project at [supabase.com](https://supabase.com).
2. **SQL Editor → New query →** paste all of
   [`supabase/schema.sql`](supabase/schema.sql) and run it. This creates the
   tables, RLS policies, the `join_pact` function, an auto-profile trigger, and
   the public `proofs` storage bucket.
3. **Project Settings → API**: copy the URL + anon key into `.env.local`.
4. **Authentication → URL Configuration**: add your local + Vercel URLs (with
   `/**`) to Redirect URLs so magic links work.
5. Restart `npm run dev`. The demo banner disappears and the app now reads/writes
   the shared database.

> **How it works:** [`src/lib/store.ts`](src/lib/store.ts) is one data layer with
> two backends. With no env vars it uses localStorage (demo). With Supabase env
> vars it hydrates from the database, writes every mutation back, and subscribes
> to **realtime** updates so both members see each other's XP, receipts, nudges,
> and boss fights as they happen. The UI and types are identical in both modes.

---

## AI integration

[`src/lib/ai.ts`](src/lib/ai.ts) exposes:

- `generateWeeklyReview`
- `generateBossFight`
- `generateSaveMeTask`
- `generateNudgeMessage` (+ `generateNudgeMessageOptions`)

All are **deterministic templates** today (no API key required) and each marks
a `// === LLM SWAP POINT ===` showing exactly where to drop in a Claude/OpenAI
call. They're already `async`, so swapping in a fetch needs no signature change.

---

## Deploy on Vercel

See **[LAUNCH.md](LAUNCH.md)** for the full walkthrough. Short version:

1. Push this repo to GitHub.
2. Import it in Vercel.
3. Add the `NEXT_PUBLIC_*` env vars (set `NEXT_PUBLIC_SITE_URL` to your Vercel
   URL) and add that URL to Supabase's Redirect URLs.
4. Deploy. (It also deploys fine with **no** env vars — it'll just be in demo
   mode.)

---

## Project structure

```
src/
  app/                 # routes (App Router)
    page.tsx           # landing
    login/ onboarding/ dashboard/ goals/ check-in/
    pact/ nudges/ save-me/ weekly-review/ archive/
    auth/callback/     # Supabase magic-link handler
  components/          # AppShell, Navbar, GoalCard, ReceiptCard, XPBadge,
                       # StreakBadge, FriendStatusCard, ProgressRing, NudgeCard,
                       # BossFightCard, EmptyState, LoadingState, ui/*
  lib/
    xp.ts streaks.ts invite.ts progress.ts friend-status.ts
    nudges.ts boss-fights.ts weekly-review.ts ai.ts
    store.ts demo-data.ts types.ts constants.ts utils.ts
    supabase/          # client.ts server.ts config.ts
supabase/
  schema.sql           # tables + RLS + storage + trigger
  seed.sql             # optional demo rows
```

---

## Scripts

```bash
npm run dev        # local dev
npm run build      # production build
npm run start      # run the production build
npm run lint       # eslint
npm run typecheck  # tsc --noEmit
```

Receipts, not vibes. Have a good summer. 🌅
