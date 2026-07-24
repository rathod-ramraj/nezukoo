"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(name + "="));
  return match ? decodeURIComponent(match.split("=")[1]) : null;
}

function formatCode(digits: string): string {
  const only = digits.replace(/\D/g, "").slice(0, 16);
  return only.match(/.{1,4}/g)?.join("-") ?? "";
}

export default function CopyCodeButton() {
  const [open, setOpen] = useState(false);
  const [reveal, setReveal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [code, setCode] = useState<string>("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const raw = readCookie("nezuko_code");
    setCode(raw ? formatCode(raw) : "");
    setReveal(false);
    setCopied(false);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function onCopy() {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {}
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title="Show my login code"
        className="group inline-flex items-center gap-1.5 rounded-lg border border-border bg-panel/60 px-3 py-1.5 text-sm font-medium text-muted transition hover:border-accent/60 hover:bg-accent/10 hover:text-white"
      >
        <svg
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          className="h-4 w-4"
        >
          <rect x="7" y="7" width="9" height="9" rx="1.6" />
          <path d="M13 7V5a1 1 0 00-1-1H5a1 1 0 00-1 1v7a1 1 0 001 1h2" strokeLinecap="round" />
        </svg>
        <span className="hidden sm:inline">My code</span>
      </button>

      {mounted && open &&
        createPortal(
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />
            <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-border bg-panel shadow-[0_20px_80px_-10px_rgba(0,0,0,0.9)]">
              <span
                aria-hidden
                className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/60 to-transparent"
              />
              <div className="flex items-start justify-between border-b border-border/60 px-5 py-4">
                <div>
                  <div className="text-[10px] uppercase tracking-[0.18em] text-accent">Your login code</div>
                  <h3 className="mt-0.5 text-sm font-semibold text-white">Save this somewhere safe</h3>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="rounded-md p-1 text-muted transition hover:bg-white/5 hover:text-white"
                  aria-label="Close"
                >
                  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
                    <path d="M5 5l10 10M15 5L5 15" strokeLinecap="round" />
                  </svg>
                </button>
              </div>

              <div className="px-5 py-5">
                {code ? (
                  <>
                    <div className="relative flex items-center justify-center rounded-xl border border-border bg-black/60 px-4 py-5">
                      <span
                        className={
                          "font-mono text-lg tracking-[0.2em] text-white transition " +
                          (reveal ? "" : "blur-md select-none")
                        }
                      >
                        {code}
                      </span>
                      {!reveal && (
                        <button
                          onClick={() => setReveal(true)}
                          className="absolute inset-0 flex items-center justify-center gap-1.5 rounded-xl text-xs font-medium text-muted transition hover:text-white"
                        >
                          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-4 w-4">
                            <path d="M2 10s3-6 8-6 8 6 8 6-3 6-8 6-8-6-8-6z" />
                            <circle cx="10" cy="10" r="2.4" />
                          </svg>
                          Click to reveal
                        </button>
                      )}
                    </div>
                    <p className="mt-3 text-[11px] leading-relaxed text-muted">
                      This is the only way to sign back in. We can&apos;t recover it — it&apos;s hashed on our side.
                    </p>
                    <div className="mt-4 flex gap-2">
                      <button
                        onClick={onCopy}
                        disabled={!reveal}
                        className="group inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white shadow-[0_0_30px_-8px_rgba(93,10,209,0.7)] transition hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {copied ? (
                          <>
                            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                              <path d="M4 10l4 4 8-8" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            Copied
                          </>
                        ) : (
                          <>
                            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-4 w-4">
                              <rect x="7" y="7" width="9" height="9" rx="1.6" />
                              <path d="M13 7V5a1 1 0 00-1-1H5a1 1 0 00-1 1v7a1 1 0 001 1h2" strokeLinecap="round" />
                            </svg>
                            Copy code
                          </>
                        )}
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="rounded-xl border border-dashed border-border bg-black/40 px-4 py-6 text-center text-sm text-muted">
                    Your code isn&apos;t saved in this browser.
                    <br />
                    Sign out and sign in again to store it here.
                  </div>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
