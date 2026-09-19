import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { isValidAdminSessionToken } from '@/lib/admin-session';
import { isValidVerifiedGateToken, TURNSTILE_GATE_COOKIE } from '@/lib/verified-gate';
import { clientIp, rateLimitResponse } from '@/lib/rate-limit';

const protectedPaths = ['/admin'];
const publicAdminPaths = ['/admin/login'];
// API-routes onder /api/admin vereisen ook een geldige sessie; alleen de login-route zelf is publiek.
const protectedApiPrefix = '/api/admin';
const publicApiPaths = ['/api/admin/auth'];

// Auth.js' eigen POST-endpoint dat de magic-linkmail daadwerkelijk verstuurt (Resend-provider).
// De client belde altijd al /api/turnstile/verify vóór signIn('resend', ...), maar niets
// server-side hield de client daaraan — wie deze route rechtstreeks post, sloeg de captcha over
// en kon het Resend-quotum leegtrekken. Zie src/lib/verified-gate.ts voor de cookie die dit dicht.
const MAGIC_LINK_SEND_PATH = '/api/auth/signin/resend';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === MAGIC_LINK_SEND_PATH && request.method === 'POST') {
    // Onafhankelijk van de Turnstile-gate hieronder: de gate-cookie is een stateloze HMAC-token
    // zonder server-side intrekking, dus een script dat 'm rechtstreeks hergebruikt (buiten de
    // browser om, die de Set-Cookie-verwijdering hieronder wel zou respecteren) kan er binnen de
    // TTL van 2 minuten alsnog meerdere sends mee doen. Deze rate limit is de echte stop tegen
    // het scenario waar de gate zelf voor bedoeld was: het Resend-quotum leegtrekken.
    const limited = await rateLimitResponse(`magic-link-send:${clientIp(request)}`, 5, 60);
    if (limited) return limited;

    // Alleen afdwingen als Turnstile daadwerkelijk geconfigureerd is — anders zou dit iedere
    // login/registratie blokkeren in omgevingen zonder Turnstile-secret (bv. lokale dev).
    if (process.env.TURNSTILE_SECRET_KEY) {
      const gateCookie = request.cookies.get(TURNSTILE_GATE_COOKIE)?.value;
      if (!(await isValidVerifiedGateToken(gateCookie))) {
        return NextResponse.json(
          { error: 'Verificatie ontbreekt of is verlopen. Vernieuw de pagina en probeer opnieuw.' },
          { status: 403 },
        );
      }
      // Single-use voor brave clients (browsers respecteren deze Set-Cookie-verwijdering): een
      // tweede submit binnen dezelfde 2 minuten moet opnieuw door Turnstile, niet doorglijden op
      // dezelfde cookie.
      const response = NextResponse.next();
      response.cookies.delete(TURNSTILE_GATE_COOKIE);
      return response;
    }
    return NextResponse.next();
  }

  const isProtectedPage = protectedPaths.some(
    (path) => pathname.startsWith(path) && !publicAdminPaths.includes(pathname),
  );
  const isProtectedApi =
    pathname.startsWith(protectedApiPrefix) && !publicApiPaths.includes(pathname);

  if (!isProtectedPage && !isProtectedApi) {
    return NextResponse.next();
  }

  const sessionCookie = request.cookies.get('admin_session');
  const valid = await isValidAdminSessionToken(sessionCookie?.value);
  if (valid) return NextResponse.next();

  if (isProtectedApi) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const loginUrl = new URL('/admin/login', request.url);
  if (!sessionCookie?.value) {
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }
  const response = NextResponse.redirect(loginUrl);
  response.cookies.delete('admin_session');
  return response;
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*', '/api/auth/signin/resend'],
};
