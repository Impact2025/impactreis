'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Heart, CheckCircle, Sun, Coffee, Moon, ChevronRight } from 'lucide-react';
import { AuthService } from '@/lib/auth';
import { api } from '@/lib/api';
import { BottomNav } from '@/components/ui/bottom-nav';

interface WeekPlan {
  week: number;
  title: string;
  icon: string;
  belofte: string;
  focus: string;
  practice: string;
}

const WEEK_PLAN: WeekPlan[] = [
  {
    week: 1, title: 'Herkenning', icon: '👁️',
    belofte: 'Ik begin de reis naar de Liefdevolle Ouder.',
    focus: 'Merk op wanneer je handelt uit angst of controle.',
    practice: 'Als je je aanpast aan anderen, zeg je intern: "Dit is een oud kenmerk van de waslijst. Het mocht er zijn om te overleven, maar ik zie het nu."',
  },
  {
    week: 2, title: 'Overgave', icon: '🌊',
    belofte: 'Ik geef over aan iets groters dan mezelf.',
    focus: 'Stop met vechten tegen situaties die je niet kunt controleren.',
    practice: 'Gebruik het Gebed om Kalmte bij frustratie. Zeg: "Ik laat de controle los en vertrouw op het proces."',
  },
  {
    week: 3, title: 'Liefdevolle Ouder', icon: '💚',
    belofte: 'Ik ben mijn eigen Liefdevolle Ouder.',
    focus: 'Vervang de interne criticus.',
    practice: 'Elke keer dat je jezelf bekritiseert, corrigeer je jezelf direct: "Nee, ik doe mijn best en dat is genoeg."',
  },
  {
    week: 4, title: 'Grenzen Stellen', icon: '🛡️',
    belofte: 'Ik mag grenzen stellen zonder schuld.',
    focus: 'Oefen met een kleine "Nee".',
    practice: 'Zeg "Nee" tegen iets kleins en observeer de onrust in je lijf zonder deze direct weg te willen hebben.',
  },
  {
    week: 5, title: 'Spelen & Plezier', icon: '🎨',
    belofte: 'Ik verdien vreugde en plezier.',
    focus: 'Het kind in je laten genieten.',
    practice: 'Doe deze week één ding dat nergens toe dient, behalve plezier — kleuren, wandelen, een grappige film kijken.',
  },
  {
    week: 6, title: 'Integriteit & Waarheid', icon: '🔍',
    belofte: 'Ik ben eerlijk over mijn gevoelens.',
    focus: 'Eerlijk zijn naar jezelf over je gevoelens.',
    practice: 'Houd een dagboekje bij: "Wat voelde ik echt in die situatie?" in plaats van "Wat had ik moeten voelen?"',
  },
  {
    week: 7, title: 'Verbinding', icon: '🤝',
    belofte: 'Ik stap uit het isolement.',
    focus: 'Uit het isolement stappen.',
    practice: 'Bezoek een (online) ACA-meeting of bel een "fellow traveller". Deel iets kleins over je proces.',
  },
];

const HALT_ITEMS = [
  { key: 'H', label: 'Hongerig', emoji: '🍎', advice: 'Neem even een pauze en eet iets kleins. Je lichaam heeft brandstof nodig om helder te denken.' },
  { key: 'A', label: 'Angstig/Boos', emoji: '😤', advice: 'Adem 4 tellen in, 4 tellen vasthouden, 8 tellen uitademen. Herhaal 3×. Geef de emotie ruimte.' },
  { key: 'L', label: 'Eenzaam', emoji: '🫂', advice: 'Stuur iemand een kort berichtje. Verbinding hoeft niet groot te zijn — één zin is genoeg.' },
  { key: 'T', label: 'Moe', emoji: '😴', advice: 'Geef jezelf toestemming om 10 minuten te rusten. Vermoeidheid is een signaal, geen zwakte.' },
];

interface DayData {
  morning: boolean;
  halt: string[];
  eveningApprovals: string[];
  eveningSaved: boolean;
}

function getTodayStr() {
  return new Date().toISOString().split('T')[0];
}

function getCurrentWeek(startDate: string): number {
  const daysDiff = Math.floor(
    (new Date().getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)
  );
  return Math.min(7, Math.max(1, Math.floor(daysDiff / 7) + 1));
}

function getDayCount(startDate: string): number {
  return (
    Math.floor((new Date().getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1
  );
}

export default function ACAPage() {
  const router = useRouter();
  const [loading, setLoading]               = useState(true);
  const [started, setStarted]               = useState(false);
  const [startDate, setStartDate]           = useState('');
  const [dayData, setDayData]               = useState<DayData>({
    morning: false, halt: [], eveningApprovals: ['', ''], eveningSaved: false,
  });
  const [morningOpen, setMorningOpen]       = useState(false);
  const [haltOpen, setHaltOpen]             = useState(false);
  const [eveningOpen, setEveningOpen]       = useState(false);

  const todayStr = getTodayStr();

  useEffect(() => {
    if (!AuthService.getUser()) { router.push('/auth/login'); return; }
    const _started   = localStorage.getItem('aca_started') === 'true';
    const _startDate = localStorage.getItem('aca_start_date') ?? '';
    const _day       = localStorage.getItem(`aca_day_${todayStr}`);
    setStarted(_started);
    setStartDate(_startDate);
    if (_day) setDayData(JSON.parse(_day));
    setLoading(false);
  }, [router, todayStr]);

  const persist = (updated: DayData) => {
    setDayData(updated);
    localStorage.setItem(`aca_day_${todayStr}`, JSON.stringify(updated));
  };

  const handleStart = () => {
    const today = getTodayStr();
    localStorage.setItem('aca_started', 'true');
    localStorage.setItem('aca_start_date', today);
    setStarted(true);
    setStartDate(today);
  };

  const handleMorningDone = () => {
    persist({ ...dayData, morning: true });
    setMorningOpen(false);
    api.logs.create({ type: 'aca_morning', date: todayStr, data: { done: true }, createdAt: new Date().toISOString() }).catch(() => {});
  };

  const toggleHalt = (key: string) => {
    const next = dayData.halt.includes(key)
      ? dayData.halt.filter(k => k !== key)
      : [...dayData.halt, key];
    persist({ ...dayData, halt: next });
  };

  const handleHaltSave = () => {
    setHaltOpen(false);
    api.logs.create({ type: 'aca_halt', date: todayStr, data: { items: dayData.halt }, createdAt: new Date().toISOString() }).catch(() => {});
  };

  const updateApproval = (i: number, value: string) => {
    const next = [...dayData.eveningApprovals];
    next[i] = value;
    persist({ ...dayData, eveningApprovals: next });
  };

  const handleEveningSave = () => {
    persist({ ...dayData, eveningSaved: true });
    setEveningOpen(false);
    api.logs.create({ type: 'aca_evening', date: todayStr, data: { approvals: dayData.eveningApprovals }, createdAt: new Date().toISOString() }).catch(() => {});
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-6 h-6 rounded-full border-2 border-[#00cc66] border-t-transparent animate-spin" />
      </div>
    );
  }

  /* ── ONBOARDING (not started) ──────────────────────────────────── */
  if (!started) {
    return (
      <div className="min-h-screen bg-white pb-28">
        <div className="sticky top-0 z-10 bg-white border-b border-[#e8e8ec]">
          <div className="max-w-lg mx-auto px-5 py-4 flex items-center gap-3">
            <Link href="/dashboard" className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-[#f4f4f7] transition-colors">
              <ArrowLeft size={18} className="text-[#0a0a14]" />
            </Link>
            <div>
              <h1 className="text-[17px] font-semibold text-[#0a0a14]">ACA Herstelpad</h1>
              <p className="text-[11px] text-[#8a8a9a]">7 weken naar herstel</p>
            </div>
          </div>
        </div>

        <div className="max-w-lg mx-auto px-5 pt-8">
          <div className="rounded-[20px] bg-[#0a0a14] p-6 mb-6">
            <div className="text-3xl mb-4">💚</div>
            <h2 className="text-[22px] font-bold text-white mb-2 leading-tight">
              Jouw reis naar de Liefdevolle Ouder
            </h2>
            <p className="text-[13px] text-white/50 leading-relaxed">
              ACA herstelwerk in 7 weken. Dagelijkse momenten van 5 minuten die échte, blijvende verandering brengen.
            </p>
          </div>

          <div className="space-y-3 mb-8">
            {[
              { icon: '☀️', title: 'Ochtend · 5 min', desc: 'Verbinding met je innerlijk kind via de Liefdevolle Ouder' },
              { icon: '⏰', title: 'Middag · 1 min', desc: 'HALT-check: Hongerig, Angstig, Eenzaam of Moe?' },
              { icon: '🌙', title: 'Avond · 5 min', desc: 'Stap 10 inventaris — geef jezelf goedkeuring' },
            ].map(item => (
              <div key={item.icon} className="flex items-start gap-3 rounded-[14px] bg-[#f4f4f7] p-4">
                <span className="text-xl">{item.icon}</span>
                <div>
                  <p className="text-[13px] font-semibold text-[#0a0a14]">{item.title}</p>
                  <p className="text-[12px] text-[#8a8a9a] mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <p className="text-[11px] text-[#8a8a9a] text-center mb-5 italic leading-relaxed">
            "Perfectie is een valkuil. Doe het liever 5 minuten<br />met aandacht dan een uur vanuit dwang."
          </p>

          <button
            onClick={handleStart}
            className="w-full py-4 bg-[#00cc66] text-white text-[15px] font-bold rounded-[16px] active:scale-[0.98] transition-transform shadow-[0_4px_20px_rgba(0,204,102,0.3)]"
          >
            Start Week 1 — Herkenning
          </button>
        </div>

        <BottomNav />
      </div>
    );
  }

  /* ── ACTIVE PROGRAM ────────────────────────────────────────────── */
  const currentWeek = getCurrentWeek(startDate);
  const dayCount    = getDayCount(startDate);
  const week        = WEEK_PLAN[currentWeek - 1];
  const done3       = [dayData.morning, dayData.halt.length > 0, dayData.eveningSaved].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-white pb-28">

      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-[#e8e8ec]">
        <div className="max-w-lg mx-auto px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-[#f4f4f7] transition-colors">
              <ArrowLeft size={18} className="text-[#0a0a14]" />
            </Link>
            <div>
              <h1 className="text-[17px] font-semibold text-[#0a0a14]">ACA Herstelpad</h1>
              <p className="text-[11px] text-[#8a8a9a]">Dag {dayCount} van je reis</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[11px] font-bold text-[#00cc66] tabular-nums">WEEK {currentWeek}/7</p>
            <p className="text-[10px] text-[#8a8a9a]">{week.title}</p>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-5 pt-5 space-y-4">

        {/* Belofte van de week */}
        <div className="rounded-[16px] bg-[#f0fdf4] border border-[#bbf7d0] px-5 py-4">
          <p className="text-[9px] font-bold text-[#00cc66] uppercase tracking-[0.18em] mb-1.5">Belofte van de week</p>
          <p className="text-[15px] font-semibold text-[#0a0a14] italic leading-snug">
            &ldquo;{week.belofte}&rdquo;
          </p>
        </div>

        {/* Daily progress bar */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-1.5 bg-[#f4f4f7] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#00cc66] rounded-full transition-all duration-500"
              style={{ width: `${(done3 / 3) * 100}%` }}
            />
          </div>
          <p className="text-[11px] font-semibold text-[#8a8a9a] tabular-nums shrink-0">{done3}/3 vandaag</p>
        </div>

        {/* ── OCHTEND ────────────────────────────────────────────── */}
        <div className="rounded-[16px] border border-[#e8e8ec] bg-white overflow-hidden">
          <button
            onClick={() => setMorningOpen(v => !v)}
            className="w-full flex items-center gap-3 px-4 py-4"
          >
            <div className={`w-9 h-9 rounded-[10px] flex items-center justify-center ${dayData.morning ? 'bg-[#f0fdf4]' : 'bg-[#fff8eb]'}`}>
              {dayData.morning
                ? <CheckCircle size={17} className="text-[#00cc66]" />
                : <Sun size={17} className="text-[#f59e0b]" />}
            </div>
            <div className="flex-1 text-left">
              <p className="text-[13px] font-semibold text-[#0a0a14]">Ochtend · Liefdevolle Ouder</p>
              <p className="text-[11px] text-[#8a8a9a]">
                {dayData.morning ? 'Voltooid ✓' : '5 minuten · Verbinding maken'}
              </p>
            </div>
            <ChevronRight size={15} className={`text-[#8a8a9a] transition-transform duration-200 ${morningOpen ? 'rotate-90' : ''}`} />
          </button>

          {morningOpen && (
            <div className="px-4 pb-4 border-t border-[#f4f4f7] space-y-3">
              <div className="rounded-[12px] bg-[#0a0a14] p-4 mt-3">
                <p className="text-[13px] text-white/80 leading-relaxed">
                  Leg je hand op je hart.<br />
                  Sluit je ogen als dat fijn voelt.<br /><br />
                  Zeg zachtjes:<br />
                  <span className="text-white font-semibold">
                    &ldquo;Ik ben hier voor je.<br />
                    Vandaag ben ik je Liefdevolle Ouder.&rdquo;
                  </span>
                </p>
              </div>
              <div className="rounded-[12px] bg-[#f0fdf4] border border-[#bbf7d0] p-3">
                <p className="text-[10px] font-bold text-[#00cc66] uppercase tracking-widest mb-1">Belofte van deze week</p>
                <p className="text-[13px] text-[#0a0a14] italic">&ldquo;{week.belofte}&rdquo;</p>
              </div>
              {!dayData.morning && (
                <button
                  onClick={handleMorningDone}
                  className="w-full py-3 bg-[#00cc66] text-white text-[14px] font-semibold rounded-[12px] active:scale-[0.98] transition-transform shadow-[0_2px_8px_rgba(0,204,102,0.25)]"
                >
                  Gedaan ✓
                </button>
              )}
            </div>
          )}
        </div>

        {/* ── HALT CHECK ─────────────────────────────────────────── */}
        <div className="rounded-[16px] border border-[#e8e8ec] bg-white overflow-hidden">
          <button
            onClick={() => setHaltOpen(v => !v)}
            className="w-full flex items-center gap-3 px-4 py-4"
          >
            <div className={`w-9 h-9 rounded-[10px] flex items-center justify-center ${dayData.halt.length > 0 ? 'bg-[#f0fdf4]' : 'bg-[#f0f0ff]'}`}>
              {dayData.halt.length > 0
                ? <CheckCircle size={17} className="text-[#00cc66]" />
                : <Coffee size={17} className="text-[#6366f1]" />}
            </div>
            <div className="flex-1 text-left">
              <p className="text-[13px] font-semibold text-[#0a0a14]">Middag · HALT Check</p>
              <p className="text-[11px] text-[#8a8a9a]">
                {dayData.halt.length > 0
                  ? `${dayData.halt.join(', ')} geselecteerd ✓`
                  : '1 minuut · Zelfzorg check'}
              </p>
            </div>
            <ChevronRight size={15} className={`text-[#8a8a9a] transition-transform duration-200 ${haltOpen ? 'rotate-90' : ''}`} />
          </button>

          {haltOpen && (
            <div className="px-4 pb-4 border-t border-[#f4f4f7]">
              <p className="text-[12px] text-[#8a8a9a] mt-3 mb-3">Ben je op dit moment...?</p>
              <div className="grid grid-cols-2 gap-2 mb-3">
                {HALT_ITEMS.map(item => {
                  const sel = dayData.halt.includes(item.key);
                  return (
                    <button
                      key={item.key}
                      onClick={() => toggleHalt(item.key)}
                      className={`p-3 rounded-[12px] border text-left transition-all active:scale-[0.97] ${
                        sel ? 'border-[#00cc66] bg-[#f0fdf4]' : 'border-[#e8e8ec] bg-white'
                      }`}
                    >
                      <span className="text-lg">{item.emoji}</span>
                      <p className={`text-[12px] font-semibold mt-1 ${sel ? 'text-[#00cc66]' : 'text-[#0a0a14]'}`}>
                        {item.label}
                      </p>
                    </button>
                  );
                })}
              </div>

              {dayData.halt.length > 0 && (
                <div className="space-y-2 mb-3">
                  {HALT_ITEMS.filter(i => dayData.halt.includes(i.key)).map(item => (
                    <div key={item.key} className="rounded-[12px] bg-[#f4f4f7] p-3">
                      <p className="text-[11px] font-bold text-[#0a0a14] mb-0.5">{item.emoji} {item.label}</p>
                      <p className="text-[12px] text-[#8a8a9a] leading-relaxed">{item.advice}</p>
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={handleHaltSave}
                className="w-full py-3 bg-[#0a0a14] text-white text-[14px] font-semibold rounded-[12px] active:scale-[0.98] transition-transform"
              >
                {dayData.halt.length === 0 ? 'Alles goed 👍' : 'Opgeslagen ✓'}
              </button>
            </div>
          )}
        </div>

        {/* ── AVOND INVENTARIS ───────────────────────────────────── */}
        <div className="rounded-[16px] border border-[#e8e8ec] bg-white overflow-hidden">
          <button
            onClick={() => setEveningOpen(v => !v)}
            className="w-full flex items-center gap-3 px-4 py-4"
          >
            <div className={`w-9 h-9 rounded-[10px] flex items-center justify-center ${dayData.eveningSaved ? 'bg-[#f0fdf4]' : 'bg-[#fdf4ff]'}`}>
              {dayData.eveningSaved
                ? <CheckCircle size={17} className="text-[#00cc66]" />
                : <Moon size={17} className="text-[#a855f7]" />}
            </div>
            <div className="flex-1 text-left">
              <p className="text-[13px] font-semibold text-[#0a0a14]">Avond · Stap 10 Inventaris</p>
              <p className="text-[11px] text-[#8a8a9a]">
                {dayData.eveningSaved ? 'Voltooid ✓' : '5 minuten · Goedkeuring geven'}
              </p>
            </div>
            <ChevronRight size={15} className={`text-[#8a8a9a] transition-transform duration-200 ${eveningOpen ? 'rotate-90' : ''}`} />
          </button>

          {eveningOpen && (
            <div className="px-4 pb-4 border-t border-[#f4f4f7]">
              <p className="text-[12px] text-[#8a8a9a] mt-3 mb-3 leading-relaxed">
                Schrijf 2 dingen waarvoor je jezelf vandaag <span className="font-semibold text-[#0a0a14]">goedkeuring</span> geeft.
                Niet waarvoor je trots bent — goedkeuring. Er is een verschil.
              </p>
              <div className="space-y-3 mb-3">
                {[0, 1].map(i => (
                  <div key={i} className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-full bg-[#f0fdf4] text-[#00cc66] text-[11px] font-bold flex items-center justify-center flex-shrink-0">
                      {i + 1}
                    </span>
                    <input
                      type="text"
                      value={dayData.eveningApprovals[i] ?? ''}
                      onChange={e => updateApproval(i, e.target.value)}
                      placeholder="Ik keur mezelf goed voor..."
                      className="flex-1 px-4 py-3 bg-[#f4f4f7] border border-[#e8e8ec] focus:border-[#00cc66] outline-none rounded-[12px] text-[14px] text-[#0a0a14] placeholder-[#8a8a9a] transition-colors"
                    />
                  </div>
                ))}
              </div>
              <button
                onClick={handleEveningSave}
                disabled={!dayData.eveningApprovals.some(a => a.trim().length > 0)}
                className="w-full py-3 bg-[#00cc66] text-white text-[14px] font-semibold rounded-[12px] active:scale-[0.98] transition-transform disabled:opacity-40 shadow-[0_2px_8px_rgba(0,204,102,0.25)]"
              >
                Opslaan ✓
              </button>
            </div>
          )}
        </div>

        {/* ── WEEK THEMA ─────────────────────────────────────────── */}
        <div className="rounded-[20px] bg-[#0a0a14] p-5">
          <div className="flex items-center gap-2.5 mb-4">
            <span className="text-xl">{week.icon}</span>
            <div>
              <p className="text-[9px] font-bold text-[#00cc66] uppercase tracking-[0.18em]">
                Week {currentWeek} Thema
              </p>
              <p className="text-[16px] font-bold text-white">{week.title}</p>
            </div>
          </div>
          <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest mb-1">FOCUS</p>
          <p className="text-[13px] text-white/70 mb-4 leading-relaxed">{week.focus}</p>
          <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest mb-1">WEEKPRAKTIJK</p>
          <p className="text-[13px] text-white/70 leading-relaxed">{week.practice}</p>
        </div>

        {/* ── 7-WEEK TIMELINE ────────────────────────────────────── */}
        <div>
          <p className="text-[13px] font-bold text-[#0a0a14] mb-3">Jouw herstelreis</p>
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-5 px-5 snap-x">
            {WEEK_PLAN.map(w => {
              const past    = w.week < currentWeek;
              const current = w.week === currentWeek;
              return (
                <div
                  key={w.week}
                  className={`flex-none w-[88px] snap-start rounded-[14px] p-3 ${
                    current ? 'bg-[#0a0a14] border-2 border-[#00cc66]' :
                    past    ? 'bg-[#f0fdf4] border border-[#bbf7d0]' :
                              'bg-[#f4f4f7] border border-[#e8e8ec]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-base">{w.icon}</span>
                    {past    && <CheckCircle size={11} className="text-[#00cc66]" />}
                    {current && <span className="text-[8px] font-bold text-[#00cc66]">NU</span>}
                  </div>
                  <p className={`text-[10px] font-bold tabular-nums ${current ? 'text-white' : past ? 'text-[#00cc66]' : 'text-[#8a8a9a]'}`}>
                    Wk {w.week}
                  </p>
                  <p className={`text-[9px] mt-0.5 leading-tight ${current ? 'text-white/60' : past ? 'text-[#0a0a14]' : 'text-[#8a8a9a]'}`}>
                    {w.title}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Compassie footer */}
        <div className="rounded-[14px] bg-[#f4f4f7] p-4 text-center">
          <Heart size={14} className="text-[#be185d] mx-auto mb-1.5" />
          <p className="text-[12px] text-[#8a8a9a] italic leading-relaxed">
            Als je een dag mist, veroordeel jezelf dan niet — dat is de oude criticus.<br />
            Pak de draad de volgende dag gewoon weer op.
          </p>
        </div>

      </div>

      <BottomNav />
    </div>
  );
}
