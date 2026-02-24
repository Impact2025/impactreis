'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  ArrowRight, ChevronDown, Check, Plus, Minus,
  Sunrise, Target, Shield, Timer, Trophy, RefreshCw,
} from 'lucide-react';

/* ─── Data ─────────────────────────────────────────────────── */
const FAQS = [
  {
    q: 'Is OSflow een gewone productiviteitsapp?',
    a: 'Nee. OSflow is een persoonlijk operating system — het combineert identiteitswerk, mindset, doelen en dagelijkse rituelen in één systeem. Het is niet bedoeld als takenlijst, maar als fundament voor wie jij bent als ondernemer.',
  },
  {
    q: 'Hoeveel tijd kost het per dag?',
    a: 'Het ochtend- en avondritueel samen kosten 10–15 minuten. De rest — doelen bijhouden, focus-sessies, wins loggen — doe je op het moment zelf. De app past in jouw dag, niet andersom.',
  },
  {
    q: 'Wat is een LSP-sessie en moet ik LEGO hebben?',
    a: 'LEGO® Serious Play is een bewezen facilitatiemethode waarbij je bouwen gebruikt om inzichten te creëren die in een gesprek niet naar boven komen. Wij verzorgen het materiaal. Jij hoeft niets mee te nemen — alleen openheid en ambitie.',
  },
  {
    q: 'Werkt OSflow ook op mijn telefoon?',
    a: 'Ja. OSflow is een Progressive Web App — dat betekent dat het werkt op desktop, tablet én telefoon, en ook offline beschikbaar is. Je voegt het toe aan je beginscherm als een normale app.',
  },
  {
    q: 'Kan ik beginnen met alleen de app zonder traject?',
    a: 'Ja. Via de Starter-optie heb je directe toegang tot de volledige app voor €29 per maand. Het OS Traject geeft je een krachtigere start met de LSP-sessie als fundament, maar de app werkt ook zelfstandig.',
  },
  {
    q: 'Wat maakt OSflow anders dan een coach?',
    a: "Een coach zie je een keer per maand. OSflow is er elke dag — in de ochtend als je start en 's avonds als je afsluit. De menselijke begeleiding via het traject is er om het systeem te activeren; de app houdt het levend.",
  },
];

const FEATURES = [
  {
    Icon: Sunrise,
    title: 'Ochtend & Avond Ritueel',
    desc: "Begin elke dag met intentie. Een begeleide wizard met ademhaling (Robbins priming), dankbaarheid, visualisatie van je wins en je identiteitsverklaring. 's Avonds sluit je af met reflectie en state-vergelijking.",
  },
  {
    Icon: Target,
    title: 'Hiërarchisch Doelensysteem',
    desc: 'Van BHAG naar kwartaaldoel, naar weekdoel, naar de drie acties van vandaag. Elke dag weet je precies waaraan je werkt en waarom dat ertoe doet voor het grote plaatje.',
  },
  {
    Icon: Shield,
    title: 'Identiteitswerk',
    desc: 'Beheer je identity statements, houd bewijzen bij dat je ze leeft en bouw streaks op. Want wie je bent bepaalt wat je doet — niet andersom.',
  },
  {
    Icon: Timer,
    title: 'Deep Work & Focus Sessies',
    desc: 'Pomodoro-tijdblokken voor deep work, gekoppeld aan je dagdoelen. Zo weet je aan het einde van de dag: ik heb gewerkt áán mijn bedrijf, niet alleen erin.',
  },
  {
    Icon: Trophy,
    title: 'Wall of Wins',
    desc: 'Log je overwinningen per categorie: Business, Persoonlijk, Gezondheid en Leren. Op moeilijke dagen scroll je door wat je al hebt bereikt. Dat is krachtig.',
  },
  {
    Icon: RefreshCw,
    title: 'Habits & Streaks',
    desc: 'Bouw gewoontes op die blijven plakken. Streaks, gamification en voortgangsindicatoren zorgen dat je consistent blijft — ook als de motivatie even laag is.',
  },
];

const TESTIMONIALS = [
  {
    quote: 'Na drie weken OSflow had ik voor het eerst in jaren echt helderheid over waar ik naartoe wil. De LSP-sessie was een eye-opener — de app houdt me dagelijks scherp.',
    name: 'Pilotgebruiker · Ondernemer',
    role: 'Marketing bureau · Amsterdam',
  },
  {
    quote: 'Ik gebruikte Notion, Todoist en drie andere apps. Nu gebruik ik OSflow. Alles zit op één plek en ik begin elke dag met intentie. Dat klinkt simpel, maar het maakt alles anders.',
    name: 'Pilotgebruiker · Directeur-eigenaar',
    role: 'Consultancy · Utrecht',
  },
  {
    quote: 'De Wall of Wins veranderde mijn kijk op wat ik al bereikt heb. Op zware dagen scroll ik erdoorheen en herinner ik me: ik ben verder dan ik denk.',
    name: "Pilotgebruiker · Zzp'er",
    role: 'Coach · Rotterdam',
  },
];

/* ─── FAQ accordion ─────────────────────────────────────────── */
function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-[#e8e8ec] last:border-b-0">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between gap-4 py-5 text-left group"
      >
        <span className="text-[15px] font-semibold text-[#0a0a14] leading-snug">{q}</span>
        <span className="shrink-0 w-7 h-7 rounded-full border border-[#e8e8ec] group-hover:border-[#0a0a14] flex items-center justify-center text-[#8a8a9a] transition-colors">
          {open ? <Minus size={12} /> : <Plus size={12} />}
        </span>
      </button>
      {open && (
        <p className="text-[14px] text-[#8a8a9a] leading-relaxed pb-5 pr-10">
          {a}
        </p>
      )}
    </div>
  );
}

/* ─── Star rating ────────────────────────────────────────────── */
function Stars() {
  return (
    <div className="flex gap-1 mb-5">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} width="12" height="12" viewBox="0 0 12 12" fill="#f59e0b">
          <path d="M6 0l1.5 4h4l-3.2 2.4 1.2 3.9L6 8.1l-3.5 2.2 1.2-3.9L.5 4h4z" />
        </svg>
      ))}
    </div>
  );
}

/* ─── Page ───────────────────────────────────────────────────── */
export default function SalesPage() {
  return (
    <div className="min-h-screen bg-white text-[#0a0a14] font-sans">

      {/* ══ NAV ═════════════════════════════════════════════════ */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-[#e8e8ec]">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-[8px] bg-[#0a0a14] flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-[#00cc66]" />
            </div>
            <span className="text-[16px] font-bold tracking-tight">OSflow</span>
          </div>

          <div className="hidden md:flex items-center gap-7">
            {[
              { label: 'Hoe het werkt', href: '#hoe-het-werkt' },
              { label: 'De app',        href: '#features'      },
              { label: 'Aanbod',        href: '#aanbod'        },
            ].map(({ label, href }) => (
              <a key={href} href={href} className="text-[13px] text-[#8a8a9a] hover:text-[#0a0a14] transition-colors font-medium">
                {label}
              </a>
            ))}
          </div>

          <Link
            href="/auth/register"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#0a0a14] text-white text-[13px] font-semibold hover:bg-[#111118] transition-colors"
          >
            Gratis kennismaking
            <ArrowRight size={13} />
          </Link>
        </div>
      </nav>

      {/* ══ HERO ════════════════════════════════════════════════ */}
      <section className="max-w-5xl mx-auto px-6 pt-20 pb-24 text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#e8e8ec] mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00cc66] inline-block" />
          <span className="text-[11px] font-semibold text-[#8a8a9a] tracking-wide">Voor ambitieuze ondernemers</span>
        </div>

        <h1 className="text-[52px] sm:text-[72px] font-bold leading-[1.0] tracking-[-0.03em] mb-6">
          Stop met<br />
          <span className="text-[#c8c8d0]">overleven.</span><br />
          Start met<br />
          <span className="text-[#00cc66]">groeien.</span>
        </h1>

        <p className="text-[16px] sm:text-[18px] text-[#8a8a9a] max-w-xl mx-auto leading-relaxed mb-10">
          OSflow is het operating system voor ondernemers die weten dat er meer in zit. Één systeem voor wie je bent, wat je wil en hoe je het bereikt — elke dag.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/auth/register"
            className="group inline-flex items-center gap-2 px-8 py-4 rounded-full bg-[#00cc66] text-[#0a0a14] font-bold text-[15px] shadow-[0_4px_24px_rgba(0,204,102,0.35)] hover:bg-[#00b85c] active:scale-[0.98] transition-all"
          >
            Bekijk het aanbod
            <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
          </Link>
          <a
            href="#hoe-het-werkt"
            className="inline-flex items-center gap-2 text-[14px] text-[#8a8a9a] font-medium hover:text-[#0a0a14] transition-colors"
          >
            Hoe het werkt
            <ChevronDown size={15} />
          </a>
        </div>
      </section>

      {/* ══ SOCIAL PROOF STRIP ══════════════════════════════════ */}
      <div className="border-y border-[#e8e8ec] bg-[#f8f9fa]">
        <div className="max-w-5xl mx-auto px-6 py-5 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-10 text-center">
          <p className="text-[12px] text-[#8a8a9a] font-medium">
            Dagelijks gebruikt door ondernemers die groei serieus nemen.
          </p>
          <div className="w-px h-4 bg-[#e8e8ec] hidden sm:block" />
          <p className="text-[12px] text-[#8a8a9a] font-medium">
            Gebaseerd op bewezen methodes van Tony Robbins & OKR.
          </p>
        </div>
      </div>

      {/* ══ PROBLEEM ════════════════════════════════════════════ */}
      <section className="max-w-5xl mx-auto px-6 py-24">
        <div className="max-w-xl mb-14">
          <p className="text-[11px] font-bold text-[#00cc66] uppercase tracking-[0.18em] mb-3">Het probleem</p>
          <h2 className="text-[36px] sm:text-[44px] font-bold leading-[1.1] tracking-tight">
            Je werkt hard. Maar werk je aan de juiste dingen?
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            {
              n: '01',
              title: 'Ambities genoeg, focus te weinig',
              desc: 'Je hebt tien ideeën voor elke dag. Het probleem is niet motivatie — het is richting. Zonder systeem verdwijnt je energie in de verkeerde richting.',
            },
            {
              n: '02',
              title: 'Goede voornemens die slijten',
              desc: 'Januari vol energie. Februari teruggevallen in oude patronen. Gewoontes bouwen vraagt meer dan wilskracht — het vraagt een dagelijkse structuur.',
            },
            {
              n: '03',
              title: 'Druk maar niet vooruitgaand',
              desc: 'Volle agenda, weinig ruimte om te bouwen aan jezelf en je bedrijf. De waan van de dag wint het van je BHAG. Dat voelt als stilstaan terwijl je holt.',
            },
          ].map(({ n, title, desc }) => (
            <div key={n} className="rounded-[20px] border border-[#e8e8ec] p-7">
              <span className="text-[12px] font-bold text-[#e8e8ec] tracking-widest tabular-nums">{n}</span>
              <h3 className="text-[17px] font-bold text-[#0a0a14] mt-4 mb-2.5 leading-snug">{title}</h3>
              <p className="text-[13px] text-[#8a8a9a] leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ══ HOE HET WERKT ═══════════════════════════════════════ */}
      <section id="hoe-het-werkt" className="bg-[#f8f9fa] py-24">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-14">
            <p className="text-[11px] font-bold text-[#00cc66] uppercase tracking-[0.18em] mb-3">Drie stappen</p>
            <h2 className="text-[36px] sm:text-[44px] font-bold leading-[1.1] tracking-tight max-w-xl mx-auto">
              Naar jouw persoonlijk OS
            </h2>
            <p className="text-[15px] text-[#8a8a9a] mt-4 max-w-md mx-auto leading-relaxed">
              OSflow werkt niet als een app die je erbij pakt. Het wordt jouw dagelijkse fundament — van ochtend tot avond, van missie tot actie.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              {
                n: '01',
                title: 'De Intake',
                sub: 'LSP Sessie',
                meta: '3 uur · persoonlijk',
                desc: 'We starten met een diepe verkenning via LEGO® Serious Play. Je ontdekt wie je bent, wat je écht wil en wat je tegenhoudt. Dit is het fundament voor alles daarna.',
                dark: true,
              },
              {
                n: '02',
                title: 'De App',
                sub: 'Jouw OS',
                meta: 'Dagelijks · 10 minuten',
                desc: 'Je OS leeft in de app — ochtend- en avondrituelen, doelen, habits, wins en focus. Elke dag 10 minuten die alles samenhouden.',
                dark: false,
                accent: true,
              },
              {
                n: '03',
                title: 'De Begeleiding',
                sub: 'Optioneel',
                meta: 'Maandelijks · 1 uur',
                desc: 'Optionele coaching check-ins om bij te sturen, te verdiepen en je traject levend te houden. Niet als therapie — als strategische spiegel.',
                dark: false,
              },
            ].map(({ n, title, sub, meta, desc, dark, accent }) => (
              <div
                key={n}
                className={`rounded-[20px] p-7 border ${
                  dark
                    ? 'bg-[#0a0a14] border-transparent'
                    : accent
                    ? 'bg-[#f0fdf4] border-[#dcfce7]'
                    : 'bg-white border-[#e8e8ec]'
                }`}
              >
                <div className="flex items-center justify-between mb-7">
                  <span className={`text-[11px] font-bold tracking-widest tabular-nums ${dark ? 'text-[#ffffff20]' : 'text-[#e8e8ec]'}`}>
                    {n}
                  </span>
                  <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ${
                    dark ? 'bg-white/10 text-[#8a8a9a]' : 'bg-[#e8e8ec] text-[#8a8a9a]'
                  }`}>
                    {meta}
                  </span>
                </div>
                <h3 className={`text-[20px] font-bold leading-tight mb-1 ${dark ? 'text-white' : 'text-[#0a0a14]'}`}>
                  {title}
                </h3>
                <p className="text-[11px] font-bold uppercase tracking-widest text-[#00cc66] mb-4">{sub}</p>
                <p className={`text-[13px] leading-relaxed ${dark ? 'text-[#8a8a9a]' : 'text-[#8a8a9a]'}`}>
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
          <p className="text-[11px] font-bold text-[#00cc66] uppercase tracking-[0.18em] mb-3">De app</p>
          <h2 className="text-[36px] sm:text-[44px] font-bold leading-[1.1] tracking-tight">
            Alles in één systeem — eindelijk
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map(({ Icon, title, desc }) => (
            <div
              key={title}
              className="rounded-[20px] border border-[#e8e8ec] p-7 hover:shadow-[0_4px_24px_rgba(0,0,0,0.05)] transition-shadow"
            >
              <div className="w-9 h-9 rounded-[10px] bg-[#f4f4f7] flex items-center justify-center mb-5">
                <Icon size={17} className="text-[#0a0a14]" strokeWidth={1.8} />
              </div>
              <h3 className="text-[15px] font-bold text-[#0a0a14] mb-2">{title}</h3>
              <p className="text-[13px] text-[#8a8a9a] leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ══ FOUNDER ═════════════════════════════════════════════ */}
      <section className="bg-[#0a0a14] py-24">
        <div className="max-w-3xl mx-auto px-6">
          <p className="text-[11px] font-bold text-[#00cc66] uppercase tracking-[0.18em] mb-8">Van de oprichter</p>

          <blockquote className="text-[22px] sm:text-[28px] font-bold text-white leading-[1.4] mb-10">
            &ldquo;Ik bouwde OSflow omdat ik het zelf nodig had — en omdat niets op de markt goed genoeg was.&rdquo;
          </blockquote>

          <p className="text-[15px] text-[#8a8a9a] leading-relaxed mb-10 max-w-2xl">
            Als sociaal ondernemer en directeur bij meerdere organisaties wist ik wat ik wilde. Maar ik gebruikte zeven losse apps en had geen coherent systeem. Ik besloot het te bouwen.
            <br /><br />
            Vandaag gebruik ik OSflow elke dag. Het is mijn eerste handeling in de ochtend en mijn laatste in de avond. Het heeft mijn focus, consistentie en energie fundamenteel veranderd. Dat wil ik ook voor jou.
          </p>

          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-full bg-[#1a1a24] border border-[#2a2a34] flex items-center justify-center text-[#8a8a9a] text-[12px] font-bold tracking-wide select-none">
              VvM
            </div>
            <div>
              <p className="text-[14px] font-bold text-white">Vincent van Munster</p>
              <p className="text-[12px] text-[#5a5a6a] mt-0.5">Oprichter OSflow · WeAreImpact · Sociaal ondernemer</p>
            </div>
          </div>
        </div>
      </section>

      {/* ══ PRICING ═════════════════════════════════════════════ */}
      <section id="aanbod" className="max-w-5xl mx-auto px-6 py-24">
        <div className="text-center mb-14">
          <p className="text-[11px] font-bold text-[#00cc66] uppercase tracking-[0.18em] mb-3">Het aanbod</p>
          <h2 className="text-[36px] sm:text-[44px] font-bold leading-[1.1] tracking-tight">
            Kies jouw instap
          </h2>
          <p className="text-[15px] text-[#8a8a9a] mt-4">Begin waar je staat. Groei naar waar je wil zijn.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">

          {/* Starter */}
          <div className="rounded-[20px] border border-[#e8e8ec] p-7">
            <p className="text-[10px] font-bold text-[#8a8a9a] uppercase tracking-[0.18em] mb-4">Starter</p>
            <h3 className="text-[17px] font-bold text-[#0a0a14] mb-1">OSflow App</h3>
            <div className="flex items-baseline gap-1.5 mb-7 mt-3">
              <span className="text-[40px] font-bold text-[#0a0a14] leading-none tracking-tight">€29</span>
              <span className="text-[12px] text-[#8a8a9a]">/ maand<br />opzegbaar</span>
            </div>
            <div className="space-y-3 mb-7">
              {[
                'Volledige app-toegang',
                'Ochtend & avond rituelen',
                'Doelen & habits tracking',
                'Wall of Wins & streaks',
                'Analytics & insights',
                'Offline beschikbaar (PWA)',
              ].map(f => (
                <div key={f} className="flex items-center gap-2.5">
                  <Check size={13} className="text-[#00cc66] shrink-0" strokeWidth={2.5} />
                  <span className="text-[13px] text-[#0a0a14]">{f}</span>
                </div>
              ))}
            </div>
            <Link
              href="/auth/register"
              className="block text-center py-3.5 rounded-[14px] border border-[#0a0a14] text-[#0a0a14] font-semibold text-[14px] hover:bg-[#0a0a14] hover:text-white transition-colors"
            >
              Start vandaag
            </Link>
          </div>

          {/* OS Traject — recommended */}
          <div className="rounded-[20px] bg-[#0a0a14] p-7 relative md:-mt-4 md:pb-11 md:pt-11">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3.5 py-1 rounded-full bg-[#00cc66] text-[#0a0a14] text-[9px] font-bold uppercase tracking-[0.18em] whitespace-nowrap">
              Meest gekozen
            </div>
            <p className="text-[10px] font-bold text-[#5a5a6a] uppercase tracking-[0.18em] mb-4">OS Traject</p>
            <h3 className="text-[17px] font-bold text-white mb-1">Volledig traject</h3>
            <div className="flex items-baseline gap-1.5 mb-7 mt-3">
              <span className="text-[40px] font-bold text-white leading-none tracking-tight">€1.497</span>
              <span className="text-[12px] text-[#5a5a6a]">eenmalig<br />incl. 3 mnd app</span>
            </div>
            <div className="space-y-3 mb-7">
              {[
                'LSP kickoff-sessie (3 uur)',
                'Persoonlijke onboarding in app',
                '3 maanden app inbegrepen',
                'Persoonlijk actieplan',
                '2× coaching check-in (1 uur)',
                'Directe WhatsApp-lijn',
              ].map(f => (
                <div key={f} className="flex items-center gap-2.5">
                  <Check size={13} className="text-[#00cc66] shrink-0" strokeWidth={2.5} />
                  <span className="text-[13px] text-white">{f}</span>
                </div>
              ))}
            </div>
            <Link
              href="/auth/register"
              className="block text-center py-3.5 rounded-[14px] bg-[#00cc66] text-[#0a0a14] font-bold text-[14px] shadow-[0_4px_16px_rgba(0,204,102,0.3)] hover:bg-[#00b85c] transition-colors"
            >
              Boek een traject
            </Link>
          </div>

          {/* Mastermind */}
          <div className="rounded-[20px] border border-[#e8e8ec] p-7">
            <p className="text-[10px] font-bold text-[#8a8a9a] uppercase tracking-[0.18em] mb-4">Groep</p>
            <h3 className="text-[17px] font-bold text-[#0a0a14] mb-1">Mastermind</h3>
            <div className="flex items-baseline gap-1.5 mb-7 mt-3">
              <span className="text-[40px] font-bold text-[#0a0a14] leading-none tracking-tight">€797</span>
              <span className="text-[12px] text-[#8a8a9a]">/ kwartaal<br />max. 6 personen</span>
            </div>
            <div className="space-y-3 mb-7">
              {[
                'Kwartaal groepsprogramma',
                'App voor alle deelnemers',
                'Maandelijkse groepssessie',
                'Peer accountability',
                'Gedeelde wins & voortgang',
                'Exclusieve groep · sterk netwerk',
              ].map(f => (
                <div key={f} className="flex items-center gap-2.5">
                  <Check size={13} className="text-[#00cc66] shrink-0" strokeWidth={2.5} />
                  <span className="text-[13px] text-[#0a0a14]">{f}</span>
                </div>
              ))}
            </div>
            <Link
              href="/auth/register"
              className="block text-center py-3.5 rounded-[14px] border border-[#0a0a14] text-[#0a0a14] font-semibold text-[14px] hover:bg-[#0a0a14] hover:text-white transition-colors"
            >
              Vraag een plek aan
            </Link>
          </div>
        </div>
      </section>

      {/* ══ TESTIMONIALS ════════════════════════════════════════ */}
      <section className="bg-[#f8f9fa] py-24">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-14">
            <p className="text-[11px] font-bold text-[#00cc66] uppercase tracking-[0.18em] mb-3">Ervaringen</p>
            <h2 className="text-[36px] font-bold tracking-tight">Wat ondernemers zeggen</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {TESTIMONIALS.map(({ quote, name, role }) => (
              <div key={name} className="rounded-[20px] bg-white border border-[#e8e8ec] p-7">
                <Stars />
                <p className="text-[14px] text-[#0a0a14] leading-relaxed mb-6 font-medium">
                  &ldquo;{quote}&rdquo;
                </p>
                <div className="border-t border-[#e8e8ec] pt-5">
                  <p className="text-[13px] font-bold text-[#0a0a14]">{name}</p>
                  <p className="text-[12px] text-[#8a8a9a] mt-0.5">{role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ FAQ ═════════════════════════════════════════════════ */}
      <section className="max-w-3xl mx-auto px-6 py-24">
        <div className="text-center mb-14">
          <p className="text-[11px] font-bold text-[#00cc66] uppercase tracking-[0.18em] mb-3">FAQ</p>
          <h2 className="text-[36px] font-bold tracking-tight">Veelgestelde vragen</h2>
        </div>

        <div className="rounded-[20px] border border-[#e8e8ec] px-7">
          {FAQS.map(faq => (
            <FaqItem key={faq.q} {...faq} />
          ))}
        </div>
      </section>

      {/* ══ FINAL CTA ═══════════════════════════════════════════ */}
      <section className="max-w-5xl mx-auto px-6 pb-24">
        <div className="rounded-[24px] bg-[#0a0a14] px-8 sm:px-14 py-16 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/8 border border-white/10 mb-7">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00cc66] inline-block live-dot" />
            <span className="text-[10px] font-bold text-[#00cc66] uppercase tracking-[0.18em]">Klaar om te beginnen?</span>
          </div>

          <h2 className="text-[36px] sm:text-[48px] font-bold text-white leading-[1.1] tracking-tight mb-4">
            Start jouw OS vandaag
          </h2>
          <p className="text-[15px] text-[#8a8a9a] max-w-md mx-auto mb-10 leading-relaxed">
            Boek een gratis kennismakingsgesprek van 20 minuten. Geen verplichtingen — gewoon kijken of OSflow bij jou past.
          </p>

          <Link
            href="/auth/register"
            className="group inline-flex items-center gap-2 px-8 py-4 rounded-full bg-[#00cc66] text-[#0a0a14] font-bold text-[15px] shadow-[0_4px_24px_rgba(0,204,102,0.35)] hover:bg-[#00b85c] active:scale-[0.98] transition-all"
          >
            Boek een gratis kennismaking
            <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
          </Link>

          <p className="text-[12px] text-[#5a5a6a] mt-6">
            Of mail direct:{' '}
            <a href="mailto:v.munster@weareimpact.nl" className="text-[#8a8a9a] hover:text-white transition-colors underline underline-offset-2">
              v.munster@weareimpact.nl
            </a>
            {' '}· 06-14470977
          </p>
        </div>
      </section>

      {/* ══ FOOTER ══════════════════════════════════════════════ */}
      <footer className="border-t border-[#e8e8ec] py-8">
        <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-[7px] bg-[#0a0a14] flex items-center justify-center">
              <div className="w-2.5 h-2.5 rounded-full bg-[#00cc66]" />
            </div>
            <span className="text-[13px] font-bold">OSflow</span>
            <span className="text-[12px] text-[#c8c8d0]">·</span>
            <span className="text-[12px] text-[#8a8a9a]">Een product van WeAreImpact · Vincent van Munster</span>
          </div>
          <a
            href="mailto:v.munster@weareimpact.nl"
            className="text-[12px] text-[#8a8a9a] hover:text-[#0a0a14] transition-colors"
          >
            v.munster@weareimpact.nl
          </a>
        </div>
      </footer>
    </div>
  );
}
