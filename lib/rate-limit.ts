import { NextResponse } from "next/server";

type RateLimitOptions = {
  key: string;
  limit: number;
  windowMs: number;
};

type RateLimitBucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, RateLimitBucket>();

export function rateLimit(request: Request, options: RateLimitOptions) {
  const now = Date.now();
  const clientKey = `${options.key}:${getClientIp(request)}`;
  const bucket = buckets.get(clientKey);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(clientKey, {
      count: 1,
      resetAt: now + options.windowMs,
    });
    return null;
  }

  bucket.count += 1;

  if (bucket.count <= options.limit) {
    return null;
  }

  const retryAfterSeconds = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));

  return NextResponse.json(
    { error: "Too many requests. Please try again shortly." },
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfterSeconds),
      },
    }
  );
}

function getClientIp(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");

  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "unknown";
  }

  return request.headers.get("x-real-ip")?.trim() || "unknown";
}
