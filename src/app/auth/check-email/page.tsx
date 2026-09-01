import Link from 'next/link';
import { Mail } from 'lucide-react';

export default function CheckEmailPage() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-5">
      <div className="w-full max-w-[360px] text-center">
        <div className="w-12 h-12 rounded-[14px] bg-surface-sunken flex items-center justify-center mx-auto mb-5">
          <Mail size={22} className="text-primary" />
        </div>
        <h1 className="text-[24px] font-bold text-ink tracking-tight">
          Check je e-mail
        </h1>
        <p className="text-[13px] text-ink-soft mt-2 leading-relaxed">
          We hebben een inloglink gestuurd. Open de mail en klik op de link om in te loggen.
          De link is 24 uur geldig.
        </p>
        <Link
          href="/auth/login"
          className="inline-block mt-6 text-[13px] text-ink font-semibold hover:text-primary transition-colors"
        >
          Terug naar inloggen
        </Link>
      </div>
    </div>
  );
}
