'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';

function BridgeInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState('');
  const next = searchParams.get('next') || '/dashboard';

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch('/api/auth/session-bridge');
        if (!res.ok) throw new Error('Geen sessie gevonden');
        const data = await res.json();
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        if (!cancelled) router.replace(next);
      } catch {
        if (cancelled) return;
        setError('Inloggen mislukt. Je wordt teruggestuurd...');
        setTimeout(() => router.replace('/auth/login'), 1500);
      }
    })();

    return () => { cancelled = true; };
  }, [router, next]);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-5">
      <div className="text-center">
        <Image src="/logo.png" alt="Sparren.app" width={40} height={40} className="rounded-[12px] mx-auto mb-5" priority />
        <div className="w-5 h-5 border-2 border-ink/20 border-t-primary rounded-full animate-spin mx-auto" />
        {error && <p className="text-[12px] text-red-600 mt-3">{error}</p>}
      </div>
    </div>
  );
}

export default function AuthBridgePage() {
  return (
    <Suspense fallback={null}>
      <BridgeInner />
    </Suspense>
  );
}
