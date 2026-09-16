// Aanvulling op seed-demo.ts: die dekt dagboek/controle-cirkel/wins/doelen/weekstart/
// weekreview/focus/energie al voor 90 dagen — maar niet de ochtend/avond-rituelen (met kikker +
// avond-verdict) en niet identity_profiles. Zonder die twee blijft de "beste volgende stap"-kaart
// permanent op "geen ochtendritueel" / "Identiteit leeg" hangen, wat geen representatief beeld
// geeft van de andere paden (kikker-open, hefboomtaak, zwakke scorecard, streak-fallback, enz.).
//
// Vandaag blijft bewust leeg (geen ochtend/avond-log) zodat er ook nog iets live in te vullen
// valt — de rest van de app (dashboard, coach, scorecard, insights) heeft dan al 3 weken
// geschiedenis om op te draaien.
import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import { getCurrentWeekNumber } from '../src/lib/weekflow.service';

const sql = neon(process.env.DATABASE_URL!);

void (async () => {
  console.log('✓ Connected to DB');

  function iso(d: Date): string {
    return d.toISOString().slice(0, 10);
  }
  function rand(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
  function pick<T>(arr: readonly T[]): T {
    return arr[rand(0, arr.length - 1)];
  }

  const orgId = 18;
  const uuid = '19'; // demo@impactreis.nl → users.id=19, zelfde patroon als seed-demo.ts
  const today = new Date();

  // ---- 1. Opruimen: alleen morning/evening, dagboek/controle-cirkel/etc. blijven staan ----
  await sql`DELETE FROM daily_logs WHERE user_id = ${uuid} AND type IN ('morning', 'evening')`;
  console.log('✓ Oude morning/evening-logs opgeruimd');

  const kikkerCategories = [
    'inbox_email', 'offertes_opvolging', 'telefonische_bereikbaarheid',
    'facturatie_debiteuren', 'personeelsplanning', 'brandjes_blussen',
  ];
  const kikkerDetails = [
    'Klant X bellen over de late levering',
    'Offerte aan Bouwbedrijf Jansen afronden',
    'Team-planning volgende week rondmaken',
    'Openstaande facturen nabellen',
    'Sollicitatiegesprek voorbereiden',
  ];
  const verdicts = ['waarde_verkocht', 'waarde_verkocht', 'gered_door_operatie', 'gevlucht_in_veiligheid'] as const;
  const wakeTimes = ['06:15', '06:30', '06:45', '07:00', '07:15'];

  // ---- 2. Ochtend + avond: laatste 21 dagen, vandaag bewust overgeslagen ----
  // ~85% voltooiing met een paar bewuste gaten (voor "gemist avondritueel"-banner/streak-herstel),
  // niet 100% — anders is er niets te herstellen/testen in de recovery-paden.
  let morningCount = 0;
  let eveningCount = 0;
  const skipDays = new Set([4, 11]); // twee losse gemiste dagen verderop in de geschiedenis

  for (let d = 1; d <= 21; d++) {
    const date = new Date(today);
    date.setDate(date.getDate() - d);
    const dateStr = iso(date);
    if (skipDays.has(d)) continue; // hele dag gemist

    const kikkerDone = Math.random() < 0.8; // ~80% van de dagen kikker afgemaakt
    const energyLevel = rand(4, 9);

    await sql`
      INSERT INTO daily_logs (organization_id, user_id, type, date_string, data, timestamp)
      VALUES (${orgId}, ${uuid}, 'morning', ${dateStr}, ${JSON.stringify({
        kikkerCategory: pick(kikkerCategories),
        kikkerDetail: pick(kikkerDetails),
        energyLevel,
        sleepQuality: rand(4, 9),
        wakeTime: pick(wakeTimes),
      })}, ${new Date(date.getTime() + 7 * 3600000).toISOString()})
    `;
    morningCount++;

    // Avond iets minder consistent dan ochtend (typisch patroon — realistischer gat voor de
    // "avondritueel gemist"-banner dan een losse hele dag).
    if (d === 1 || Math.random() < 0.85) {
      await sql`
        INSERT INTO daily_logs (organization_id, user_id, type, date_string, data, timestamp)
        VALUES (${orgId}, ${uuid}, 'evening', ${dateStr}, ${JSON.stringify({
          eveningVerdict: kikkerDone ? pick(verdicts) : 'gevlucht_in_veiligheid',
          eveningVerdictDetail: kikkerDone ? '' : 'Te veel afgeleid door mail en meldingen',
          energyLevel: Math.max(1, energyLevel - rand(0, 2)),
        })}, ${new Date(date.getTime() + 21 * 3600000).toISOString()})
      `;
      eveningCount++;
    }
  }
  console.log(`✓ ${morningCount} morning-logs, ${eveningCount} evening-logs (laatste 21 dagen, vandaag leeg)`);

  // ---- 3. Identity: 5 statements (4 actief, 1 uitgezet) + bijpassende proofs ----
  const now = new Date();
  const statements = [
    { id: 'demo-id-1', statement: 'Ik ben een leider die waarde creëert', createdAt: iso(new Date(now.getTime() - 60 * 86400000)), isActive: true, proofCount: 12, streak: 4, lastProofDate: new Date(now.getTime() - 1 * 86400000).toISOString() },
    { id: 'demo-id-2', statement: 'Ik ben consistent in mijn rituelen', createdAt: iso(new Date(now.getTime() - 45 * 86400000)), isActive: true, proofCount: 8, streak: 2, lastProofDate: new Date(now.getTime() - 2 * 86400000).toISOString() },
    { id: 'demo-id-3', statement: 'Ik ben iemand die prioriteert boven brandjes blust', createdAt: iso(new Date(now.getTime() - 30 * 86400000)), isActive: true, proofCount: 5, streak: 0, lastProofDate: new Date(now.getTime() - 6 * 86400000).toISOString() },
    { id: 'demo-id-4', statement: 'Ik ben energiek en vol vitaliteit', createdAt: iso(new Date(now.getTime() - 20 * 86400000)), isActive: true, proofCount: 3, streak: 1, lastProofDate: new Date(now.getTime() - 1 * 86400000).toISOString() },
    { id: 'demo-id-5', statement: 'Ik ben iemand die altijd doorzet', createdAt: iso(new Date(now.getTime() - 15 * 86400000)), isActive: false, proofCount: 1, streak: 0, lastProofDate: new Date(now.getTime() - 14 * 86400000).toISOString() },
  ];
  const proofTexts: Record<string, string[]> = {
    'demo-id-1': ['Grote klant binnengehaald ondanks tegenwerking', 'Team meegenomen in nieuwe strategie', 'Investeerder overtuigd met heldere visie'],
    'demo-id-2': ['3 weken op rij ochtendritueel afgerond', 'Weekstart elke maandag zonder overslaan'],
    'demo-id-3': ['Kikker eerst gedaan i.p.v. mail gecheckt', 'Hefboomtaak afgerond vóór lunch'],
    'demo-id-4': ['Hardgelopen ondanks drukke week'],
  };
  const proofs: { id: string; identityId: string; proof: string; date: string }[] = [];
  let proofSeq = 1;
  for (const [identityId, texts] of Object.entries(proofTexts)) {
    for (const text of texts) {
      proofs.push({
        id: `demo-proof-${proofSeq++}`,
        identityId,
        proof: text,
        date: new Date(now.getTime() - rand(1, 25) * 86400000).toISOString(),
      });
    }
  }

  await sql`
    INSERT INTO identity_profiles (user_id, organization_id, statements, proofs, updated_at)
    VALUES (${uuid}, ${orgId}, ${JSON.stringify(statements)}, ${JSON.stringify(proofs)}, NOW())
    ON CONFLICT (user_id) DO UPDATE SET
      statements = ${JSON.stringify(statements)}, proofs = ${JSON.stringify(proofs)}, updated_at = NOW()
  `;
  console.log(`✓ identity_profiles: ${statements.length} statements (1 inactief), ${proofs.length} proofs`);

  // ---- 4. Weekstart/weekreview: seed-demo.ts gebruikt week-nummers als "2026-W01", maar de
  // echte pagina's (weekly-start/weekly-review) en ritual-status.service.ts gebruiken
  // getCurrentWeekNumber() — een kaal ISO-weeknummer ("38") — en herkennen een week alleen als
  // afgerond via data.type ('weekly-start'/'weekly-review') binnen de weekly_reviews-rij, niet via
  // een aparte kolom. Door dat format-verschil werden de door seed-demo.ts aangemaakte weken nooit
  // als "af" herkend. Hier dus opnieuw, met het juiste format — en de HUIDIGE week bewust leeg,
  // zodat "Start je week"/"Sluit je week af" nog live te testen zijn.
  await sql`DELETE FROM weekly_goals WHERE user_id = ${uuid}`;
  await sql`DELETE FROM weekly_reviews WHERE user_id = ${uuid}`;

  const currentWeek = getCurrentWeekNumber();
  const currentYear = today.getFullYear();
  let weekRowCount = 0;

  for (const offset of [3, 2, 1]) {
    const weekNumber = String(currentWeek - offset);
    const weekStartData = {
      type: 'weekly-start',
      weekNumber: currentWeek - offset,
      year: currentYear,
      weekIntention: `Focus week ${weekNumber}: minder brandjes blussen, meer bouwen.`,
      mainGoals: ['Offertetraject X afronden', '2 klantgesprekken voeren', 'Weekrapport op tijd versturen'],
      focusAreas: { work: rand(5, 8), health: rand(4, 7), relationships: rand(4, 7), personal: rand(4, 7) },
      learningGoal: 'Delegeren i.p.v. zelf oplossen',
      supportNetwork: 'Sparringpartner + team',
      obstacles: 'Drukke agenda door vergaderingen',
      successMetrics: 'Kikker elke dag afgerond',
      createdAt: new Date(today.getTime() - offset * 7 * 86400000).toISOString(),
    };
    const weekReviewData = {
      type: 'weekly-review',
      weekNumber: currentWeek - offset,
      wins: ['Klant X getekend', 'Team-planning rondgemaakt'],
      challenges: 'Te veel tijd aan inbox besteed',
      learnings: 'Blokkeren van focustijd werkt beter dan hopen op rust',
      productivityScore: rand(5, 9),
      energyScore: rand(4, 8),
      carryForward: 'Offertetraject X afmaken',
      leaveBehing: 'Zelf elke offerte willen nabellen',
      growthMoment: 'Nee gezegd tegen een low-value klant',
      gratitude: 'Goed gesprek met mentor',
      weekStart: iso(new Date(today.getTime() - (offset * 7 + 6) * 86400000)),
      weekEnd: iso(new Date(today.getTime() - offset * 7 * 86400000)),
      whatGave: 'Duidelijkheid aan het team gegeven',
      whatLearned: 'Delegeren scheelt meer tijd dan ik dacht',
      howContributed: 'Klant geholpen met een lastig probleem',
      howMakeBetter: '15 minuten eerder beginnen',
      mainGoalResults: [
        { goal: 'Offertetraject X afronden', done: true },
        { goal: '2 klantgesprekken voeren', done: true },
        { goal: 'Weekrapport op tijd versturen', done: Math.random() < 0.7 },
      ],
    };

    await sql`
      INSERT INTO weekly_reviews (organization_id, user_id, week_number, data, timestamp)
      VALUES (${orgId}, ${uuid}, ${weekNumber}, ${JSON.stringify(weekStartData)}, ${new Date(today.getTime() - (offset * 7 + 6) * 86400000).toISOString()})
    `;
    await sql`
      INSERT INTO weekly_reviews (organization_id, user_id, week_number, data, timestamp)
      VALUES (${orgId}, ${uuid}, ${weekNumber}, ${JSON.stringify(weekReviewData)}, ${new Date(today.getTime() - offset * 7 * 86400000).toISOString()})
    `;
    await sql`
      INSERT INTO weekly_goals (organization_id, user_id, week_number, goals, status, created_at, updated_at)
      VALUES (${orgId}, ${uuid}, ${weekNumber}, ${JSON.stringify(weekStartData.mainGoals.map((title) => ({ title, done: true })))}, 'completed', NOW(), NOW())
    `;
    weekRowCount++;
  }
  console.log(`✓ ${weekRowCount} volledige weken (weekstart + weekreview + weekly_goals), huidige week (${currentWeek}) bewust leeg`);

  console.log('\n✓ Klaar — rituelen, identiteit en weekstart/weekreview toegevoegd aan demo@impactreis.nl');
})();
