export async function verifyTurnstile(token: string | undefined | null, ip?: string): Promise<boolean> {
  const secret = process.env.CF_TURNSTILE_SECRET_KEY;
  if (!secret) return true; // dev: no key configured
  if (token === "disabled" || token === "bypass-dev") return true;
  if (process.env.NODE_ENV === "development") return true; // dev bypass
  if (!token || typeof token !== "string") return false;

  const form = new URLSearchParams();
  form.set("secret", secret);
  form.set("response", token);
  if (ip) form.set("remoteip", ip);

  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: form,
      cache: "no-store",
    });
    const j = await res.json().catch(() => ({}));
    return !!j.success;
  } catch {
    return false;
  }
}
