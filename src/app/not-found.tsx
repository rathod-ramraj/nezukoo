import Link from "next/link";
import Image from "next/image";

export const metadata = {
  title: "Not found",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-black text-white">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[520px] bg-[radial-gradient(ellipse_at_top,rgba(93,10,209,0.25),transparent_60%)]" />

      <main className="mx-auto max-w-md px-6 text-center">
        <div className="mx-auto mb-6 inline-flex items-center justify-center rounded-full bg-accent/20 p-3 shadow-[0_0_80px_20px_rgba(93,10,209,0.35)]">
          <Image src="/logo.png" alt="Nezuko" width={44} height={44} />
        </div>

        <div className="text-[10px] uppercase tracking-[0.25em] text-accent">Error 404</div>
        <h1 className="mt-3 text-5xl font-semibold tracking-tight sm:text-6xl">
          Nothing to <span className="text-muted">see here.</span>
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-muted">
          The page you&apos;re looking for doesn&apos;t exist, or it never did. Either way — dead end.
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/"
            className="rounded-full bg-white px-5 py-2.5 text-sm font-medium text-black transition hover:bg-white/90"
          >
            Take me home
          </Link>
          <Link
            href="/faq"
            className="rounded-full border border-white/[0.1] px-5 py-2.5 text-sm text-muted transition hover:border-white/[0.2] hover:text-white"
          >
            Read the FAQ
          </Link>
        </div>
      </main>
    </div>
  );
}
