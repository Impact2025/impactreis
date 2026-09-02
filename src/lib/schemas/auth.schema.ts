import { z } from 'zod';

// Genormaliseerd zodat register/login/forgot-password altijd hetzelfde e-mailadres zien —
// zonder dit kon "Jan@Bedrijf.nl" registreren en "jan@bedrijf.nl" wachtwoord-reset aanvragen
// zonder resultaat (forgot-password lowercet al langer, register/login deden dat niet).
const normalizedEmail = z.string().email('Invalid email format').transform(v => v.toLowerCase().trim());

export const registerSchema = z.object({
  email: normalizedEmail,
  // 8 tekens matcht de UI-copy op de registratiepagina — was eerder 6, terwijl de pagina zelf
  // altijd al "min. 8 tekens" beloofde.
  password: z.string().min(8, 'Password must be at least 8 characters long'),
});

export const loginSchema = z.object({
  email: normalizedEmail,
  password: z.string().min(1, 'Password is required'),
});