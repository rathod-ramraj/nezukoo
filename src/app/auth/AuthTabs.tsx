"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { VanishInput } from "@/components/ui/VanishInput";
import { TosModal } from "@/components/ui/TosModal";
import { Turnstile } from "@/components/ui/Turnstile";
import { StatefulButton } from "@/components/ui/StatefulButton";

type Tab = "signin" | "signup";

export default function AuthTabs() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/dashboard";
  const initial = (params.get("tab") as Tab) === "signup" ? "signup" : "signin";
  const [tab, setTab] = useState<Tab>(initial);

  useEffect(() => {
    const t = (params.get("tab") as Tab) === "signup" ? "signup" : "signin";
    setTab(t);
  }, [params]);

  function switchTab(t: Tab) {
    setTab(t);
    const sp = new URLSearchParams(Array.from(params.entries()));
    sp.set("tab", t);
    router.replace(`/auth?${sp.toString()}`, { scroll: false });
  }

  return (
    <div className="w-full">
      <div className="mx-auto mb-6 flex w-full max-w-xs items-center justify-center">
        <div className="relative grid w-full grid-cols-2 rounded-full border border-border bg-black/60 p-1 backdrop-blur">
          <TabPill active={tab === "signin"} onClick={() => switchTab("signin")}>
            Sign in
          </TabPill>
          <TabPill active={tab === "signup"} onClick={() => switchTab("signup")}>
            Create
          </TabPill>
        </div>
      </div>

      <div className="relative">
        <AnimatePresence mode="wait">
          {tab === "signin" ? (
            <motion.div
              key="signin"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <SignInForm next={next} />
            </motion.div>
          ) : (
            <motion.div
              key="signup"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <SignUpForm />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function TabPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={
        "relative rounded-full px-4 py-1.5 text-xs font-medium transition-colors " +
        (active ? "text-white" : "text-muted hover:text-white")
      }
    >
      {active && (
        <motion.span
          layoutId="auth-tab-pill"
          className="absolute inset-0 -z-0 rounded-full bg-accent shadow-[0_0_30px_rgba(93,10,209,0.6)]"
          transition={{ type: "spring", stiffness: 400, damping: 32 }}
        />
      )}
      <span className="relative z-10">{children}</span>
    </button>
  );
}

function SignInForm({ next }: { next: string }) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [captcha, setCaptcha] = useState<string | null>(null);

  function format(v: string) {
    const d = v.replace(/\D/g, "").slice(0, 16);
    return d.match(/.{1,4}/g)?.join("-") ?? "";
  }

  async function submit() {
    if (loading) return;
    setErr(null);
    if (!captcha) {
      setErr("Please complete the captcha.");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, turnstileToken: captcha }),
    });
    setLoading(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setErr(j.error || "Invalid code");
      setCaptcha(null);
      return;
    }
    router.push(next);
    router.refresh();
  }

  return (
    <div className="rounded-2xl border border-border bg-panel/80 p-6 backdrop-blur">
      <h1 className="text-xl font-semibold">Welcome back</h1>
      <p className="mt-1 text-sm text-muted">Enter your 16-digit code.</p>

      <div className="mt-5">
        <VanishInput
          value={code}
          onChange={(v) => setCode(format(v))}
          placeholder="XXXX-XXXX-XXXX-XXXX"
          inputMode="numeric"
          autoFocus
          autoComplete="off"
          inputClassName="font-mono tracking-wider"
          onEnter={submit}
        />
      </div>

      <div className="mt-4">
        <Turnstile onToken={setCaptcha} />
      </div>

      {err && <p className="mt-3 text-sm text-red-400">{err}</p>}

      <StatefulButton
        onClick={submit}
        disabled={loading || code.replace(/\D/g, "").length !== 16 || !captcha}
        className="mt-5 w-full bg-accent py-3 text-white hover:bg-accent-hover"
      >
        {loading ? "Checking…" : "Sign in"}
      </StatefulButton>

      <p className="mt-4 text-center text-xs text-muted">
        Sessions last 7 days. Codes never expire — save yours.
      </p>
    </div>
  );
}

function SignUpForm() {
  const router = useRouter();
  const [code, setCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [tosOpen, setTosOpen] = useState(false);
  const [captcha, setCaptcha] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function create() {
    if (loading) return;
    setErr(null);
    setLoading(true);
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ turnstileToken: captcha }),
    });
    const j = await res.json().catch(() => ({}));
    setLoading(false);
    if (j.code) {
      setCode(j.code);
    } else {
      setErr(j.error || "Failed");
      setCaptcha(null);
    }
  }

  function requestCreate() {
    if (loading || code) return;
    if (!captcha) {
      setErr("Please complete the captcha.");
      return;
    }
    setTosOpen(true);
  }

  function acceptTos() {
    setTosOpen(false);
    create();
  }

  async function copy() {
    if (!code) return;
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function goDashboard() {
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="rounded-2xl border border-border bg-panel/80 p-6 backdrop-blur">
      <h1 className="text-xl font-semibold">Create your account</h1>
      <p className="mt-1 text-sm text-muted">
        We generate a private 16-digit code. Save it — no recovery exists.
      </p>

      {!code && (
        <>
          <div className="mt-6">
            <Turnstile onToken={setCaptcha} />
          </div>

          {err && <p className="mt-3 text-sm text-red-400">{err}</p>}

          <StatefulButton
            onClick={requestCreate}
            disabled={loading || !captcha}
            className="mt-5 w-full bg-accent py-3 text-white hover:bg-accent-hover"
          >
            {loading ? "Generating…" : "Generate my code"}
          </StatefulButton>
        </>
      )}

      <TosModal open={tosOpen} onAccept={acceptTos} onReject={() => setTosOpen(false)} />

      {code && (
        <div className="mt-6 space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-accent/60 bg-black p-4 text-center shadow-[0_0_50px_rgba(93,10,209,0.25)]"
          >
            <div className="text-[10px] uppercase tracking-widest text-muted">Your code</div>
            <div className="mt-2 font-mono text-sm sm:text-lg tracking-wider sm:tracking-widest">{code}</div>
          </motion.div>

          <button
            onClick={copy}
            className="w-full rounded-lg border border-border px-4 py-2.5 text-sm transition hover:border-accent"
          >
            {copied ? "Copied ✓" : "Copy to clipboard"}
          </button>

          <label className="flex items-start gap-2 text-xs text-muted">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="mt-0.5 accent-accent"
            />
            I&apos;ve saved this code. I understand there is no recovery.
          </label>

          <button
            onClick={goDashboard}
            disabled={!confirmed}
            className="w-full rounded-lg bg-accent px-4 py-3 text-sm font-medium text-white transition hover:bg-accent-hover disabled:opacity-40"
          >
            Continue →
          </button>
        </div>
      )}
    </div>
  );
}

