// Best-effort admin-notificaties (nieuwe gebruiker / nieuwe lead) — een falende send mag de
// registratie- of lead-flow nooit blokkeren, dus elke aanroep hier slikt zijn eigen fouten.
import { getResend, FROM_EMAIL } from '@/lib/resend';
import { adminNewUserEmail, adminNewLeadEmail, adminCronFailureEmail } from '@/lib/email-templates';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? '';

function appUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || 'https://sparren.app';
}

export async function notifyAdminNewUser(email: string, source: 'magic-link' | 'wachtwoord'): Promise<void> {
  if (!ADMIN_EMAIL) return;
  try {
    const { subject, html } = adminNewUserEmail({ email, source, appUrl: appUrl() });
    const { error } = await getResend().emails.send({ from: FROM_EMAIL, to: ADMIN_EMAIL, subject, html });
    if (error) console.error('Admin new-user notify failed:', error);
  } catch (err) {
    console.error('Admin new-user notify threw:', err);
  }
}

export async function notifyAdminCronFailure(jobName: string, error: unknown): Promise<void> {
  if (!ADMIN_EMAIL) return;
  try {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const { subject, html } = adminCronFailureEmail({ jobName, errorMessage, appUrl: appUrl() });
    const { error: sendError } = await getResend().emails.send({ from: FROM_EMAIL, to: ADMIN_EMAIL, subject, html });
    if (sendError) console.error('Admin cron-failure notify failed:', sendError);
  } catch (err) {
    console.error('Admin cron-failure notify threw:', err);
  }
}

export async function notifyAdminNewLead(data: {
  email: string;
  name?: string | null;
  level: string;
  score: number;
  profileLabel: string;
}): Promise<void> {
  if (!ADMIN_EMAIL) return;
  try {
    const { subject, html } = adminNewLeadEmail({ ...data, appUrl: appUrl() });
    const { error } = await getResend().emails.send({ from: FROM_EMAIL, to: ADMIN_EMAIL, subject, html });
    if (error) console.error('Admin new-lead notify failed:', error);
  } catch (err) {
    console.error('Admin new-lead notify threw:', err);
  }
}
