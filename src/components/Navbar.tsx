"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Archive,
  CalendarCheck,
  Hand,
  Home,
  LayoutGrid,
  LifeBuoy,
  LogOut,
  Plus,
  Sparkles,
  Swords,
  Target,
  Users,
  X,
} from "lucide-react";
import { APP_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { isLiveMode, signOut } from "@/lib/store";

const LINKS = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/goals", label: "Goals", icon: Target },
  { href: "/check-in", label: "Receipt", icon: CalendarCheck },
  { href: "/pact", label: "Pact", icon: Users },
  { href: "/nudges", label: "Nudges", icon: Hand },
  { href: "/save-me", label: "Save me", icon: LifeBuoy },
  { href: "/weekly-review", label: "Review", icon: Swords },
  { href: "/archive", label: "Archive", icon: Archive },
];

// Overflow links surfaced in the mobile "More" sheet.
const MORE_LINKS = LINKS.filter((l) =>
  ["/nudges", "/save-me", "/weekly-review", "/archive"].includes(l.href)
);

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [moreOpen, setMoreOpen] = useState(false);

  async function handleSignOut() {
    await signOut();
    router.replace("/login");
  }

  return (
    <>
      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b border-sand-200 bg-sand-50/80 backdrop-blur">
        <div className="container flex h-16 items-center justify-between gap-4">
          <Link href="/dashboard" className="flex items-center gap-2 font-extrabold">
            <span className="grid h-9 w-9 place-items-center rounded-2xl bg-sunset-500 text-white shadow-cozy">
              <Sparkles className="h-5 w-5" />
            </span>
            <span className="hidden text-lg tracking-tight sm:inline">
              {APP_NAME}
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-1 md:flex">
            {LINKS.map(({ href, label, icon: Icon }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex items-center gap-1.5 rounded-2xl px-3 py-2 text-sm font-semibold transition",
                    active
                      ? "bg-sunset-500 text-white shadow-cozy"
                      : "text-ink/60 hover:bg-sand-100 hover:text-ink"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              );
            })}
            {isLiveMode && (
              <button
                onClick={handleSignOut}
                className="ml-1 flex items-center gap-1.5 rounded-2xl px-3 py-2 text-sm font-semibold text-ink/45 transition hover:bg-sand-100 hover:text-ink"
                title="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            )}
          </nav>
        </div>
      </header>

      {/* Mobile "More" sheet */}
      {moreOpen && (
        <div className="fixed inset-0 z-40 md:hidden" onClick={() => setMoreOpen(false)}>
          <div className="absolute inset-0 bg-ink/30 backdrop-blur-sm" />
          <div
            className="absolute inset-x-0 bottom-0 animate-pop-in rounded-t-3xl bg-white p-5 pb-24 shadow-cozy"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-bold">More tools 🧰</h3>
              <button
                onClick={() => setMoreOpen(false)}
                className="rounded-xl p-1.5 text-ink/40 hover:bg-sand-100"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {MORE_LINKS.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMoreOpen(false)}
                  className="flex items-center gap-3 rounded-2xl border border-sand-200 bg-sand-50 p-3 font-semibold text-ink/80"
                >
                  <span className="grid h-9 w-9 place-items-center rounded-xl bg-white text-sunset-500">
                    <Icon className="h-5 w-5" />
                  </span>
                  {label}
                </Link>
              ))}
            </div>
            {isLiveMode && (
              <button
                onClick={handleSignOut}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-sand-200 py-2.5 text-sm font-semibold text-ink/60"
              >
                <LogOut className="h-4 w-4" /> Sign out
              </button>
            )}
          </div>
        </div>
      )}

      {/* Mobile bottom nav with raised center action */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-sand-200 bg-white/95 backdrop-blur md:hidden">
        <div className="relative grid grid-cols-5 items-center">
          <MobileItem href="/dashboard" label="Home" icon={Home} pathname={pathname} />
          <MobileItem href="/goals" label="Goals" icon={Target} pathname={pathname} />

          {/* Center raised receipt FAB */}
          <div className="flex justify-center">
            <Link
              href="/check-in"
              className="-mt-7 grid h-14 w-14 place-items-center rounded-2xl bg-sunset-500 text-white shadow-cozy ring-4 ring-sand-50 transition active:scale-95"
              aria-label="Submit receipt"
            >
              <Plus className="h-6 w-6" />
            </Link>
          </div>

          <MobileItem href="/pact" label="Pact" icon={Users} pathname={pathname} />
          <button
            onClick={() => setMoreOpen(true)}
            className={cn(
              "flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-semibold",
              MORE_LINKS.some((l) => l.href === pathname)
                ? "text-sunset-600"
                : "text-ink/45"
            )}
          >
            <LayoutGrid className="h-5 w-5" />
            More
          </button>
        </div>
      </nav>
    </>
  );
}

function MobileItem({
  href,
  label,
  icon: Icon,
  pathname,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  pathname: string;
}) {
  const active = pathname === href;
  return (
    <Link
      href={href}
      className={cn(
        "flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-semibold",
        active ? "text-sunset-600" : "text-ink/45"
      )}
    >
      <Icon className="h-5 w-5" />
      {label}
    </Link>
  );
}
