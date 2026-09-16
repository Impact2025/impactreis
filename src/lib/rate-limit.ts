import { NextRequest, NextResponse } from 'next/server';
import { sql } from './db';

// Vaste-window rate limiting op Postgres (rate_limits-tabel, migrations/manual/0015_rate_limits.sql).
// Geen Redis/Upstash nodig -- de app draait al op Neon en het verkeer is nog klein genoeg dat
// een extra write per aanvraag geen bottleneck is. Bij serieuze schaal (meerdere honderden
// req/s op één endpoint) is een in-memory/Redis-teller de volgende stap; tot die tijd is dit
// de eenvoudigste oplossing die klopt over meerdere serverless-instanties.
export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  limit: number;
}

export async function checkRateLimit(
  key: string,
  limit: number,
  windowSeconds: number,
): Promise<RateLimitResult> {
  const windowMs = windowSeconds * 1000;
  const windowStart = new Date(Math.floor(Date.now() / windowMs) * windowMs);

  const rows = await sql`
    INSERT INTO rate_limits (bucket_key, window_start, count)
    VALUES (${key}, ${windowStart.toISOString()}, 1)
    ON CONFLICT (bucket_key, window_start)
    DO UPDATE SET count = rate_limits.count + 1
    RETURNING count
  `;

  const count = Number(rows[0]?.count ?? 1);
  return { allowed: count <= limit, remaining: Math.max(0, limit - count), limit };
}

/** IP uit request-headers, met Vercel/proxy-fallbacks. Best-effort: gebruik nooit als enige identiteit. */
export function clientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return request.headers.get('x-real-ip') || 'unknown';
}

/**
 * Past een limiet toe en geeft direct een 429-response terug als die overschreden is, anders null.
 * `identity` moet al geprefixt zijn met een route-naam zodat limieten per endpoint niet botsen,
 * bv. rateLimitResponse(`coach-chat:${userId}`, 20, 60).
 */
export async function rateLimitResponse(
  identity: string,
  limit: number,
  windowSeconds: number,
): Promise<NextResponse | null> {
  const result = await checkRateLimit(identity, limit, windowSeconds);
  if (result.allowed) return null;

  return NextResponse.json(
    { error: 'Te veel aanvragen. Probeer het over een minuut opnieuw.' },
    {
      status: 429,
      headers: {
        'Retry-After': String(windowSeconds),
        'X-RateLimit-Limit': String(result.limit),
        'X-RateLimit-Remaining': '0',
      },
    },
  );
}
