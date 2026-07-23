import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getDb } from "@/lib/mongo";
import { GridBackground } from "@/components/ui/GridBackground";
import { BentoGrid, BentoCard } from "@/components/ui/BentoGrid";
import { HoverBorderGradient } from "@/components/ui/HoverBorderGradient";
import { TextGenerate } from "@/components/ui/TextGenerate";
import SnippetPreview from "./_landing/SnippetPreview";
import Workflow from "./_landing/Workflow";
import StatsHover from "./_landing/StatsHover";

export const dynamic = "force-dynamic";

async function getPublicStats() {
  try {
    const db = await getDb();
    const [users, sites, subscribers, agg] = await Promise.all([
      db.collection("users").countDocuments(),
      db.collection("sites").countDocuments(),
      db.collection("subscribers").countDocuments(),
      db
        .collection("sites")
        .aggregate([
          { $group: { _id: null, delivered: { $sum: { $ifNull: ["$deliveredTotal", 0] } } } },
        ])
        .toArray(),
    ]);
    return {
      users,
      sites,
      subscribers,
      delivered: (agg[0] as { delivered?: number } | undefined)?.delivered || 0,
    };
  } catch {
    return null;
  }
}

function fmt(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "k";
  return n.toLocaleString();
}

export default async function Home() {
  if (await getSession()) redirect("/dashboard");
  const stats = await getPublicStats();
  return (
    <div className="relative w-full overflow-x-hidden bg-black text-white">
      {/* NAV */}
      <nav className="fixed inset-x-0 top-0 z-50 border-b border-border/50 bg-black/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo.png" alt="Nezuko" width={28} height={28} priority />
            <span className="text-lg font-semibold tracking-tight">Nezuko</span>
          </Link>
          <div className="flex items-center gap-3 text-sm">
            <Link href="/auth?tab=signin" className="text-muted hover:text-white">Sign in</Link>
            <Link
              href="/auth?tab=signup"
              className="rounded-full bg-accent px-4 py-1.5 font-medium text-white transition hover:bg-accent-hover"
            >
              Get started
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative flex min-h-screen w-full items-center justify-center overflow-hidden pt-24">
        <GridBackground />

        <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
          <div className="mx-auto mb-6 flex items-center justify-center">
            <div className="rounded-full bg-accent/20 p-4 shadow-[0_0_120px_40px_rgba(93,10,209,0.4)]">
              <Image
                src="/logo.png"
                alt="Nezuko"
                width={88}
                height={88}
                className="drop-shadow-[0_0_30px_rgba(93,10,209,0.6)]"
                priority
              />
            </div>
          </div>

          <HoverBorderGradient
            as="div"
            containerClassName="mx-auto mb-6"
            className="!py-1 !text-xs"
          >
            <span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-accent" />
            No email. No trackers. Just a 16-digit code.
          </HoverBorderGradient>

          <h1 className="bg-gradient-to-b from-white to-white/70 bg-clip-text text-5xl font-semibold tracking-tight text-transparent sm:text-7xl">
            Push notifications,
            <br />
            <span className="text-accent">simplified.</span>
          </h1>

          <TextGenerate
            words="Drop one line of JS on your site. Reach your visitors instantly. Privacy is the default, not an add-on."
            className="mx-auto mt-6 max-w-xl text-base font-normal text-muted sm:text-lg"
          />

          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/auth?tab=signup"
              className="rounded-full bg-accent px-6 py-3 text-sm font-medium text-white shadow-[0_0_40px_rgba(93,10,209,0.5)] transition hover:bg-accent-hover"
            >
              Create your account →
            </Link>
            <Link
              href="/auth?tab=signin"
              className="rounded-full border border-border px-6 py-3 text-sm font-medium text-white transition hover:border-accent"
            >
              I have a code
            </Link>
          </div>

          <p className="mt-6 text-xs text-muted">Free. Self-hostable. Open in spirit.</p>
        </div>
      </section>

      {/* STATS */}
      {stats && (stats.users > 0 || stats.sites > 0 || stats.subscribers > 0) && (
        <section className="relative border-t border-border/50 py-16">
          <div className="mx-auto max-w-6xl px-6">
            <div className="mb-8 text-center">
              <div className="mb-3 text-xs uppercase tracking-[0.2em] text-accent">Trusted by builders</div>
              <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                A small community, growing quietly.
              </h2>
            </div>
            <StatsHover
              items={[
                { label: "Accounts", value: fmt(stats.users) },
                { label: "Sites registered", value: fmt(stats.sites) },
                { label: "Push subscribers", value: fmt(stats.subscribers) },
                { label: "Notifications delivered", value: fmt(stats.delivered) },
              ]}
            />
          </div>
        </section>
      )}

      {/* SNIPPET */}
      <section className="relative border-t border-border/50 py-24">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <div className="mb-3 text-xs uppercase tracking-[0.2em] text-accent">Install in seconds</div>
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            One file. One script tag.
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-sm text-muted">
            Drop <code className="text-white">nezuko-sw.js</code> at the root of your site, then paste the
            snippet before <code className="text-white">&lt;/body&gt;</code>. That&apos;s it.
          </p>
          <div className="mt-10">
            <SnippetPreview />
          </div>
        </div>
      </section>

      {/* WORKFLOW */}
      <section className="relative border-t border-border/50 py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-10 text-center">
            <div className="mb-3 text-xs uppercase tracking-[0.2em] text-accent">How it works</div>
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Three steps from install to sent.
            </h2>
          </div>
          <Workflow />
        </div>
      </section>

      {/* PRIVACY BENTO */}
      <section className="relative border-t border-border/50 py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-10 text-center">
            <div className="mb-3 text-xs uppercase tracking-[0.2em] text-accent">Privacy by default</div>
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              We don&apos;t know who you are.
              <br />
              <span className="text-muted">And we like it that way.</span>
            </h2>
          </div>

          <BentoGrid>
            <BentoCard
              className="md:col-span-2"
              icon={<Icon>{"//"}</Icon>}
              title="No email, no password, no phone."
              description="Your account is a 16-digit code. Nothing to leak, nothing to sell."
              header={
                <div className="flex h-32 items-center justify-center rounded-lg bg-gradient-to-br from-accent/40 to-transparent">
                  <div className="rounded-md border border-border bg-black px-4 py-2 font-mono text-lg tracking-widest">
                    XXXX-XXXX-XXXX-XXXX
                  </div>
                </div>
              }
            />
            <BentoCard
              icon={<Icon>zero</Icon>}
              title="Zero trackers in the embed."
              description="The script does one thing: register push. No fingerprinting, no analytics, no third parties."
              header={<ZeroTrackersVisual />}
            />
            <BentoCard
              icon={<Icon>{"</>"}</Icon>}
              title="Self-hostable."
              description="Run Nezuko on your own VPS. Your data never touches ours."
              header={<SelfHostVisual />}
            />
            <BentoCard
              className="md:col-span-2"
              icon={<Icon>🔒</Icon>}
              title="Origin-locked subscriptions."
              description="Each subscription is bound to your registered origin. Someone else can't hijack your script to send from a different domain."
              header={
                <div className="flex h-32 flex-col items-center justify-center gap-2 rounded-lg bg-gradient-to-br from-transparent to-accent/30 p-3 sm:flex-row sm:gap-3">
                  <div className="flex items-center gap-1.5 text-[11px] sm:text-xs">
                    <Pill ok>your-site.com</Pill>
                    <span className="text-muted">→</span>
                    <Pill ok>200</Pill>
                  </div>
                  <span className="hidden text-muted sm:inline">·</span>
                  <div className="flex items-center gap-1.5 text-[11px] sm:text-xs">
                    <Pill>evil.com</Pill>
                    <span className="text-muted">→</span>
                    <Pill>403</Pill>
                  </div>
                </div>
              }
            />
          </BentoGrid>
        </div>
      </section>

      {/* CTA */}
      <section className="relative border-t border-border/50 py-24">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            Start sending in <span className="text-accent">under a minute.</span>
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-muted">
            Generate a code, paste the snippet, send your first push. No credit card, no email confirmation, no BS.
          </p>
          <Link
            href="/auth?tab=signup"
            className="mt-8 inline-block rounded-full bg-accent px-8 py-3.5 text-sm font-medium text-white shadow-[0_0_60px_rgba(93,10,209,0.5)] transition hover:bg-accent-hover"
          >
            Create your code →
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-border/50 py-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 text-xs text-muted">
          <div className="flex items-center gap-2">
            <Image src="/logo.png" alt="" width={16} height={16} />
            <span>Nezuko — nezukoo.vercel.app</span>
          </div>
          <div>
            Built with love by{" "}
            <a
              href="https://github.com/rathod-ramraj"
              target="_blank"
              rel="noreferrer"
              className="text-white hover:text-accent"
            >
              Ramraj
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Icon({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-black/60 font-mono text-xs text-accent">
      {children}
    </div>
  );
}

function ZeroTrackersVisual() {
  const items = ["Google Analytics", "Meta Pixel", "Hotjar", "Segment", "Mixpanel"];
  return (
    <div className="flex h-32 flex-col justify-center gap-1.5 rounded-lg border border-border bg-gradient-to-br from-black to-accent/10 p-3">
      {items.map((n) => (
        <div key={n} className="flex items-center justify-between rounded-md border border-border/60 bg-black/60 px-2.5 py-1">
          <span className="truncate text-[11px] text-muted line-through decoration-red-500/60">{n}</span>
          <span className="ml-2 shrink-0 rounded-full border border-red-900 px-1.5 text-[9px] font-medium uppercase tracking-widest text-red-400">
            blocked
          </span>
        </div>
      ))}
    </div>
  );
}

function SelfHostVisual() {
  return (
    <div className="flex h-32 items-center justify-center gap-3 rounded-lg border border-border bg-gradient-to-br from-black via-accent/10 to-black p-3">
      <div className="flex flex-col items-center gap-1">
        <div className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-black text-accent">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-4 w-4">
            <path d="M4 6h16v4H4zM4 14h16v4H4z" />
            <circle cx="7" cy="8" r=".6" fill="currentColor" />
            <circle cx="7" cy="16" r=".6" fill="currentColor" />
          </svg>
        </div>
        <span className="text-[9px] uppercase tracking-widest text-muted">your VPS</span>
      </div>

      <div className="flex flex-1 flex-col items-center gap-1">
        <div className="flex w-full items-center">
          <span className="h-px flex-1 bg-gradient-to-r from-accent/80 to-transparent" />
          <span className="mx-1 text-[10px] text-accent">HTTPS</span>
          <span className="h-px flex-1 bg-gradient-to-l from-accent/80 to-transparent" />
        </div>
        <span className="text-[9px] uppercase tracking-widest text-muted">no third party</span>
      </div>

      <div className="flex flex-col items-center gap-1">
        <div className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-black text-accent">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-4 w-4">
            <rect x="3" y="4" width="18" height="12" rx="2" />
            <path d="M8 20h8M12 16v4" />
          </svg>
        </div>
        <span className="text-[9px] uppercase tracking-widest text-muted">your users</span>
      </div>
    </div>
  );
}

function Pill({ ok, children }: { ok?: boolean; children: React.ReactNode }) {
  return (
    <span
      className={
        "whitespace-nowrap rounded-full border px-2 py-0.5 sm:px-3 sm:py-1 " +
        (ok ? "border-accent text-white" : "border-red-900 text-red-400")
      }
    >
      {children}
    </span>
  );
}
