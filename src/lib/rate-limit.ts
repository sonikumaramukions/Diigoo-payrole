import prisma from './prisma';

const WINDOW_MS = 60 * 1000; // 1 minute window

interface RateLimitConfig {
  maxRequests: number;
  windowMs?: number;
}

export async function checkRateLimit(
  key: string,
  config: RateLimitConfig = { maxRequests: 10 }
): Promise<{ allowed: boolean; remaining: number; resetAt: Date }> {
  const windowMs = config.windowMs || WINDOW_MS;
  const now = new Date();
  const windowStart = new Date(now.getTime() - windowMs);

  try {
    const rateLimit = await prisma.rateLimit.findUnique({
      where: { key },
    });

    if (!rateLimit || rateLimit.windowStart < windowStart) {
      // Create or reset window
      await prisma.rateLimit.upsert({
        where: { key },
        update: { count: 1, windowStart: now },
        create: { key, count: 1, windowStart: now },
      });

      return {
        allowed: true,
        remaining: config.maxRequests - 1,
        resetAt: new Date(now.getTime() + windowMs),
      };
    }

    if (rateLimit.count >= config.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: new Date(rateLimit.windowStart.getTime() + windowMs),
      };
    }

    await prisma.rateLimit.update({
      where: { key },
      data: { count: { increment: 1 } },
    });

    return {
      allowed: true,
      remaining: config.maxRequests - rateLimit.count - 1,
      resetAt: new Date(rateLimit.windowStart.getTime() + windowMs),
    };
  } catch {
    // If rate limiting fails, allow the request but log
    console.error('Rate limiting check failed for key:', key);
    return {
      allowed: true,
      remaining: config.maxRequests,
      resetAt: new Date(now.getTime() + windowMs),
    };
  }
}

export const RATE_LIMITS = {
  adminLogin: { maxRequests: 5, windowMs: 5 * 60 * 1000 }, // 5 attempts per 5 min
  trackingVisit: { maxRequests: 30, windowMs: 60 * 1000 }, // 30 per minute
  trackingLogin: { maxRequests: 10, windowMs: 60 * 1000 }, // 10 per minute
  trackingReport: { maxRequests: 10, windowMs: 60 * 1000 }, // 10 per minute
  apiGeneral: { maxRequests: 60, windowMs: 60 * 1000 }, // 60 per minute
} as const;
