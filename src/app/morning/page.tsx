'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Sunrise, ArrowLeft, ArrowRight, CheckCircle, Heart, Target, Zap, Brain, CalendarClock, Mountain, Coffee, Sun, GlassWater, Mic } from 'lucide-react';
import { AuthService } from '@/lib/auth';
import { api } from '@/lib/api';
import { BottomNav } from '@/components/ui/bottom-nav';
import { getToday } from '@/lib/weekflow.service';
import { useRitualStatus } from '@/hooks/useRitualStatus';
import { MeditationPlayer } from '@/components/meditations/MeditationPlayer';
import { getMeditationsByCategory } from '@/lib/meditations/catalog';
import { useSpeechRecognition } from '@/hooks/use-speech';
import { TIME_WASTER_OPTIONS } from '@/lib/onboarding';

const FOCUS_CATEGORY_OPTIONS = [
  { value: 'commercie', label: 'Commercie / Sales' },
  { value: 'proces', label: 'Proces & Automatisering' },
  { value: 'klantwerk', label: 'Klantwerk / Uitvoering' },
] as const;

type Step = 'dagtype' | 'centering' | 'intentie' | 'focusblokken' | 'status' | 'dankbaarheid' | 'affirmatie' | 'done';
type DayType = 'focus' | 'buffer' | 'free';
type Mode = 'full' | 'quick';

// Centering staat na dagtype/pre-work en vóór de rest: de neuro-somatische poortwachter die
// ervoor zorgt dat intentie, focusblokken en de statuspeiling vanuit een gekalmeerd brein
// worden ingevuld i.p.v. vanuit ochtendhaast. Alleen in de Volledige modus — Snel (2 min)
// blijft bewust zonder audio, anders klopt de tijdsbelofte niet meer.
const FULL_STEPS: Step[] = ['dagtype', 'centering', 'intentie', 'focusblokken', 'status', 'dankbaarheid', 'affirmatie'];
// Snelle modus: alleen de stappen die de meeste weerstand geven (agenda-planning,
// slaap/energie-sliders) worden overgeslagen — dagtype/intentie/dankbaarheid/affirmatie
// blijven staan omdat die het minste tijd kosten en het meeste effect hebben.
const QUICK_STEPS: Step[] = ['dagtype', 'intentie', 'dankbaarheid', 'affirmatie'];

const MODE_STORAGE_KEY = 'morning_ritual_mode';

// Roterende suggesties voor dankbaarheid, zodat je niet elke dag opnieuw iets hoeft te
// verzinnen. Welke 6 er getoond worden verschuift per dag (op basis van de datum), zodat
// het toch niet elke ochtend dezelfde rijtjes zijn.
const GRATITUDE_PRESETS = [
  'Mijn gezondheid',
  'Een klant die me vertrouwt',
  'Het dak boven mijn hoofd',
  'Iemand die me steunt',
  'Dat ik mag ondernemen op mijn eigen manier',
  'Een goed gesprek dat ik onlangs had',
  'Mijn team',
  'De vrijheid om mijn eigen agenda te bepalen',
  'Iets kleins dat gisteren goed ging',
  'Mijn gezin / dierbaren',
  'Een les die ik onlangs leerde',
  'Dat ik vandaag weer een kans krijg',
];

function getDailyGratitudePresets(dateKey: string, count = 6): string[] {
  let seed = 0;
  for (const ch of dateKey) seed += ch.charCodeAt(0);
  const start = seed % GRATITUDE_PRESETS.length;
  const rotated = [...GRATITUDE_PRESETS.slice(start), ...GRATITUDE_PRESETS.slice(0, start)];
  return rotated.slice(0, count);
}

const STEP_LABELS: Record<Step, string> = {
  dagtype: 'Dagtype',
  centering: 'Centering',
  intentie: 'De Kikker',
  focusblokken: 'Focus Blokken',
  status: 'Status',
  dankbaarheid: 'Dankbaarheid',
  affirmatie: 'Affirmatie',
  done: 'Klaar',
};

const DAY_TYPE_OPTIONS: { value: DayType; label: string; description: string }[] = [
  { value: 'focus', label: 'Focus Day', description: 'Diep werk, 80/20-projecten — onwrikbare concentratie' },
  { value: 'buffer', label: 'Buffer Day', description: 'Administratie, planning, voorbereiding' },
  { value: 'free', label: 'Free Day', description: 'Volledige disconnectie — geen zakelijk contact' },
];

interface FocusBlok {
  category: string | null;
  taaknaam: string;
}

interface PreWork {
  daylight: boolean;
  hydration: boolean;
  caffeineDelay: boolean;
}

interface MorningData {
  dayType: DayType | null;
  preWork: PreWork;
  kikkerCategory: string | null;
  kikkerDetail: string;
  intentie: string;
  affirmatie: string;
  dankbaarheid: string[];
  energyLevel: number;
  sleepQuality: number;
  sleepTime: string;
  wakeTime: string;
  focusBlok1: FocusBlok;
  focusBlok2: FocusBlok;
}

export default function MorningPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState<Step>('dagtype');
  const [alVoltooid, setAlVoltooid] = useState(false);
  const [meetingCount, setMeetingCount] = useState<number | null>(null);
  const [mode, setMode] = useState<Mode>('full');
  const router = useRouter();
  const { settings } = useRitualStatus();

  const baseSteps = mode === 'quick' ? QUICK_STEPS : FULL_STEPS;
  // Meditaties zijn optioneel (zie Instellingen / onboarding) — sla de centering-stap over
  // als de gebruiker die heeft uitgezet, i.p.v. 'm gedwongen te tonen.
  const STEPS = settings.meditationsEnabled ? baseSteps : baseSteps.filter((s) => s !== 'centering');

  useEffect(() => {
    const stored = localStorage.getItem(MODE_STORAGE_KEY);
    if (stored === 'quick' || stored === 'full') setMode(stored);
  }, []);

  const selectMode = (next: Mode) => {
    setMode(next);
    localStorage.setItem(MODE_STORAGE_KEY, next);
  };

  const today = new Date();
  const dayName = today.toLocaleDateString('nl-NL', { weekday: 'long' });
  const dateStr = today.toLocaleDateString('nl-NL', { day: 'numeric', month: 'long' });
  // Datum in de tijdzone van de gebruiker, niet UTC/serverlokaal — anders komt een
  // ochtendritueel vlak na middernacht onder de verkeerde dag te staan en mist streak/dashboard
  // 'm als "vandaag gedaan". Moet in de pas lopen met ritual-status.service.ts, dat dezelfde
  // settings.timezone gebruikt.
  const todayStr = getToday(settings.timezone);
  const dailyGratitudePresets = getDailyGratitudePresets(todayStr);

  const [formData, setFormData] = useState<MorningData>({
    dayType: null,
    preWork: { daylight: false, hydration: false, caffeineDelay: false },
    kikkerCategory: null,
    kikkerDetail: '',
    intentie: '',
    affirmatie: '',
    dankbaarheid: ['', '', ''],
    energyLevel: 7,
    sleepQuality: 7,
    sleepTime: '23:00',
    wakeTime: '06:30',
    focusBlok1: { category: null, taaknaam: '' },
    focusBlok2: { category: null, taaknaam: '' },
  });
  const [topTimeWasters, setTopTimeWasters] = useState<string[]>([]);
  const kikkerSpeech = useSpeechRecognition();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = AuthService.isAuthenticated() ? { email: 'user@example.com' } : null;
        if (!currentUser) { router.push('/auth/login'); return; }

        const logs = await api.logs.getByTypeAndDate('morning', todayStr).catch(() => []);
        const raw = Array.isArray(logs) && logs[0] ? logs[0].data : null;
        const p = typeof raw === 'string' ? JSON.parse(raw) : raw;
        if (p) {
          setFormData({
            dayType: ['focus', 'buffer', 'free'].includes(p.dayType) ? p.dayType : null,
            preWork: p.preWork && typeof p.preWork === 'object'
              ? {
                  daylight: !!p.preWork.daylight,
                  hydration: !!p.preWork.hydration,
                  caffeineDelay: !!p.preWork.caffeineDelay,
                }
              : { daylight: false, hydration: false, caffeineDelay: false },
            kikkerCategory: typeof p.kikkerCategory === 'string' ? p.kikkerCategory : null,
            kikkerDetail: typeof p.kikkerDetail === 'string' ? p.kikkerDetail : '',
            intentie: typeof p.intentie === 'string' ? p.intentie : '',
            affirmatie: typeof p.affirmatie === 'string' ? p.affirmatie : '',
            dankbaarheid: Array.isArray(p.dankbaarheid)
              ? p.dankbaarheid.map((d: unknown) => (typeof d === 'string' ? d : ''))
              : ['', '', ''],
            energyLevel: typeof p.energyLevel === 'number' ? p.energyLevel : 7,
            sleepQuality: typeof p.sleepQuality === 'number' ? p.sleepQuality : 7,
            sleepTime: typeof p.sleepTime === 'string' ? p.sleepTime : '23:00',
            wakeTime: typeof p.wakeTime === 'string' ? p.wakeTime : '06:30',
            focusBlok1: p.focusBlok1 && typeof p.focusBlok1 === 'object'
              ? { category: p.focusBlok1.category || null, taaknaam: p.focusBlok1.taaknaam || p.focusBlok1.onderwerp || '' }
              : { category: null, taaknaam: '' },
            focusBlok2: p.focusBlok2 && typeof p.focusBlok2 === 'object'
              ? { category: p.focusBlok2.category || null, taaknaam: p.focusBlok2.taaknaam || p.focusBlok2.onderwerp || '' }
              : { category: null, taaknaam: '' },
          });
          setAlVoltooid(true);
        }
      } catch {
        router.push('/auth/login');
      } finally {
        setLoading(false);
      }
    };
    checkAuth();

    // Zichtbaarheid, geen sturing: laat zien hoe vol de agenda vandaag al is zodat de
    // focusblokken bewust gekozen worden — geen tijdvak-matching, geen automatische actie.
    api.calendar.today()
      .then((res) => { if (res?.configured) setMeetingCount(res.events?.length ?? 0); })
      .catch(() => {});

    // De Kikker kiest uit de eigen top-3 tijdvreters uit de onboarding — geen nieuw lijstje.
    fetch('/api/onboarding/profile', { headers: { Authorization: `Bearer ${AuthService.getToken()}` } })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        const wasters = data?.profile?.businessDna?.topTimeWasters;
        if (Array.isArray(wasters)) setTopTimeWasters(wasters);
      })
      .catch(() => {});
  }, [router, todayStr]);

  // Houdt het kikker-detailveld live bij tijdens het inspreken.
  useEffect(() => {
    if (kikkerSpeech.listening) setFormData((f) => ({ ...f, kikkerDetail: kikkerSpeech.transcript }));
  }, [kikkerSpeech.transcript, kikkerSpeech.listening]);

  const updateDankbaarheid = (index: number, value: string) => {
    const updated = [...formData.dankbaarheid];
    updated[index] = value;
    setFormData({ ...formData, dankbaarheid: updated });
  };

  const handleComplete = async () => {
    setSaving(true);
    try {
      const kikkerLabel = formData.kikkerCategory
        ? TIME_WASTER_OPTIONS.find((o) => o.value === formData.kikkerCategory)?.label ?? formData.kikkerCategory
        : '';
      const derivedIntentie = [kikkerLabel, formData.kikkerDetail].filter(Boolean).join(' — ') || formData.intentie;
      try {
        await api.logs.create({
          type: 'morning',
          date: todayStr,
          mode,
          ...formData,
          intentie: derivedIntentie,
        });
      } catch (err) {
        console.error('API save error:', err);
      }

      const token = localStorage.getItem('token');

      // Fire-and-forget: sessie analyse email + coach-reflectie (De Sparringpartner)
      if (token) {
        fetch('/api/email/sessie-analyse', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(formData),
        }).catch(() => {});
        fetch('/api/coach/analyse', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        }).catch(() => {});
      }

      setStep('done');
      setTimeout(() => { router.push('/dashboard'); }, 2000);
    } catch (err) {
      console.error('Save error:', err);
    } finally {
      setSaving(false);
    }
  };

  const currentIndex = STEPS.indexOf(step);
  const progressPct = step === 'done' ? 100 : ((currentIndex + 1) / STEPS.length) * 100;
  const isLastStep = step === 'affirmatie';

  const canGoNext = () => {
    if (step === 'dagtype') return formData.dayType !== null;
    if (step === 'intentie') return formData.kikkerCategory !== null;
    if (step === 'focusblokken') return formData.focusBlok1.category !== null && formData.focusBlok2.category !== null;
    if (step === 'dankbaarheid') return (formData.dankbaarheid ?? []).some((d) => (d ?? '').trim().length > 0);
    if (step === 'affirmatie') return (formData.affirmatie ?? '').trim().length > 0;
    return true;
  };

  const goNext = () => {
    const idx = STEPS.indexOf(step);
    if (idx < STEPS.length - 1) setStep(STEPS[idx + 1]);
    else handleComplete();
  };

  const goPrev = () => {
    const idx = STEPS.indexOf(step);
    if (idx > 0) setStep(STEPS[idx - 1]);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-card flex items-center justify-center">
        <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (alVoltooid && step === 'dagtype') {
    return (
      <div className="min-h-screen bg-surface-card pb-28">
        <div className="sticky top-0 z-10 bg-surface-card border-b border-line">
          <div className="max-w-lg mx-auto px-5 py-4 flex items-center gap-3">
            <Link href="/dashboard" className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-surface-sunken transition-colors">
              <ArrowLeft size={18} className="text-ink" />
            </Link>
            <div>
              <h1 className="text-[17px] font-semibold text-ink">Ochtend Ritueel</h1>
              <p className="text-[11px] text-ink-soft">Vandaag al voltooid</p>
            </div>
          </div>
        </div>
        <div className="max-w-lg mx-auto px-5 pt-6 space-y-4">
          <div className="rounded-[16px] bg-primary-muted border border-primary-light p-5 flex items-center gap-4">
            <CheckCircle size={28} className="text-primary flex-shrink-0" />
            <div>
              <p className="text-[15px] font-semibold text-ink">Goed gedaan vandaag!</p>
              <p className="text-[12px] text-on-surface-inverse/50 mt-0.5">Je ochtend ritueel is al voltooid voor {dateStr}.</p>
            </div>
          </div>

          {formData.intentie ? (
            <div className="rounded-[16px] border border-line p-5 space-y-4">
              {formData.dayType && (
                <div>
                  <p className="text-[11px] text-ink-soft uppercase tracking-widest mb-1">Dagtype</p>
                  <p className="text-[14px] font-semibold text-ink">
                    {DAY_TYPE_OPTIONS.find((o) => o.value === formData.dayType)?.label}
                  </p>
                </div>
              )}
              <div>
                <p className="text-[11px] text-ink-soft uppercase tracking-widest mb-1">De Kikker</p>
                <p className="text-[14px] text-ink leading-relaxed">{formData.intentie}</p>
              </div>
              {(formData.focusBlok1?.category || formData.focusBlok2?.category) ? (
                <div className="border-t border-surface-sunken pt-4 space-y-2">
                  <p className="text-[11px] text-ink-soft uppercase tracking-widest mb-2">Focus Blokken</p>
                  {formData.focusBlok1?.category ? (
                    <div className="flex items-start gap-3 bg-surface-sunken rounded-[12px] p-3">
                      <span className="text-[11px] font-bold text-primary bg-primary-muted px-2 py-0.5 rounded-md shrink-0">08:30</span>
                      <div>
                        <p className="text-[13px] font-semibold text-ink">{FOCUS_CATEGORY_OPTIONS.find((o) => o.value === formData.focusBlok1.category)?.label}</p>
                        {formData.focusBlok1.taaknaam ? <p className="text-[12px] text-ink-soft mt-0.5">{formData.focusBlok1.taaknaam}</p> : null}
                      </div>
                    </div>
                  ) : null}
                  {formData.focusBlok2?.category ? (
                    <div className="flex items-start gap-3 bg-surface-sunken rounded-[12px] p-3">
                      <span className="text-[11px] font-bold text-primary bg-primary-muted px-2 py-0.5 rounded-md shrink-0">12:30</span>
                      <div>
                        <p className="text-[13px] font-semibold text-ink">{FOCUS_CATEGORY_OPTIONS.find((o) => o.value === formData.focusBlok2.category)?.label}</p>
                        {formData.focusBlok2.taaknaam ? <p className="text-[12px] text-ink-soft mt-0.5">{formData.focusBlok2.taaknaam}</p> : null}
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}
              {formData.affirmatie ? (
                <div className="border-t border-surface-sunken pt-4">
                  <p className="text-[11px] text-ink-soft uppercase tracking-widest mb-1">Affirmatie</p>
                  <p className="text-[14px] text-primary italic leading-relaxed">&quot;{formData.affirmatie}&quot;</p>
                </div>
              ) : null}
              {formData.dankbaarheid?.some(d => d) ? (
                <div className="border-t border-surface-sunken pt-4">
                  <p className="text-[11px] text-ink-soft uppercase tracking-widest mb-2">Dankbaarheid</p>
                  <ul className="space-y-1">
                    {formData.dankbaarheid.filter(d => d).map((d, i) => (
                      <li key={i} className="text-[13px] text-ink flex items-start gap-2">
                        <span className="text-primary mt-0.5">✓</span>{d}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              <div className="border-t border-surface-sunken pt-4 flex gap-4">
                <div className="flex-1 text-center">
                  <p className="text-[11px] text-ink-soft">Energie</p>
                  <p className="text-[18px] font-bold text-primary">{formData.energyLevel}<span className="text-[12px] text-ink-soft">/10</span></p>
                </div>
                <div className="flex-1 text-center">
                  <p className="text-[11px] text-ink-soft">Slaap</p>
                  <p className="text-[18px] font-bold text-primary">{formData.sleepQuality}<span className="text-[12px] text-ink-soft">/10</span></p>
                </div>
              </div>
            </div>
          ) : null}

          <button
            onClick={() => setAlVoltooid(false)}
            className="w-full py-3.5 rounded-[14px] border border-line text-[14px] text-ink-soft font-medium active:scale-[0.98] transition-transform"
          >
            Opnieuw invullen
          </button>
        </div>
        <BottomNav />
      </div>
    );
  }

  if (step === 'done') {
    return (
      <div className="min-h-screen bg-surface-card flex items-center justify-center">
        <div className="text-center px-5">
          <div className="w-20 h-20 bg-primary-muted rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="text-primary" size={40} />
          </div>
          <h2 className="text-[24px] font-bold text-ink mb-2">Ochtend Ritueel Voltooid!</h2>
          <p className="text-[14px] text-ink-soft">Je dag is goed gestart.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-card pb-28">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-surface-card border-b border-line">
        <div className="max-w-lg mx-auto px-5 py-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard"
                className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-surface-sunken transition-colors"
              >
                <ArrowLeft size={18} className="text-ink" />
              </Link>
              <div>
                <h1 className="text-[17px] font-semibold text-ink">Ochtend Ritueel</h1>
                <p className="text-[11px] text-ink-soft">{STEP_LABELS[step]}</p>
              </div>
            </div>
            <span className="text-[12px] font-medium text-ink-soft bg-surface-sunken px-3 py-1 rounded-full">
              {currentIndex + 1}/{STEPS.length}
            </span>
          </div>
          <div className="h-1 w-full bg-surface-sunken rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-5 pt-5">

        {/* Step: Dagtype */}
        {step === 'dagtype' && (
          <div className="space-y-4">
            <div className="flex rounded-[14px] border border-line p-1 bg-surface-sunken">
              <button
                type="button"
                onClick={() => selectMode('full')}
                className={`flex-1 py-2.5 rounded-[10px] text-[13px] font-semibold transition-colors ${
                  mode === 'full' ? 'bg-primary text-white' : 'text-ink-soft'
                }`}
              >
                Volledig
              </button>
              <button
                type="button"
                onClick={() => selectMode('quick')}
                className={`flex-1 py-2.5 rounded-[10px] text-[13px] font-semibold transition-colors ${
                  mode === 'quick' ? 'bg-primary text-white' : 'text-ink-soft'
                }`}
              >
                Snel (2 min)
              </button>
            </div>
            {mode === 'quick' && (
              <p className="text-[12px] text-ink-soft px-1 -mt-2">
                Focusblokken en slaap/energie sla je nu over — je kunt altijd terugschakelen naar Volledig.
              </p>
            )}

            <div className="rounded-[16px] bg-surface-inverse p-5">
              <div className="flex items-center gap-2 mb-2">
                <Mountain size={18} className="text-tertiary" />
                <span className="text-[11px] text-white/40 uppercase tracking-widest">
                  {dayName}, {dateStr}
                </span>
              </div>
              <p className="text-[17px] text-white font-semibold">Wat voor dag wordt het?</p>
              <p className="text-[13px] text-white/50 mt-1">Kies bewust — dat voorkomt dat alles door elkaar loopt.</p>
            </div>

            <div className="space-y-2.5">
              {DAY_TYPE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, dayType: opt.value })}
                  className={`w-full text-left rounded-[16px] border p-4 transition-colors ${
                    formData.dayType === opt.value
                      ? 'border-primary bg-primary-muted'
                      : 'border-line bg-surface-sunken'
                  }`}
                >
                  <p className="text-[14px] font-semibold text-ink">{opt.label}</p>
                  <p className="text-[12px] text-ink-soft mt-0.5">{opt.description}</p>
                </button>
              ))}
            </div>

            {formData.dayType && formData.dayType !== 'free' && (
              <div className="rounded-[16px] border border-line p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Sun size={16} className="text-tertiary" />
                  <span className="text-[14px] font-semibold text-ink">Pre-work rituelen</span>
                </div>
                <div className="space-y-2.5">
                  {([
                    { key: 'daylight' as const, icon: Sun, label: 'Daglicht gehad (5-30 min)' },
                    { key: 'hydration' as const, icon: GlassWater, label: 'Water met elektrolyten' },
                    { key: 'caffeineDelay' as const, icon: Coffee, label: 'Cafeïne nog uitgesteld' },
                  ]).map(({ key, icon: Icon, label }) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setFormData({ ...formData, preWork: { ...formData.preWork, [key]: !formData.preWork[key] } })}
                      className={`w-full flex items-center gap-3 rounded-[12px] px-4 py-3 transition-colors ${
                        formData.preWork[key] ? 'bg-primary-muted' : 'bg-surface-sunken'
                      }`}
                    >
                      <Icon size={15} className={formData.preWork[key] ? 'text-primary' : 'text-ink-soft'} />
                      <span className="text-[13px] text-ink flex-1 text-left">{label}</span>
                      {formData.preWork[key] && <CheckCircle size={15} className="text-primary" />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step: Centering — de poortwachter vóór intentie/focusblokken/statuspeiling */}
        {step === 'centering' && (
          <div className="space-y-4">
            <div className="rounded-[16px] bg-surface-inverse p-5">
              <div className="flex items-center gap-2 mb-2">
                <Brain size={18} className="text-primary" />
                <span className="text-[11px] text-white/40 uppercase tracking-widest">Vóór de rest van je ochtend</span>
              </div>
              <p className="text-[17px] text-white font-semibold">Even landen.</p>
              <p className="text-[13px] text-white/50 mt-1">
                Drie minuten rust, zodat je intentie en focusblokken zo dadelijk vanuit kalmte komen — niet vanuit ochtendhaast.
              </p>
            </div>
            {getMeditationsByCategory('ochtend').map((meditation) => (
              <MeditationPlayer key={meditation.id} meditation={meditation} />
            ))}
            <p className="text-center text-[12px] text-ink-soft px-2">
              Liever meteen door? Dat kan — tik gewoon op Volgende.
            </p>
          </div>
        )}

        {/* Step: De Kikker (vermijdings-check) */}
        {step === 'intentie' && (
          <div className="space-y-4">
            <div className="rounded-[16px] bg-surface-inverse p-5">
              <div className="flex items-center gap-2 mb-2">
                <Sunrise size={18} className="text-primary" />
                <span className="text-[11px] text-white/40 uppercase tracking-widest">
                  {dayName}, {dateStr}
                </span>
              </div>
              <p className="text-[17px] text-white font-semibold">Wat is je kikker vandaag?</p>
              <p className="text-[13px] text-white/50 mt-1">De moeilijkste commerciële of operationele taak — kies 'm nu, geen uitstel.</p>
            </div>
            <div className="rounded-[16px] border border-line p-5">
              <div className="flex items-center gap-2 mb-3">
                <Target size={16} className="text-primary" />
                <span className="text-[14px] font-semibold text-ink">Kies uit je eigen tijdvreters</span>
              </div>
              {topTimeWasters.length === 0 ? (
                <p className="text-[12px] text-ink-soft">Nog geen tijdvreters bekend — vul je Bedrijfs-DNA aan in Instellingen.</p>
              ) : (
                <div className="space-y-2">
                  {topTimeWasters.map((value) => {
                    const label = TIME_WASTER_OPTIONS.find((o) => o.value === value)?.label ?? value;
                    const selected = formData.kikkerCategory === value;
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setFormData({ ...formData, kikkerCategory: value })}
                        className={`w-full text-left rounded-[12px] px-4 py-3 text-[13px] transition-colors ${
                          selected ? 'bg-primary-muted text-primary font-medium' : 'bg-surface-sunken text-ink'
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="mt-4 pt-4 border-t border-surface-sunken">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={formData.kikkerDetail}
                    onChange={(e) => setFormData({ ...formData, kikkerDetail: e.target.value })}
                    placeholder={kikkerSpeech.listening ? 'Ik luister...' : 'Optioneel: wie of wat precies?'}
                    disabled={kikkerSpeech.listening}
                    className="flex-1 px-4 py-3 bg-surface-sunken border border-line focus:border-primary outline-none rounded-[12px] text-[14px] text-ink placeholder-ink-soft transition-colors"
                  />
                  {kikkerSpeech.supported && (
                    <button
                      type="button"
                      onClick={() => (kikkerSpeech.listening ? kikkerSpeech.stop() : kikkerSpeech.start())}
                      className={`w-11 h-11 rounded-[12px] flex items-center justify-center shrink-0 transition-colors ${
                        kikkerSpeech.listening ? 'bg-red-500 text-white animate-pulse' : 'bg-surface-sunken text-ink'
                      }`}
                    >
                      <Mic size={16} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step: Focus Blokken */}
        {step === 'focusblokken' && (
          <div className="space-y-4">
            <div className="rounded-[16px] bg-surface-inverse p-5">
              <div className="flex items-center gap-2 mb-2">
                <Brain size={18} className="text-primary" />
                <span className="text-[11px] text-white/40 uppercase tracking-widest">Deep Work Planning</span>
              </div>
              <p className="text-[17px] text-white font-semibold">Jouw 2 focusblokken vandaag</p>
              <p className="text-[13px] text-white/50 mt-1">Besluit nu — zodat je straks direct begint.</p>
              {meetingCount !== null && (
                <p className="text-[12px] text-primary mt-3 flex items-center gap-1.5">
                  <CalendarClock size={13} />
                  {meetingCount === 0
                    ? 'Geen vergaderingen vandaag in je agenda'
                    : `Je hebt vandaag al ${meetingCount} ${meetingCount === 1 ? 'afspraak' : 'afspraken'} in je agenda`}
                </p>
              )}
            </div>

            {/* Blok 1 */}
            <div className="rounded-[16px] border border-line p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-[8px] bg-surface-inverse flex items-center justify-center">
                    <span className="text-[11px] font-bold text-white">1</span>
                  </div>
                  <span className="text-[14px] font-semibold text-ink">Focusblok 1</span>
                </div>
                <span className="text-[12px] font-semibold text-primary bg-primary-muted px-3 py-1 rounded-full">
                  08:30 – 10:00
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {FOCUS_CATEGORY_OPTIONS.map((o) => (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, focusBlok1: { ...formData.focusBlok1, category: o.value } })}
                    className={`text-[13px] px-3.5 py-2 rounded-full border transition-colors ${
                      formData.focusBlok1.category === o.value
                        ? 'border-primary bg-primary-muted text-primary font-medium'
                        : 'border-line text-ink hover:border-primary/50'
                    }`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
              <div>
                <input
                  type="text"
                  value={formData.focusBlok1.taaknaam}
                  onChange={(e) => setFormData({ ...formData, focusBlok1: { ...formData.focusBlok1, taaknaam: e.target.value.slice(0, 50) } })}
                  placeholder="Optioneel: taaknaam (max 50 tekens)"
                  maxLength={50}
                  className="w-full px-4 py-3 bg-surface-sunken border border-line focus:border-primary outline-none rounded-[12px] text-[14px] text-ink placeholder-ink-soft transition-colors"
                />
              </div>
            </div>

            {/* Blok 2 */}
            <div className="rounded-[16px] border border-line p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-[8px] bg-surface-inverse flex items-center justify-center">
                    <span className="text-[11px] font-bold text-white">2</span>
                  </div>
                  <span className="text-[14px] font-semibold text-ink">Focusblok 2</span>
                </div>
                <span className="text-[12px] font-semibold text-primary bg-primary-muted px-3 py-1 rounded-full">
                  12:30 – 14:00
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {FOCUS_CATEGORY_OPTIONS.map((o) => (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, focusBlok2: { ...formData.focusBlok2, category: o.value } })}
                    className={`text-[13px] px-3.5 py-2 rounded-full border transition-colors ${
                      formData.focusBlok2.category === o.value
                        ? 'border-primary bg-primary-muted text-primary font-medium'
                        : 'border-line text-ink hover:border-primary/50'
                    }`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
              <div>
                <input
                  type="text"
                  value={formData.focusBlok2.taaknaam}
                  onChange={(e) => setFormData({ ...formData, focusBlok2: { ...formData.focusBlok2, taaknaam: e.target.value.slice(0, 50) } })}
                  placeholder="Optioneel: taaknaam (max 50 tekens)"
                  maxLength={50}
                  className="w-full px-4 py-3 bg-surface-sunken border border-line focus:border-primary outline-none rounded-[12px] text-[14px] text-ink placeholder-ink-soft transition-colors"
                />
              </div>
            </div>

            <p className="text-center text-[12px] text-ink-soft italic px-2">
              "Success is doing a few things well, consistently." — Tony Robbins
            </p>
          </div>
        )}

        {/* Step: Status */}
        {step === 'status' && (
          <div className="rounded-[16px] border border-line p-5 space-y-6">
            <div className="flex items-center gap-2 mb-1">
              <Zap size={16} className="text-tertiary" />
              <span className="text-[14px] font-semibold text-ink">Hoe voel je je vandaag?</span>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[13px] text-ink">Slaap kwaliteit</span>
                <span className="text-[13px] font-semibold text-primary">{formData.sleepQuality}/10</span>
              </div>
              <div className="relative h-2 bg-surface-sunken rounded-full">
                <div
                  className="absolute inset-y-0 left-0 bg-primary rounded-full transition-all"
                  style={{ width: `${(formData.sleepQuality / 10) * 100}%` }}
                />
                <input
                  type="range" min="1" max="10" value={formData.sleepQuality}
                  onChange={(e) => setFormData({ ...formData, sleepQuality: parseInt(e.target.value) })}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[13px] text-ink">Energie niveau</span>
                <span className="text-[13px] font-semibold text-primary">{formData.energyLevel}/10</span>
              </div>
              <div className="relative h-2 bg-surface-sunken rounded-full">
                <div
                  className="absolute inset-y-0 left-0 bg-primary rounded-full transition-all"
                  style={{ width: `${(formData.energyLevel / 10) * 100}%` }}
                />
                <input
                  type="range" min="1" max="10" value={formData.energyLevel}
                  onChange={(e) => setFormData({ ...formData, energyLevel: parseInt(e.target.value) })}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-[13px] text-ink mb-2">Hoe laat ben je gaan slapen?</label>
                <input
                  type="time"
                  value={formData.sleepTime}
                  onChange={(e) => setFormData({ ...formData, sleepTime: e.target.value })}
                  className="w-full px-4 py-3 bg-surface-sunken border border-line focus:border-primary outline-none rounded-[12px] text-[14px] text-ink transition-colors"
                />
              </div>
              <div className="flex-1">
                <label className="block text-[13px] text-ink mb-2">Hoe laat ben je wakker geworden?</label>
                <input
                  type="time"
                  value={formData.wakeTime}
                  onChange={(e) => setFormData({ ...formData, wakeTime: e.target.value })}
                  className="w-full px-4 py-3 bg-surface-sunken border border-line focus:border-primary outline-none rounded-[12px] text-[14px] text-ink transition-colors"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step: Dankbaarheid */}
        {step === 'dankbaarheid' && (
          <div className="rounded-[16px] border border-line p-5">
            <div className="flex items-center gap-2 mb-4">
              <Heart size={16} className="text-tertiary" />
              <span className="text-[14px] font-semibold text-ink">3 dingen waar ik dankbaar voor ben</span>
            </div>

            <div className="mb-4">
              <p className="text-[11px] text-ink-soft mb-2">Niets bij te bedenken? Tik een suggestie aan:</p>
              <div className="flex flex-wrap gap-2">
                {dailyGratitudePresets.map((preset) => {
                  const alreadyUsed = formData.dankbaarheid.includes(preset);
                  const firstEmptyIndex = formData.dankbaarheid.findIndex((d) => !d.trim());
                  return (
                    <button
                      key={preset}
                      type="button"
                      disabled={alreadyUsed || firstEmptyIndex === -1}
                      onClick={() => updateDankbaarheid(firstEmptyIndex, preset)}
                      className={`px-3 py-1.5 rounded-full text-[12px] border transition-colors ${
                        alreadyUsed
                          ? 'border-primary-light bg-primary-muted text-primary'
                          : 'border-line bg-surface-sunken text-ink-soft disabled:opacity-40'
                      }`}
                    >
                      {preset}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-3">
              {[0, 1, 2].map((index) => (
                <div key={index} className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-full bg-surface-sunken text-ink-soft text-[11px] font-bold flex items-center justify-center flex-shrink-0">
                    {index + 1}
                  </span>
                  <input
                    type="text"
                    value={formData.dankbaarheid[index]}
                    onChange={(e) => updateDankbaarheid(index, e.target.value)}
                    placeholder="Ik ben dankbaar voor..."
                    className="flex-1 px-4 py-3 bg-surface-sunken border border-line focus:border-primary outline-none rounded-[12px] text-[14px] text-ink placeholder-ink-soft transition-colors"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step: Affirmatie */}
        {step === 'affirmatie' && (
          <div className="space-y-4">
            <div className="rounded-[16px] bg-surface-inverse p-5">
              <p className="text-[13px] text-white/50 leading-relaxed">
                Een krachtige affirmatie zet je neurale netwerk klaar voor succes. Schrijf vanuit geloof, niet vanuit verlangen.
              </p>
            </div>
            <div className="rounded-[16px] border border-line p-5">
              <div className="flex items-center gap-2 mb-3">
                <Zap size={16} className="text-tertiary" />
                <span className="text-[14px] font-semibold text-ink">Mijn affirmatie voor vandaag</span>
              </div>
              <textarea
                value={formData.affirmatie}
                onChange={(e) => setFormData({ ...formData, affirmatie: e.target.value })}
                placeholder="Ik ben... Ik heb... Ik bereik..."
                rows={4}
                className="w-full resize-none bg-surface-sunken border border-line focus:border-primary outline-none rounded-[12px] px-4 py-3 text-[14px] text-ink placeholder-ink-soft transition-colors"
              />
              <p className="text-[11px] text-ink-soft mt-3 italic">
                Tip: Schrijf in de tegenwoordige tijd. Bijv: &quot;Ik ben een krachtige, impactvolle ondernemer.&quot;
              </p>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex gap-3 mt-6">
          {currentIndex > 0 && (
            <button
              onClick={goPrev}
              className="flex-1 py-3.5 rounded-[14px] border border-line text-[14px] font-medium text-ink-soft active:scale-[0.98] transition-transform"
            >
              Vorige
            </button>
          )}
          <button
            onClick={goNext}
            disabled={!canGoNext() || saving}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-primary text-white text-[14px] font-semibold rounded-[14px] active:scale-[0.98] transition-transform disabled:opacity-40 shadow-[0_2px_12px_rgba(81,96,80,0.3)]"
          >
            {saving ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : isLastStep ? (
              <>
                <CheckCircle size={16} />
                Voltooien
              </>
            ) : (
              <>
                Volgende
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </div>

        {/* Step dots */}
        <div className="flex justify-center gap-2 mt-5">
          {STEPS.map((s, i) => (
            <div
              key={s}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === currentIndex
                  ? 'w-5 bg-primary'
                  : i < currentIndex
                  ? 'w-1.5 bg-primary/40'
                  : 'w-1.5 bg-line'
              }`}
            />
          ))}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
