"use client";
import { useState } from "react";

export default function Snippet({ siteId, appUrl }: { siteId: string; appUrl: string }) {
  const snippet = `<script async src="${appUrl}/embed/${siteId}.js"></script>`;
  const swUrl = `${appUrl}/sw.js`;
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  async function downloadSw() {
    if (downloading) return;
    setDownloading(true);
    try {
      const res = await fetch(swUrl, { cache: "no-store" });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "nezuko-sw.js";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setDownloaded(true);
      setTimeout(() => setDownloaded(false), 2000);
    } catch {
      window.open(swUrl, "_blank");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="rounded-xl border border-white/[0.08] bg-white/[0.02]">
      <div className="flex flex-col gap-1 border-b border-white/[0.06] px-5 py-3 sm:flex-row sm:items-baseline sm:justify-between">
        <h2 className="text-sm font-semibold text-white">Install</h2>
        <p className="text-[12px] text-white/50">Two steps. Under a minute.</p>
      </div>

      <div className="flex flex-col divide-y divide-white/[0.06]">
        <Step
          num={1}
          title="Upload the service worker to your site"
          desc="Web push requires a service worker on your own origin. Download the file, then upload it so it's reachable at the root of your site."
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              onClick={downloadSw}
              disabled={downloading}
              className={
                "inline-flex items-center justify-center gap-2 rounded-md border px-3 py-2 text-[12px] font-medium transition disabled:cursor-not-allowed " +
                (downloaded
                  ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                  : "border-white/10 bg-white/[0.03] text-white hover:border-white/25 hover:bg-white/[0.06]")
              }
            >
              {downloaded ? (
                <>
                  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.4" className="h-3.5 w-3.5">
                    <path d="M4 10l4 4 8-8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Downloaded
                </>
              ) : (
                <>
                  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-3.5 w-3.5">
                    <path d="M10 3v10m0 0l-4-4m4 4l4-4M4 17h12" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {downloading ? "Downloading…" : "Download "}
                  {!downloading && <code className="rounded bg-white/[0.06] px-1 text-white/80">nezuko-sw.js</code>}
                </>
              )}
            </button>
            <span className="text-[12px] text-white/50">
              Then upload to your root, so it&apos;s reachable at{" "}
              <code className="rounded bg-white/[0.06] px-1 text-white/80">yoursite.com/nezuko-sw.js</code>
            </span>
          </div>
          <p className="mt-3 text-[11px] leading-relaxed text-white/40">
            Common places: <code className="text-white/60">public/</code> (Next.js, Vite, Nuxt, Astro),{" "}
            <code className="text-white/60">static/</code> (SvelteKit), the web root of your PHP/WordPress site, or your S3/Cloudflare Pages bucket root.
          </p>
        </Step>

        <Step
          num={2}
          title="Paste the snippet before </body>"
          desc="One line. Once the SW is in place, this loads Nezuko and prompts users on their first click."
        >
          <SnippetBlock code={snippet} />
        </Step>

        <Step
          num={3}
          title="Verify"
          desc="Load your site in a fresh (non-private) window and click anywhere. You should see the browser's notification prompt. Once someone allows, they appear in Subscribers instantly."
        >
          <p className="text-[11px] leading-relaxed text-white/40">
            Not working? Open DevTools → Application → Service Workers. If nothing is registered, check that{" "}
            <code className="text-white/60">nezuko-sw.js</code> at your root returns JavaScript (not HTML).
          </p>
        </Step>
      </div>
    </div>
  );
}

function Step({
  num,
  title,
  desc,
  children,
}: {
  num: number;
  title: string;
  desc: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-4 px-5 py-5">
      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-[11px] font-semibold text-white/70">
        {num}
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="text-[13px] font-semibold text-white">{title}</h3>
        <p className="mt-1 text-[12px] leading-relaxed text-white/55">{desc}</p>
        <div className="mt-3">{children}</div>
      </div>
    </div>
  );
}

function SnippetBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="relative">
      <pre className="overflow-x-auto rounded-md border border-white/10 bg-black/60 p-4 pr-24 font-mono text-[12px] leading-relaxed text-white/80">
        <code>{code}</code>
      </pre>
      <button
        onClick={copy}
        className={
          "absolute right-2 top-2 inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[11px] font-medium transition " +
          (copied
            ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
            : "border-white/10 bg-white/[0.03] text-white/60 hover:border-white/25 hover:text-white")
        }
      >
        {copied ? (
          <>
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.4" className="h-3 w-3">
              <path d="M4 10l4 4 8-8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Copied
          </>
        ) : (
          <>
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-3 w-3">
              <rect x="6" y="6" width="10" height="10" rx="2" />
              <path d="M4 14V5a1 1 0 011-1h9" />
            </svg>
            Copy
          </>
        )}
      </button>
    </div>
  );
}
