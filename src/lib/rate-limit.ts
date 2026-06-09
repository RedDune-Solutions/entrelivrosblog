import 'server-only'
import { headers } from 'next/headers'

// Simple in-memory rate limiter for server actions and route handlers.
// State lives in the process memory (per instance), so it is not shared across
// serverless instances. For production-grade limits, back this with a shared
// store (Redis / Supabase). Good enough to stop casual spam/abuse from a
// single client.
type Bucket = { count: number; resetAt: number }

const buckets = new Map<string, Bucket>()

export type RateLimitResult = {
  allowed: boolean
  remaining: number
  resetAt: number
}

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now()
  const existing = buckets.get(key)

  if (!existing || existing.resetAt <= now) {
    const resetAt = now + windowMs
    buckets.set(key, { count: 1, resetAt })
    return { allowed: true, remaining: limit - 1, resetAt }
  }

  if (existing.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: existing.resetAt }
  }

  existing.count += 1
  return {
    allowed: true,
    remaining: limit - existing.count,
    resetAt: existing.resetAt,
  }
}

// Reads the caller IP from the forwarded headers. Works inside server actions
// and route handlers. Falls back to "unknown" when no header is present.
export async function getRequestIp(): Promise<string> {
  const h = await headers()
  const fwd = h.get('x-forwarded-for')
  if (fwd) return fwd.split(',')[0]!.trim()
  const real = h.get('x-real-ip')
  if (real) return real.trim()
  return 'unknown'
}
