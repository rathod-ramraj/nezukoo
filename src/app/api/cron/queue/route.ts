import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongo";
import webpush from "web-push";

// Vercel Cron: runs every 30 seconds via vercel.json
// Authorization header is set by Vercel automatically
export const maxDuration = 60;
export const dynamic = "force-dynamic";

const WORKER_ID = `cron-${Date.now()}`;
const CONCURRENCY = 100;

export async function GET(req: NextRequest) {
  // Verify this is called by Vercel Cron (or locally with the secret)
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
    return NextResponse.json({ error: "VAPID keys not configured" }, { status: 500 });
  }

  webpush.setVapidDetails(
    process.env.VAPID_CONTACT || "mailto:admin@example.com",
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );

  if (!process.env.MONGODB_URI) {
    return NextResponse.json({ error: "MONGODB_URI not set" }, { status: 500 });
  }

  try {
    const db = await getDb();
    const staleBefore = new Date(Date.now() - 5 * 60 * 1000);

    // Claim a pending (or stale) notification job
    const found = await db.collection("notifications").findOneAndUpdate(
      {
        $or: [
          { status: "pending" },
          { status: "sending", claimedAt: { $lt: staleBefore } },
        ],
      },
      {
        $set: {
          status: "sending",
          claimedBy: WORKER_ID,
          claimedAt: new Date(),
        },
      },
      { sort: { sentAt: 1 }, returnDocument: "after" }
    );

    const job = found && (found as any).value ? (found as any).value : found;

    if (!job || !job._id) {
      return NextResponse.json({ ok: true, message: "No pending jobs" });
    }

    // Fetch all subscribers for this site
    const subs = await db
      .collection("subscribers")
      .find({ siteId: job.siteId })
      .toArray();

    const payload = JSON.stringify({
      title: job.title,
      body: job.body,
      url: job.url || undefined,
      icon: job.icon || undefined,
      image: job.image || undefined,
      actions: job.actions || undefined,
    });

    await db.collection("notifications").updateOne(
      { _id: job._id },
      { $set: { attempted: subs.length, delivered: 0, failed: 0 } }
    );

    let delivered = 0;
    let failed = 0;
    const gone: string[] = [];

    // Fan out with concurrency
    let i = 0;
    async function worker() {
      while (i < subs.length) {
        const s = subs[i++];
        try {
          await webpush.sendNotification(
            { endpoint: s.endpoint, keys: s.keys },
            payload,
            { TTL: 60 * 60 * 24 }
          );
          delivered++;
        } catch (e: any) {
          failed++;
          if (e?.statusCode === 404 || e?.statusCode === 410) {
            gone.push(s.endpoint);
          }
        }
      }
    }

    await Promise.all(
      Array.from({ length: Math.min(CONCURRENCY, subs.length || 1) }, worker)
    );

    // Remove expired subscriptions
    if (gone.length) {
      await db
        .collection("subscribers")
        .deleteMany({ siteId: job.siteId, endpoint: { $in: gone } });
    }

    // Mark job done
    await db.collection("notifications").updateOne(
      { _id: job._id },
      {
        $set: { status: "done", delivered, failed, finishedAt: new Date() },
        $unset: { claimedBy: "", claimedAt: "" },
      }
    );

    // Update site counters
    await db.collection("sites").updateOne(
      { siteId: job.siteId },
      {
        $inc: {
          sentCount: 1,
          attemptedTotal: subs.length,
          deliveredTotal: delivered,
        },
      }
    );

    // Trim notification history to last 10
    const HISTORY_LIMIT = 10;
    const keep = await db
      .collection("notifications")
      .find({ siteId: job.siteId, status: "done" }, { projection: { _id: 1 } })
      .sort({ sentAt: -1 })
      .limit(HISTORY_LIMIT)
      .toArray();
    if (keep.length === HISTORY_LIMIT) {
      await db.collection("notifications").deleteMany({
        siteId: job.siteId,
        status: "done",
        _id: { $nin: keep.map((n: any) => n._id) },
      });
    }

    return NextResponse.json({
      ok: true,
      job: String(job._id),
      siteId: job.siteId,
      attempted: subs.length,
      delivered,
      failed,
    });
  } catch (err: any) {
    console.error("[cron/queue]", err);
    return NextResponse.json(
      { error: String(err?.message || err) },
      { status: 500 }
    );
  }
}
