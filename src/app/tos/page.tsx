import Link from "next/link";
import Image from "next/image";

export const metadata = {
  title: "Terms of Service — Nezuko",
};

const sections = [
  {
    h: "1. What Nezuko is",
    p: "Nezuko is a web push notification service. Site owners embed a small script on their websites to let visitors subscribe to browser notifications. Nezuko stores push subscription endpoints on behalf of site owners and delivers messages via the browser's push service (Google FCM, Mozilla autopush, Apple APNs).",
  },
  {
    h: "2. Your account",
    p: "Your account is a randomly-generated 16-digit code. This code is the sole credential. If you lose it, the account and all its data are permanently inaccessible — there is no recovery, no reset, no support ticket that can restore it. You are solely responsible for storing your code securely.",
  },
  {
    h: "3. Acceptable use — what you MAY NOT do",
    list: [
      "Send unsolicited notifications, spam, or repeated content unrelated to what your visitors opted in for.",
      "Send more than a reasonable frequency of notifications. As a soft guideline: no more than a few notifications per subscriber per day, unless your service inherently demands it (e.g. chat).",
      "Send notifications on behalf of a domain you do not own or control.",
      "Send notifications containing sexual, violent, harassing, hateful content",
      "Send phishing, malware links, cryptocurrency scams, fake giveaways, or fake login prompts.",
    ],
  },
  {
    h: "4. Origin lock",
    p: "Every site you register is bound to one origin (protocol + host). Subscriptions coming from a different origin are rejected server-side. You may not register origins you do not own. If we detect abuse of this, we will delete the site and its subscribers.",
  },
  {
    h: "5. Data we store",
    list: [
      "The salted hash of your 16-digit code (never the code itself in plaintext).",
      "The sites you register: name, origin, timestamps.",
      "Push subscription endpoints and public keys provided by your visitors' browsers. These are opaque tokens routed to browser vendors — Nezuko cannot read the identity of a subscriber from them.",
      "Notification history: title, body, click URL, delivery counts, timestamps.",
      "Short-lived login-attempt records (IP + timestamp) to rate-limit brute-force. Auto-expire in 15 minutes.",
    ],
  },
  {
    h: "6. What we do NOT store",
    list: [
      "Emails. We never ask for one.",
      "Names, phone numbers, addresses, or any personally identifying account information.",
      "Cookies for tracking. The only cookie is your session, and it exists solely so you stay signed in.",
      "Any analytics or fingerprinting from the embed script.",
    ],
  },
  {
    h: "7. Deletion",
    p: "Deleting a site deletes its subscribers and notification history. There is no separate account-delete button — because there is no personal data attached to the account beyond the code hash. Losing your code effectively deletes the account.",
  },
  {
    h: "8. Availability",
    p: "Nezuko is provided as-is, with no uptime SLA. Delivery depends on browser push services, which are outside our control. Some browsers (notably Brave with default settings, and all private/incognito windows) may reject push subscriptions — this is a browser policy, not a Nezuko failure.",
  },
  {
    h: "9. Changes",
    p: "These terms may change. Continued use of Nezuko after changes constitutes acceptance. Material changes will be noted on this page.",
  },
];

export default function TosPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <nav className="border-b border-border/50 bg-black/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo.png" alt="Nezuko" width={28} height={28} />
            <span className="text-lg font-semibold tracking-tight">Nezuko</span>
          </Link>
          <Link href="/" className="text-sm text-muted hover:text-white">&larr; Home</Link>
        </div>
      </nav>

      <main className="mx-auto max-w-2xl px-6 py-16">
        <div className="text-[10px] uppercase tracking-[0.2em] text-accent">Legal</div>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight">Terms of Service</h1>
        <p className="mt-3 text-sm text-muted">
          Short version: don&apos;t spam, don&apos;t scam, don&apos;t register domains you don&apos;t own. Long version below.
        </p>

        <div className="mt-10 space-y-8">
          {sections.map((s) => (
            <section key={s.h}>
              <h2 className="text-lg font-semibold text-white">{s.h}</h2>
              {s.p && <p className="mt-2 text-sm leading-relaxed text-muted">{s.p}</p>}
              {s.list && (
                <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-muted marker:text-accent">
                  {s.list.map((li) => (
                    <li key={li}>{li}</li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>

        <div className="mt-14 border-t border-border pt-6 text-xs text-muted">
          By using Nezuko, you agree to the above. If any of it feels off for your use case, don&apos;t use Nezuko.
        </div>
      </main>

      <footer className="border-t border-border/50 py-6">
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
