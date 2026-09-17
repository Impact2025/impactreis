import Link from 'next/link';
import Image from 'next/image';
import { Mail } from 'lucide-react';

// Zelf registreren is uitgeschakeld — toegang is alleen op uitnodiging.
// Nieuwe accounts ontstaan via de gewone /auth/login-magic-link, maar alleen voor
// e-mailadressen die vooraf zijn uitgenodigd (zie lib/invites.ts, /admin/uitnodigingen).
export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-5">
      <div className="w-full max-w-[360px] text-center">
        <Image src="/logo.png" alt="Sparren.app" width={48} height={48} className="rounded-[14px] mx-auto mb-5" priority />
        <h1 className="text-[28px] font-bold text-ink tracking-tight">
          Alleen op uitnodiging
        </h1>
        <p className="text-[14px] text-ink-soft mt-3 leading-relaxed">
          Sparren.app is op dit moment alleen toegankelijk voor uitgenodigde gebruikers.
          Neem contact op als je toegang wilt.
        </p>

        <a
          href="mailto:v.munster@weareimpact.nl"
          className="mt-7 w-full inline-flex items-center justify-center gap-2 py-3.5 rounded-[14px] bg-primary text-white font-bold text-[14px] shadow-[0_4px_16px_rgba(81,96,80,0.35)] active:scale-[0.98] transition-all"
        >
          <Mail size={15} /> v.munster@weareimpact.nl
        </a>

        <p className="text-center text-[13px] text-ink-soft mt-6">
          Al een account?{' '}
          <Link href="/auth/login" className="text-ink font-semibold hover:text-primary transition-colors">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
