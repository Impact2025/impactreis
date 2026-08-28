import Link from 'next/link';
import { Mail } from 'lucide-react';

export default function CheckEmailPage() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-5">
      <div className="w-full max-w-[360px] text-center">
        <div className="w-12 h-12 rounded-[14px] bg-[#f4f4f7] flex items-center justify-center mx-auto mb-5">
          <Mail size={22} className="text-[#00cc66]" />
        </div>
        <h1 className="text-[24px] font-bold text-[#0a0a14] tracking-tight">
          Check je e-mail
        </h1>
        <p className="text-[13px] text-[#8a8a9a] mt-2 leading-relaxed">
          We hebben een inloglink gestuurd. Open de mail en klik op de link om in te loggen.
          De link is 24 uur geldig.
        </p>
        <Link
          href="/auth/login"
          className="inline-block mt-6 text-[13px] text-[#0a0a14] font-semibold hover:text-[#00cc66] transition-colors"
        >
          Terug naar inloggen
        </Link>
      </div>
    </div>
  );
}
