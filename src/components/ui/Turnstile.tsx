"use client";
import Script from "next/script";
import { useEffect, useRef } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: any) => string;
      reset: (id?: string) => void;
      remove: (id?: string) => void;
    };
  }
}

export function Turnstile({
  onToken,
  theme = "dark",
}: {
  onToken: (token: string | null) => void;
  theme?: "light" | "dark" | "auto";
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const onTokenRef = useRef(onToken);
  onTokenRef.current = onToken;

  const siteKey =
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ||
    "0x4AAAAAAD6OY-3rcsgHnxYd";

  useEffect(() => {
    if (!siteKey) {
      onTokenRef.current("disabled");
      return;
    }

    let cancelled = false;

    function renderWidget() {
      if (cancelled || !containerRef.current || widgetIdRef.current) return;
      if (!window.turnstile) return;

      try {
        containerRef.current.innerHTML = "";
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          theme,
          callback: (token: string) => onTokenRef.current(token),
          "error-callback": () => onTokenRef.current(null),
          "expired-callback": () => onTokenRef.current(null),
          "timeout-callback": () => onTokenRef.current(null),
        });
      } catch (err) {
        console.error("Turnstile render error:", err);
      }
    }

    const interval = setInterval(() => {
      if (cancelled) return;
      if (window.turnstile && containerRef.current && !widgetIdRef.current) {
        renderWidget();
      }
      if (widgetIdRef.current) {
        clearInterval(interval);
      }
    }, 150);

    renderWidget();

    return () => {
      cancelled = true;
      clearInterval(interval);
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {}
        widgetIdRef.current = null;
      }
    };
  }, [siteKey, theme]);

  if (!siteKey) return null;

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
      />
      <div ref={containerRef} className="flex min-h-[65px] items-center justify-center" />
    </>
  );
}
