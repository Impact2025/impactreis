// Kortlevende, HMAC-SHA256-signed "ik ben net server-side door Turnstile geverifieerd"-token.
// Zelfde patroon als src/lib/admin-session.ts (Web Crypto only, zodat het ook in edge-middleware
// draait), maar dan met een korte TTL (2 min): net lang genoeg om na de Turnstile-widget door te
// klikken naar de magic-link-send, niet bruikbaar als herbruikbare sessie.
//
// Waarom dit bestaat: /api/turnstile/verify verifieerde het Cloudflare-token altijd al
// server-side, maar de uitkomst kwam nooit verder dan een los fetch-response op de client — de
// eigenlijke send (signIn('resend', ...), NextAuth's POST /api/auth/signin/resend) checkte niets.
// Wie die POST rechtstreeks aanriep, omzeilde de captcha volledig. Deze cookie is de brug: het
// middleware (zie src/middleware.ts) eist 'm nu op de signin-route.

const GATE_MAX_AGE_MS = 2 * 60 * 1000;
export const GATE_MAX_AGE_SECONDS = GATE_MAX_AGE_MS / 1000;
export const TURNSTILE_GATE_COOKIE = 'turnstile_verified';

function getSecret(): string {
  const secret = process.env.TURNSTILE_SECRET_KEY || process.env.AUTH_SECRET;
  if (!secret) throw new Error('TURNSTILE_SECRET_KEY (of AUTH_SECRET) is niet geconfigureerd');
  return secret;
}

async function importHmacKey(secret: string, usage: 'sign' | 'verify'): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    [usage],
  );
}

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function createVerifiedGateToken(): Promise<string> {
  const secret = getSecret();
  const random = toHex(crypto.getRandomValues(new Uint8Array(16)));
  const payload = `${Date.now()}:${random}`;
  const key = await importHmacKey(secret, 'sign');
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
  return btoa(`${payload}:${toHex(new Uint8Array(sig))}`);
}

export async function isValidVerifiedGateToken(value: string | undefined | null): Promise<boolean> {
  if (!value) return false;
  let secret: string;
  try {
    secret = getSecret();
  } catch {
    return false;
  }

  try {
    const decoded = atob(value);
    const lastColon = decoded.lastIndexOf(':');
    if (lastColon === -1) return false;
    const payload = decoded.slice(0, lastColon);
    const sig = decoded.slice(lastColon + 1);

    const [tsStr] = payload.split(':');
    const timestamp = parseInt(tsStr, 10);
    if (isNaN(timestamp) || Date.now() - timestamp > GATE_MAX_AGE_MS) return false;

    const sigBytes = Uint8Array.from(
      (sig.match(/.{1,2}/g) ?? []).map((b) => parseInt(b, 16)),
    );
    const key = await importHmacKey(secret, 'verify');
    return await crypto.subtle.verify('HMAC', key, sigBytes, new TextEncoder().encode(payload));
  } catch {
    return false;
  }
}
