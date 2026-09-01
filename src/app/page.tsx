'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import {
  ArrowRight, ChevronDown, Check, Plus, Minus,
  Sunrise, Target, Shield, Timer, Trophy, RefreshCw,
} from 'lucide-react';

/* ─── Data ─────────────────────────────────────────────────── */
const FAQS = [
  {
    q: 'Wat maakt myAiPA anders dan apps zoals Todoist of Notion?',
    a: 'Klassieke tools stimuleren je om méér taken af te vinken, wat vaak leidt tot extra stress. myAiPA fungeert als een executive filter: het dwingt je om minder, maar de juiste dingen te doen en bewaakt actief je grenzen en hersteltijd.',
  },
  {
    q: 'Hoeveel tijd kost myAiPA me per dag?',
    a: "Slechts circa 5 minuten in de ochtend voor de briefing en 5 minuten 's avonds voor de afronding. Het is ontworpen om je wekelijks uren aan zoektijd, twijfel en operationele ruis te besparen.",
  },
  {
    q: 'Kan ik starten met alleen de app?',
    a: 'Ja. Je kunt direct instappen met het maandabonnement (€29/mnd). Wil je een vliegende start en je strategische doelen direct messcherp neerzetten? Dan adviseren we het complete myAiPA Traject inclusief de 3-urige intake.',
  },
  {
    q: 'Werkt myAiPA op zowel desktop als mobiel?',
    a: 'Ja, myAiPA is een geavanceerde Progressive Web App (PWA) die naadloos synchroniseert tussen je iPhone, Android, tablet en computer.',
  },
];

const FEATURES = [
  {
    Icon: Sunrise,
    title: 'Ochtend-Priming & Focus',
    desc: 'Begin de dag in 3 minuten met rust. Visualiseer je belangrijkste winst, centreer je gedachten en start vanuit kalm leiderschap voordat de buitenwereld aan je trekt.',
  },
  {
    Icon: Target,
    title: "Het 'Gouden Ei' & Micro-Acties",
    desc: 'Sloop uitstelgedrag. De app kiest jouw belangrijkste prioriteit en splitst complexe taken direct op in behapbare stapjes van 2 tot 5 minuten.',
  },
  {
    Icon: Shield,
    title: 'Smart Boundary Shielding',
    desc: 'Bescherm je kostbare tijd. Krijg met één klik professionele, vriendelijke templates om niet-urgente verzoeken en vrijblijvende meetings beleefd af te wijzen.',
  },
  {
    Icon: Trophy,
    title: 'Wall of Wins & Energie-Check',
    desc: "Houd je cognitieve batterij bij en log overwinningen op het gebied van Business, Gezondheid en Persoonlijke Groei. Zodat je 's avonds met een gerust hart de werkdag afsluit.",
  },
  {
    Icon: Timer,
    title: 'Micro-Acties in Focusblokken',
    desc: 'Werk gestructureerd aan je Gouden Ei met korte, behapbare focussessies — zo bouw je elke dag zichtbare voortgang op je belangrijkste doel.',
  },
  {
    Icon: RefreshCw,
    title: 'Strategische Spiegel',
    desc: 'Optionele maandelijkse check-in om te reflecteren op je energielekken, doelen bij te sturen en scherp te blijven op wat echt waarde oplevert.',
  },
];

const TESTIMONIALS = [
  {
    quote: 'Na drie weken myAiPA had ik voor het eerst in jaren echt helderheid over mijn prioriteiten. De intake was een eye-opener — de app houdt me dagelijks scherp zonder me te overweldigen.',
    name: 'Directeur-eigenaar',
    role: 'Marketing & Strategiebureau',
  },
  {
    quote: 'Ik gebruikte Notion, Todoist en twee meditatie-apps door elkaar. Met myAiPA zit alles op één plek. Ik begin elke ochtend met rust en focus.',
    name: 'Oprichter',
    role: 'Consultancybureau',
  },
  {
    quote: 'De micro-stapjes en de Wall of Wins haalden direct de druk van de ketel. Ik werk minder gehaast, maar krijg structureel meer van de juiste dingen af.',
    name: "Zzp'er & Trainer",
    role: 'Coaching',
  },
];

/* ─── FAQ accordion ─────────────────────────────────────────── */
function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-line last:border-b-0">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between gap-4 py-5 text-left group"
      >
        <span className="text-[15px] font-semibold text-ink leading-snug">{q}</span>
        <span className="shrink-0 w-7 h-7 rounded-full border border-line group-hover:border-ink flex items-center justify-center text-ink-soft transition-colors">
          {open ? <Minus size={12} /> : <Plus size={12} />}
        </span>
      </button>
      {open && (
        <p className="text-[14px] text-ink-soft leading-relaxed pb-5 pr-10">
          {a}
        </p>
      )}
    </div>
  );
}

/* ─── Star rating ────────────────────────────────────────────── */
function Stars() {
  return (
    <div className="flex gap-1 mb-5 text-tertiary">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
          <path d="M6 0l1.5 4h4l-3.2 2.4 1.2 3.9L6 8.1l-3.5 2.2 1.2-3.9L.5 4h4z" />
        </svg>
      ))}
    </div>
  );
}

/* ─── Logo ───────────────────────────────────────────────────── */
function Logo({ size = 28 }: { size?: number }) {
  return (
    <Image
      src="/logo.png"
      alt="myAiPA logo"
      width={size}
      height={size}
      className="rounded-[6px]"
      priority
    />
  );
}

/* ─── Page ───────────────────────────────────────────────────── */
export default function SalesPage() {
  return (
    <div className="min-h-screen bg-white text-ink font-sans">

      {/* ══ NAV ═════════════════════════════════════════════════ */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-line">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Logo size={28} />
            <span className="text-[16px] font-bold tracking-tight">myAiPA</span>
          </div>

          <div className="hidden md:flex items-center gap-7">
            {[
              { label: 'Hoe het werkt', href: '#hoe-het-werkt' },
              { label: 'De app',        href: '#features'      },
              { label: 'Aanbod',        href: '#aanbod'        },
            ].map(({ label, href }) => (
              <a key={href} href={href} className="text-[13px] text-ink-soft hover:text-ink transition-colors font-medium">
                {label}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/auth/login"
              className="inline-flex items-center px-4 py-2 rounded-full text-[13px] font-semibold text-ink-soft hover:text-ink transition-colors"
            >
              Inloggen
            </Link>
            <Link
              href="/auth/register"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-surface-inverse text-white text-[13px] font-semibold hover:bg-surface-inverse transition-colors"
            >
              Gratis kennismaking
              <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      </nav>

      {/* ══ HERO ════════════════════════════════════════════════ */}
      <section className="max-w-5xl mx-auto px-6 pt-20 pb-24 text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-line mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block" />
          <span className="text-[11px] font-semibold text-ink-soft tracking-wide">
            Voor ondernemers, directeuren en impactmakers die niet langer geleefd willen worden door hun agenda
          </span>
        </div>

        <h1 className="text-[52px] sm:text-[72px] font-bold leading-[1.0] tracking-[-0.03em] mb-6">
          Stop met<br />
          <span className="text-on-surface-inverse/50">overleven.</span><br />
          Leid je bedrijf met<br />
          <span className="text-primary">rust en focus.</span>
        </h1>

        <p className="text-[16px] sm:text-[18px] text-ink-soft max-w-xl mx-auto leading-relaxed mb-10">
          myAiPA is jouw persoonlijke Executive AI-Assistant &amp; Mindset Copiloot. Eén intelligent systeem voor wie je bent, wat je doelen zijn en hoe je je agenda beschermt — elke dag in slechts 10 minuten.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/auth/register"
            className="group inline-flex items-center gap-2 px-8 py-4 rounded-full bg-primary text-white font-bold text-[15px] shadow-[0_4px_24px_rgba(81,96,80,0.35)] hover:bg-primary active:scale-[0.98] transition-all"
          >
            Boek een gratis kennismaking (20 min)
            <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
          </Link>
          <a
            href="#hoe-het-werkt"
            className="inline-flex items-center gap-2 text-[14px] text-ink-soft font-medium hover:text-ink transition-colors"
          >
            Bekijk hoe myAiPA werkt
            <ChevronDown size={15} />
          </a>
        </div>
      </section>

      {/* ══ SOCIAL PROOF STRIP ══════════════════════════════════ */}
      <div className="border-y border-line bg-surface-card">
        <div className="max-w-5xl mx-auto px-6 py-5 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-10 text-center">
          <p className="text-[12px] text-ink-soft font-medium">
            Dagelijks gebruikt door ambitieuze leiders.
          </p>
          <div className="w-px h-4 bg-line hidden sm:block" />
          <p className="text-[12px] text-ink-soft font-medium">
            Geïnspireerd op beproefde methodes voor high-performance priming, OKR-doelstructuren en executive agendashielding.
          </p>
        </div>
      </div>

      {/* ══ PROBLEEM ════════════════════════════════════════════ */}
      <section className="max-w-5xl mx-auto px-6 py-24">
        <div className="max-w-xl mb-14">
          <p className="text-[11px] font-bold text-primary uppercase tracking-[0.18em] mb-3">Waarom je nu vastloopt</p>
          <h2 className="text-[36px] sm:text-[44px] font-bold leading-[1.1] tracking-tight">
            Je hebt geen gebrek aan motivatie. Je mist een systeem dat je beschermt.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            {
              n: '01',
              title: 'Brandjes blussen in plaats van bouwen',
              desc: 'Je begint de dag met grote ambities, maar om 10:00 uur regeert je inbox. Je werkt hard in je bedrijf, maar komt niet toe aan strategisch bouwen áán je toekomst.',
            },
            {
              n: '02',
              title: "De 'Altijd Aan' vermoeidheid",
              desc: 'Talloze open tabbladen in je hoofd, piekeren over deadlines in het weekend en een overvolle agenda met afspraken waar je eigenlijk ‘nee’ tegen had moeten zeggen.',
            },
            {
              n: '03',
              title: 'De app-jungle zonder overzicht',
              desc: 'Je schakelt tussen Notion, Todoist, een papieren notitieboek en een meditatie-app. Losse tools die meer tijd kosten om bij te houden dan ze daadwerkelijk opleveren.',
            },
          ].map(({ n, title, desc }) => (
            <div key={n} className="rounded-[20px] border border-line p-7">
              <span className="text-[12px] font-bold text-line tracking-widest tabular-nums">{n}</span>
              <h3 className="text-[17px] font-bold text-ink mt-4 mb-2.5 leading-snug">{title}</h3>
              <p className="text-[13px] text-ink-soft leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ══ HOE HET WERKT ═══════════════════════════════════════ */}
      <section id="hoe-het-werkt" className="bg-surface-card py-24">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-14">
            <p className="text-[11px] font-bold text-primary uppercase tracking-[0.18em] mb-3">Drie stappen</p>
            <h2 className="text-[36px] sm:text-[44px] font-bold leading-[1.1] tracking-tight max-w-xl mx-auto">
              Van operationele chaos naar structurele rust
            </h2>
            <p className="text-[15px] text-ink-soft mt-4 max-w-md mx-auto leading-relaxed">
              myAiPA werkt niet als een app die je erbij pakt. Het wordt jouw dagelijkse copiloot — van strategisch fundament tot dagelijkse micro-actie.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              {
                n: '01',
                title: 'De Strategische Intake',
                sub: 'LSP Kick-off',
                meta: '3 uur · persoonlijk',
                desc: 'We starten met een diepe fundament-sessie (o.a. met LEGO® Serious Play). Je brengt je kernwaarden, visie en grootste knelpunten in kaart. Dit vormt de blauwdruk voor jouw persoonlijke AI-copiloot.',
                dark: true,
              },
              {
                n: '02',
                title: 'Jouw Dagelijkse Copiloot',
                sub: 'De app',
                meta: 'Dagelijks · 10 minuten',
                desc: 'myAiPA leeft op je telefoon en desktop. Elke ochtend helpt de wizard je focussen op maximaal 1 strategisch hoofddoel en breekt grote projecten op in behapbare micro-acties.',
                dark: false,
                accent: true,
              },
              {
                n: '03',
                title: 'Strategische Spiegel',
                sub: 'Optioneel',
                meta: 'Maandelijks · check-in',
                desc: 'Optionele 1-op-1 coaching om te reflecteren op je energielekken, doelen bij te sturen en scherp te blijven op wat echt maatschappelijke en zakelijke waarde oplevert.',
                dark: false,
                warm: true,
              },
            ].map(({ n, title, sub, meta, desc, dark, accent, warm }) => (
              <div
                key={n}
                className={`rounded-[20px] p-7 border ${
                  dark
                    ? 'bg-surface-inverse border-transparent'
                    : accent
                    ? 'bg-primary-muted border-primary-light'
                    : warm
                    ? 'bg-tertiary-soft border-tertiary/20'
                    : 'bg-white border-line'
                }`}
              >
                <div className="flex items-center justify-between mb-7">
                  <span className={`text-[11px] font-bold tracking-widest tabular-nums ${dark ? 'text-[#ffffff20]' : 'text-line'}`}>
                    {n}
                  </span>
                  <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ${
                    dark ? 'bg-white/10 text-ink-soft' : warm ? 'bg-white/60 text-tertiary' : 'bg-line text-ink-soft'
                  }`}>
                    {meta}
                  </span>
                </div>
                <h3 className={`text-[20px] font-bold leading-tight mb-1 ${dark ? 'text-white' : 'text-ink'}`}>
                  {title}
                </h3>
                <p className={`text-[11px] font-bold uppercase tracking-widest mb-4 ${warm ? 'text-tertiary' : 'text-primary'}`}>{sub}</p>
                <p className={`text-[13px] leading-relaxed ${dark ? 'text-ink-soft' : 'text-ink-soft'}`}>
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ FEATURES ════════════════════════════════════════════ */}
      <section id="features" className="max-w-5xl mx-auto px-6 py-24">
        <div className="text-center mb-14">
          <p className="text-[11px] font-bold text-primary uppercase tracking-[0.18em] mb-3">De myAiPA app</p>
          <h2 className="text-[36px] sm:text-[44px] font-bold leading-[1.1] tracking-tight">
            Geen eindeloze to-do-lijst, maar jouw operationele filter
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map(({ Icon, title, desc }, i) => {
            const tone = [
              { bg: 'bg-primary', ring: 'hover:border-primary-light' },
              { bg: 'bg-accent', ring: 'hover:border-accent-soft' },
              { bg: 'bg-tertiary', ring: 'hover:border-tertiary-soft' },
            ][i % 3];
            return (
              <div
                key={title}
                className={`rounded-[20px] border border-line p-7 hover:shadow-[0_4px_24px_rgba(0,0,0,0.06)] transition-all ${tone.ring}`}
              >
                <div className={`w-9 h-9 rounded-[10px] ${tone.bg} flex items-center justify-center mb-5`}>
                  <Icon size={17} className="text-white" strokeWidth={1.8} />
                </div>
                <h3 className="text-[15px] font-bold text-ink mb-2">{title}</h3>
                <p className="text-[13px] text-ink-soft leading-relaxed">{desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ══ FOUNDER ═════════════════════════════════════════════ */}
      <section className="bg-surface-inverse py-24">
        <div className="max-w-3xl mx-auto px-6">
          <p className="text-[11px] font-bold text-primary uppercase tracking-[0.18em] mb-8">Van de oprichter</p>

          <blockquote className="text-[22px] sm:text-[28px] font-bold text-white leading-[1.4] mb-10">
            &ldquo;Ik bouwde myAiPA omdat ik het zelf nodig had.&rdquo;
          </blockquote>

          <p className="text-[15px] text-ink-soft leading-relaxed mb-10 max-w-2xl">
            Als sociaal ondernemer en directeur bij meerdere organisaties verdronk ik in de operationele ruis van zeven losse apps. Ik wilde één rustig systeem dat mijn agenda bewaakt, mijn doelen scherp houdt en me helpt ontspannen.
            <br /><br />
            Vandaag is myAiPA mijn eerste handeling in de ochtend en mijn laatste in de avond. Het heeft mijn focus, energie en tijdwinst fundamenteel veranderd. Diezelfde rust en slagkracht gun ik jou.
          </p>

          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-full bg-white flex items-center justify-center overflow-hidden border border-[#2a2a34]">
              <Logo size={30} />
            </div>
            <div>
              <p className="text-[14px] font-bold text-white">Vincent van Munster</p>
              <p className="text-[12px] text-on-surface-inverse/50 mt-0.5">Oprichter myAiPA · Sociaal ondernemer</p>
            </div>
          </div>
        </div>
      </section>

      {/* ══ PRICING ═════════════════════════════════════════════ */}
      <section id="aanbod" className="max-w-5xl mx-auto px-6 py-24">
        <div className="text-center mb-14">
          <p className="text-[11px] font-bold text-primary uppercase tracking-[0.18em] mb-3">Het aanbod &amp; tarieven</p>
          <h2 className="text-[36px] sm:text-[44px] font-bold leading-[1.1] tracking-tight">
            Kies jouw niveau van regie en ondersteuning
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">

          {/* Starter */}
          <div className="rounded-[20px] border border-line p-7">
            <p className="text-[10px] font-bold text-ink-soft uppercase tracking-[0.18em] mb-4">Starter (App Only)</p>
            <h3 className="text-[17px] font-bold text-ink mb-1">Voor de zelfstandige bouwer</h3>
            <div className="flex items-baseline gap-1.5 mb-7 mt-3">
              <span className="text-[40px] font-bold text-ink leading-none tracking-tight">€29</span>
              <span className="text-[12px] text-ink-soft">/ maand<br />opzegbaar</span>
            </div>
            <div className="space-y-3 mb-7">
              {[
                'Volledige toegang tot de myAiPA app',
                'Ochtend- & avondrituelen',
                'Focus- & habit-tracking',
                'Wall of Wins & offline modus (PWA)',
                "Slimme 'Nee-zeg' templates",
              ].map(f => (
                <div key={f} className="flex items-center gap-2.5">
                  <Check size={13} className="text-primary shrink-0" strokeWidth={2.5} />
                  <span className="text-[13px] text-ink">{f}</span>
                </div>
              ))}
            </div>
            <Link
              href="/auth/register"
              className="block text-center py-3.5 rounded-[14px] border border-ink text-ink font-semibold text-[14px] hover:bg-surface-inverse hover:text-white transition-colors"
            >
              Start met myAiPA
            </Link>
          </div>

          {/* Traject — recommended */}
          <div className="rounded-[20px] bg-surface-inverse p-7 relative md:-mt-4 md:pb-11 md:pt-11">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3.5 py-1 rounded-full bg-primary text-white text-[9px] font-bold uppercase tracking-[0.18em] whitespace-nowrap">
              Meest gekozen
            </div>
            <p className="text-[10px] font-bold text-on-surface-inverse/50 uppercase tracking-[0.18em] mb-4">myAiPA Traject</p>
            <h3 className="text-[17px] font-bold text-white mb-1">Voor de structurele doorbraak</h3>
            <div className="flex items-baseline gap-1.5 mb-7 mt-3">
              <span className="text-[40px] font-bold text-white leading-none tracking-tight">€1.497</span>
              <span className="text-[12px] text-on-surface-inverse/50">eenmalig<br />incl. 3 mnd app</span>
            </div>
            <div className="space-y-3 mb-7">
              {[
                '3 uur LSP Kick-off & Intake',
                'Persoonlijke inrichting van jouw systeem',
                '3 maanden volledige app-toegang',
                '2× 1-op-1 coaching sessies (1 uur)',
                'Directe WhatsApp hulplijn voor support',
              ].map(f => (
                <div key={f} className="flex items-center gap-2.5">
                  <Check size={13} className="text-primary shrink-0" strokeWidth={2.5} />
                  <span className="text-[13px] text-white">{f}</span>
                </div>
              ))}
            </div>
            <Link
              href="/auth/register"
              className="block text-center py-3.5 rounded-[14px] bg-primary text-white font-bold text-[14px] shadow-[0_4px_16px_rgba(81,96,80,0.3)] hover:bg-primary transition-colors"
            >
              Boek jouw traject
            </Link>
          </div>

          {/* Executive & Team */}
          <div className="rounded-[20px] border border-line p-7">
            <p className="text-[10px] font-bold text-ink-soft uppercase tracking-[0.18em] mb-4">Executive &amp; Team</p>
            <h3 className="text-[17px] font-bold text-ink mb-1">Voor directies en impact-teams</h3>
            <div className="flex items-baseline gap-1.5 mb-7 mt-3">
              <span className="text-[40px] font-bold text-ink leading-none tracking-tight">€2.950</span>
              <span className="text-[12px] text-ink-soft">/ kwartaal<br />max. 6 leiders</span>
            </div>
            <div className="space-y-3 mb-7">
              {[
                'Alles uit het Traject',
                'Maandelijkse live strategiesessie',
                'Team capaciteits- en agendabewaking',
                'Wekelijkse accountability & feedback',
                'Directe prioriteitssupport',
              ].map(f => (
                <div key={f} className="flex items-center gap-2.5">
                  <Check size={13} className="text-primary shrink-0" strokeWidth={2.5} />
                  <span className="text-[13px] text-ink">{f}</span>
                </div>
              ))}
            </div>
            <Link
              href="/auth/register"
              className="block text-center py-3.5 rounded-[14px] border border-ink text-ink font-semibold text-[14px] hover:bg-surface-inverse hover:text-white transition-colors"
            >
              Vraag beschikbaarheid aan
            </Link>
          </div>
        </div>
      </section>

      {/* ══ TESTIMONIALS ════════════════════════════════════════ */}
      <section className="bg-surface-card py-24">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-14">
            <p className="text-[11px] font-bold text-primary uppercase tracking-[0.18em] mb-3">Ervaringen</p>
            <h2 className="text-[36px] font-bold tracking-tight">Ervaringen van ondernemers</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {TESTIMONIALS.map(({ quote, name, role }) => (
              <div key={name} className="rounded-[20px] bg-white border border-line p-7">
                <Stars />
                <p className="text-[14px] text-ink leading-relaxed mb-6 font-medium">
                  &ldquo;{quote}&rdquo;
                </p>
                <div className="border-t border-line pt-5">
                  <p className="text-[13px] font-bold text-ink">{name}</p>
                  <p className="text-[12px] text-ink-soft mt-0.5">{role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ FAQ ═════════════════════════════════════════════════ */}
      <section className="max-w-3xl mx-auto px-6 py-24">
        <div className="text-center mb-14">
          <p className="text-[11px] font-bold text-primary uppercase tracking-[0.18em] mb-3">FAQ</p>
          <h2 className="text-[36px] font-bold tracking-tight">Veelgestelde vragen</h2>
        </div>

        <div className="rounded-[20px] border border-line px-7">
          {FAQS.map(faq => (
            <FaqItem key={faq.q} {...faq} />
          ))}
        </div>
      </section>

      {/* ══ FINAL CTA ═══════════════════════════════════════════ */}
      <section className="max-w-5xl mx-auto px-6 pb-24">
        <div className="rounded-[24px] bg-surface-inverse px-8 sm:px-14 py-16 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/8 border border-white/10 mb-7">
            <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block live-dot" />
            <span className="text-[10px] font-bold text-primary uppercase tracking-[0.18em]">Klaar voor meer rust en leiderschap?</span>
          </div>

          <h2 className="text-[36px] sm:text-[48px] font-bold text-white leading-[1.1] tracking-tight mb-4">
            Start vandaag met jouw persoonlijke copiloot
          </h2>
          <p className="text-[15px] text-ink-soft max-w-md mx-auto mb-10 leading-relaxed">
            Plan een vrijblijvend adviesgesprek van 20 minuten om te ontdekken wat myAiPA voor jouw werkdag doet.
          </p>

          <Link
            href="/auth/register"
            className="group inline-flex items-center gap-2 px-8 py-4 rounded-full bg-primary text-white font-bold text-[15px] shadow-[0_4px_24px_rgba(81,96,80,0.35)] hover:bg-primary active:scale-[0.98] transition-all"
          >
            Boek jouw gratis kennismaking
            <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
          </Link>

          <p className="text-[12px] text-on-surface-inverse/50 mt-6">
            Of neem direct contact op:{' '}
            <a href="mailto:v.munster@weareimpact.nl" className="text-ink-soft hover:text-white transition-colors underline underline-offset-2">
              v.munster@weareimpact.nl
            </a>
            {' '}· 06-14470977
          </p>
        </div>
      </section>

      {/* ══ FOOTER ══════════════════════════════════════════════ */}
      <footer className="border-t border-line py-8">
        <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Logo size={24} />
            <span className="text-[13px] font-bold">myAiPA</span>
            <span className="text-[12px] text-on-surface-inverse/50">·</span>
            <span className="text-[12px] text-ink-soft">Een initiatief van WeAreImpact · Vincent van Munster</span>
          </div>
          <a
            href="mailto:v.munster@weareimpact.nl"
            className="text-[12px] text-ink-soft hover:text-ink transition-colors"
          >
            v.munster@weareimpact.nl
          </a>
        </div>
      </footer>
    </div>
  );
}
