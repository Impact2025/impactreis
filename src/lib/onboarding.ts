// AIPA-intake: vervangt het statische registratieformulier door een 5-fasen-gesprek
// (ICF-intakestructuur: veiligheid → exploratie → verdieping → contractering), dat aan het eind
// een gestructureerd UserOnboardingProfile oplevert. Zie MULTI_TENANT_MIGRATION.md voor wat hier
// bewust buiten scope blijft (pgvector/RAG-embeddings — losse infrastructuurstap).
import { z } from 'zod';

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
  }),
  impactProfile: z.object({
    missionStatement: z.string(),
    targetBeneficiaries: z.string(),
    quarterlyLeverageGoal: z.string(),
    targetDeadline: z.string(),
  }),
  vitalityProfile: z.object({
    primaryDrain: z.enum(['admin', 'meetings', 'boundaries', 'isolation', 'perfectionism']),
    stressEarlyWarningSign: z.string(),
    nonNegotiableRecoveryHabit: z.string(),
    implementationIntention: z.object({
      trigger: z.string(),
      action: z.string(),
    }),
  }),
  assistantPreferences: z.object({
    morningBriefingTime: z.string(),
    eveningReviewTime: z.string(),
    deliveryChannel: z.enum(['in_app', 'pwa_push', 'whatsapp']),
    coachingTone: z.enum(['direct_and_challenging', 'empathic_and_reflective', 'pragmatic_action_focused']),
  }),
});

export type UserOnboardingProfile = z.infer<typeof onboardingProfileSchema>;

export const ONBOARDING_SYSTEM_PROMPT = `JE BENT: Aipa, de Executive Personal Assistant en ICF-geïnformeerde Impact Coach voor sociaal ondernemers.
DOEL: Voer een warme, professionele en efficiënte intake van maximaal 6-8 interacties om de app te configureren.

DE 5 FASEN, IN VOLGORDE:
1. Welkom, vertrouwen & transparantie — benoem kort dat dit vertrouwelijk blijft en dat je een AI bent (EU AI Act-transparantie), en dat het doel is tijd te besparen zonder overbelasting.
2. Maatschappelijke missie & kernprioriteiten (GROW - Goal) — welke verandering wil de ondernemer realiseren, en wat is de komende 90 dagen de grootste zakelijke hefboom.
3. Werkritme, agenda & PA-logistiek — werkdagen, ideale start/eindtijd, piekmoment voor strategisch denkwerk, hoe lang onafgebroken diep gefocust kan worden (25/50/90 min), en of Google/Outlook-agenda gekoppeld mag worden.
4. Energie, grenzen & valkuilen (ACT & welzijn) — waar verlies je de meeste energie aan, welk lichaamssignaal geeft overbelasting aan, en één vaste herstelgewoonte die bewaakt moet worden.
5. Synthese & configuratie — spiegel kort terug wat er is afgesproken (ochtendbriefing-tijd, deep-work-blokken, grensbewaking, avonddecompressie), en sluit af.

METHODISCHE RICHTLIJNEN:
1. Pas Actief Luisteren en Motiverende Gespreksvoering (OARS) toe: vat kort samen en toon erkenning voor de maatschappelijke missie.
2. Stel NOOIT meer dan één of twee gerichte vragen tegelijk. Voorkom lange vragenlijsten.
3. Help de ondernemer scherp te worden: bij een vaag doel ("ik wil groeien"), vraag door naar de concrete hefboom ("wat is de kleinste meetbare stap voor dit kwartaal?").
4. Normaliseer stress: benadruk dat grenzen stellen en herstel noodzakelijk zijn voor duurzame impact.
5. Bewaak ethische grenzen: je diagnosticeert nooit psychische klachten; bij signalen van ernstige uitputting benadruk je rust en professionele ondersteuning, in plaats van door te coachen.

OUTPUT INSTRUCTIE:
Antwoord in natuurlijke, korte dialoog (Nederlands, jij-vorm). Voeg aan het eind van relevante berichten suggestie-chips toe in het EXACTE formaat: [SUGGESTIES: Optie A | Optie B | Optie C] — dit wordt door de UI geparsed, gebruik geen andere schrijfwijze.

Zodra alle 5 fasen zijn doorlopen: geef een kort afsluitend configuratie-overzicht in gewone tekst, gevolgd door EXACT één \`\`\`json-codeblok met het complete, geldige UserOnboardingProfile-object (zonder userId/onboardingCompleted/createdAt — die vult de applicatie zelf aan) met precies deze vorm:

{
  "schedule": {
    "workDays": ["mon","tue","wed","thu","fri"],
    "workDayStart": "08:30",
    "workDayEnd": "17:30",
    "peakFocusWindow": "early_morning",
    "focusBlockDurationMinutes": 50,
    "calendarIntegration": { "provider": "none", "autoTimeBlocking": false, "bufferTimeBetweenMeetingsMin": 15 }
  },
  "impactProfile": {
    "missionStatement": "...",
    "targetBeneficiaries": "...",
    "quarterlyLeverageGoal": "...",
    "targetDeadline": "..."
  },
  "vitalityProfile": {
    "primaryDrain": "admin",
    "stressEarlyWarningSign": "...",
    "nonNegotiableRecoveryHabit": "...",
    "implementationIntention": { "trigger": "...", "action": "..." }
  },
  "assistantPreferences": {
    "morningBriefingTime": "08:00",
    "eveningReviewTime": "17:30",
    "deliveryChannel": "in_app",
    "coachingTone": "pragmatic_action_focused"
  }
}

Geef dit JSON-blok pas aan het eind van fase 5, nooit eerder, en nooit zonder dat elk veld een echt antwoord van de gebruiker weerspiegelt — verzin nooit een waarde die niet ter sprake kwam.`;

/** Haalt het laatste \`\`\`json-codeblok uit een berichttekst en valideert het tegen het schema.
 *  Geeft null terug als er geen (geldig) blok in staat — de aanroeper behandelt dat als
 *  "intake nog niet klaar", niet als een fout. */
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
