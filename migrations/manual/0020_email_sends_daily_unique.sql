-- Race-vrije dedupe voor dagelijkse mails: Vercel cron kan een run dubbel/gelijktijdig afleveren,
-- waarbij beide runs "nog niet verstuurd vandaag" zien. Een unieke index maakt de claim atomair
-- (zie claimDailyEmail in src/lib/email-recipients.ts). Predicaat begint vanaf vandaag zodat
-- bestaande dubbele rijen uit het verleden de index niet blokkeren.

CREATE UNIQUE INDEX IF NOT EXISTS uq_email_sends_daily
  ON email_sends (user_id, email_type, (sent_at::date))
  WHERE email_type IN ('morning_motivation', 'morning_reminder')
    AND sent_at >= '2026-09-19';
