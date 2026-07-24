"use client";
import { motion } from "framer-motion";

const steps = [
  {
    n: "01",
    title: "Add your site",
    body: "Sign in with your 16-digit code, paste your site URL, and get a unique embed snippet.",
    visual: (
      <div className="flex h-full items-center justify-center">
        <div className="w-full max-w-xs rounded-lg border border-border bg-black p-4 text-left">
          <div className="mb-2 text-[10px] uppercase tracking-widest text-muted">Add site</div>
          <div className="rounded-md border border-accent-soft bg-black px-3 py-2 font-mono text-xs">
            https://your-site.com
          </div>
          <div className="mt-3 flex justify-end">
            <div className="rounded-full bg-accent px-3 py-1 text-[10px] text-white">Add</div>
          </div>
        </div>
      </div>
    ),
  },
  {
    n: "02",
    title: "Drop the snippet",
    body: "One <script> tag before </body>. Nezuko registers a service worker and handles subscriptions for you.",
    visual: (
      <div className="flex h-full items-center justify-center px-4">
        <pre className="w-full overflow-x-auto rounded-lg border border-border bg-black p-3 text-left text-xs">
          <code className="text-white">
            <span className="text-muted">&lt;</span>
            <span className="text-accent">script</span> src=
            <span className="text-emerald-300">&quot;…&quot;</span>
            <span className="text-muted">&gt;&lt;/</span>
            <span className="text-accent">script</span>
            <span className="text-muted">&gt;</span>
          </code>
        </pre>
      </div>
    ),
  },
  {
    n: "03",
    title: "Send a push",
    body: "Compose a title and body from your dashboard. Every subscriber is delivered a native OS notification.",
    visual: (
      <div className="flex h-full items-center justify-center">
        <div className="w-full max-w-xs rounded-xl border border-border bg-black/80 p-3 shadow-2xl backdrop-blur">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-md bg-accent/30" />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div className="text-xs font-semibold">nezuko.wtf</div>
                <div className="text-[10px] text-muted">now</div>
              </div>
              <div className="mt-0.5 text-xs text-white">You have 42 new signups</div>
              <div className="text-[11px] text-muted">Nice growth today.</div>
            </div>
          </div>
        </div>
      </div>
    ),
  },
];

export default function Workflow() {
  return (
    <div className="grid gap-6 md:grid-cols-3">
      {steps.map((s, i) => (
        <motion.div
          key={s.n}
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5, delay: i * 0.1 }}
          className="group relative overflow-hidden rounded-2xl border border-border bg-panel p-6 transition hover:border-accent"
        >
          <div className="absolute -right-6 -top-6 font-mono text-8xl font-bold text-white/[0.03]">
            {s.n}
          </div>
          <div className="text-[10px] uppercase tracking-widest text-accent">Step {s.n}</div>
          <h3 className="mt-2 text-xl font-semibold">{s.title}</h3>
          <p className="mt-2 text-sm text-muted">{s.body}</p>
          <div className="mt-6 h-32 rounded-lg border border-border bg-black/60">
            {s.visual}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
