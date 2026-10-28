"use client";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

type Push = { id: number; title: string; body: string };

function useClock() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);
  return now;
}

const PRESETS: { title: string; body: string }[] = [
  { title: "New signup", body: "Nezuko just crossed 1,000 subscribers." },
  { title: "Ship it", body: "Deploy #482 is live in production." },
  { title: "Server hot", body: "us-east-1 CPU at 94%. Autoscale kicked in." },
];

type SendState = "idle" | "sending" | "sent";

export default function LiveDemo() {
  const [title, setTitle] = useState("Your first push");
  const [body, setBody] = useState("Hey — this notification came from Layla.");
  const [stack, setStack] = useState<Push[]>([]);
  const [device, setDevice] = useState<"phone" | "desktop">("phone");
  const [sendState, setSendState] = useState<SendState>("idle");
  const idRef = useRef(0);

  function fire(t: string, b: string) {
    const id = ++idRef.current;
    setStack((s) => [{ id, title: t, body: b }, ...s].slice(0, 4));
    setTimeout(() => {
      setStack((s) => s.filter((p) => p.id !== id));
    }, 5200);
  }

  function send() {
    if (sendState !== "idle") return;
    const t = title.trim() || "Untitled";
    const b = body.trim() || "…";
    setSendState("sending");
    setTimeout(() => {
      fire(t, b);
      setSendState("sent");
      setTimeout(() => setSendState("idle"), 1400);
    }, 550);
  }

  useEffect(() => {
    const t = setTimeout(() => fire(PRESETS[0].title, PRESETS[0].body), 800);
    return () => clearTimeout(t);
  }, []);

  const latest = stack[0];

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)] lg:gap-14">
      {/* Composer */}
      <div className="relative order-2 lg:order-1">
        <div className="pointer-events-none absolute -inset-6 -z-10 rounded-3xl bg-[radial-gradient(circle_at_30%_0%,rgba(93,10,209,0.35),transparent_60%)] blur-2xl" />
        <div className="rounded-2xl border border-border bg-panel/80 p-1 shadow-[0_30px_80px_-30px_rgba(93,10,209,0.4)] backdrop-blur">
          <div className="flex items-center justify-between border-b border-border px-4 py-2">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted">
                POST /notifications
              </span>
            </div>
          </div>
          <div className="space-y-4 p-5">
            <label className="block">
              <span className="mb-1.5 block font-mono text-[10px] uppercase tracking-widest text-muted">
                title
              </span>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value.slice(0, 60))}
                onKeyDown={(e) => e.key === "Enter" && send()}
                className="w-full rounded-lg border border-border bg-black/60 px-3 py-2.5 text-sm text-white placeholder:text-muted focus:border-accent"
                placeholder="What happened?"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block font-mono text-[10px] uppercase tracking-widest text-muted">
                body
              </span>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value.slice(0, 140))}
                rows={2}
                className="w-full resize-none rounded-lg border border-border bg-black/60 px-3 py-2.5 text-sm text-white placeholder:text-muted focus:border-accent"
                placeholder="Details for your subscriber."
              />
            </label>
            <div className="flex flex-wrap gap-1.5">
              {PRESETS.map((p) => (
                <button
                  key={p.title}
                  onClick={() => {
                    setTitle(p.title);
                    setBody(p.body);
                  }}
                  className="rounded-full border border-border bg-black/40 px-2.5 py-1 text-[10px] text-muted transition hover:border-accent hover:text-white"
                >
                  {p.title}
                </button>
              ))}
            </div>
            <button
              onClick={send}
              disabled={sendState !== "idle"}
              className={
                "group relative flex w-full items-center justify-center overflow-hidden rounded-lg px-4 py-3 text-sm font-medium text-white shadow-[0_0_40px_-8px_rgba(93,10,209,0.9)] transition disabled:cursor-not-allowed " +
                (sendState === "sent"
                  ? "bg-emerald-500 shadow-[0_0_40px_-8px_rgba(16,185,129,0.9)]"
                  : "bg-accent hover:bg-accent-hover")
              }
            >
              <AnimatePresence mode="wait" initial={false}>
                {sendState === "idle" && (
                  <motion.span
                    key="idle"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.18 }}
                    className="relative z-10 inline-flex items-center gap-2"
                  >
                    Send push
                    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5">
                      <path d="M4 10h12M11 5l5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </motion.span>
                )}
                {sendState === "sending" && (
                  <motion.span
                    key="sending"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.18 }}
                    className="relative z-10 inline-flex items-center gap-2"
                  >
                    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5 animate-spin">
                      <path d="M10 2a8 8 0 018 8" strokeLinecap="round" />
                    </svg>
                    Sending…
                  </motion.span>
                )}
                {sendState === "sent" && (
                  <motion.span
                    key="sent"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.18 }}
                    className="relative z-10 inline-flex items-center gap-2"
                  >
                    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.4" className="h-3.5 w-3.5">
                      <path d="M4 10.5l4 4 8-9" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Delivered
                  </motion.span>
                )}
              </AnimatePresence>
              <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
            </button>
          </div>
        </div>
      </div>

      {/* Devices */}
      <div className="relative order-1 flex flex-col items-center justify-center lg:order-2">
        <div className="pointer-events-none absolute -inset-10 -z-10 rounded-full bg-[radial-gradient(circle_at_center,rgba(93,10,209,0.25),transparent_70%)] blur-3xl" />

        {/* Mobile toggle */}
        <div className="mb-6 flex sm:hidden">
          <DeviceToggle value={device} onChange={setDevice} />
        </div>

        {/* Mobile: one device at a time */}
        <div className="flex w-full justify-center sm:hidden">
          {device === "phone" ? <IPhone stack={stack} /> : <MacBook latest={latest} />}
        </div>

        {/* MacBook + iPhone on ≥sm */}
        <div className="relative hidden w-full items-end justify-center gap-6 sm:flex sm:gap-10">
          <MacBook latest={latest} />
          <div className="relative -mb-4">
            <IPhone stack={stack} />
          </div>
        </div>
      </div>
    </div>
  );
}

function MacBook({ latest }: { latest: Push | undefined }) {
  const now = useClock();
  return (
    <div className="relative w-full max-w-[640px]">
      {/* screen */}
      <div className="relative rounded-t-[14px] border border-white/[0.08] bg-gradient-to-b from-white/[0.06] to-black p-2.5 shadow-[0_40px_100px_-30px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(255,255,255,0.08)]">
        {/* camera notch */}
        <div className="absolute left-1/2 top-1 z-30 h-1.5 w-14 -translate-x-1/2 rounded-full bg-black">
          <span className="absolute left-1/2 top-1/2 h-1 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/10" />
        </div>
        <div className="relative aspect-[16/10] w-full overflow-hidden rounded-[8px] bg-[linear-gradient(135deg,#12002a_0%,#050010_60%,#0a0014_100%)]">
          {/* wallpaper glow */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(93,10,209,0.35),transparent_55%),radial-gradient(ellipse_at_bottom_right,rgba(93,10,209,0.15),transparent_60%)]" />

          {/* menu bar */}
          <div className="relative z-10 flex items-center justify-between border-b border-white/[0.06] bg-black/30 px-3 py-1 font-mono text-[9px] text-white/70 backdrop-blur">
            <div className="flex items-center gap-3">
              <svg viewBox="0 0 20 20" fill="currentColor" className="h-2.5 w-2.5">
                <path d="M13.5 2c-.5 1.3-1.5 2-2.7 2 .1-1.3 1.1-2.4 2.7-2zM15 14c-.5 1.1-.8 1.5-1.5 2.4-.9 1.2-2.2 2.6-3.9 2.6-1.5 0-1.9-1-3.9-1s-2.5 1-3.9 1c-1.7 0-3-1.5-3.9-2.7C-1.6 12.3-1.3 6.5 2.7 5.2c1.4-.5 2.7 0 4 .5 1-.4 2-1 3.4-.9 1.5.1 2.7.8 3.5 1.7-3.1 1.8-2.6 6.2 1.4 7.5z" />
              </svg>
              <span className="font-semibold">Safari</span>
              <span className="text-white/50">File</span>
              <span className="text-white/50">Edit</span>
              <span className="text-white/50">View</span>
              <span className="text-white/50">History</span>
            </div>
            <div className="flex items-center gap-2 text-white/70">
              <span></span>
              <span></span>
              <span>100%</span>
              <span className="tabular-nums" suppressHydrationWarning>
                {now ? now.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" }) : ""}
              </span>
              <span className="tabular-nums" suppressHydrationWarning>
                {now ? now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
              </span>
            </div>
          </div>

          {/* browser window */}
          <div className="relative z-0 mx-4 mt-3 rounded-md border border-white/[0.08] bg-black/40 shadow-[0_20px_40px_-20px_rgba(0,0,0,0.9)] backdrop-blur">
            <div className="flex items-center gap-2 border-b border-white/[0.06] px-3 py-1.5">
              <div className="flex gap-1">
                <span className="h-2 w-2 rounded-full bg-[#ff5f57]" />
                <span className="h-2 w-2 rounded-full bg-[#febc2e]" />
                <span className="h-2 w-2 rounded-full bg-[#28c840]" />
              </div>
              <div className="mx-auto flex items-center gap-1.5 rounded-md bg-white/[0.06] px-2 py-0.5 font-mono text-[9px] text-white/60">
                <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.4" className="h-2.5 w-2.5">
                  <path d="M4 5V4a2 2 0 114 0v1M3.5 5h5v4.5h-5z" />
                </svg>
                your-site.com
              </div>
              <div className="w-6" />
            </div>
            <div className="grid grid-cols-[1fr_1.2fr] gap-3 p-3">
              <div className="space-y-1.5">
                <div className="h-2 w-16 rounded-full bg-white/20" />
                <div className="h-1.5 w-24 rounded-full bg-white/10" />
                <div className="h-1.5 w-20 rounded-full bg-white/10" />
                <div className="mt-2 h-5 w-16 rounded bg-accent/70" />
              </div>
              <div className="rounded bg-gradient-to-br from-accent/30 to-transparent" />
            </div>
          </div>

          {/* corner notification */}
          <div className="pointer-events-none absolute right-3 top-9 z-20 w-[62%] max-w-[280px]">
            <AnimatePresence>
              {latest && (
                <motion.div
                  key={latest.id}
                  initial={{ opacity: 0, y: -20, x: 20, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, x: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -12, scale: 0.96 }}
                  transition={{ type: "spring", stiffness: 340, damping: 28 }}
                  className="rounded-[10px] border border-white/10 bg-[rgba(38,38,42,0.72)] p-2.5 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.9),inset_0_0.5px_0_rgba(255,255,255,0.08)] backdrop-blur-2xl"
                >
                  <div className="flex items-start gap-2.5">
                    <div className="relative h-6 w-6 shrink-0 overflow-hidden rounded-[5px] bg-gradient-to-br from-accent to-[#3a0785]">
                      <span className="absolute inset-0 flex items-center justify-center text-[11px] font-semibold text-white">L</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <div className="truncate text-[10.5px] font-semibold text-white">
                          Layla
                        </div>
                        <div className="shrink-0 text-[9px] font-medium text-white/55">now</div>
                      </div>
                      <div className="mt-px truncate text-[10.5px] font-semibold text-white">
                        {latest.title}
                      </div>
                      <div className="line-clamp-2 text-[10.5px] leading-snug text-white/80">
                        {latest.body}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* dock */}
          <div className="absolute inset-x-0 bottom-1.5 z-10 flex justify-center">
            <div className="flex items-end gap-1 rounded-xl border border-white/[0.08] bg-black/30 px-1.5 py-1 backdrop-blur">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="h-3.5 w-3.5 rounded-[4px] bg-gradient-to-b from-white/20 to-white/5"
                  style={{ opacity: 0.4 + i * 0.1 }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
      {/* base / hinge */}
      <div className="relative mx-auto h-3 w-[102%] rounded-b-[10px] bg-gradient-to-b from-white/[0.08] to-black shadow-[0_10px_30px_rgba(0,0,0,0.9)]">
        <div className="absolute left-1/2 top-0 h-1 w-16 -translate-x-1/2 rounded-b-md bg-black/60" />
      </div>
      <div className="mx-auto h-1 w-[92%] rounded-b-full bg-black/60" />
    </div>
  );
}

function IPhone({ stack }: { stack: Push[] }) {
  const now = useClock();
  return (
    <div className="relative w-[220px]">
      <div className="relative rounded-[38px] border border-white/[0.08] bg-gradient-to-b from-white/[0.06] to-black p-1.5 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(255,255,255,0.08)]">
        <div className="absolute left-1/2 top-3 z-30 h-4 w-16 -translate-x-1/2 rounded-full bg-black" />
        <div className="relative h-[440px] overflow-hidden rounded-[30px] bg-[linear-gradient(180deg,#0a0014_0%,#12002a_50%,#050010_100%)]">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(93,10,209,0.35),transparent_60%)]" />

          {/* status bar */}
          <div className="relative z-10 flex items-center justify-between px-5 pt-4 font-mono text-[10px] text-white/90">
            <span suppressHydrationWarning>
              {now ? now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
            </span>
            <div className="flex items-center gap-1">
              <span className="h-0.5 w-0.5 rounded-full bg-white" />
              <span className="h-0.5 w-0.5 rounded-full bg-white" />
              <span className="h-0.5 w-0.5 rounded-full bg-white/40" />
              <span className="ml-1 rounded-sm border border-white/60 px-0.5 text-[7px] leading-none">76</span>
            </div>
          </div>

          {/* big clock */}
          <div className="relative z-10 mt-8 text-center">
            <div className="font-sans text-[9px] uppercase tracking-widest text-white/60" suppressHydrationWarning>
              {now ? now.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" }) : ""}
            </div>
            <div className="mt-1 text-[52px] font-light leading-none tracking-tight text-white" suppressHydrationWarning>
              {now ? now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false }) : ""}
            </div>
          </div>

          {/* stack */}
          <div className="absolute inset-x-2 bottom-4 z-20 flex flex-col-reverse gap-1.5">
            <AnimatePresence initial={false}>
              {stack.map((p, i) => (
                <motion.div
                  key={p.id}
                  layout
                  initial={{ opacity: 0, y: 20, scale: 0.92 }}
                  animate={{
                    opacity: 1 - i * 0.18,
                    y: 0,
                    scale: 1 - i * 0.04,
                  }}
                  exit={{ opacity: 0, y: -10, scale: 0.95, transition: { duration: 0.25 } }}
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  style={{ zIndex: 10 - i }}
                  className="rounded-[14px] border border-white/10 bg-[rgba(38,38,42,0.75)] p-2.5 shadow-[0_8px_20px_-8px_rgba(0,0,0,0.9),inset_0_0.5px_0_rgba(255,255,255,0.08)] backdrop-blur-2xl"
                >
                  <div className="flex items-start gap-2">
                    <div className="relative h-6 w-6 shrink-0 overflow-hidden rounded-[5px] bg-gradient-to-br from-accent to-[#3a0785]">
                      <span className="absolute inset-0 flex items-center justify-center text-[10px] font-semibold text-white">L</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <div className="truncate text-[10px] font-semibold text-white">
                          Layla
                        </div>
                        <div className="shrink-0 text-[9px] font-medium text-white/55">now</div>
                      </div>
                      <div className="mt-px truncate text-[10.5px] font-semibold text-white">
                        {p.title}
                      </div>
                      <div className="line-clamp-2 text-[10.5px] leading-snug text-white/80">
                        {p.body}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

function DeviceToggle({
  value,
  onChange,
}: {
  value: "phone" | "desktop";
  onChange: (v: "phone" | "desktop") => void;
}) {
  return (
    <div className="relative flex rounded-full border border-border bg-black/60 p-1 backdrop-blur">
      <motion.div
        layout
        transition={{ type: "spring", stiffness: 400, damping: 32 }}
        className="absolute inset-y-1 w-[calc(50%-4px)] rounded-full bg-accent shadow-[0_0_20px_-4px_rgba(93,10,209,0.8)]"
        style={{ left: value === "phone" ? 4 : "calc(50% + 0px)" }}
      />
      <button
        onClick={() => onChange("phone")}
        className={
          "relative z-10 flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-medium transition-colors " +
          (value === "phone" ? "text-white" : "text-muted")
        }
      >
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-3.5 w-3.5">
          <rect x="6" y="2.5" width="8" height="15" rx="1.5" />
          <path d="M9 15h2" strokeLinecap="round" />
        </svg>
        Phone
      </button>
      <button
        onClick={() => onChange("desktop")}
        className={
          "relative z-10 flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-medium transition-colors " +
          (value === "desktop" ? "text-white" : "text-muted")
        }
      >
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-3.5 w-3.5">
          <rect x="2.5" y="4" width="15" height="10" rx="1.5" />
          <path d="M7 17h6M10 14v3" strokeLinecap="round" />
        </svg>
        Mac
      </button>
    </div>
  );
}

