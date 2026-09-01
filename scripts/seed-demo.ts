import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

void (async () => {
  console.log('✓ Connected to DB');

  function iso(d: Date): string {
    return d.toISOString().slice(0, 10);
  }
  function rand(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  // ---- 1. Demo-organization (idempotent) ----
  const orgRows = await sql`SELECT id FROM organizations WHERE slug = 'demo-impactreis'`;
  let orgId: number;
  if (orgRows.length > 0) {
    orgId = orgRows[0].id as number;
    console.log(`✓ Bestaande organization 'demo-impactreis', id=${orgId}`);
  } else {
    const r = await sql`
      INSERT INTO organizations (slug, name, plan, created_at)
      VALUES ('demo-impactreis', 'Demo ImpactReis', 'starter', NOW())
      RETURNING id
    `;
    orgId = r[0].id as number;
    console.log(`✓ Nieuwe organization 'demo-impactreis', id=${orgId}`);
  }

  // ---- 2. Demo-user (idempotent) ----
  const demoEmail = 'demo@impactreis.nl';
  const userRows = await sql`SELECT id, organization_id FROM users WHERE email = ${demoEmail}`;
  const userId = 19; // demo@impactreis.nl → users.id=19
  const uuid = userId.toString(); // user_id is text in de content-tabellen (habits/daily_logs/etc.)

  // ---- 3. Opruimen: verwijder oud demo-content voor deze UUID (idempotent herstart) ----
  // Tabelnamen zijn interne whitelist — geen user-input, dus directe tag-query veilig.
  await sql`DELETE FROM habits WHERE user_id = ${uuid}`;
  await sql`DELETE FROM daily_logs WHERE user_id = ${uuid}`;
  await sql`DELETE FROM goals WHERE user_id = ${uuid}`;
  await sql`DELETE FROM weekly_goals WHERE user_id = ${uuid}`;
  await sql`DELETE FROM weekly_reviews WHERE user_id = ${uuid}`;
  await sql`DELETE FROM focus_sessions WHERE user_id = ${uuid}`;
  await sql`DELETE FROM wins WHERE user_id = ${uuid}`;
  await sql`DELETE FROM user_context WHERE user_id = ${uuid}`;
  await sql`DELETE FROM coach_lessons WHERE user_id = ${uuid}`;
  await sql`DELETE FROM energy_log WHERE user_id = ${uuid}`;
  console.log('✓ Oud demo-content opgeruimd');

  // ---- 4. user_context ----
  await sql`
    INSERT INTO user_context (user_id, organization_id, current_energy_level, current_stress_level, recent_mood, current_focus_area, coaching_style, updated_at)
    VALUES (${uuid}, ${orgId}, 6, 3, 'goed', 'productiviteit', 'empathic_and_reflective', NOW())
  `;
  console.log('✓ user_context');

  // ---- 5. Habits (3 gewoonten) ----
  const habitNames = ['Diep werk 90 min', 'Ochtendoefening', 'Reflectie-avond'];
  for (const name of habitNames) {
    await sql`
      INSERT INTO habits (organization_id, user_id, name, streak, last_completed, created_at)
      VALUES (${orgId}, ${uuid}, ${name}, ${rand(5, 21)}, ${iso(new Date(Date.now() - rand(0, 2) * 86400000))}, NOW())
    `;
  }
  console.log('✓ habits');

  // ---- 6. Dagboek: 90x ochtend + 90x avond + 45x adhd + 13x controle_cirkel + 13x feiten_verhalen ----
  const today = new Date();
  let totalLogs = 0;

  for (let d = 0; d < 90; d++) {
    const date = new Date(today);
    date.setDate(date.getDate() - d);
    const dateStr = iso(date);
    const dagNummer = 90 - d;

    // Ochtend
    await sql`
      INSERT INTO daily_logs (organization_id, user_id, type, date_string, data, timestamp)
      VALUES (${orgId}, ${uuid}, 'dagboek_ochtend', ${dateStr}, ${JSON.stringify({
        stemming: ['rustig', 'gestimuleerd', 'goed', 'focussed'][rand(0, 3)],
        tekst: `Dag ${dagNummer}: ${['start met prioriteit', 'rustige ochtend', 'energiek en helder', 'focus op kwartaal-doel'][rand(0, 3)]}.`
      })}, NOW())
    `;
    totalLogs++;

    // Avond
    await sql`
      INSERT INTO daily_logs (organization_id, user_id, type, date_string, data, timestamp)
      VALUES (${orgId}, ${uuid}, 'dagboek_avond', ${dateStr}, ${JSON.stringify({
        stemming: ['tevreden', 'moedig', 'rustig', 'bevredigd'][rand(0, 3)],
        tekst: `Dag ${dagNummer}: ${['twee blokken achter de rug', 'goed gesprek met mentor', 'zware dag maar ik hield vol', 'vroeg af — slimme keuze'][rand(0, 3)]}.`
      })}, NOW())
    `;
    totalLogs++;

    // ADHD (elke 2 dagen)
    if (d % 2 === 0) {
      await sql`
        INSERT INTO daily_logs (organization_id, user_id, type, date_string, data, timestamp)
        VALUES (${orgId}, ${uuid}, 'adhd', ${dateStr}, ${JSON.stringify({
          scores: { focus: rand(2, 8), organisatie: rand(2, 8), impulsiviteit: rand(2, 8) },
          notes: `ADHD-scORE dag ${dagNummer}: rustig gestart, piek na lunch.`
        })}, NOW())
      `;
      totalLogs++;
    }
  }

  // Controle-cirkel: wekelijks (13x)
  for (let w = 0; w < 13; w++) {
    const date = new Date(today);
    date.setDate(date.getDate() - (89 - w * 7));
    const dateStr = iso(date);
    await sql`
      INSERT INTO daily_logs (organization_id, user_id, type, date_string, data, timestamp)
      VALUES (${orgId}, ${uuid}, 'controle_cirkel', ${dateStr}, ${JSON.stringify({
        probleem: `Uitdaging week ${w + 1}`,
        mijn_kant: ['Ik voel me gestrest', 'Ik wil het oplossen'][rand(0, 1)],
        niet_mijn_kant: ['Tijdstip is ongunstig', 'Anderen zijn betrokken'][rand(0, 1)],
        gekozen_actie: `Actie week ${w + 1}`,
        losgelaten: rand(0, 1) === 1
      })}, NOW())
    `;
    totalLogs++;
  }

  // Feiten & verhalen (reflectie): wekelijks (13x)
  for (let w = 0; w < 13; w++) {
    const date = new Date(today);
    date.setDate(date.getDate() - (89 - w * 7));
    const dateStr = iso(date);
    await sql`
      INSERT INTO daily_logs (organization_id, user_id, type, date_string, data, timestamp)
      VALUES (${orgId}, ${uuid}, 'feiten_verhalen', ${dateStr}, ${JSON.stringify({
        situatie: `Situatie week ${w + 1}`,
        verhaal: `Verhaal: dit week was intensief.`,
        feiten: ['Feit 1', 'Feit 2'][rand(0, 1)],
        inzicht: `Inzicht: ik leer elke week meer.`
      })}, NOW())
    `;
    totalLogs++;
  }

  console.log(`✓ ${totalLogs} dagboek-rijen (ochtend+avond+adhd+controle_cirkel+reflectie)`);

  // ---- 7. Wins: 26 over 90 dagen ----
  const winCategories = ['business', 'personal', 'health', 'learning'] as const;
  const winTitles: Record<string, string[]> = {
    business: ['Nieuwe klant gesloten', 'Presentatie gegeven', 'Contract ondertekend', 'Project gelanceerd', 'Meetingschema geoptimaliseerd'],
    personal: ['Drie weken geen sugar', 'Hardloopwinaars 5 km', 'Nieuw boek afgerond', 'Dank aan een vriend', 'Leeggoed gedaan'],
    health: ['7 uur slaap 5 nachten op rij', 'Supplements weer op schema', 'Stretching elke ochtend', 'Water drinkroutine', 'Mindfulness 10 min'],
    learning: ['Coursetitel afgerond', 'Boekssamenvatting geschreven', 'Nieuw framework geprobeerd', 'Expert-call gehad', 'Paper geread en genotuleerd'],
  };
  let insertedWins = 0;
  for (let w = 0; w < 26; w++) {
    const date = new Date(today);
    date.setDate(date.getDate() - (89 - w * 3));
    const cat = winCategories[rand(0, 3)];
    const title = winTitles[cat][rand(0, winTitles[cat].length - 1)];
    const desc = `ImpactReis demo: ${title.toLowerCase()} — week ${Math.ceil((w + 1) / 2)}.`;
    const level = rand(1, 5);
    await sql`
      INSERT INTO wins (organization_id, user_id, title, description, category, impact_level, date, tags, created_at)
      VALUES (${orgId}, ${uuid}, ${title}, ${desc}, ${cat}, ${level}, ${iso(date)}, ${JSON.stringify(['demo', 'impactreis'])}, NOW())
    `;
    if (level >= 4) {
      await sql`
        INSERT INTO user_context (user_id, last_major_win_date, updated_at, organization_id)
        VALUES (${uuid}, ${iso(date)}, NOW(), ${orgId})
        ON CONFLICT (user_id) DO UPDATE SET last_major_win_date = ${iso(date)}, updated_at = NOW()
      `;
    }
    insertedWins++;
    if (insertedWins % 10 === 0) process.stdout.write(`  ${insertedWins}/26 wins...`);
  }
  console.log(`✓ ${insertedWins} wins`);

  // ---- 8. Goals: 3 doelen ----
  const goals = [
    { title: 'Kwartaal-doel: 3 nieuwe relaties', description: 'Netwerkuitbreiding Q3', type: 'business', completed: false },
    { title: 'Boek schrijven hoofdstuk 4', description: 'Uitwerking case study', type: 'learning', completed: true },
    { title: 'Dagelijkse oefening', description: '10 min bewegen', type: 'health', completed: false },
  ];
  for (const g of goals) {
    await sql`
      INSERT INTO goals (user_id, id, organization_id, data, updated_at)
      VALUES (${uuid}, ${randomUUID()}, ${orgId}, ${JSON.stringify(g)}, NOW())
    `;
  }
  console.log('✓ goals (3)');

  // ---- 9. Weekly goals + weekly reviews: 13 weken ----
  for (let week = 1; week <= 13; week++) {
    const weekNumber = `2026-W${String(week).padStart(2, '0')}`;
    const gw = [
      { title: `Week ${week}: prioriteit A`, done: rand(0, 1) === 1 },
      { title: `Week ${week}: prioriteit B`, done: rand(0, 1) === 1 },
    ];
    await sql`
      INSERT INTO weekly_goals (organization_id, user_id, week_number, goals, status, created_at, updated_at)
      VALUES (${orgId}, ${uuid}, ${weekNumber}, ${JSON.stringify(gw)}, 'active', NOW(), NOW())
    `;

    const wr = {
      focus: `Focus week ${week}`,
      breakthroughs: [`Doorbraak week ${week}`],
      challenges: [`Uitdaging week ${week}`],
      energyTrend: 'up',
    };
    await sql`
      INSERT INTO weekly_reviews (organization_id, user_id, week_number, data, timestamp)
      VALUES (${orgId}, ${uuid}, ${weekNumber}, ${JSON.stringify(wr)}, NOW())
    `;
  }
  console.log('✓ 13 weekly_goals + 13 weekly_reviews');

  // ---- 10. Focus-sessies: 2-4 per dag, 90 dagen ----
  let insertedFocus = 0;
  for (let d = 0; d < 90; d++) {
    const date = new Date(today);
    date.setDate(date.getDate() - d);
    const sessionsToday = rand(2, 4);
    for (let s = 0; s < sessionsToday; s++) {
      const startMin = 540 + s * 90 + rand(0, 30);
      const startH = Math.floor(startMin / 60);
      const startM = startMin % 60;
      const startTime = `${String(startH).padStart(2, '0')}:${String(startM).padStart(2, '0')}`;
      await sql`
        INSERT INTO focus_sessions (organization_id, user_id, date, start_time, goal, completed, created_at)
        VALUES (${orgId}, ${uuid}, ${iso(date)}, ${startTime}, 'Diep werkblok', true, NOW())
      `;
      insertedFocus++;
    }
  }
  console.log(`✓ ${insertedFocus} focus_sessions`);

  // ---- 11. Energy log: 1-2 per dag, 90 dagen ----
  const activities = ['Werk', 'Oefening', 'Lezen', 'Sociale activiteit', 'Rust', 'Eten'];
  const categories = ['werk', 'fysiek', 'mentaal', 'sociale', 'rust'];
  let insertedEnergy = 0;
  for (let d = 0; d < 90; d++) {
    const date = new Date(today);
    date.setDate(date.getDate() - d);
    const count = rand(1, 2);
    for (let e = 0; e < count; e++) {
      await sql`
        INSERT INTO energy_log (organization_id, user_id, date_string, activity, category, direction, source, created_at)
        VALUES (${orgId}, ${uuid}, ${iso(date)}, ${activities[rand(0, activities.length - 1)]}, ${categories[rand(0, categories.length - 1)]}, ${rand(0, 1) === 1 ? 'gain' : 'cost'}, 'ritueel', NOW())
      `;
      insertedEnergy++;
    }
  }
  console.log(`✓ ${insertedEnergy} energy_log`);

  // ---- 12. Coach-lessons: 5 inzichten ----
  const lessonInsights = [
    { patternKey: 'perfectionism', technique: '80/20 focus', insight: 'Perfectie vasthoudt productie — 80% nu, 20% later.', confidence: 0.75, confirmed: 2, disproven: 0 },
    { patternKey: 'boundaries', technique: 'tijdgebonden blok', insight: 'Zonder tijdseinde lopen meetings door — hard stoppen werkt.', confidence: 0.7, confirmed: 3, disproven: 1 },
    { patternKey: 'admin', technique: 'batch verwerking', insight: 'Admin concentreren in één blok per dag vermindert vragenspekt.', confidence: 0.8, confirmed: 4, disproven: 0 },
    { patternKey: 'isolation', technique: 'co-working slot', insight: 'Een keer per week deelt kamer vermindert isolerende dag.', confidence: 0.6, confirmed: 1, disproven: 2 },
    { patternKey: 'meetings', technique: 'no-meeting middag', insight: 'Middag vrij van meetings geeft diep werk ruimte.', confidence: 0.85, confirmed: 5, disproven: 0 },
  ];
  for (const l of lessonInsights) {
    await sql`
      INSERT INTO coach_lessons (organization_id, user_id, pattern_key, technique, insight, confidence, times_confirmed, times_disproven, active, source, created_at, updated_at)
      VALUES (${orgId}, ${uuid}, ${l.patternKey}, ${l.technique}, ${l.insight}, ${l.confidence}, ${l.confirmed}, ${l.disproven}, true, 'demo', NOW(), NOW())
      ON CONFLICT (user_id, pattern_key) DO UPDATE SET
        technique = ${l.technique},
        insight = ${l.insight},
        confidence = ${l.confidence},
        times_confirmed = ${l.confirmed},
        times_disproven = ${l.disproven},
        active = true,
        updated_at = NOW()
    `;
  }
  console.log('✓ 5 coach_lessons');

  // ---- 13. Samenvatting ----
  console.log('\n===== SEED KLAAR =====');
  const counts = await sql`
    SELECT
      (SELECT count(*) FROM organizations WHERE slug = 'demo-impactreis')::int AS organizations,
      (SELECT count(*) FROM users WHERE email = 'demo@impactreis.nl')::int AS users,
      (SELECT count(*) FROM habits WHERE user_id = ${uuid})::int AS habits,
      (SELECT count(*) FROM daily_logs WHERE user_id = ${uuid})::int AS daily_logs,
      (SELECT count(*) FROM wins WHERE user_id = ${uuid})::int AS wins,
      (SELECT count(*) FROM goals WHERE user_id = ${uuid})::int AS goals,
      (SELECT count(*) FROM weekly_goals WHERE user_id = ${uuid})::int AS weekly_goals,
      (SELECT count(*) FROM weekly_reviews WHERE user_id = ${uuid})::int AS weekly_reviews,
      (SELECT count(*) FROM focus_sessions WHERE user_id = ${uuid})::int AS focus_sessions,
      (SELECT count(*) FROM energy_log WHERE user_id = ${uuid})::int AS energy_logs,
      (SELECT count(*) FROM coach_lessons WHERE user_id = ${uuid})::int AS coach_lessons
  `;
  console.log(JSON.stringify(counts[0], null, 2));
  console.log(`\nDemo-account klaar: demo@impactreis.nl (organization: demo-impactreis, id=${orgId})`);
  console.log(`JWT-token genereren voor test: npx tsx -e "import { sign } from 'jsonwebtoken'; console.log(sign({ userId: 19, orgId: 18 }, process.env.JWT_SECRET!, { expiresIn: '7d' }))"`);
  console.log('\n✓ Klaar');
})();
