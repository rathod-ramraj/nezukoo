// Layla push queue worker.
// Runs as its own Node process alongside Next.
// Polls the `notifications` collection for docs with status="pending",
// claims them, fans out web-push, updates progress on the same doc.

require("dotenv").config({ path: ".env.local" });
require("dotenv").config({ path: ".env", override: false });
require("dotenv").config({ path: ".env.development", override: false });

const { MongoClient, ObjectId } = require("mongodb");
const webpush = require("web-push");
const http = require("http");

const MONGO_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.MONGODB_DB || "Layla";
const PORT = Number(process.env.PORT || process.env.QUEUE_PORT || 4001);
const CONCURRENCY = Number(process.env.QUEUE_CONCURRENCY || 250);
const POLL_MS = Number(process.env.QUEUE_POLL_MS || 1500);
const PROGRESS_EVERY = Number(process.env.QUEUE_PROGRESS_EVERY || 25);
const WORKER_ID = `${process.pid}-${Math.random().toString(36).slice(2, 8)}`;

if (!MONGO_URI) {
  console.error("[queue] MONGODB_URI not set");
  process.exit(1);
}
if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
  console.error("[queue] VAPID keys not set");
  process.exit(1);
}

webpush.setVapidDetails(
  process.env.VAPID_CONTACT || "mailto:admin@layla.wtf",
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY,
);

const client = new MongoClient(MONGO_URI);
let db;

async function connect() {
  await client.connect();
  db = client.db(DB_NAME);
  await db.collection("notifications").createIndex({ status: 1, sentAt: 1 });
  console.log(`[queue] connected · worker=${WORKER_ID} · concurrency=${CONCURRENCY}`);
}

async function claimNext() {
  const staleBefore = new Date(Date.now() - 5 * 60 * 1000);
  return db.collection("notifications").findOneAndUpdate(
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
    { sort: { sentAt: 1 }, returnDocument: "after" },
  );
}

async function runJob(job) {
  const startedAt = Date.now();
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
    { $set: { attempted: subs.length, delivered: 0, failed: 0 } },
  );

  let delivered = 0;
  let failed = 0;
  const gone = [];
  let sinceFlush = 0;

  async function flush() {
    if (sinceFlush === 0) return;
    sinceFlush = 0;
    await db.collection("notifications").updateOne(
      { _id: job._id },
      { $set: { delivered, failed, claimedAt: new Date() } },
    );
  }

  let i = 0;
  async function worker() {
    while (i < subs.length) {
      const s = subs[i++];
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: s.keys },
          payload,
          { TTL: 60 * 60 * 24 },
        );
        delivered++;
      } catch (e) {
        failed++;
        const code = e && e.statusCode;
        if (code === 404 || code === 410) gone.push(s.endpoint);
      }
      sinceFlush++;
      if (sinceFlush >= PROGRESS_EVERY) await flush();
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(CONCURRENCY, subs.length || 1) }, worker),
  );
  await flush();

  if (gone.length) {
    await db
      .collection("subscribers")
      .deleteMany({ siteId: job.siteId, endpoint: { $in: gone } });
  }

  await db.collection("notifications").updateOne(
    { _id: job._id },
    {
      $set: {
        status: "done",
        delivered,
        failed,
        finishedAt: new Date(),
      },
      $unset: { claimedBy: "", claimedAt: "" },
    },
  );

  await db.collection("sites").updateOne(
    { siteId: job.siteId },
    {
      $inc: {
        sentCount: 1,
        attemptedTotal: subs.length,
        deliveredTotal: delivered,
      },
    },
  );

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
      _id: { $nin: keep.map((n) => n._id) },
    });
  }

  const ms = Date.now() - startedAt;
  console.log(
    `[queue] job=${job._id} site=${job.siteId} attempted=${subs.length} delivered=${delivered} failed=${failed} ms=${ms}`,
  );
}

let running = false;
async function tick() {
  if (running) return;
  running = true;
  try {
    while (true) {
      const found = await claimNext();
      const doc = found && found.value ? found.value : found;
      if (!doc || !doc._id) break;
      try {
        await runJob(doc);
      } catch (e) {
        console.error(`[queue] job ${doc._id} failed:`, e);
        await db.collection("notifications").updateOne(
          { _id: doc._id },
          {
            $set: {
              status: "done",
              error: String(e && e.message ? e.message : e).slice(0, 500),
              finishedAt: new Date(),
            },
            $unset: { claimedBy: "", claimedAt: "" },
          },
        );
      }
    }
  } finally {
    running = false;
  }
}

http
  .createServer((req, res) => {
    if (req.url === "/health" || req.url === "/") {
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ ok: true, worker: WORKER_ID }));
      return;
    }
    if (req.url === "/kick" && req.method === "POST") {
      res.writeHead(202, { "content-type": "application/json" });
      res.end(JSON.stringify({ ok: true }));
      tick();
      return;
    }
    res.writeHead(404);
    res.end();
  })
  .listen(PORT, "0.0.0.0", () => {
    console.log(`[queue] http listening on 0.0.0.0:${PORT}`);
  });

async function main() {
  await connect();
  setInterval(tick, POLL_MS);
  tick();
}

main().catch((e) => {
  console.error("[queue] fatal:", e);
  process.exit(1);
});

async function shutdown(sig) {
  console.log(`[queue] ${sig} received, closing…`);
  try {
    await client.close();
  } catch {}
  process.exit(0);
}
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
