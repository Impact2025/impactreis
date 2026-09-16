// Executive Reality Check — scoringslogica voor de 6-vragen diagnostic op /reality-check.
// Score wordt server-side herberekend uit ruwe antwoord-indices (nooit uit een door de client
// aangeleverd totaal) zodat het resultaat niet te manipuleren is en de lead-capture-gate
// (antwoorden invullen → e-mail achterlaten → pas dan de score zien) niet omzeild kan worden.

export interface RealityCheckOption {
  label: string;
  points: number;
}

export interface RealityCheckQuestion {
  id: string;
  title: string;
  subtitle?: string;
  options: RealityCheckOption[];
  /** Getoond in het resultatenscherm als deze vraag laag scoort (<=1 punt). */
  weaknessDiagnosis: string;
}

export const REALITY_CHECK_QUESTIONS: RealityCheckQuestion[] = [
  {
    id: 'agenda_autonomie',
    title: 'Hoeveel procent van je tijd gaat deze week op aan ongeplande ad-hoc verzoeken, operationele brandjes en administratie in plaats van strategische regie?',
    options: [
      { label: 'Minder dan 15% — ik bewaak mijn blokken strak.', points: 4 },
      { label: 'Tussen de 15% en 35% — acceptabel, maar het vreet aan mijn scherpte.', points: 3 },
      { label: 'Tussen de 35% en 50% — ik word grotendeels geregeerd door andermans prioriteiten.', points: 1 },
      { label: 'Meer dan 50% — ik ben de brandweerman van mijn eigen organisatie geworden.', points: 0 },
    ],
    weaknessDiagnosis: "Het 'Brandweerman-Syndroom': een groot deel van je cognitieve energie gaat naar ad-hoc dossiers die je team zelfstandig zou moeten dragen.",
  },
  {
    id: 'olifant_in_kamer',
    title: 'Welke strategische beslissing, lastig functioneringsgesprek of koerswijziging schuif je al langer dan twee weken voor je uit?',
    options: [
      { label: 'Geen — besluiten neem ik binnen 48 uur na signalering.', points: 4 },
      { label: "Eén sluimerend dossier dat ik steeds voor me uit duw wegens 'tijdgebrek'.", points: 2 },
      { label: 'Meerdere cruciale knopen die vastzitten omdat ik de mentale bandbreedte mis.', points: 1 },
      { label: 'Ik weet dat er fundamentele dingen moeten veranderen, maar ik kom niet uit de waan van de dag.', points: 0 },
    ],
    weaknessDiagnosis: 'Uitstel-Frictie: het niet doorsnijden van sleutelbeslissingen veroorzaakt sluipende vertraging in je organisatie.',
  },
  {
    id: 'geen_ja_knikker',
    title: 'Wie in jouw directe werkomgeving durft jou momenteel écht ongefilterd tegen te spreken en je aannames genadeloos te fileren?',
    options: [
      { label: 'Ik heb een sparringpartner / raadkamer die mij wekelijks de waarheid vertelt.', points: 4 },
      { label: 'Mijn MT of partner probeert het wel, maar kent niet alle strategische context.', points: 2 },
      { label: 'Vrijwel niemand; mijn team knikt ja en kijkt naar mij voor alle antwoorden.', points: 1 },
      { label: 'Ik sta er strategisch volledig alleen voor.', points: 0 },
    ],
    weaknessDiagnosis: 'Ja-Knikker Risico: blinde vlekken worden niet gefileerd — niemand spreekt je scherp genoeg tegen.',
  },
  {
    id: 'cognitieve_rust',
    title: 'Met welk gevoel sluit je gemiddeld genomen om 18:00 uur je laptop?',
    options: [
      { label: 'Voltooid: mijn 3 kernprioriteiten zijn afgerond, mijn hoofd is leeg.', points: 4 },
      { label: 'Gematigd tevreden, maar met een knagend gevoel over niet-opgepakte zaken.', points: 2 },
      { label: 'Uitgeput: de hele dag gerend en honderd mails beantwoord, maar strategisch niets opgeschoten.', points: 1 },
      { label: "Mijn werkdag stopt niet om 18:00; ik werk 's avonds door om 'bij te blijven'.", points: 0 },
    ],
    weaknessDiagnosis: 'Onvoltooide Dagen: je sluit af met een knagend gevoel over niet-opgepakte zaken, in plaats van rust.',
  },
  {
    id: 'organisatorisch_geheugen',
    title: 'Hoeveel energie verlies je aan het steeds opnieuw uitleggen van intenties, briefings of project-/subsidiekaders aan personeel of AI-tools?',
    options: [
      { label: 'Minimaal — onze doelstellingen en formats liggen gestructureerd vast.', points: 4 },
      { label: 'Regelmatig — mensen en tools missen de finesses, dus moet ik vaak bijsturen.', points: 2 },
      { label: 'Dagelijks — generieke AI (ChatGPT) en medewerkers missen het totale overzicht; ik blijf de bottleneck.', points: 0 },
    ],
    weaknessDiagnosis: 'Context-Fragmentatie: je blijft dagelijks context herhalen aan mensen en tools — jij bent de bottleneck.',
  },
  {
    id: 'focus_discipline',
    title: 'Heb je een vast ochtend- en avondritueel waarmee je je dag intentioneel opent en reflectief afsluit?',
    options: [
      { label: 'Ja, geborgd in een vast dagelijks systeem.', points: 4 },
      { label: 'Ik begin de dag met goede moed, maar de inbox overspoelt het proces binnen 15 minuten.', points: 2 },
      { label: 'Nee, ik start direct in Teams/Slack/Outlook en begin direct met reageren.', points: 0 },
    ],
    weaknessDiagnosis: 'Reactieve Start: je opent en sluit je dag niet intentioneel, waardoor de inbox meteen de regie overneemt.',
  },
];

export const REALITY_CHECK_MAX_SCORE = REALITY_CHECK_QUESTIONS.reduce(
  (sum, q) => sum + Math.max(...q.options.map((o) => o.points)),
  0
); // 24

export interface RealityCheckProfile {
  key: 'gevangene' | 'schakelaar' | 'regisseur';
  label: string;
  tagline: string;
  annualHoursRange: string;
}

const PROFILES: RealityCheckProfile[] = [
  {
    key: 'gevangene',
    label: 'De Operationeel Gevangene',
    tagline: 'Je bent de bottleneck van je eigen succes. Je leidt niet meer, je overleeft.',
    annualHoursRange: '> 650 uur / jaar',
  },
  {
    key: 'schakelaar',
    label: 'De Pragmatische Schakelaar',
    tagline: 'Je boekt resultaten, maar tegen een disproportioneel hoge energietol.',
    annualHoursRange: '350 – 500 uur / jaar',
  },
  {
    key: 'regisseur',
    label: 'De Strategische Regisseur',
    tagline: "Scherpe focus en discipline, maar je mist een geautomatiseerd 'executive filter' om je impact schaalbaar te maken.",
    annualHoursRange: '100 – 200 uur / jaar',
  },
];

/** Ruwe antwoord-indices (per vraag de gekozen optie-index) → totaalscore. Onbekende/ontbrekende
 *  antwoorden tellen als 0 punten, zodat een onvolledige inzending nooit een hogere score dan
 *  verdiend oplevert. */
export function scoreAnswers(answerIndices: (number | null | undefined)[]): number {
  return REALITY_CHECK_QUESTIONS.reduce((sum, q, i) => {
    const idx = answerIndices[i];
    const option = typeof idx === 'number' ? q.options[idx] : undefined;
    return sum + (option?.points ?? 0);
  }, 0);
}

export function getProfile(score: number): RealityCheckProfile {
  if (score <= 8) return PROFILES[0];
  if (score <= 16) return PROFILES[1];
  return PROFILES[2];
}

/** Lineaire interpolatie tussen 16 uur/week verlies bij score 0 en 2 uur/week bij score 24 —
 *  gekalibreerd op het voorbeeld uit de blueprint (score 11/24 → 9,5 uur/week). */
export function getHoursLost(score: number): { weekly: number; monthly: number } {
  const clamped = Math.max(0, Math.min(REALITY_CHECK_MAX_SCORE, score));
  const weekly = 16 - (clamped / REALITY_CHECK_MAX_SCORE) * 14;
  return {
    weekly: Math.round(weekly * 10) / 10,
    monthly: Math.round(weekly * 4.3),
  };
}

const CONTRADICTION_RISK = ['Zeer hoog', 'Zeer hoog', 'Hoog', 'Gemiddeld', 'Laag'];

/** Vraag 3 (Geen Ja-Knikker Toets) bepaalt specifiek het tegenspraak-risico, los van de totaalscore. */
export function getContradictionRisk(q3AnswerIndex: number | null | undefined): string {
  const points = typeof q3AnswerIndex === 'number'
    ? REALITY_CHECK_QUESTIONS[2].options[q3AnswerIndex]?.points ?? 0
    : 0;
  if (points >= 4) return 'Laag';
  if (points >= 2) return 'Gemiddeld';
  if (points >= 1) return 'Hoog';
  return CONTRADICTION_RISK[0];
}

/** De laagst scorende vragen (max 3, alleen bij <=1 punt) als gepersonaliseerde diagnose. */
export function getWeaknessDiagnoses(answerIndices: (number | null | undefined)[]): string[] {
  const scored = REALITY_CHECK_QUESTIONS.map((q, i) => {
    const idx = answerIndices[i];
    const points = typeof idx === 'number' ? q.options[idx]?.points ?? 0 : 0;
    return { points, text: q.weaknessDiagnosis };
  });
  return scored
    .filter((s) => s.points <= 1)
    .sort((a, b) => a.points - b.points)
    .slice(0, 3)
    .map((s) => s.text);
}
