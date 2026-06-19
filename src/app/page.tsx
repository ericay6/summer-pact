import Link from "next/link";
import { Sparkles, Flame, Camera, Swords, HeartHandshake } from "lucide-react";
import { APP_NAME, APP_SLOGAN, APP_TAGLINE } from "@/lib/constants";
import { buttonVariants } from "@/components/ui/Button";

const FEATURES = [
  {
    icon: Camera,
    title: "Daily receipts",
    body: "Snap proof of progress. Tiny proof counts — no zero days, no shame.",
  },
  {
    icon: Flame,
    title: "Streaks & XP",
    body: "Earn XP for effort, keep your streak alive, and watch your summer arc grow.",
  },
  {
    icon: HeartHandshake,
    title: "Friendly nudges",
    body: "When your friend goes quiet, send a supportive (never shamey) poke.",
  },
  {
    icon: Swords,
    title: "Weekly boss fights",
    body: "Get an honest weekly review and a challenge to beat together.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <header className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2 font-extrabold">
          <span className="grid h-9 w-9 place-items-center rounded-2xl bg-sunset-500 text-white shadow-cozy">
            <Sparkles className="h-5 w-5" />
          </span>
          <span className="text-lg tracking-tight">{APP_NAME}</span>
        </div>
        <Link href="/login" className={buttonVariants({ variant: "ghost", size: "sm" })}>
          Sign in
        </Link>
      </header>

      <section className="container grid items-center gap-10 py-12 md:grid-cols-2 md:py-20">
        <div>
          <div className="chip mb-5 bg-sunset-100 text-sunset-700">
            ☀️ A summer accountability game for two
          </div>
          <h1 className="text-4xl font-extrabold leading-[1.05] tracking-tight text-ink sm:text-6xl">
            {APP_NAME}
          </h1>
          <p className="mt-4 text-2xl font-bold text-sunset-600">{APP_SLOGAN}</p>
          <p className="mt-4 max-w-md text-lg text-ink/60">{APP_TAGLINE}</p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/onboarding" className={buttonVariants({ size: "lg" })}>
              Create your pact
            </Link>
            <Link
              href="/login"
              className={buttonVariants({ variant: "secondary", size: "lg" })}
            >
              Sign in
            </Link>
          </div>
          <p className="mt-4 text-xs text-ink/40">
            No account needed to try the demo — it runs locally in your browser.
          </p>
        </div>

        <div className="relative">
          <div className="card card-pad animate-pop-in">
            <div className="flex items-center justify-between">
              <div className="font-bold">The Summer Arc 🌅</div>
              <span className="chip bg-sunset-500 text-white">
                <Flame className="h-3.5 w-3.5 fill-white" /> 5 day streak
              </span>
            </div>
            <div className="mt-4 space-y-3">
              <MiniReceipt
                emoji="🔬"
                title="Finish research paper"
                note="Drafted the entire methods section!"
                xp={60}
              />
              <MiniReceipt
                emoji="💪"
                title="Move my body 4x/week"
                note="30-min run by the water 🏃"
                xp={45}
              />
              <MiniReceipt
                emoji="📖"
                title="Read 6 books"
                note="20 pages before bed. Counts."
                xp={20}
              />
            </div>
          </div>
          <div className="absolute -bottom-4 -left-4 hidden rotate-[-6deg] sm:block">
            <span className="chip bg-lagoon-500 text-white shadow-cozy">
              Riley is making a comeback 📈
            </span>
          </div>
        </div>
      </section>

      <section className="container grid gap-4 pb-20 sm:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map(({ icon: Icon, title, body }) => (
          <div key={title} className="card card-pad">
            <Icon className="h-7 w-7 text-sunset-500" />
            <h3 className="mt-3 font-bold">{title}</h3>
            <p className="mt-1 text-sm text-ink/60">{body}</p>
          </div>
        ))}
      </section>

      <footer className="container border-t border-sand-200 py-8 text-center text-sm text-ink/40">
        {APP_NAME} — {APP_SLOGAN} Built for two friends and one good summer.
      </footer>
    </div>
  );
}

function MiniReceipt({
  emoji,
  title,
  note,
  xp,
}: {
  emoji: string;
  title: string;
  note: string;
  xp: number;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-sand-50 p-3">
      <span className="text-xl">{emoji}</span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold">{title}</div>
        <div className="truncate text-xs text-ink/50">{note}</div>
      </div>
      <span className="chip bg-sunset-100 text-sunset-700">+{xp} XP</span>
    </div>
  );
}
