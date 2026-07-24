import Link from "next/link";
import { notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getDb } from "@/lib/mongo";
import Snippet from "./Snippet";
import Composer from "./Composer";
import DeleteSite from "./DeleteSite";
import SiteTabs from "./SiteTabs";
import SiteFavicon from "@/components/ui/SiteFavicon";

export const dynamic = "force-dynamic";

export default async function SitePage({ params }: { params: { siteId: string } }) {
  const session = (await getSession())!;
  const db = await getDb();
  const site = await db.collection("sites").findOne({ siteId: params.siteId, userId: session.uid });
  if (!site) notFound();

  const [subs, notifs] = await Promise.all([
    db.collection("subscribers").countDocuments({ siteId: site.siteId }),
    db
      .collection("notifications")
      .find({ siteId: site.siteId })
      .sort({ sentAt: -1 })
      .limit(10)
      .toArray(),
  ]);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://nezukoo.vercel.app";
  const sentCount = site.sentCount ?? notifs.length;
  const totalAttempted = site.attemptedTotal ?? notifs.reduce((a: number, n: any) => a + (n.attempted || 0), 0);
  const totalDelivered = site.deliveredTotal ?? notifs.reduce((a: number, n: any) => a + (n.delivered || 0), 0);
  const deliveryRate =
    totalAttempted > 0 ? Math.round((totalDelivered / totalAttempted) * 100) : 100;

  const plainNotifs = notifs.map((n: any) => ({
    _id: String(n._id),
    title: n.title,
    body: n.body,
    url: n.url,
    sentAt: n.sentAt,
    attempted: n.attempted || 0,
    delivered: n.delivered || 0,
  }));

  return (
    <div className="space-y-6">
      <SiteHeader site={site} />

      <SiteTabs
        compose={<Composer siteId={site.siteId} origin={site.origin} disabled={subs === 0} />}
        overview={
          <div className="space-y-10">
            <section className="grid grid-cols-2 divide-white/[0.06] overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.02] lg:grid-cols-4 lg:divide-x">
              <StatCell label="Subscribers" value={subs} />
              <StatCell label="Sent" value={sentCount} />
              <StatCell label="Delivered" value={totalDelivered} />
              <StatCell label="Delivery rate" value={`${deliveryRate}%`} />
            </section>
            <History notifs={plainNotifs} />
          </div>
        }
        install={<Snippet siteId={site.siteId} appUrl={appUrl} />}
        settings={<DeleteSite siteId={site.siteId} />}
      />
    </div>
  );
}

function SiteHeader({ site }: { site: any }) {
  let host = site.origin;
  try {
    host = new URL(site.origin).host;
  } catch {}
  const initial = (site.name || host || "?").trim().charAt(0).toUpperCase();

  return (
    <div className="space-y-4">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-[13px] text-white/50 transition hover:text-white"
      >
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-3.5 w-3.5">
          <path d="M12 4l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        All sites
      </Link>

      <div className="flex flex-wrap items-center gap-3">
        <SiteFavicon host={host} fallback={initial} size={40} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="truncate text-xl font-semibold tracking-tight text-white sm:text-2xl">
              {site.name || host}
            </h1>
            <StatusPill ok={site.verified} />
          </div>
          <a
            href={site.origin}
            target="_blank"
            rel="noreferrer"
            className="mt-0.5 inline-flex items-center gap-1 truncate text-[13px] text-white/50 transition hover:text-white/80"
          >
            {host}
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-3 w-3">
              <path d="M6 4h10v10M16 4L6 14" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
}

function StatusPill({ ok }: { ok?: boolean }) {
  return (
    <span
      className={
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium " +
        (ok
          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
          : "border-yellow-500/30 bg-yellow-500/10 text-yellow-400")
      }
    >
      {ok ? "Ready" : "Pending"}
    </span>
  );
}

function StatCell({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="border-b border-white/[0.06] p-4 last:border-b-0 sm:p-5 lg:border-b-0 [&:nth-child(odd)]:border-r [&:nth-child(odd)]:border-white/[0.06] lg:[&:nth-child(odd)]:border-r-0">
      <div className="text-[11px] font-medium text-white/50">{label}</div>
      <div className="mt-1 text-2xl font-semibold tracking-tight text-white">{value}</div>
    </div>
  );
}

function History({ notifs }: { notifs: any[] }) {
  return (
    <section>
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-sm font-semibold text-white">Recent activity</h2>
        <span className="text-[11px] text-white/40">
          Only the last 10 are kept — older notifications aren&apos;t stored.
        </span>
      </div>

      {notifs.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/[0.08] bg-white/[0.02] px-6 py-12 text-center text-sm text-white/50">
          No notifications yet. Head to <span className="text-white">Compose</span> to send one.
          <div className="mt-1 text-[11px] text-white/40">
            Only the last 10 are kept — we don&apos;t store old notifications.
          </div>
        </div>
      ) : (
        <ul className="divide-y divide-white/[0.06] overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.02]">
          {notifs.map((n: any) => {
            const rate =
              n.attempted > 0 ? Math.round((n.delivered / n.attempted) * 100) : 0;
            return (
              <li
                key={n._id}
                className="flex flex-col gap-2 px-4 py-3.5 transition hover:bg-white/[0.02] sm:flex-row sm:items-center sm:gap-6"
              >
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13px] font-medium text-white">{n.title}</div>
                  <div className="mt-0.5 line-clamp-1 text-[12px] text-white/50">{n.body}</div>
                </div>
                <div className="flex items-center gap-4 text-[12px] text-white/50 sm:gap-6">
                  <span className="tabular-nums">
                    <span className="text-white">{n.delivered}</span>
                    <span className="text-white/30">/{n.attempted}</span>
                  </span>
                  <span className="tabular-nums text-white/70">{rate}%</span>
                  <span className="w-20 shrink-0 text-right tabular-nums">
                    {timeAgo(new Date(n.sentAt))}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function timeAgo(d: Date) {
  const secs = Math.max(1, Math.floor((Date.now() - d.getTime()) / 1000));
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}
