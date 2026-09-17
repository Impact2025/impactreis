import { sql } from './db';

// Invite-only gate voor de magic-link-flow (zie auth.ts sendVerificationRequest).
// Bestaande klanten (al een users-rij) mogen altijd opnieuw inloggen; nieuwe accounts
// mogen alleen ontstaan voor e-mailadressen die hier expliciet zijn uitgenodigd.
export async function isEmailInvited(email: string): Promise<boolean> {
  const normalized = email.toLowerCase().trim();

  const [existingUser] = await sql`SELECT id FROM users WHERE email = ${normalized}`;
  if (existingUser) return true;

  const [invite] = await sql`SELECT id FROM invited_emails WHERE email = ${normalized}`;
  return !!invite;
}
