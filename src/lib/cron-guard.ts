import { NextRequest, NextResponse } from 'next/server';
import { notifyAdminCronFailure } from '@/lib/admin-notify';

// De zes e-mail-cronroutes (vercel.json) draaien onbewaakt — een onverwachte throw (bv. een
// tijdelijk DB- of Resend-probleem) resulteerde tot nu toe alleen in een 500 die nergens dan in
// Vercel's eigen logs zichtbaar werd, wat niemand actief in de gaten houdt. Deze wrapper vangt
// dat op en stuurt de enige admin een mail, zodat een gefaalde job zichtbaar is zonder dat er
// eerst een Sentry/monitoring-account voor nodig is.
export function withCronErrorNotification(
  jobName: string,
  handler: (request: NextRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      return await handler(request);
    } catch (error) {
      console.error(`Cron job "${jobName}" failed:`, error);
      // notifyAdminCronFailure vangt intern al zijn eigen fouten af (best-effort), maar een
      // extra vangnet hier zorgt dat zelfs een onverwachte break daarin de 500-response niet
      // laat crashen — de job faalde toch al, dat mag niet ook nog de nette foutafhandeling slopen.
      await notifyAdminCronFailure(jobName, error).catch((notifyError) => {
        console.error(`Admin cron-failure notify voor "${jobName}" faalde onverwacht:`, notifyError);
      });
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  };
}
