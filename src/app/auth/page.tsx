import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { GridBackground } from "@/components/ui/GridBackground";
import AuthTabs from "./AuthTabs";

export const metadata = {
  title: "Sign In & Sign Up",
  description: "Sign in or create a privacy-first Nezuko Web Push account using your passwordless 16-digit secret code.",
  alternates: {
    canonical: "/auth",
  },
  openGraph: {
    title: "Sign In & Sign Up — Nezuko Web Push",
    description: "Sign in or create a privacy-first Nezuko Web Push account using your passwordless 16-digit secret code.",
    url: "https://nezukoo.vercel.app/auth",
  },
};

export const dynamic = "force-dynamic";

export default async function AuthPage() {
  if (await getSession()) redirect("/dashboard");
  return (
    <div className="relative min-h-screen overflow-hidden bg-black text-white">
      <div className="absolute inset-0">
        <GridBackground />
      </div>

      {/* NAV */}
      <nav className="relative z-20 border-b border-border/50 bg-black/40 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo.png" alt="Nezuko Web Push" width={28} height={28} priority />
            <span className="text-lg font-semibold tracking-tight">Nezuko</span>
          </Link>
          <div className="flex items-center gap-2.5 sm:gap-4 text-xs sm:text-sm">
            <Link href="/" className="text-muted transition hover:text-white">Home</Link>
            <Link href="/faq" className="text-muted transition hover:text-white">FAQ</Link>
            <Link href="/tos" className="text-muted transition hover:text-white">Terms</Link>
          </div>
        </div>
      </nav>

      <main className="relative z-10 mx-auto flex min-h-[calc(100vh-64px-56px)] w-full max-w-md items-center justify-center px-4 py-8 sm:px-6 sm:py-10">
        <Suspense fallback={<div className="text-sm text-muted">Loading…</div>}>
          <AuthTabs />
        </Suspense>
      </main>

      {/* FOOTER */}
      <footer className="relative z-10 border-t border-border/50 py-6">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 text-xs text-muted sm:flex-row sm:px-6">
          <div className="flex items-center gap-2 text-center sm:text-left">
            <Image src="/logo.png" alt="Nezuko Web Push" width={16} height={16} className="shrink-0" />
            <span>Nezuko Web Push — Privacy-focused Web Push Notification Service</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            <Link href="/" className="hover:text-white transition">Home</Link>
            <Link href="/faq" className="hover:text-white transition">FAQ</Link>
            <Link href="/tos" className="hover:text-white transition">Terms of Service</Link>
            <span>·</span>
            <span>Built by{" "}
              <a
                href="https://github.com/rathod-ramraj"
                target="_blank"
                rel="noreferrer"
                className="text-white hover:text-accent"
              >
                Ramraj
              </a>
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
