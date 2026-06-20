import { Resend } from 'resend';

/**
 * Lazily-instantiated Resend client.
 *
 * The client is created on first use (at request time) rather than at module
 * load. This keeps `next build` from failing when RESEND_API_KEY is absent:
 * `new Resend("")` throws synchronously, and a module-level instantiation would
 * crash page-data collection for the whole app — not just email routes.
 */
let client: Resend | null = null;

export function getResend(): Resend {
  if (!client) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error(
        'RESEND_API_KEY is not set. Configure it in the environment before sending email.'
      );
    }
    client = new Resend(apiKey);
  }
  return client;
}

/** Default sender, overridable via RESEND_FROM_EMAIL. */
export const FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL || 'Mijn Ondernemers OS <onboarding@resend.dev>';
