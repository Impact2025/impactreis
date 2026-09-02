import crypto from 'crypto';
import { sql } from '@/lib/db';

/**
 * Multi-tenant fan-out helpers voor de cron-getriggerde levenscyclus-mails.
 *
 * Mirrort het patroon dat push-notificaties al gebruiken (src/app/api/notifications/send/route.ts
 * loopt over alle push_subscriptions): elke cron-route haalt hier zijn ontvangerslijst op i.p.v.
 * één hardcoded NOTIFICATION_EMAIL, en logt elke geslaagde send in email_sends zodat dezelfde
 * mail niet twee keer op één dag verstuurd wordt.
 */

export type EmailPrefColumn =
  | 'morning_motivation'
  | 'morning_reminder'
  | 'weekly_report'
  | 'streak_celebration'
  | 'onboarding_nudge'
  | 'winback';

export interface EmailRecipient {
  userId: number;
  email: string;
  unsubscribeToken: string | null;
}

/**
 * Alle users met `prefColumn` aan (users zonder email_preferences-rij tellen als opt-in — dat
 * kan alleen bij oude accounts van vóór de backfill-migratie) die `emailType` nog niet vandaag
 * kregen.
 */
// prefColumn komt altijd uit de EmailPrefColumn-union hierboven (compile-time whitelist, nooit
// user input) — de neon tagged-template ondersteunt geen dynamische identifiers (geen
// `sql.unsafe`), dus bouwen we de kolomnaam hier veilig in de query-string en parametriseren we
// alleen de echte waarde (emailType) via de "gewone functie"-vorm van de client.
export async function getRecipients(
  prefColumn: EmailPrefColumn,
  emailType: string
): Promise<EmailRecipient[]> {
  const rows = await sql(
    `SELECT u.id AS user_id, u.email, ep.unsubscribe_token
     FROM users u
     LEFT JOIN email_preferences ep ON ep.user_id = u.id
     WHERE COALESCE(ep.${prefColumn}, TRUE) = TRUE
       AND NOT EXISTS (
         SELECT 1 FROM email_sends es
         WHERE es.user_id = u.id
           AND es.email_type = $1
           AND es.sent_at::date = CURRENT_DATE
       )`,
    [emailType]
  );
  return rows.map(r => ({
    userId: r.user_id as number,
    email: r.email as string,
    unsubscribeToken: (r.unsubscribe_token as string | null) ?? null,
  }));
}

export async function recordEmailSent(
  userId: number,
  emailType: string,
  meta?: Record<string, unknown>
): Promise<void> {
  await sql`
    INSERT INTO email_sends (user_id, email_type, meta)
    VALUES (${userId}, ${emailType}, ${meta ? JSON.stringify(meta) : null})
  `;
}

export async function wasEmailSent(
  userId: number,
  emailType: string,
  sinceDate?: Date
): Promise<boolean> {
  if (sinceDate) {
    const rows = await sql`
      SELECT 1 FROM email_sends
      WHERE user_id = ${userId} AND email_type = ${emailType} AND sent_at >= ${sinceDate.toISOString()}
      LIMIT 1
    `;
    return rows.length > 0;
  }
  const rows = await sql`
    SELECT 1 FROM email_sends WHERE user_id = ${userId} AND email_type = ${emailType} LIMIT 1
  `;
  return rows.length > 0;
}

/** Zorgt dat een user een email_preferences-rij + token heeft; geeft het (bestaande of nieuwe) token terug. */
export async function ensurePreferences(userId: number): Promise<string> {
  const existing = await sql`SELECT unsubscribe_token FROM email_preferences WHERE user_id = ${userId} LIMIT 1`;
  if (existing.length > 0) return existing[0].unsubscribe_token as string;

  const token = crypto.randomBytes(24).toString('hex');
  await sql`
    INSERT INTO email_preferences (user_id, unsubscribe_token)
    VALUES (${userId}, ${token})
    ON CONFLICT (user_id) DO NOTHING
  `;
  const row = await sql`SELECT unsubscribe_token FROM email_preferences WHERE user_id = ${userId} LIMIT 1`;
  return row[0].unsubscribe_token as string;
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://reis.weareimpact.nl';

export function unsubscribeUrl(token: string, category: EmailPrefColumn): string {
  return `${APP_URL}/api/email/unsubscribe?token=${encodeURIComponent(token)}&type=${encodeURIComponent(category)}`;
}
