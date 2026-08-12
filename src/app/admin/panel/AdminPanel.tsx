"use client";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, LayoutGroup } from "framer-motion";

type Tab = "stats" | "sites" | "users" | "audit";

type ConfirmState = {
  title: string;
  description: React.ReactNode;
  phrase: string;
  actionLabel: string;
  onConfirm: () => Promise<void> | void;
} | null;

export default function AdminPanel() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("stats");
  const [confirmState, setConfirmState] = useState<ConfirmState>(null);

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.replace("/admin/login");
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="flex items-center justify-between gap-3 border-b border-white/[0.06] pb-4">
        <div className="min-w-0">
          <div className="text-[10px] uppercase tracking-[0.25em] text-accent">Restricted</div>
          <h1 className="mt-1 truncate text-xl font-semibold tracking-tight sm:text-2xl">Admin panel</h1>
        </div>
        <button
          onClick={logout}
          className="shrink-0 rounded-md border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[12px] text-white/70 transition hover:border-white/25 hover:text-white"
        >
          Log out
        </button>
      </div>

      <LayoutGroup id="admin-tabs">
        <div className="mt-6 -mx-4 flex gap-1 overflow-x-auto border-b border-white/[0.06] px-4 sm:mx-0 sm:px-0">
          {(["stats", "sites", "users", "audit"] as Tab[]).map((t) => {
            const active = tab === t;
            return (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={
                  "relative px-3 py-2 text-[13px] font-medium capitalize transition " +
                  (active ? "text-white" : "text-white/50 hover:text-white")
                }
              >
                {active && (
                  <motion.span
                    layoutId="admin-tab-underline"
                    className="absolute inset-x-0 -bottom-px h-px bg-accent"
                  />
                )}
                {t}
              </button>
            );
          })}
        </div>
      </LayoutGroup>

      <div className="mt-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
          >
            {tab === "stats" && <StatsTab />}
            {tab === "sites" && <SitesTab requestConfirm={setConfirmState} />}
            {tab === "users" && <UsersTab requestConfirm={setConfirmState} />}
            {tab === "audit" && <AuditTab />}
          </motion.div>
        </AnimatePresence>
      </div>

      <ConfirmModal state={confirmState} onClose={() => setConfirmState(null)} />
    </div>
  );
}

function ConfirmModal({ state, onClose }: { state: ConfirmState; onClose: () => void }) {
  const [typed, setTyped] = useState("");
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!state) {
      setTyped("");
      setRunning(false);
    }
  }, [state]);

  if (!state) return null;
  const s = state;
  const matches = typed.trim() === s.phrase;

  async function go() {
    if (!matches || running) return;
    setRunning(true);
    try {
      await s.onConfirm();
      onClose();
    } finally {
      setRunning(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl border border-red-500/20 bg-black p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 text-red-400">
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
            <path d="M10 7v4M10 14v.01" strokeLinecap="round" />
            <path d="M8.6 3.5a1.6 1.6 0 012.8 0l6.4 11.2A1.6 1.6 0 0116.4 17H3.6a1.6 1.6 0 01-1.4-2.3L8.6 3.5z" strokeLinejoin="round" />
          </svg>
          <span className="text-[10px] uppercase tracking-[0.2em]">Destructive action</span>
        </div>
        <h3 className="mt-2 text-base font-semibold text-white">{s.title}</h3>
        <div className="mt-2 text-[13px] leading-relaxed text-white/70">{s.description}</div>

        <div className="mt-4">
          <label className="text-[11px] text-white/50">
            Type <code className="rounded bg-white/[0.08] px-1 font-mono text-white/90">{s.phrase}</code> to confirm
          </label>
          <input
            autoFocus
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && go()}
            spellCheck={false}
            autoComplete="off"
            className="mt-1.5 w-full rounded-md border border-white/10 bg-black/60 px-3 py-2 font-mono text-sm text-white outline-none focus:border-red-500/50"
          />
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onClose}
            disabled={running}
            className="rounded-md border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[12px] text-white/70 hover:border-white/25 hover:text-white disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            onClick={go}
            disabled={!matches || running}
            className="rounded-md border border-red-500/40 bg-red-500/20 px-3 py-1.5 text-[12px] font-medium text-red-300 transition hover:bg-red-500/30 disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/[0.03] disabled:text-white/30"
          >
            {running ? "Deleting…" : s.actionLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function StatsTab() {
  const [data, setData] = useState<any>(null);
  const [series, setSeries] = useState<any>(null);
  useEffect(() => {
    fetch("/api/admin/stats").then((r) => r.json()).then(setData);
    fetch("/api/admin/timeseries").then((r) => r.json()).then(setSeries);
  }, []);
  if (!data) return <p className="text-sm text-white/40">Loading…</p>;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <Stat label="Users" value={data.totals.users} sub={`+${data.recent.usersDay} 24h · +${data.recent.usersWeek} 7d`} />
        <Stat label="Sites" value={data.totals.sites} />
        <Stat label="Subscribers" value={data.totals.subscribers} />
        <Stat label="Notifications sent (lifetime)" value={data.totals.sentLifetime} sub={`+${data.recent.notifDay} 24h · +${data.recent.notifWeek} 7d`} />
        <Stat label="Attempted (lifetime)" value={data.totals.attemptedLifetime} />
        <Stat label="Delivered (lifetime)" value={data.totals.deliveredLifetime} />
        <Stat
          label="Delivery rate"
          value={
            data.totals.attemptedLifetime > 0
              ? `${Math.round((data.totals.deliveredLifetime / data.totals.attemptedLifetime) * 100)}%`
              : "—"
          }
        />
        <Stat label="History records" value={data.totals.notifications} />
      </div>

      {series && (
        <div className="grid gap-4 lg:grid-cols-2">
          <ChartCard title="Signups" subtitle="Last 30 days">
            <LineChart
              points={series.days.map((d: any) => ({ x: d.date, y: d.signups }))}
              color="#a78bfa"
            />
          </ChartCard>
          <ChartCard title="Notifications attempted" subtitle="Last 30 days">
            <LineChart
              points={series.days.map((d: any) => ({ x: d.date, y: d.attempted }))}
              color="#34d399"
            />
          </ChartCard>
          <ChartCard title="Delivered vs failed" subtitle="Last 30 days">
            <StackedBars
              points={series.days.map((d: any) => ({
                x: d.date,
                a: d.delivered,
                b: Math.max(0, d.attempted - d.delivered),
              }))}
            />
          </ChartCard>
          <ChartCard title="Top sites by subscribers" subtitle="Current">
            <HBar
              rows={series.topSites.map((s: any) => ({
                label: hostOf(s.origin),
                value: s.subscribers,
              }))}
            />
          </ChartCard>
        </div>
      )}
    </div>
  );
}

function hostOf(origin: string) {
  try {
    return new URL(origin).host;
  } catch {
    return origin;
  }
}

function ChartCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
      <div className="mb-3 flex items-baseline justify-between">
        <div className="text-[13px] font-semibold text-white">{title}</div>
        {subtitle && <div className="text-[10px] uppercase tracking-wider text-white/40">{subtitle}</div>}
      </div>
      {children}
    </div>
  );
}

function LineChart({ points, color }: { points: { x: string; y: number }[]; color: string }) {
  const W = 560;
  const H = 160;
  const P = 20;
  const max = Math.max(1, ...points.map((p) => p.y));
  const step = (W - P * 2) / Math.max(1, points.length - 1);
  const y = (v: number) => H - P - ((H - P * 2) * v) / max;
  const path = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${P + i * step},${y(p.y)}`)
    .join(" ");
  const area =
    points.length > 1
      ? `${path} L${P + (points.length - 1) * step},${H - P} L${P},${H - P} Z`
      : "";
  const total = points.reduce((s, p) => s + p.y, 0);
  const [hover, setHover] = useState<{ i: number; left: number; top: number } | null>(null);

  function onMove(e: React.MouseEvent<SVGSVGElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const relX = ((e.clientX - rect.left) / rect.width) * W;
    const rawIdx = Math.round((relX - P) / step);
    const i = Math.max(0, Math.min(points.length - 1, rawIdx));
    const cx = ((P + i * step) / W) * rect.width;
    const cy = (y(points[i].y) / H) * rect.height;
    setHover({ i, left: cx, top: cy });
  }

  const hp = hover ? points[hover.i] : null;
  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full touch-none"
        preserveAspectRatio="none"
        onMouseMove={onMove}
        onMouseLeave={() => setHover(null)}
      >
        <defs>
          <linearGradient id={`grad-${color}`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.35" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((t) => (
          <line key={t} x1={P} x2={W - P} y1={H * t} y2={H * t} stroke="rgba(255,255,255,0.05)" />
        ))}
        {area && <path d={area} fill={`url(#grad-${color})`} />}
        <path d={path} fill="none" stroke={color} strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" />
        {points.map((p, i) => (
          <circle key={i} cx={P + i * step} cy={y(p.y)} r="1.6" fill={color} />
        ))}
        {hover && (
          <g>
            <line
              x1={P + hover.i * step}
              x2={P + hover.i * step}
              y1={P}
              y2={H - P}
              stroke="rgba(255,255,255,0.2)"
              strokeDasharray="2 2"
            />
            <circle cx={P + hover.i * step} cy={y(points[hover.i].y)} r="3.5" fill={color} stroke="#000" strokeWidth="1" />
          </g>
        )}
      </svg>
      {hp && hover && (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-md border border-white/10 bg-black/95 px-2 py-1 text-[10px] whitespace-nowrap shadow-lg"
          style={{ left: hover.left, top: hover.top - 6 }}
        >
          <div className="text-white/50">{hp.x}</div>
          <div className="tabular-nums font-semibold" style={{ color }}>
            {hp.y.toLocaleString()}
          </div>
        </div>
      )}
      <div className="mt-2 flex items-baseline justify-between text-[10px] text-white/40">
        <span>{points[0]?.x.slice(5) ?? ""}</span>
        <span className="tabular-nums text-white/60">total: {total.toLocaleString()}</span>
        <span>{points[points.length - 1]?.x.slice(5) ?? ""}</span>
      </div>
    </div>
  );
}

function StackedBars({ points }: { points: { x: string; a: number; b: number }[] }) {
  const W = 560;
  const H = 160;
  const P = 20;
  const max = Math.max(1, ...points.map((p) => p.a + p.b));
  const slot = (W - P * 2) / points.length;
  const bw = Math.max(2, slot - 2);
  const totalDelivered = points.reduce((s, p) => s + p.a, 0);
  const totalFailed = points.reduce((s, p) => s + p.b, 0);
  const [hover, setHover] = useState<{ i: number; left: number; top: number } | null>(null);

  function onMove(e: React.MouseEvent<SVGSVGElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const relX = ((e.clientX - rect.left) / rect.width) * W;
    const rawIdx = Math.floor((relX - P) / slot);
    const i = Math.max(0, Math.min(points.length - 1, rawIdx));
    const cx = ((P + i * slot + bw / 2) / W) * rect.width;
    const total = points[i].a + points[i].b;
    const topY = H - P - ((H - P * 2) * total) / max;
    const cy = (topY / H) * rect.height;
    setHover({ i, left: cx, top: cy });
  }

  const hp = hover ? points[hover.i] : null;
  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full touch-none"
        preserveAspectRatio="none"
        onMouseMove={onMove}
        onMouseLeave={() => setHover(null)}
      >
        {[0.25, 0.5, 0.75].map((t) => (
          <line key={t} x1={P} x2={W - P} y1={H * t} y2={H * t} stroke="rgba(255,255,255,0.05)" />
        ))}
        {points.map((p, i) => {
          const total = p.a + p.b;
          const h = ((H - P * 2) * total) / max;
          const ah = ((H - P * 2) * p.a) / max;
          const x = P + i * slot;
          const dim = hover && hover.i !== i ? 0.35 : 1;
          return (
            <g key={i} style={{ opacity: dim }}>
              <rect x={x} y={H - P - h} width={bw} height={h - ah} fill="rgba(248,113,113,0.6)" />
              <rect x={x} y={H - P - ah} width={bw} height={ah} fill="rgba(52,211,153,0.7)" />
            </g>
          );
        })}
      </svg>
      {hp && hover && (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-md border border-white/10 bg-black/95 px-2 py-1 text-[10px] whitespace-nowrap shadow-lg"
          style={{ left: hover.left, top: hover.top - 6 }}
        >
          <div className="text-white/50">{hp.x}</div>
          <div className="flex items-center gap-1 tabular-nums">
            <span className="h-1.5 w-1.5 rounded-sm bg-emerald-400/70" />
            <span className="text-white/80">{hp.a.toLocaleString()}</span>
            <span className="text-white/40">delivered</span>
          </div>
          <div className="flex items-center gap-1 tabular-nums">
            <span className="h-1.5 w-1.5 rounded-sm bg-red-400/60" />
            <span className="text-white/80">{hp.b.toLocaleString()}</span>
            <span className="text-white/40">failed</span>
          </div>
        </div>
      )}
      <div className="mt-2 flex items-center justify-between gap-2 text-[10px] text-white/40">
        <div className="flex flex-wrap gap-3">
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-emerald-400/70" /> delivered {totalDelivered.toLocaleString()}</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-red-400/60" /> failed {totalFailed.toLocaleString()}</span>
        </div>
        <span className="tabular-nums whitespace-nowrap">{points[0]?.x.slice(5) ?? ""} → {points[points.length - 1]?.x.slice(5) ?? ""}</span>
      </div>
    </div>
  );
}

function HBar({ rows }: { rows: { label: string; value: number }[] }) {
  if (rows.length === 0) return <div className="py-6 text-center text-[12px] text-white/40">No sites yet.</div>;
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <div className="space-y-2">
      {rows.map((r, i) => (
        <div key={i}>
          <div className="mb-1 flex items-baseline justify-between text-[11px]">
            <span className="max-w-[70%] truncate text-white/80">{r.label}</span>
            <span className="tabular-nums text-white/50">{r.value.toLocaleString()}</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.05]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-accent to-accent/50"
              style={{ width: `${(r.value / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-3 sm:p-4">
      <div className="text-[10px] uppercase tracking-wider text-white/40">{label}</div>
      <div className="mt-1 truncate text-xl font-semibold tabular-nums sm:text-2xl">{typeof value === "number" ? value.toLocaleString() : value}</div>
      {sub && <div className="mt-1 truncate text-[11px] text-white/40">{sub}</div>}
    </div>
  );
}

function SitesTab({ requestConfirm }: { requestConfirm: (s: ConfirmState) => void }) {
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState<any>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/sites?q=${encodeURIComponent(q)}`);
    const j = await res.json();
    setRows(j.sites || []);
    setLoading(false);
  }, [q]);

  useEffect(() => {
    load();
  }, [load]);

  async function openDetail(siteId: string) {
    const res = await fetch(`/api/admin/sites/${siteId}`);
    const j = await res.json();
    setDetail(j);
  }

  function askDelete(siteId: string, origin: string, subs?: number) {
    requestConfirm({
      title: `Delete site ${origin}?`,
      description: (
        <div className="space-y-1">
          <div>This permanently removes:</div>
          <ul className="ml-4 list-disc text-white/60">
            <li>The site record</li>
            <li>{subs != null ? `${subs.toLocaleString()} subscriber(s)` : "All subscribers"}</li>
            <li>All notification history</li>
          </ul>
          <div className="mt-2 text-red-400/80">This cannot be undone.</div>
        </div>
      ),
      phrase: "DELETE IT",
      actionLabel: "Delete site",
      onConfirm: async () => {
        const res = await fetch(`/api/admin/sites/${siteId}`, { method: "DELETE" });
        if (res.ok) {
          setDetail(null);
          load();
        }
      },
    });
  }

  return (
    <div>
      <div className="mb-4 flex gap-2">
        <input
          className="flex-1 rounded-md border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-white/30"
          placeholder="Search by origin (e.g. example.com)"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && load()}
        />
        <button onClick={load} className="rounded-md border border-white/10 bg-white/[0.03] px-3 text-[13px] text-white/80 hover:border-white/25 hover:text-white">
          Search
        </button>
      </div>

      {loading && <p className="text-sm text-white/40">Loading…</p>}
      <div className="overflow-x-auto rounded-xl border border-white/[0.08]">
        <table className="w-full min-w-[640px] text-left text-[13px]">
          <thead className="bg-white/[0.03] text-[11px] uppercase tracking-wider text-white/50">
            <tr>
              <th className="px-3 py-2">Origin</th>
              <th className="px-3 py-2">Verified</th>
              <th className="px-3 py-2 text-right">Subs</th>
              <th className="px-3 py-2 text-right">Sent</th>
              <th className="px-3 py-2">Owner</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.05]">
            {rows.map((s) => (
              <tr key={s.siteId} className="hover:bg-white/[0.02]">
                <td className="max-w-[220px] truncate px-3 py-2">
                  <a href={s.origin} target="_blank" rel="noreferrer" className="text-white hover:text-accent">
                    {s.origin}
                  </a>
                </td>
                <td className="px-3 py-2">
                  <span className={s.verified ? "text-emerald-400" : "text-yellow-400"}>{s.verified ? "yes" : "no"}</span>
                </td>
                <td className="px-3 py-2 text-right tabular-nums">{s.subscribers.toLocaleString()}</td>
                <td className="px-3 py-2 text-right tabular-nums">{s.sentCount.toLocaleString()}</td>
                <td className="max-w-[160px] truncate px-3 py-2 font-mono text-[11px] text-white/60">{s.userId}</td>
                <td className="px-3 py-2 text-right">
                  <button onClick={() => openDetail(s.siteId)} className="text-[11px] text-white/60 hover:text-white">
                    View
                  </button>
                  <button onClick={() => askDelete(s.siteId, s.origin, s.subscribers)} className="ml-3 text-[11px] text-red-400 hover:text-red-300">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && !loading && (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-[12px] text-white/40">
                  No sites match.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setDetail(null)}>
          <div
            className="max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-white/10 bg-black p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-white/[0.06] pb-3">
              <div>
                <div className="text-[10px] uppercase tracking-wider text-white/40">Site</div>
                <a href={detail.site.origin} target="_blank" rel="noreferrer" className="mt-1 block text-base font-semibold text-white hover:text-accent">
                  {detail.site.origin}
                </a>
                <div className="mt-1 font-mono text-[11px] text-white/50">{detail.site.siteId}</div>
                <div className="font-mono text-[11px] text-white/50">owner: {detail.site.userId}</div>
              </div>
              <button onClick={() => setDetail(null)} className="text-white/40 hover:text-white">
                ×
              </button>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-[12px] sm:grid-cols-4">
              <Kv k="Verified" v={detail.site.verified ? "yes" : "no"} />
              <Kv k="Subs" v={detail.site.subscribers.toLocaleString()} />
              <Kv k="Sent" v={detail.site.sentCount.toLocaleString()} />
              <Kv k="Delivered" v={detail.site.deliveredTotal.toLocaleString()} />
            </div>
            <div className="mt-6">
              <div className="mb-2 text-[11px] uppercase tracking-wider text-white/40">Last 10 notifications</div>
              <div className="space-y-2">
                {detail.notifications.map((n: any, i: number) => (
                  <div key={i} className="rounded-md border border-white/[0.06] bg-white/[0.02] p-3">
                    <div className="flex items-baseline justify-between">
                      <div className="text-[13px] font-medium">{n.title}</div>
                      <div className="text-[10px] text-white/40">{new Date(n.sentAt).toLocaleString()}</div>
                    </div>
                    <div className="mt-1 line-clamp-2 text-[12px] text-white/60">{n.body}</div>
                    <div className="mt-1 text-[10px] text-white/40">
                      {n.delivered}/{n.attempted} delivered
                    </div>
                  </div>
                ))}
                {detail.notifications.length === 0 && <div className="text-[12px] text-white/40">None sent.</div>}
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2 border-t border-white/[0.06] pt-4">
              <button
                onClick={() => askDelete(detail.site.siteId, detail.site.origin, detail.site.subscribers)}
                className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-[12px] font-medium text-red-400 hover:bg-red-500/20"
              >
                Delete site
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Kv({ k, v }: { k: string; v: string }) {
  return (
    <div className="rounded-md border border-white/[0.06] bg-white/[0.02] p-2">
      <div className="text-[9px] uppercase tracking-wider text-white/40">{k}</div>
      <div className="mt-0.5 text-[13px] tabular-nums text-white">{v}</div>
    </div>
  );
}

function UsersTab({ requestConfirm }: { requestConfirm: (s: ConfirmState) => void }) {
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/users?q=${encodeURIComponent(q)}`);
    const j = await res.json();
    setRows(j.users || []);
    setLoading(false);
  }, [q]);

  useEffect(() => {
    load();
  }, [load]);

  function askDelete(userId: string, siteCount: number, origins: string[]) {
    requestConfirm({
      title: `Delete user ${userId}?`,
      description: (
        <div className="space-y-1">
          <div>This cascades and permanently removes:</div>
          <ul className="ml-4 list-disc text-white/60">
            <li>The user account</li>
            <li>
              {siteCount} site(s){origins.length ? `: ${origins.join(", ")}` : ""}
            </li>
            <li>All their subscribers</li>
            <li>All their notification history</li>
          </ul>
          <div className="mt-2 text-red-400/80">This cannot be undone.</div>
        </div>
      ),
      phrase: "DELETE IT",
      actionLabel: "Delete user",
      onConfirm: async () => {
        const res = await fetch(`/api/admin/users/${userId}`, { method: "DELETE" });
        if (res.ok) load();
      },
    });
  }

  return (
    <div>
      <div className="mb-4 flex gap-2">
        <input
          className="flex-1 rounded-md border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-white/30"
          placeholder="Search by userId"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && load()}
        />
        <button onClick={load} className="rounded-md border border-white/10 bg-white/[0.03] px-3 text-[13px] text-white/80 hover:border-white/25 hover:text-white">
          Search
        </button>
      </div>

      {loading && <p className="text-sm text-white/40">Loading…</p>}
      <div className="overflow-x-auto rounded-xl border border-white/[0.08]">
        <table className="w-full min-w-[640px] text-left text-[13px]">
          <thead className="bg-white/[0.03] text-[11px] uppercase tracking-wider text-white/50">
            <tr>
              <th className="px-3 py-2">User</th>
              <th className="px-3 py-2">Created</th>
              <th className="px-3 py-2 text-right">Sites</th>
              <th className="px-3 py-2">Origins</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.05]">
            {rows.map((u) => (
              <tr key={u.userId} className="hover:bg-white/[0.02]">
                <td className="px-3 py-2 font-mono text-[11px] text-white/80">{u.userId}</td>
                <td className="px-3 py-2 text-[11px] text-white/50">{new Date(u.createdAt).toLocaleString()}</td>
                <td className="px-3 py-2 text-right tabular-nums">{u.siteCount}</td>
                <td className="max-w-[300px] truncate px-3 py-2 text-[11px] text-white/60">{(u.origins || []).join(", ") || "—"}</td>
                <td className="px-3 py-2 text-right">
                  <button onClick={() => askDelete(u.userId, u.siteCount, u.origins || [])} className="text-[11px] text-red-400 hover:text-red-300">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && !loading && (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-[12px] text-white/40">
                  No users match.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AuditTab() {
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => {
    fetch("/api/admin/audit").then((r) => r.json()).then((j) => setRows(j.entries || []));
  }, []);
  return (
    <div className="overflow-x-auto rounded-xl border border-white/[0.08]">
      <table className="w-full min-w-[640px] text-left text-[13px]">
        <thead className="bg-white/[0.03] text-[11px] uppercase tracking-wider text-white/50">
          <tr>
            <th className="px-3 py-2">When</th>
            <th className="px-3 py-2">Action</th>
            <th className="px-3 py-2">Target</th>
            <th className="px-3 py-2">Meta</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/[0.05]">
          {rows.map((r, i) => (
            <tr key={i}>
              <td className="whitespace-nowrap px-3 py-2 text-[11px] text-white/60">{new Date(r.at).toLocaleString()}</td>
              <td className="px-3 py-2 font-mono text-[11px] text-white/80">{r.action}</td>
              <td className="px-3 py-2 font-mono text-[11px] text-white/60">{r.targetType ? `${r.targetType}: ${r.targetId}` : "—"}</td>
              <td className="max-w-[300px] truncate px-3 py-2 text-[11px] text-white/50">{r.meta ? JSON.stringify(r.meta) : "—"}</td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={4} className="px-3 py-6 text-center text-[12px] text-white/40">
                Nothing logged yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
