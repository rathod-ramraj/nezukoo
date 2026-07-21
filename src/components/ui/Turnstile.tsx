"use client";
import Script from "next/script";
import { useEffect, useId, useRef } from "react";

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
  const holderId = useId().replace(/:/g, "");
  const widgetIdRef = useRef<string | null>(null);
  let siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  if (process.env.NODE_ENV === "development" && (!siteKey || siteKey.startsWith("0x"))) {
    siteKey = "1x00000000000000000000AA";
  }

  useEffect(() => {
    if (!siteKey) {
      onToken("disabled");
      return;
    }

    let cancelled = false;
    function tryRender() {
      if (cancelled) return;
      const el = document.getElementById(holderId);
      if (!el || !window.turnstile || !siteKey) {
        setTimeout(tryRender, 200);
        return;
      }
      if (widgetIdRef.current) return;
      widgetIdRef.current = window.turnstile.render(el, {
        sitekey: siteKey,
        theme,
        callback: (token: string) => onToken(token),
        "error-callback": () => onToken(null),
        "expired-callback": () => onToken(null),
        "timeout-callback": () => onToken(null),
      });
    }
    tryRender();
    return () => {
      cancelled = true;
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {}
        widgetIdRef.current = null;
      }
    };
  }, [holderId, siteKey, theme, onToken]);

  if (!siteKey) return null;

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js"
        strategy="afterInteractive"
      />
      <div id={holderId} className="flex justify-center" />
    </>
  );
}
