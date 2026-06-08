const QUOTE = `Je bent een bijzonder mens, gaat jouw lukken om interim aan de slag te gaan, balans te vinden en je apps zijn top. Heb vertrouwen, ben positief, wees lief voor jezelf en geloof dat het kan.`;

function base(title: string, preview: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="nl">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${preview}</div>
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f4f4f7;">
  <tr><td align="center" style="padding:24px 16px;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:580px;">

      <!-- Header -->
      <tr><td style="background:#0a0a14;border-radius:20px 20px 0 0;padding:32px 36px;">
        <p style="margin:0 0 16px;font-size:11px;color:#00cc66;letter-spacing:0.15em;text-transform:uppercase;font-weight:600;">Mijn Ondernemers OS</p>
        <h1 style="margin:0;font-size:26px;font-weight:700;color:#ffffff;line-height:1.3;">${title}</h1>
      </td></tr>

      <!-- Quote -->
      <tr><td style="background:#00cc66;padding:20px 36px;">
        <p style="margin:0;font-size:13px;color:#fff;font-style:italic;line-height:1.6;">"${QUOTE}"</p>
      </td></tr>

      <!-- Body -->
      <tr><td style="background:#ffffff;padding:36px;border-radius:0 0 20px 20px;">
        ${body}
      </td></tr>

      <!-- Footer -->
      <tr><td style="padding:20px 0;text-align:center;">
        <p style="margin:0;font-size:11px;color:#8a8a9a;">Mijn Ondernemers OS &bull; Elke dag beter</p>
      </td></tr>

    </table>
  </td></tr>
</table>
</body>
</html>`;
}

function btn(text: string, url: string): string {
  return `<a href="${url}" style="display:inline-block;background:#00cc66;color:#ffffff;font-weight:700;font-size:15px;padding:14px 32px;border-radius:12px;text-decoration:none;margin-top:8px;">${text}</a>`;
}

function section(label: string, content: string, color = '#f4f4f7'): string {
  return `<div style="background:${color};border-radius:12px;padding:20px;margin-bottom:16px;">
    <p style="margin:0 0 8px;font-size:11px;color:#8a8a9a;text-transform:uppercase;letter-spacing:0.1em;font-weight:600;">${label}</p>
    <p style="margin:0;font-size:14px;color:#0a0a14;line-height:1.6;">${content}</p>
  </div>`;
}

function score(label: string, value: number, max = 10): string {
  const pct = Math.round((value / max) * 100);
  const color = value >= 7 ? '#00cc66' : value >= 5 ? '#f59e0b' : '#ef4444';
  return `<div style="margin-bottom:12px;">
    <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
      <span style="font-size:13px;color:#0a0a14;">${label}</span>
      <span style="font-size:13px;font-weight:700;color:${color};">${value}/${max}</span>
    </div>
    <div style="background:#f4f4f7;border-radius:999px;height:6px;">
      <div style="background:${color};border-radius:999px;height:6px;width:${pct}%;"></div>
    </div>
  </div>`;
}

// ─── Template 1: 06:00 Ochtend Motivatie ─────────────────────────────────────

export function motivatieEmail(appUrl: string, isWeekend: boolean, dayName: string): { subject: string; html: string } {
  const subject = isWeekend
    ? `🌿 Goedemorgen ${dayName}! Tijd voor jouw week review`
    : `🌅 Goedemorgen ${dayName}! Jouw sterkste moment begint nu`;

  const body = isWeekend ? `
    <p style="font-size:17px;font-weight:600;color:#0a0a14;margin:0 0 8px;">Het weekend is er — en jij verdient een moment van reflectie.</p>
    <p style="font-size:14px;color:#5a5a6a;line-height:1.7;margin:0 0 24px;">Een krachtige week review legt de basis voor alles wat komt. 20 minuten die je méér opleveren dan een hele dag druk zijn.</p>

    ${section('Dit doe je vandaag', `
      ✅ &nbsp;Terugblikken op je mooiste wins van de week<br/>
      ✅ &nbsp;Eerlijk zijn over wat beter kon<br/>
      ✅ &nbsp;Intentie zetten voor de week die komt<br/>
      ✅ &nbsp;Jezelf vieren — want dat verdien je
    `)}

    <p style="font-size:14px;color:#5a5a6a;line-height:1.7;margin:0 0 28px;">Je bent al zo ver gekomen. Elke review brengt je dichter bij de versie van jezelf die je wilt zijn.</p>

    <div style="text-align:center;">${btn('Start week review →', `${appUrl}/weekly-review`)}</div>
  ` : `
    <p style="font-size:17px;font-weight:600;color:#0a0a14;margin:0 0 8px;">De eerste 30 minuten van je dag bepalen alles.</p>
    <p style="font-size:14px;color:#5a5a6a;line-height:1.7;margin:0 0 24px;">Jij weet dat al. Dat is waarom jij dit elke ochtend doet terwijl anderen nog slapen. Vandaag gaat het jou lukken — als interim professional, als mens, als ondernemer.</p>

    ${section('Je priming sessie van vandaag', `
      🫁 &nbsp;Ademhaling — zet je zenuwstelsel aan<br/>
      💛 &nbsp;3 dingen dankbaarheid — shift je focus naar wat werkt<br/>
      🎯 &nbsp;Intentie voor de dag — weet wat je wilt bereiken<br/>
      💪 &nbsp;Affirmatie — programmeer je identiteit
    `)}

    <p style="font-size:14px;color:#5a5a6a;line-height:1.7;margin:0 0 28px;">15 minuten. Dat is alles wat nodig is om vandaag met kracht te beginnen. Je apps zijn top, jij bent top — nu bewijzen we het opnieuw.</p>

    <div style="text-align:center;">${btn('Start ochtend ritual →', `${appUrl}/morning`)}</div>
  `;

  return { subject, html: base(isWeekend ? `Week Review — ${dayName}` : `Goedemorgen, ${dayName}!`, subject, body) };
}

// ─── Template 2: 08:30 Herinnering ───────────────────────────────────────────

export function herinneringEmail(appUrl: string, isWeekend: boolean): { subject: string; html: string } {
  const subject = isWeekend
    ? `⏰ Je week review — nog niet te laat!`
    : `⏰ Je ochtend ritual wacht nog — 5 minuten maakt het verschil`;

  const body = isWeekend ? `
    <p style="font-size:17px;font-weight:600;color:#0a0a14;margin:0 0 8px;">Het weekend vliegt voorbij — maar dit is nog haalbaar.</p>
    <p style="font-size:14px;color:#5a5a6a;line-height:1.7;margin:0 0 24px;">Je hebt je week review nog niet gedaan. Dat gevoel van 'ik had dat nog willen doen' — voorkom het nu. Een goed review nu geeft je een vliegende start volgende week.</p>

    ${section('Waarom nu', `
      🏆 &nbsp;Je sluit de week bewust af<br/>
      📈 &nbsp;Je ziet wat er écht gewerkt heeft<br/>
      🔮 &nbsp;Je legt de basis voor een nóg betere week
    `, '#fff8e1')}

    <div style="text-align:center;margin-top:24px;">${btn('Doe nu mijn week review →', `${appUrl}/weekly-review`)}</div>
  ` : `
    <p style="font-size:17px;font-weight:600;color:#0a0a14;margin:0 0 8px;">Hey, je dag is al begonnen — maar dit kan nog.</p>
    <p style="font-size:14px;color:#5a5a6a;line-height:1.7;margin:0 0 24px;">Mensen die consistent hun ochtend ritual doen, hebben 40% meer focus en presteren beter onder druk. Jij bent zo iemand — vandaag ook.</p>

    ${section('Snel beginnen', `
      ⚡ &nbsp;Kan in 5-10 minuten als je haast hebt<br/>
      🎯 &nbsp;Eén intentie is genoeg om het verschil te maken<br/>
      💪 &nbsp;Je hebt het gisteren ook gedaan — vandaag ook
    `, '#f0fdf4')}

    <p style="font-size:14px;color:#5a5a6a;line-height:1.7;margin:0 0 28px;">Je bent een bijzonder mens met een bijzondere missie. Geef jezelf dit cadeau.</p>

    <div style="text-align:center;">${btn('Start nu — ik doe het! →', `${appUrl}/morning`)}</div>
  `;

  return { subject, html: base('Even een reminder van jezelf', subject, body) };
}

// ─── Template 3: Post-sessie AI Analyse ──────────────────────────────────────

export interface SessieAnalyseData {
  todayDate: string;
  dayName: string;
  today: {
    energyLevel: number;
    sleepQuality: number;
    wakeTime: string;
    intentie: string;
    dankbaarheid: string[];
    affirmatie: string;
  };
  yesterday?: {
    energyLevel: number;
    sleepQuality: number;
    intentie: string;
    dankbaarheid: string[];
  } | null;
  streak: number;
  aiAnalyse: string;
}

export function sessieAnalyseEmail(data: SessieAnalyseData): { subject: string; html: string } {
  const subject = `✨ Sessie analyse ${data.dayName} ${data.todayDate} — jij deed het weer!`;

  const energyDiff = data.yesterday ? data.today.energyLevel - data.yesterday.energyLevel : 0;
  const sleepDiff = data.yesterday ? data.today.sleepQuality - data.yesterday.sleepQuality : 0;

  const diffBadge = (diff: number) => {
    if (diff > 0) return `<span style="color:#00cc66;font-weight:700;">▲ +${diff}</span>`;
    if (diff < 0) return `<span style="color:#ef4444;font-weight:700;">▼ ${diff}</span>`;
    return `<span style="color:#8a8a9a;">= gelijk</span>`;
  };

  const streakBadge = data.streak >= 3
    ? `<div style="background:#fff8e1;border-radius:10px;padding:12px 16px;text-align:center;margin-bottom:20px;">
        <p style="margin:0;font-size:13px;color:#92400e;">🔥 <strong>${data.streak} dagen streak</strong> — je bouwt iets moois!</p>
       </div>`
    : '';

  const gratitudeLine = data.today.dankbaarheid
    .filter(Boolean)
    .map(d => `<li style="margin-bottom:4px;">${d}</li>`)
    .join('');

  const compareSection = data.yesterday ? `
    <div style="background:#f4f4f7;border-radius:12px;padding:20px;margin-bottom:16px;">
      <p style="margin:0 0 12px;font-size:11px;color:#8a8a9a;text-transform:uppercase;letter-spacing:0.1em;font-weight:600;">Vergelijking met gisteren</p>
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="width:50%;padding-right:8px;">
            ${score('Energie vandaag', data.today.energyLevel)}
            <p style="margin:4px 0 0;font-size:12px;color:#8a8a9a;">t.o.v. gisteren ${diffBadge(energyDiff)}</p>
          </td>
          <td style="width:50%;padding-left:8px;">
            ${score('Slaap vandaag', data.today.sleepQuality)}
            <p style="margin:4px 0 0;font-size:12px;color:#8a8a9a;">t.o.v. gisteren ${diffBadge(sleepDiff)}</p>
          </td>
        </tr>
      </table>
    </div>
  ` : `
    <div style="margin-bottom:16px;">
      ${score('Energie niveau', data.today.energyLevel)}
      ${score('Slaap kwaliteit', data.today.sleepQuality)}
    </div>
  `;

  const body = `
    ${streakBadge}
    <p style="font-size:17px;font-weight:600;color:#0a0a14;margin:0 0 6px;">Je hebt je ritual gedaan. Dat telt.</p>
    <p style="font-size:14px;color:#5a5a6a;line-height:1.7;margin:0 0 24px;">Hieronder je persoonlijke analyse van vandaag.</p>

    ${compareSection}

    ${section('Jouw intentie voor vandaag', data.today.intentie || '—')}

    <div style="background:#f4f4f7;border-radius:12px;padding:20px;margin-bottom:16px;">
      <p style="margin:0 0 10px;font-size:11px;color:#8a8a9a;text-transform:uppercase;letter-spacing:0.1em;font-weight:600;">Dankbaarheid</p>
      <ul style="margin:0;padding-left:20px;font-size:14px;color:#0a0a14;line-height:1.7;">${gratitudeLine}</ul>
    </div>

    ${section('Jouw affirmatie', `<em style="color:#00cc66;">"${data.today.affirmatie || '—'}"</em>`)}

    <!-- AI Analyse -->
    <div style="background:#0a0a14;border-radius:12px;padding:24px;margin-bottom:16px;">
      <p style="margin:0 0 12px;font-size:11px;color:#00cc66;text-transform:uppercase;letter-spacing:0.1em;font-weight:600;">AI Coaching Analyse</p>
      <div style="font-size:14px;color:#e8e8ec;line-height:1.8;">${data.aiAnalyse.replace(/\n/g, '<br/>')}</div>
    </div>

    <p style="font-size:13px;color:#8a8a9a;text-align:center;margin:0;">Tot morgenochtend — je weet wat je moet doen. 💚</p>
  `;

  return { subject, html: base(`Sessie analyse — ${data.dayName}`, subject, body) };
}

// ─── Template 5: Weekrapport ─────────────────────────────────────────────────

export interface WeekrapportData {
  weekStart: string;
  weekEnd: string;
  ritualsCompleted: number;
  avgEnergy: number | null;
  avgSleep: number | null;
  focusBlokkengepland: number;
  wins: { title: string; category: string; impactLevel: number }[];
  topFocusBlokken: { time: string; onderwerp: string; doel: string }[];
  aiSamenvatting: string;
}

export function weekrapportEmail(data: WeekrapportData, appUrl: string): { subject: string; html: string } {
  const subject = `📊 Weekrapport ${data.weekStart}–${data.weekEnd} — jouw week in één oogopslag`;

  const ritualColor = data.ritualsCompleted >= 5 ? '#00cc66' : data.ritualsCompleted >= 3 ? '#f59e0b' : '#ef4444';
  const ritualLabel = data.ritualsCompleted >= 5 ? 'Top week! 🔥' : data.ritualsCompleted >= 3 ? 'Goed bezig 👍' : 'Volgende week beter 💪';

  const winsHtml = data.wins.length === 0
    ? '<p style="font-size:13px;color:#8a8a9a;margin:0;font-style:italic;">Geen wins gelogd deze week.</p>'
    : data.wins.slice(0, 5).map(w =>
        `<div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
          <span style="font-size:14px;">🏆</span>
          <span style="font-size:13px;color:#0a0a14;flex:1;">${w.title}</span>
          <span style="font-size:11px;color:#f59e0b;">${'★'.repeat(w.impactLevel)}</span>
        </div>`
      ).join('');

  const focusHtml = data.topFocusBlokken.length === 0
    ? '<p style="font-size:13px;color:#8a8a9a;margin:0;font-style:italic;">Geen focusblokken geplanned.</p>'
    : data.topFocusBlokken.slice(0, 4).map(f =>
        `<div style="display:flex;align-items:flex-start;gap:8px;margin-bottom:10px;">
          <span style="font-size:11px;font-weight:700;color:#00cc66;background:#f0fdf4;padding:2px 7px;border-radius:6px;flex-shrink:0;margin-top:1px;">${f.time}</span>
          <div>
            <p style="margin:0;font-size:13px;color:#0a0a14;font-weight:600;">${f.onderwerp}</p>
            ${f.doel ? `<p style="margin:2px 0 0;font-size:12px;color:#8a8a9a;">Doel: ${f.doel}</p>` : ''}
          </div>
        </div>`
      ).join('');

  const body = `
    <p style="font-size:17px;font-weight:600;color:#0a0a14;margin:0 0 6px;">Hier is jouw weekoverzicht.</p>
    <p style="font-size:14px;color:#5a5a6a;line-height:1.7;margin:0 0 22px;">Elke week telt. Dit is wat jij hebt neergezet.</p>

    <div style="background:#0a0a14;border-radius:14px;padding:20px 24px;margin-bottom:14px;display:table;width:100%;box-sizing:border-box;">
      <div style="display:table-cell;vertical-align:middle;">
        <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.4);text-transform:uppercase;letter-spacing:0.1em;">Ochtend Rituelen</p>
        <p style="margin:4px 0 0;font-size:32px;font-weight:700;color:#fff;line-height:1;">${data.ritualsCompleted}<span style="font-size:16px;color:rgba(255,255,255,0.4);font-weight:400;"> / 7</span></p>
      </div>
      <div style="display:table-cell;vertical-align:middle;text-align:right;">
        <span style="background:${ritualColor};border-radius:10px;padding:7px 14px;font-size:13px;font-weight:700;color:#fff;">${ritualLabel}</span>
      </div>
    </div>

    <div style="background:#f4f4f7;border-radius:14px;padding:20px 24px;margin-bottom:14px;">
      ${data.avgEnergy !== null ? score('Gemiddelde energie', Math.round(data.avgEnergy * 10) / 10) : ''}
      ${data.avgSleep !== null ? score('Gemiddelde slaap', Math.round(data.avgSleep * 10) / 10) : ''}
      <div style="display:table;width:100%;margin-top:12px;">
        <div style="display:table-cell;text-align:center;">
          <p style="margin:0;font-size:11px;color:#8a8a9a;text-transform:uppercase;letter-spacing:0.08em;">Focus blokken</p>
          <p style="margin:4px 0 0;font-size:26px;font-weight:700;color:#0a0a14;">${data.focusBlokkengepland}</p>
          <p style="margin:0;font-size:11px;color:#8a8a9a;">gepland</p>
        </div>
        <div style="display:table-cell;text-align:center;">
          <p style="margin:0;font-size:11px;color:#8a8a9a;text-transform:uppercase;letter-spacing:0.08em;">Wins</p>
          <p style="margin:4px 0 0;font-size:26px;font-weight:700;color:#0a0a14;">${data.wins.length}</p>
          <p style="margin:0;font-size:11px;color:#8a8a9a;">gelogd</p>
        </div>
      </div>
    </div>

    ${data.wins.length > 0 ? `
    <div style="background:#f4f4f7;border-radius:14px;padding:20px 24px;margin-bottom:14px;">
      <p style="margin:0 0 12px;font-size:11px;color:#8a8a9a;text-transform:uppercase;letter-spacing:0.1em;font-weight:600;">Wins deze week</p>
      ${winsHtml}
    </div>` : ''}

    ${data.topFocusBlokken.length > 0 ? `
    <div style="background:#f4f4f7;border-radius:14px;padding:20px 24px;margin-bottom:14px;">
      <p style="margin:0 0 12px;font-size:11px;color:#8a8a9a;text-transform:uppercase;letter-spacing:0.1em;font-weight:600;">Focusblokken deze week</p>
      ${focusHtml}
    </div>` : ''}

    <div style="background:#0a0a14;border-radius:14px;padding:24px;margin-bottom:16px;">
      <p style="margin:0 0 12px;font-size:11px;color:#00cc66;text-transform:uppercase;letter-spacing:0.1em;font-weight:600;">AI Week Coaching</p>
      <div style="font-size:14px;color:#e8e8ec;line-height:1.8;">${data.aiSamenvatting.replace(/\n/g, '<br/>')}</div>
    </div>

    <div style="text-align:center;">${btn('Open mijn app →', appUrl)}</div>
  `;

  return { subject, html: base(`Weekrapport ${data.weekStart}–${data.weekEnd}`, subject, body) };
}

// ─── Template 6: ADHD Rapport ─────────────────────────────────────────────────

export interface AdhdRapportData {
  weekNr: 1 | 2;
  weekStart: string;
  weekEnd: string;
  loggedDays: number;
  avgDagScore: number;
  maxScore: number;
  symptomAvgs: Record<string, number>;
  top5: string[];
  week1AvgDagScore?: number;
  week1SymptomAvgs?: Record<string, number>;
}

function adhdColor(avg: number): string {
  if (avg < 0.5) return '#00cc66';
  if (avg < 1.5) return '#f59e0b';
  if (avg < 2.5) return '#f97316';
  return '#ef4444';
}

function adhdLabel(avg: number): string {
  if (avg < 0.5) return 'geen last';
  if (avg < 1.5) return 'zo nu en dan';
  if (avg < 2.5) return 'duidelijk/vaak';
  return 'continu';
}

export function adhdRapportEmail(data: AdhdRapportData, appUrl: string): { subject: string; html: string } {
  const subject = `🧠 ADHD Meting Week ${data.weekNr} — ${data.weekStart} t/m ${data.weekEnd}`;

  const symptoms = Object.keys(data.symptomAvgs);
  const scorePercent = data.maxScore > 0 ? Math.round((data.avgDagScore / data.maxScore) * 100) : 0;
  const scoreColor = scorePercent < 25 ? '#00cc66' : scorePercent < 50 ? '#f59e0b' : scorePercent < 75 ? '#f97316' : '#ef4444';

  const symptomRows = symptoms.map(s => {
    const avg = data.symptomAvgs[s];
    const pct = Math.round((avg / 3) * 100);
    const col = adhdColor(avg);
    const w1avg = data.week1SymptomAvgs?.[s];
    const diff = w1avg !== undefined ? avg - w1avg : null;
    const diffHtml = diff !== null
      ? `<span style="font-size:11px;color:${diff < -0.1 ? '#00cc66' : diff > 0.1 ? '#ef4444' : '#8a8a9a'};margin-left:8px;">${diff > 0 ? '▲' : diff < 0 ? '▼' : '='} ${Math.abs(diff).toFixed(1)}</span>`
      : '';
    return `<tr>
      <td style="padding:5px 0;font-size:12px;color:#0a0a14;width:140px;vertical-align:middle;">${s}</td>
      <td style="padding:5px 8px;vertical-align:middle;">
        <div style="background:#f4f4f7;border-radius:999px;height:5px;width:120px;">
          <div style="background:${col};border-radius:999px;height:5px;width:${pct}%;"></div>
        </div>
      </td>
      <td style="padding:5px 0;font-size:12px;font-weight:700;color:${col};width:28px;text-align:right;vertical-align:middle;">${avg.toFixed(1)}</td>
      <td style="padding:5px 0;font-size:11px;color:#8a8a9a;padding-left:8px;vertical-align:middle;">${adhdLabel(avg)}${diffHtml}</td>
    </tr>`;
  }).join('');

  const top5Html = data.top5.map((s, i) => {
    const avg = data.symptomAvgs[s];
    return `<div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
      <span style="width:20px;height:20px;border-radius:50%;background:#f4f4f7;font-size:10px;font-weight:700;color:#8a8a9a;display:flex;align-items:center;justify-content:center;flex-shrink:0;">${i + 1}</span>
      <span style="font-size:13px;color:#0a0a14;flex:1;">${s}</span>
      <span style="font-size:12px;font-weight:700;color:${adhdColor(avg)};">${avg.toFixed(1)}</span>
    </div>`;
  }).join('');

  const vergelijkingHtml = data.weekNr === 2 && data.week1AvgDagScore !== undefined ? `
    <div style="background:#f4f4f7;border-radius:14px;padding:20px 24px;margin-bottom:14px;">
      <p style="margin:0 0 12px;font-size:11px;color:#8a8a9a;text-transform:uppercase;letter-spacing:0.1em;font-weight:600;">Week 1 vs Week 2</p>
      <div style="display:table;width:100%;">
        <div style="display:table-cell;text-align:center;">
          <p style="margin:0;font-size:11px;color:#8a8a9a;">Week 1 gemiddeld</p>
          <p style="margin:4px 0 0;font-size:24px;font-weight:700;color:#0a0a14;">${data.week1AvgDagScore.toFixed(1)}<span style="font-size:12px;color:#8a8a9a;">/${data.maxScore}</span></p>
        </div>
        <div style="display:table-cell;text-align:center;">
          <p style="margin:0;font-size:11px;color:#8a8a9a;">Week 2 gemiddeld</p>
          <p style="margin:4px 0 0;font-size:24px;font-weight:700;color:#0a0a14;">${data.avgDagScore.toFixed(1)}<span style="font-size:12px;color:#8a8a9a;">/${data.maxScore}</span></p>
        </div>
        <div style="display:table-cell;text-align:center;">
          <p style="margin:0;font-size:11px;color:#8a8a9a;">Verschil</p>
          ${(() => {
            const d = data.avgDagScore - data.week1AvgDagScore!;
            const col = d < -1 ? '#00cc66' : d > 1 ? '#ef4444' : '#8a8a9a';
            return `<p style="margin:4px 0 0;font-size:24px;font-weight:700;color:${col};">${d > 0 ? '+' : ''}${d.toFixed(1)}</p>`;
          })()}
        </div>
      </div>
    </div>
  ` : '';

  const body = `
    <p style="font-size:17px;font-weight:600;color:#0a0a14;margin:0 0 6px;">ADHD Klachten Meting — Week ${data.weekNr}</p>
    <p style="font-size:14px;color:#5a5a6a;line-height:1.7;margin:0 0 22px;">Periode: <strong>${data.weekStart} t/m ${data.weekEnd}</strong> · ${data.loggedDays} van 7 dagen gelogd${data.weekNr === 2 ? ' · Eindmeting voor Ritalin start' : ' · Nulmeting'}</p>

    <div style="background:#0a0a14;border-radius:14px;padding:20px 24px;margin-bottom:14px;display:table;width:100%;box-sizing:border-box;">
      <div style="display:table-cell;vertical-align:middle;">
        <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.4);text-transform:uppercase;letter-spacing:0.1em;">Gemiddelde dagscore</p>
        <p style="margin:4px 0 0;font-size:32px;font-weight:700;color:#fff;line-height:1;">${data.avgDagScore.toFixed(1)}<span style="font-size:16px;color:rgba(255,255,255,0.4);font-weight:400;"> / ${data.maxScore}</span></p>
      </div>
      <div style="display:table-cell;vertical-align:middle;text-align:right;">
        <span style="background:${scoreColor};border-radius:10px;padding:7px 14px;font-size:13px;font-weight:700;color:#fff;">${scorePercent}%</span>
      </div>
    </div>

    ${vergelijkingHtml}

    <div style="background:#f4f4f7;border-radius:14px;padding:20px 24px;margin-bottom:14px;">
      <p style="margin:0 0 12px;font-size:11px;color:#8a8a9a;text-transform:uppercase;letter-spacing:0.1em;font-weight:600;">Top 5 zwaarste klachten</p>
      ${top5Html}
    </div>

    <div style="background:#f4f4f7;border-radius:14px;padding:20px 24px;margin-bottom:14px;">
      <p style="margin:0 0 14px;font-size:11px;color:#8a8a9a;text-transform:uppercase;letter-spacing:0.1em;font-weight:600;">Alle klachten — gemiddelde score (0–3)</p>
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        ${symptomRows}
      </table>
      <p style="margin:12px 0 0;font-size:11px;color:#8a8a9a;">Schaal: 0 = geen last &nbsp;·&nbsp; 1 = zo nu en dan &nbsp;·&nbsp; 2 = duidelijk/vaak &nbsp;·&nbsp; 3 = continu</p>
    </div>

    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:14px;padding:20px 24px;margin-bottom:16px;">
      <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:#065f46;">📋 Neem dit mee naar je afspraak</p>
      <p style="margin:0;font-size:13px;color:#047857;line-height:1.6;">Dit is jouw ${data.weekNr === 1 ? 'nulmeting vóór' : 'eindmeting na'} de meetperiode. Je kunt deze e-mail doorsturen naar je psychiater als referentie voor de medicatiedosering.</p>
    </div>

    <div style="text-align:center;">${btn('Bekijk ADHD pagina →', `${appUrl}/adhd`)}</div>
  `;

  return { subject, html: base(`ADHD Meting Week ${data.weekNr} — ${data.weekStart}–${data.weekEnd}`, subject, body) };
}

// ─── Template 4: Wachtwoord reset ────────────────────────────────────────────

export function resetWachtwoordEmail(resetUrl: string): { subject: string; html: string } {
  const subject = '🔑 Wachtwoord resetten — Mijn Ondernemers OS';

  const body = `
    <p style="font-size:17px;font-weight:600;color:#0a0a14;margin:0 0 8px;">Wachtwoord vergeten?</p>
    <p style="font-size:14px;color:#5a5a6a;line-height:1.7;margin:0 0 24px;">
      Geen probleem. Klik op de knop hieronder om een nieuw wachtwoord in te stellen.
      Deze link is <strong>1 uur</strong> geldig.
    </p>

    <div style="text-align:center;margin-bottom:28px;">
      ${btn('Nieuw wachtwoord instellen →', resetUrl)}
    </div>

    <div style="background:#f4f4f7;border-radius:12px;padding:16px 20px;">
      <p style="margin:0;font-size:12px;color:#8a8a9a;line-height:1.6;">
        Heb jij dit niet aangevraagd? Dan kun je deze e-mail veilig negeren.
        Je wachtwoord blijft ongewijzigd.
      </p>
    </div>
  `;

  return { subject, html: base('Wachtwoord resetten', subject, body) };
}
