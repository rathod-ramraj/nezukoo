import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import CopyCodeButton from "./CopyCodeButton";
import SendTrayProvider from "./SendTrayProvider";
import SendTray from "./SendTray";

export const metadata = {
  title: "Dashboard",
  robots: { index: false, follow: false, nocache: true },
};

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/auth?tab=signin");

  return (
    <SendTrayProvider>
      <div className="flex min-h-screen flex-col bg-black text-white">
        <header className="sticky top-0 z-30 border-b border-border/60 bg-black/70 backdrop-blur">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
            <Link href="/dashboard" className="flex items-center gap-2">
              <Image src="/logo.png" alt="Nezuko" width={26} height={26} priority />
              <span className="text-base font-semibold tracking-tight sm:text-lg">
                Nezuko<span className="text-accent">.</span>
              </span>
            </Link>
            <nav className="flex items-center gap-2 text-sm">
              <SendTray />
              <CopyCodeButton />
              <form action="/api/auth/logout" method="post">
                <button className="group inline-flex items-center gap-1.5 rounded-lg border border-red-950/60 bg-red-950/20 px-3 py-1.5 text-sm font-medium text-red-400 transition hover:border-red-500/60 hover:bg-red-500/15 hover:text-red-300">
                  <svg
                    viewBox="0 0 20 20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                  >
                    <path d="M11 4H5a1 1 0 00-1 1v10a1 1 0 001 1h6" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M13 7l3 3-3 3M8 10h8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Sign out
                </button>
              </form>
            </nav>
          </div>
        </header>
        <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-6 sm:px-6 sm:py-10">
          {children}
        </main>
      </div>
    </SendTrayProvider>
  );
}
