import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongo";
import { normalizeOrigin } from "@/lib/ids";
export const runtime = "nodejs";

const ENDPOINT_ALLOWLIST = [
  "https://fcm.googleapis.com/",
  "https://updates.push.services.mozilla.com/",
  "https://push.services.mozilla.com/",
  "https://web.push.apple.com/",
  "https://api.push.apple.com/",
];
const ENDPOINT_ALLOW_SUFFIXES = [".notify.windows.com/"];

function isAllowedEndpoint(ep: string) {
  if (ENDPOINT_ALLOWLIST.some((p) => ep.startsWith(p))) return true;
  try {
    const u = new URL(ep);
    if (u.protocol !== "https:") return false;
    return ENDPOINT_ALLOW_SUFFIXES.some((s) => u.host.endsWith(s.replace(/\/$/, "")));
  } catch {
    return false;
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { siteId, origin, subscription } = body ?? {};

  if (typeof siteId !== "string" || !siteId) {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
  if (typeof origin !== "string" || !origin) {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
  if (
    !subscription ||
    typeof subscription !== "object" ||
    typeof subscription.endpoint !== "string" ||
    !isAllowedEndpoint(subscription.endpoint)
  ) {
    return NextResponse.json({ error: "bad_subscription" }, { status: 400 });
  }
  const keys = subscription.keys;
  if (
    !keys ||
    typeof keys !== "object" ||
    typeof keys.p256dh !== "string" ||
    typeof keys.auth !== "string"
  ) {
    return NextResponse.json({ error: "bad_subscription" }, { status: 400 });
  }

  const db = await getDb();
  const site = await db.collection("sites").findOne({ siteId });
  if (!site) return NextResponse.json({ error: "unknown_site" }, { status: 404 });

  let normalized: string | null = null;
  try {
    normalized = normalizeOrigin(origin);
  } catch {}

  if (normalized !== site.origin) {
    return NextResponse.json({ error: "origin_mismatch" }, { status: 403 });
  }

  const userAgent = req.headers.get("user-agent") || null;

  await db.collection("subscribers").updateOne(
    { siteId, endpoint: subscription.endpoint },
    {
      $set: {
        siteId,
        endpoint: subscription.endpoint,
        keys: { p256dh: keys.p256dh, auth: keys.auth },
        userAgent,
        updatedAt: new Date(),
      },
      $setOnInsert: { createdAt: new Date() },
    },
    { upsert: true }
  );

  if (!site.verified) {
    await db.collection("sites").updateOne({ siteId }, { $set: { verified: true, verifiedAt: new Date() } });
  }

  return NextResponse.json({ ok: true });
}
