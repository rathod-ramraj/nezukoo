import Link from "next/link";
import Image from "next/image";

export const metadata = {
  title: "FAQ — Nezuko",
};

type Item = {
  q: string;
  a: string;
  image?: { src: string; alt: string; caption?: string };
};

type Category = {
  label: string;
  hint: string;
  items: Item[];
};

const categories: Category[] = [
  {
    label: "Browsers",
    hint: "Quirks that come from the browser, not from Nezuko.",
    items: [
      {
        q: "Why don't notifications show up in Brave?",
        a: "Brave disables Google's push service by default because it routes through Google servers. Users have to enable it manually in Brave settings → Privacy and security → turn on 'Use Google services for push messaging'. After enabling, restart the browser. Until this toggle is on, Brave silently refuses to subscribe — there is nothing any web push service can do server-side.",
        image: {
          src: "/assets/brave-faq.png",
          alt: "Brave settings — enable Use Google services for push messaging",
          caption: "brave://settings/privacy → Use Google services for push messaging",
        },
      },
      {
        q: "Why doesn't the notification icon show on Safari?",
        a: "Safari ignores the icon field in the push payload. It uses the icons declared in your site's Web App Manifest instead — specifically the largest PNG in the icons[] array of your /manifest.json. Fix: add a manifest.json with a 192×192 (or larger) PNG icon, and link it from every page with <link rel=\"manifest\" href=\"/manifest.json\">. Chrome, Firefox, and Edge use the payload icon; Safari doesn't.",
      },
      {
        q: "Why don't notifications work at all on iOS?",
        a: "Web push on iOS Safari only works if the user installs your site to their home screen first (Share → Add to Home Screen). Regular Safari tabs cannot receive push. This is an Apple platform restriction. Once installed as a PWA, push works normally through APNs.",
      },
      {
        q: "Why don't notifications work in private / incognito windows?",
        a: "Chrome, Firefox, and Safari all refuse to register service workers or push subscriptions in private browsing mode. The subscribe prompt may appear but silently fail. This is by design in every browser.",
      },
    ],
  },
  {
    label: "Setup",
    hint: "Adding sites and making the snippet work.",
    items: [
      {
        q: "Why can't I add an http:// site?",
        a: "Web push requires HTTPS. Browsers will not register a service worker on http:// pages (localhost is the only exception, for development). This is a browser security rule, not a Nezuko policy.",
      },
      {
        q: "The user clicked 'Allow' but they don't appear in Subscribers. Why?",
        a: "A few common causes: (1) the site is not served over HTTPS, (2) the nezuko-sw.js file isn't reachable at the site root (open yoursite.com/nezuko-sw.js — it must return JavaScript, not your SPA's index.html), (3) an existing service worker is blocking Nezuko's registration, (4) the browser silently blocked the subscription (Brave, private mode). Open DevTools → Application → Service Workers to inspect.",
      },
      {
        q: "Why do I have to upload nezuko-sw.js? Can't the script do everything?",
        a: "Browsers only allow a service worker to be registered from the same origin as the page. That's a hard security rule — a service worker at nezukoo.vercel.app can't be installed on yoursite.com. So the SW file has to live at yoursite.com/nezuko-sw.js. Every push notification service (OneSignal, Pushly, etc.) has the same requirement. It's a one-time file upload.",
      },
      {
        q: "How do I test that push is working?",
        a: "Add your site, install the snippet, load your site in a normal (non-private) window, click Subscribe. You should appear in Subscribers immediately. Then open the Compose tab and send a test. If nothing arrives, check DevTools → Application → Service Workers → Push.",
      },
      {
        q: "Can two accounts add the same site?",
        a: "Technically yes. But only one can actually collect subscribers, because a browser can only register one service worker per scope. Whichever snippet loads first wins. In practice, the real site owner controls what runs on their domain.",
      },
    ],
  },
  {
    label: "Delivery",
    hint: "What happens after you hit Send.",
    items: [
      {
        q: "Do notifications work when the user's browser is closed?",
        a: "On desktop: only if the browser has a background process (Chrome/Edge usually do on Windows; Firefox doesn't by default; Safari does via macOS). On Android: yes, always — the OS wakes the browser. On iOS PWA: yes, delivered by APNs.",
      },
      {
        q: "How long can a notification take to arrive?",
        a: "Usually under 5 seconds. Push services (FCM/Mozilla/Apple) may delay or batch delivery to save battery, especially on mobile with the screen off. Nezuko sets a 24-hour TTL — if the device is offline that long, the notification is dropped.",
      },
      {
        q: "Why did some notifications fail in the send response?",
        a: "Most common reasons: (1) the subscription expired — browsers rotate keys periodically, (2) the user cleared site data or uninstalled the browser, (3) the push service is temporarily rejecting. Nezuko auto-removes subscribers whose endpoints return 404 or 410 (permanently gone). Transient failures aren't removed.",
      },
      {
        q: "Why is my 'Sent' count higher than my subscriber count?",
        a: "Sent counts every notification you've dispatched over the lifetime of the site. Subscribers is the current live count. If someone unsubscribes or their endpoint goes stale, they're removed from Subscribers but their historical delivery still counts.",
      },
    ],
  },
  {
    label: "Account & data",
    hint: "How Nezuko treats your account and what it stores.",
    items: [
      {
        q: "I lost my 16-digit code. Can I recover it?",
        a: "No. Nezuko stores only a salted hash of your code — the original digits are never saved. There is no email, phone, or backup. If you're still signed in, use the 'My code' button in the header to view it. If you're signed out with the code lost, the account and all its sites are permanently unreachable. Just create a new account and re-add your sites — you keep control of your domain, so re-verification is trivial.",
      },
      {
        q: "How many notifications are kept in history?",
        a: "Only the last 10 per site, to keep the database lean. Older ones are automatically deleted. Lifetime totals (Sent, Attempted, Delivered) are preserved as counters — those don't lose accuracy.",
      },
      {
        q: "Does Nezuko track my visitors?",
        a: "No. The embed script only registers a service worker and prompts for push permission. No analytics, no fingerprinting, no cookies, no third-party requests except to the browser's own push service (FCM/Mozilla/Apple) when a user subscribes.",
      },
    ],
  },
];

export default function FaqPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-black text-white">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[520px] bg-[radial-gradient(ellipse_at_top,rgba(93,10,209,0.22),transparent_60%)]" />
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(to_bottom,transparent,rgba(0,0,0,0.6))]" />

      <nav className="sticky top-0 z-30 border-b border-white/[0.06] bg-black/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo.png" alt="Nezuko" width={28} height={28} />
            <span className="text-lg font-semibold tracking-tight">
              Nezuko<span className="text-accent">.</span>
            </span>
          </Link>
          <Link
            href="/dashboard"
            className="text-sm text-muted transition hover:text-white"
          >
            &larr; Dashboard
          </Link>
        </div>
      </nav>

      <main className="mx-auto max-w-3xl px-6 pb-24 pt-16 sm:pt-20">
        <div className="text-[10px] uppercase tracking-[0.25em] text-accent">Help center</div>
        <h1 className="mt-3 text-5xl font-semibold tracking-tight sm:text-6xl">
          Frequently asked <span className="text-muted">questions</span>
        </h1>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-muted">
          Web push has a lot of quirks that come from the browser, not the service. Here&apos;s what
          people run into most.
        </p>

        <div className="mt-10 flex flex-wrap gap-2">
          {categories.map((c) => (
            <a
              key={c.label}
              href={`#${slug(c.label)}`}
              className="rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-xs text-muted transition hover:border-accent/50 hover:bg-accent/10 hover:text-white"
            >
              {c.label}
            </a>
          ))}
        </div>

        <div className="mt-16 space-y-20">
          {categories.map((cat) => (
            <section key={cat.label} id={slug(cat.label)} className="scroll-mt-24">
              <div className="flex items-baseline justify-between gap-4 border-b border-white/[0.06] pb-4">
                <h2 className="text-2xl font-semibold tracking-tight">{cat.label}</h2>
                <span className="text-xs text-muted">{cat.hint}</span>
              </div>

              <div className="mt-6 space-y-4">
                {cat.items.map((it) => (
                  <article
                    key={it.q}
                    className="group rounded-xl border border-white/[0.06] bg-white/[0.015] p-6 transition hover:border-white/[0.12] hover:bg-white/[0.03]"
                  >
                    <h3 className="text-base font-medium text-white">{it.q}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-muted">{it.a}</p>

                    {it.image && (
                      <figure className="mt-5 overflow-hidden rounded-lg border border-white/[0.08] bg-black/60">
                        <div className="relative w-full">
                          <Image
                            src={it.image.src}
                            alt={it.image.alt}
                            width={1200}
                            height={700}
                            className="h-auto w-full"
                          />
                        </div>
                        {it.image.caption && (
                          <figcaption className="border-t border-white/[0.06] px-4 py-2 text-[11px] text-muted">
                            {it.image.caption}
                          </figcaption>
                        )}
                      </figure>
                    )}
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-24 rounded-2xl border border-white/[0.06] bg-gradient-to-br from-white/[0.03] to-transparent p-8">
          <h3 className="text-lg font-semibold">Still stuck?</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Most web push weirdness comes from the browser, not from Nezuko. If you hit something
            that isn&apos;t here and it feels like a real bug, it probably belongs on this page —
            let us know.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/dashboard"
              className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-white/90"
            >
              Back to dashboard
            </Link>
            <Link
              href="/tos"
              className="rounded-lg border border-white/[0.1] px-4 py-2 text-sm text-muted transition hover:border-white/[0.2] hover:text-white"
            >
              Read the Terms
            </Link>
          </div>
        </div>
      </main>

      <footer className="border-t border-white/[0.06] py-6">
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

function slug(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}
