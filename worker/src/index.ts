export interface Env {
  APP_URL: string;
  CRON_SECRET: string;
}

interface ProcessResult {
  ok: boolean;
  processed: number;
  errors: number;
  jobs: string[];
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retries = 3,
  baseDelay = 1000
): Promise<Response> {
  let lastErr: unknown;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, options);
      if (res.ok || (res.status >= 400 && res.status < 500)) {
        return res;
      }
      console.warn(`[cf-queue] attempt ${attempt}/${retries} failed with HTTP ${res.status}`);
    } catch (err) {
      lastErr = err;
      console.warn(`[cf-queue] attempt ${attempt}/${retries} network error:`, err);
    }
    if (attempt < retries) {
      await sleep(baseDelay * Math.pow(2, attempt - 1));
    }
  }
  if (lastErr) throw lastErr;
  throw new Error(`Request to ${url} failed after ${retries} attempts`);
}

async function processQueue(env: Env): Promise<ProcessResult> {
  const appUrl = (env.APP_URL || "https://nezukoo.vercel.app").replace(/\/$/, "");
  const secret = env.CRON_SECRET;

  if (!secret) {
    console.error("[cf-queue] CRON_SECRET is not configured");
    return { ok: false, processed: 0, errors: 1, jobs: [] };
  }

  const endpoint = `${appUrl}/api/cron/queue`;
  let processed = 0;
  let errors = 0;
  const jobs: string[] = [];
  const MAX_DRAIN = 10;

  for (let i = 0; i < MAX_DRAIN; i++) {
    try {
      const res = await fetchWithRetry(endpoint, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${secret}`,
          "User-Agent": "Nezuko-CF-QueueWorker/1.0",
        },
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        console.error(`[cf-queue] cron/queue HTTP ${res.status}: ${text}`);
        errors++;
        break;
      }

      const data: any = await res.json().catch(() => ({}));

      if (data.ok && data.job) {
        processed++;
        jobs.push(data.job);
        console.log(
          `[cf-queue] job=${data.job} site=${data.siteId} attempted=${data.attempted} delivered=${data.delivered} failed=${data.failed}`
        );
      } else {
        // No pending jobs remaining
        break;
      }
    } catch (err) {
      console.error("[cf-queue] unexpected processing error:", err);
      errors++;
      break;
    }
  }

  return { ok: errors === 0, processed, errors, jobs };
}

const worker = {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // Health and status endpoint
    if (url.pathname === "/" || url.pathname === "/health") {
      return new Response(
        JSON.stringify({
          ok: true,
          worker: "nezuko-queue-worker",
          cronConfigured: Boolean(env.CRON_SECRET),
          targetApp: env.APP_URL || "https://nezukoo.vercel.app",
          time: new Date().toISOString(),
        }),
        {
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Async kick trigger (matches queue.js /kick behavior)
    if (url.pathname === "/kick" && request.method === "POST") {
      ctx.waitUntil(processQueue(env));
      return new Response(JSON.stringify({ ok: true, queued: true }), {
        status: 202,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Synchronous execution (useful for testing and verification)
    if (url.pathname === "/process" && (request.method === "POST" || request.method === "GET")) {
      const result = await processQueue(env);
      return new Response(JSON.stringify(result), {
        status: result.ok ? 200 : 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response("Not Found", { status: 404 });
  },

  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    console.log(`[cf-queue] cron trigger fired at ${new Date(event.scheduledTime).toISOString()}`);
    ctx.waitUntil(processQueue(env));
  },
};

export default worker;

