# Nezuko Queue Worker (Cloudflare Worker)

Zero-inactivity, high-reliability queue worker for Nezuko Web Push notifications.

## Features
- **Zero Cold-Start Sleep**: Runs 24/7 at Cloudflare's Edge without sleeping (eliminating Render free-tier 15-minute spin-down).
- **Dual Triggers**:
  - **Cron Trigger**: Runs every minute (`* * * * *`) automatically to sweep and process pending or stale jobs.
  - **Instant Kick**: Accepts `POST /kick` (returns 202 immediately and fans out execution with `ctx.waitUntil`).
- **Resilient Delivery**: Retries with exponential backoff on transient network issues.
- **Verification Endpoint**: `GET /process` and `GET /health` for testing and health monitoring.

---

## Deployment & Setup

### 1. Login to Cloudflare (one-time)
```bash
npx wrangler login
```

### 2. Configure Secrets
Set the `CRON_SECRET` (matching your Vercel/production `CRON_SECRET`):
```bash
npx wrangler secret put CRON_SECRET
# Enter: 24528477b0debdda0aa2fe67727efb73feb4cd346e5f9498cfe4bf438422aede
```

*(Optional: If your app URL is different from `https://nezukoo.vercel.app`, set it via `APP_URL` in `wrangler.toml` or `npx wrangler secret put APP_URL`)*.

### 3. Deploy
```bash
npm run deploy
# or: npx wrangler deploy
```

Once deployed, Cloudflare gives you a URL (e.g., `https://nezuko-queue-worker.<your-subdomain>.workers.dev`).

---

## Verification & Testing

### Test Health:
```bash
curl https://nezuko-queue-worker.<your-subdomain>.workers.dev/health
# Response: {"ok":true,"worker":"nezuko-queue-worker","cronConfigured":true,...}
```

### Test Synchronous Processing:
```bash
curl -X POST https://nezuko-queue-worker.<your-subdomain>.workers.dev/process
# Response: {"ok":true,"processed":0,"errors":0,"jobs":[]}
```

### Test Kick Endpoint:
```bash
curl -X POST https://nezuko-queue-worker.<your-subdomain>.workers.dev/kick
# Response: {"ok":true,"queued":true}
```

---

## Switch Production to Cloudflare Worker

Once verified:
1. In your **Vercel Dashboard → Project Settings → Environment Variables**:
   Update **`QUEUE_URL`**:
   ```
   QUEUE_URL=https://nezuko-queue-worker.<your-subdomain>.workers.dev
   ```
2. In your local [.env.local](file:///Users/rathodram/Desktop/Projects/Nezuko/.env.local), update `QUEUE_URL`.
3. Redeploy on Vercel to use the new Worker URL.
