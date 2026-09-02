// Admin session tokens: HMAC-SHA256-signed, 24u geldig. Los van de reguliere
// gebruikers-auth (JWT/Auth.js) — /admin heeft een eigen, enkelvoudig account.
// Web Crypto only zodat dezelfde code in de edge-middleware en route handlers draait.
// Tokenformaat: base64("timestamp:random:hexsig").

const SESSION_MAX_AGE_MS = 24 * 60 * 60 * 1000;
export const SESSION_MAX_AGE_SECONDS = SESSION_MAX_AGE_MS / 1000;

function getSecret(): string {
  const secret = process.env.ADMIN_AUTH_SECRET || process.env.AUTH_SECRET;
  if (!secret) throw new Error('ADMIN_AUTH_SECRET (of AUTH_SECRET) is niet geconfigureerd');
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

export async function createAdminSessionToken(): Promise<string> {
  const secret = getSecret();
  const random = toHex(crypto.getRandomValues(new Uint8Array(16)));
  const payload = `${Date.now()}:${random}`;
  const key = await importHmacKey(secret, 'sign');
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
  return btoa(`${payload}:${toHex(new Uint8Array(sig))}`);
}

export async function isValidAdminSessionToken(value: string | undefined | null): Promise<boolean> {
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
    if (isNaN(timestamp) || Date.now() - timestamp > SESSION_MAX_AGE_MS) return false;

    const sigBytes = Uint8Array.from(
      (sig.match(/.{1,2}/g) ?? []).map((b) => parseInt(b, 16)),
    );
    const key = await importHmacKey(secret, 'verify');
    return await crypto.subtle.verify('HMAC', key, sigBytes, new TextEncoder().encode(payload));
  } catch {
    return false;
  }
}
