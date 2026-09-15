// Impact Coach-intake: een 6-stappen tap-first wizard (chips, geen vrije tekst) die het
// 'Bedrijfs-DNA' en de coach-persona van de ondernemer vastlegt. Vervangt de oude AIPA-chatintake
// (zie CHANGELOG voor de geschiedenis) — die bestond uit een LLM-gesprek met vrije tekstvelden,
// wat precies de 'tekstdrempel' was die deze wizard oplost.
import { z } from 'zod';

export const TIME_WASTER_OPTIONS = [
  { value: 'inbox_email', label: 'Overlopende inbox & e-mailverkeer' },
  { value: 'offertes_opvolging', label: 'Nabellen van offertes en trage opvolging' },
  { value: 'telefonische_bereikbaarheid', label: 'Telefonische bereikbaarheid & klantvragen' },
  { value: 'facturatie_debiteuren', label: 'Wekelijkse facturatie en betalingsherinneringen' },
  { value: 'personeelsplanning', label: 'Roostering, personeelsplanning & bezetting' },
  { value: 'brandjes_blussen', label: 'Steeds opnieuw ad-hoc brandjes blussen voor het team' },
] as const;

export const AVOIDANCE_BEHAVIOR_OPTIONS = [
  { value: 'bouwen_techniek', label: 'Te lang pielen aan website, techniek of app-ontwikkeling' },
  { value: 'telefoontjes_uitstellen', label: 'Moeilijke telefoontjes / verkoopgesprekken voor me uitschuiven' },
  { value: 'veilige_administratie', label: 'Veilig administratieve klusjes doen die een ander zou kunnen doen' },
  { value: 'te_snel_ja_zeggen', label: "Te snel 'ja' zeggen tegen slechtbetalende of veeleisende klanten" },
] as const;

export const INDUSTRY_OPTIONS = [
  { value: 'zakelijke_dienstverlening', label: 'Zakelijke Dienstverlening' },
  { value: 'installatie_bouw', label: 'Installatietechniek / Bouw' },
  { value: 'handel', label: 'Groothandel / Handel' },
  { value: 'zorg_welzijn', label: 'Zorg / Welzijn / Sociaal' },
  { value: 'anders', label: 'Anders' },
] as const;

export const TEAM_SIZE_OPTIONS = [
  { value: 'solo', label: '1 (Solo)' },
  { value: 'team_2_5', label: '2–5 medewerkers' },
  { value: 'team_6_20', label: '6–20 medewerkers' },
  { value: 'team_20_100', label: '20–100 medewerkers' },
] as const;

export const BUSINESS_MODEL_OPTIONS = [
  { value: 'uurtarief', label: 'Uurtarief / Declarabel' },
  { value: 'vaste_projecten', label: 'Vaste Projectprijzen' },
  { value: 'abonnementen', label: 'Abonnementen / Terugkerend' },
] as const;

export const LEVERAGE_GOAL_OPTIONS = [
  { value: 'capaciteit', label: 'Capaciteit', description: '10 tot 15 uur per week structureel vrijspelen uit de operatie.' },
  { value: 'marge', label: 'Marge', description: 'Gemiddelde projectprijs of uurtarief met minimaal 30% verhogen.' },
  { value: 'rust_focus', label: 'Rust & Focus', description: 'Eén vaste vrije dag per week zonder e-mail of telefoon.' },
] as const;

// Presets voor de Consequentie-Module (Martell Stap 4 — Stakes): concrete voorbeelden zodat
// "iets pijnlijks verzinnen" niet zelf weer een vermijdbare taak wordt. Vrije tekst blijft nodig
// (de consequentie moet persoonlijk kloppen), maar een voorbeeld tikken is sneller dan verzinnen.
export const CONSEQUENCE_PRESETS = [
  '€500 doneren aan een goed doel dat ik niet steun',
  'Mijn grootste concurrent op de hoogte stellen dat ik dit kwartaal mijn doel niet haalde',
  'Een dag onbetaald vrijwilligerswerk doen bij een organisatie die me niet aanspreekt',
  '€250 overmaken aan mijn accountability-partner, geen vragen',
] as const;

export const consequenceModuleSchema = z.object({
  description: z.string().min(1).max(300),
});

export const COACH_PERSONAS = {
  male: { defaultName: 'Marcus', voiceId: 'marcus_dutch_deep', description: 'Diepe, rustige, gezaghebbende toon — stoïcijns en direct.' },
  female: { defaultName: 'Sarah', voiceId: 'sarah_dutch_sharp', description: 'Heldere, scherpe, doortastende toon — no-nonsense en to the point.' },
} as const;

const enumValues = <T extends readonly { value: string }[]>(opts: T) =>
  opts.map((o) => o.value) as [T[number]['value'], ...T[number]['value'][]];

export const coachProfileSchema = z.object({
  gender: z.enum(['male', 'female']),
  displayName: z.string().min(1).max(40),
  voiceId: z.string(),
  toneSeverity: z.literal('high_challenger'),
});

export const businessDnaSchema = z.object({
  industry: z.enum(enumValues(INDUSTRY_OPTIONS)),
  teamSize: z.enum(enumValues(TEAM_SIZE_OPTIONS)),
  businessModel: z.enum(enumValues(BUSINESS_MODEL_OPTIONS)),
  topTimeWasters: z.array(z.enum(enumValues(TIME_WASTER_OPTIONS))).min(1).max(3),
  avoidanceBehavior: z.enum(enumValues(AVOIDANCE_BEHAVIOR_OPTIONS)),
  quarterlyLeverageGoal: z.enum(enumValues(LEVERAGE_GOAL_OPTIONS)),
});

// Legacy velden uit de oude AIPA-chatintake — nu optioneel. Dashboard/avondritueel lezen deze
// al via optional chaining, dus dit blijft compatibel zonder die call-sites aan te passen.
export const onboardingProfileSchema = z.object({
  schedule: z.object({
    workDays: z.array(z.enum(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'])),
    workDayStart: z.string(),
    workDayEnd: z.string(),
    peakFocusWindow: z.enum(['early_morning', 'late_morning', 'afternoon', 'evening']),
    focusBlockDurationMinutes: z.union([z.literal(25), z.literal(50), z.literal(90)]),
    calendarIntegration: z.object({
      provider: z.enum(['google', 'microsoft', 'none']),
      autoTimeBlocking: z.boolean(),
      bufferTimeBetweenMeetingsMin: z.number(),
    }),
  }).optional(),
  impactProfile: z.object({
    missionStatement: z.string(),
    targetBeneficiaries: z.string(),
    quarterlyLeverageGoal: z.string(),
    targetDeadline: z.string(),
  }).optional(),
  vitalityProfile: z.object({
    primaryDrain: z.enum(['admin', 'meetings', 'boundaries', 'isolation', 'perfectionism']),
    stressEarlyWarningSign: z.string(),
    nonNegotiableRecoveryHabit: z.string(),
    implementationIntention: z.object({
      trigger: z.string(),
      action: z.string(),
    }),
  }).optional(),
  assistantPreferences: z.object({
    morningBriefingTime: z.string(),
    eveningReviewTime: z.string(),
    deliveryChannel: z.enum(['in_app', 'pwa_push', 'whatsapp']),
    coachingTone: z.enum(['direct_and_challenging', 'empathic_and_reflective', 'pragmatic_action_focused']),
  }).optional(),
  coachProfile: coachProfileSchema,
  businessDna: businessDnaSchema,
  // Optioneel in het schema (backward-compatible met profielen van vóór de Consequentie-Module),
  // maar de wizard zelf staat niet toe deze stap over te slaan.
  consequenceModule: consequenceModuleSchema.optional(),
});

export type UserOnboardingProfile = z.infer<typeof onboardingProfileSchema>;
export type CoachProfile = z.infer<typeof coachProfileSchema>;
export type BusinessDna = z.infer<typeof businessDnaSchema>;
export type ConsequenceModule = z.infer<typeof consequenceModuleSchema>;

export function labelFor<T extends readonly { value: string; label: string }[]>(opts: T, value: string): string {
  return opts.find((o) => o.value === value)?.label ?? value;
}

// Ongebruikt sinds de tap-first wizard de LLM-chatintake verving — /api/onboarding/chat en
// /api/onboarding/progress importeren dit nog maar worden nergens meer aangeroepen vanuit de UI.
// Blijft staan zodat die routes compileren zonder ze nu al te verwijderen.
export function extractOnboardingProfile(assistantText: string): UserOnboardingProfile | null {
  const matches = [...assistantText.matchAll(/```json\s*([\s\S]*?)```/g)];
  if (matches.length === 0) return null;
  const last = matches[matches.length - 1][1];
  try {
    const parsed = JSON.parse(last);
    const result = onboardingProfileSchema.safeParse(parsed);
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}

export const ONBOARDING_SYSTEM_PROMPT = '';
