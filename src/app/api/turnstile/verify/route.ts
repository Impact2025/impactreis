import { NextRequest, NextResponse } from 'next/server';
import { verifyTurnstileToken } from '@/lib/turnstile';
import { createVerifiedGateToken, TURNSTILE_GATE_COOKIE, GATE_MAX_AGE_SECONDS } from '@/lib/verified-gate';

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const token = body?.token;
  if (typeof token !== 'string' || !token) {
    return NextResponse.json({ success: false }, { status: 400 });
  }

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  const success = await verifyTurnstileToken(token, ip);

  const response = NextResponse.json({ success }, { status: success ? 200 : 400 });

  // Zet de korte-TTL gate-cookie die middleware.ts hierna eist op de magic-link-send zelf —
  // dit is de stap die eerder ontbrak: server-side verificatie die de client niet kon negeren.
  if (success) {
    const gateToken = await createVerifiedGateToken();
    response.cookies.set(TURNSTILE_GATE_COOKIE, gateToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: GATE_MAX_AGE_SECONDS,
      path: '/',
    });
  }

  return response;
}
