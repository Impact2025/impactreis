import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { isValidAdminSessionToken } from '@/lib/admin-session';

const protectedPaths = ['/admin'];
const publicAdminPaths = ['/admin/login'];
// API-routes onder /api/admin vereisen ook een geldige sessie; alleen de login-route zelf is publiek.
const protectedApiPrefix = '/api/admin';
const publicApiPaths = ['/api/admin/auth'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

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
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};
