'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { ArrowRight, ArrowLeft, Check, Clock, ShieldAlert, AlertTriangle } from 'lucide-react';
import { REALITY_CHECK_QUESTIONS } from '@/lib/reality-check';

const LEVEL_OPTIONS = [
  'Directeur / Eigenaar',
  'C-level / MT-lid',
  'Ondernemer / ZZP',
  'Anders',
];

type Step = 'intro' | number | 'gate' | 'result';

interface ResultData {
  score: number;
  maxScore: number;
  profile: { key: string; label: string; tagline: string; annualHoursRange: string };
  weeklyHoursLost: number;
  monthlyHoursLost: number;
  contradictionRisk: string;
  diagnoses: string[];
}

function Logo({ size = 26 }: { size?: number }) {
  return (
    <Image src="/logo.png" alt="Sparren.app logo" width={size} height={size} className="rounded-[6px]" priority />
  );
}

export default function RealityCheckPage() {
  const [step, setStep] = useState<Step>('intro');
  const [answers, setAnswers] = useState<(number | null)[]>(Array(REALITY_CHECK_QUESTIONS.length).fill(null));
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [level, setLevel] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ResultData | null>(null);

  const totalQuestions = REALITY_CHECK_QUESTIONS.length;

  const selectAnswer = (optionIndex: number) => {
    if (typeof step !== 'number') return;
    const next = [...answers];
    next[step] = optionIndex;
    setAnswers(next);
    setTimeout(() => {
      if (step < totalQuestions - 1) setStep(step + 1);
      else setStep('gate');
    }, 220);
  };

  const goBack = () => {
    if (typeof step === 'number' && step > 0) setStep(step - 1);
    else if (step === 0) setStep('intro');
    else if (step === 'gate') setStep(totalQuestions - 1);
  };

  const submit = async () => {
    setError(null);
    if (!email.trim() || !level) {
      setError('Vul je zakelijke e-mailadres en directieniveau in.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/reality-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), name: name.trim() || undefined, level, answers }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Er ging iets mis. Probeer het opnieuw.');
        return;
      }
      setResult(data);
      setStep('result');
    } catch {
      setError('Er ging iets mis. Probeer het opnieuw.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-ink font-sans">
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-line">
        <div className="max-w-lg mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <Logo size={26} />
            <span className="text-[15px] font-bold tracking-tight">Sparren.app</span>
          </Link>
          {typeof step === 'number' && (
            <span className="text-[12px] font-semibold text-ink-soft tabular-nums">
              {step + 1} / {totalQuestions}
            </span>
          )}
        </div>
        {typeof step === 'number' && (
          <div className="h-1 bg-surface-sunken">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${((step + 1) / totalQuestions) * 100}%` }}
            />
          </div>
        )}
      </nav>

      <div className="max-w-lg mx-auto px-6 py-10">
        {step === 'intro' && (
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-primary-light bg-primary-muted mb-8">
              <Clock size={12} className="text-primary" />
              <span className="text-[11px] font-semibold text-primary-dark tracking-wide">2 minuten · 6 vragen</span>
            </div>
            <h1 className="text-[36px] sm:text-[44px] font-bold leading-[1.1] tracking-tight mb-4">
              De Executive Reality Check
            </h1>
            <p className="text-[15px] text-ink-soft leading-relaxed mb-10">
              Zes scherpe vragen die je blinde vlekken blootleggen: waar je regie kwijt bent, hoeveel uren per week het je kost en hoe kwetsbaar je organisatie is zonder tegenspraak.
            </p>
            <button
              onClick={() => setStep(0)}
              className="group w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-primary text-white font-bold text-[15px] shadow-[0_4px_24px_rgba(81,96,80,0.35)] hover:bg-primary-dark active:scale-[0.98] transition-all"
            >
              Start de Reality Check
              <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        )}

        {typeof step === 'number' && (
          <div>
            <h2 className="text-[20px] sm:text-[22px] font-bold leading-snug mb-6">
              {REALITY_CHECK_QUESTIONS[step].title}
            </h2>
            <div className="space-y-3">
              {REALITY_CHECK_QUESTIONS[step].options.map((opt, i) => {
                const selected = answers[step] === i;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => selectAnswer(i)}
                    className={`w-full text-left rounded-[14px] border-2 px-5 py-4 text-[14px] leading-relaxed transition-colors ${
                      selected
                        ? 'border-primary bg-primary-muted text-primary-dark font-medium'
                        : 'border-line hover:border-primary-light text-ink'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
            {step > 0 && (
              <button
                onClick={goBack}
                className="mt-6 inline-flex items-center gap-1.5 text-[13px] text-ink-soft hover:text-ink transition-colors"
              >
                <ArrowLeft size={14} /> Vorige vraag
              </button>
            )}
          </div>
        )}

        {step === 'gate' && (
          <div>
            <h2 className="text-[26px] font-bold leading-snug mb-2">Je resultaat is klaar</h2>
            <p className="text-[14px] text-ink-soft mb-8 leading-relaxed">
              Vul je gegevens in om je Focus-Score, je geschatte jaarlijkse urenverlies en je persoonlijke diagnose direct te zien.
            </p>
            <div className="space-y-4">
              <div>
                <label className="text-[12px] font-semibold text-ink-soft mb-1.5 block">Naam (optioneel)</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3.5 bg-surface-sunken border border-line focus:border-primary outline-none rounded-[12px] text-[14px] text-ink placeholder-ink-soft transition-colors"
                  placeholder="Je naam"
                />
              </div>
              <div>
                <label className="text-[12px] font-semibold text-ink-soft mb-1.5 block">Zakelijk e-mailadres *</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3.5 bg-surface-sunken border border-line focus:border-primary outline-none rounded-[12px] text-[14px] text-ink placeholder-ink-soft transition-colors"
                  placeholder="naam@bedrijf.nl"
                />
              </div>
              <div>
                <label className="text-[12px] font-semibold text-ink-soft mb-1.5 block">Directieniveau *</label>
                <div className="grid grid-cols-2 gap-2.5">
                  {LEVEL_OPTIONS.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setLevel(opt)}
                      className={`rounded-[12px] border-2 px-3 py-3 text-[12.5px] font-medium transition-colors ${
                        level === opt ? 'border-primary bg-primary-muted text-primary-dark' : 'border-line text-ink hover:border-primary-light'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
              {error && <p className="text-[13px] text-red-600">{error}</p>}
              <button
                onClick={submit}
                disabled={submitting}
                className="w-full inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-primary text-white font-bold text-[15px] shadow-[0_4px_24px_rgba(81,96,80,0.35)] hover:bg-primary-dark active:scale-[0.98] transition-all disabled:opacity-60"
              >
                {submitting ? 'Bezig met analyseren...' : 'Toon mijn resultaat'}
                {!submitting && <ArrowRight size={16} />}
              </button>
              <p className="text-[11px] text-ink-soft text-center">
                We gebruiken je gegevens alleen om je resultaat te sturen en op te volgen. Geen spam.
              </p>
            </div>
            <button
              onClick={goBack}
              className="mt-6 inline-flex items-center gap-1.5 text-[13px] text-ink-soft hover:text-ink transition-colors"
            >
              <ArrowLeft size={14} /> Terug naar vragen
            </button>
          </div>
        )}

        {step === 'result' && result && (
          <div>
            <div className="rounded-[24px] bg-surface-inverse p-7 sm:p-9">
              <p className="text-[10px] font-bold text-primary-light uppercase tracking-[0.18em] mb-3">
                Executive Reality Check &middot; Audit Rapport
              </p>
              <p className="text-[13px] text-on-surface-inverse/60 mb-1">
                Score: {result.score}/{result.maxScore}
              </p>
              <h2 className="text-[26px] sm:text-[30px] font-bold text-white leading-tight mb-3">
                {result.profile.label}
              </h2>
              <p className="text-[15px] text-on-surface-inverse/80 leading-relaxed">
                {result.profile.tagline}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-7">
                <div className="rounded-[16px] bg-white/8 border border-white/10 p-4">
                  <p className="text-[10px] font-bold text-on-surface-inverse/50 uppercase tracking-widest mb-1.5">Geschat verloren tijd</p>
                  <p className="text-[20px] font-bold text-white">{result.weeklyHoursLost} uur / week</p>
                  <p className="text-[12px] text-on-surface-inverse/60 mt-0.5">≈ {result.monthlyHoursLost} uur per maand</p>
                </div>
                <div className="rounded-[16px] bg-white/8 border border-white/10 p-4">
                  <p className="text-[10px] font-bold text-on-surface-inverse/50 uppercase tracking-widest mb-1.5">Status tegenspraak</p>
                  <p className="text-[20px] font-bold text-white flex items-center gap-1.5">
                    <ShieldAlert size={16} className="text-primary-light" /> {result.contradictionRisk}
                  </p>
                  <p className="text-[12px] text-on-surface-inverse/60 mt-0.5">Ja-knikker risico</p>
                </div>
              </div>
            </div>

            {result.diagnoses.length > 0 && (
              <div className="rounded-[20px] border border-line p-6 mt-5">
                <p className="text-[11px] font-bold text-primary uppercase tracking-[0.18em] mb-4">De diagnose van de spiegel</p>
                <div className="space-y-3.5">
                  {result.diagnoses.map((d, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <AlertTriangle size={15} className="text-tertiary shrink-0 mt-0.5" />
                      <p className="text-[13.5px] text-ink leading-relaxed">{d}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="rounded-[20px] bg-primary-muted border border-primary-light p-6 mt-5 text-center">
              <p className="text-[15px] font-bold text-ink mb-2">Stop met geleefd worden.</p>
              <p className="text-[13px] text-ink-soft mb-6 leading-relaxed">
                Bespreek je uitslag in een Strategische Debrief Call — geen verkoopgesprek, we leggen de zaag direct op jouw knelpunten.
              </p>
              <Link
                href="/auth/register"
                className="group inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-primary text-white font-bold text-[14px] shadow-[0_4px_16px_rgba(81,96,80,0.3)] hover:bg-primary-dark active:scale-[0.98] transition-all"
              >
                Boek je Strategische Debrief Call
                <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>

            <div className="flex items-center justify-center gap-2 mt-6 text-[12px] text-ink-soft">
              <Check size={13} className="text-primary" />
              Gemaakt door en voor ondernemers.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
