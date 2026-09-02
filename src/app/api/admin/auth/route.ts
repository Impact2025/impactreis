import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createAdminSessionToken, SESSION_MAX_AGE_SECONDS } from '@/lib/admin-session';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? '';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? '';

export async function POST(request: NextRequest) {
  const secretConfigured = process.env.ADMIN_AUTH_SECRET || process.env.AUTH_SECRET;
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD || !secretConfigured) {
    console.error('Admin auth env vars ontbreken (ADMIN_EMAIL / ADMIN_PASSWORD / ADMIN_AUTH_SECRET)');
    return NextResponse.json({ error: 'Server niet geconfigureerd' }, { status: 500 });
  }

  try {
    const { email, password } = await request.json();

    if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'Ongeldige inloggegevens' }, { status: 401 });
    }

    const token = await createAdminSessionToken();
    const cookieStore = await cookies();
    cookieStore.set('admin_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: SESSION_MAX_AGE_SECONDS,
      path: '/',
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin auth error:', error);
    return NextResponse.json({ error: 'Authenticatie mislukt' }, { status: 500 });
  }
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete('admin_session');
  return NextResponse.json({ success: true });
}
