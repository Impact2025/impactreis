'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { AuthService } from '@/lib/auth';
import {
  COACH_PERSONAS,
  INDUSTRY_OPTIONS,
  TEAM_SIZE_OPTIONS,
  BUSINESS_MODEL_OPTIONS,
  TIME_WASTER_OPTIONS,
  AVOIDANCE_BEHAVIOR_OPTIONS,
  LEVERAGE_GOAL_OPTIONS,
  CONSEQUENCE_PRESETS,
  labelFor,
  type UserOnboardingProfile,
} from '@/lib/onboarding';
import { ChipButton, CardOption, CheckRow } from '@/components/ui/dna-controls';

const TOTAL_STEPS = 7;

type Gender = 'male' | 'female';

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [checking, setChecking] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [gender, setGender] = useState<Gender | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [industry, setIndustry] = useState<string | null>(null);
  const [teamSize, setTeamSize] = useState<string | null>(null);
  const [businessModel, setBusinessModel] = useState<string | null>(null);
  const [topTimeWasters, setTopTimeWasters] = useState<string[]>([]);
  const [avoidanceBehavior, setAvoidanceBehavior] = useState<string | null>(null);
  const [leverageGoal, setLeverageGoal] = useState<string | null>(null);
  const [painfulConsequence, setPainfulConsequence] = useState('');
  const [meditationsEnabled, setMeditationsEnabled] = useState(true);

  // Coach-verdieping op de consequentie (stap 7): optioneel, max 2 vragen. Volledig additief —
  // blokkeert nooit "Activeer mijn werkruimte", dat blijft alleen aan painfulConsequence hangen.
  type DeepeningMessage = { role: 'user' | 'assistant'; content: string };
  const [deepeningActive, setDeepeningActive] = useState(false);
  const [deepeningSkipped, setDeepeningSkipped] = useState(false);
  const [deepeningMessages, setDeepeningMessages] = useState<DeepeningMessage[]>([]);
  const [deepeningLoading, setDeepeningLoading] = useState(false);
  const [deepeningAnswer, setDeepeningAnswer] = useState('');
  const [deepeningClosed, setDeepeningClosed] = useState(false);

  const questionCount = deepeningMessages.filter((m) => m.role === 'assistant').length;
  const showAnswerInput = deepeningActive && !deepeningClosed && !deepeningLoading && deepeningMessages[deepeningMessages.length - 1]?.role === 'assistant';

  function buildDeepeningSystemPrompt(turn: 1 | 2): string {
    const name = displayName.trim() || (gender ? COACH_PERSONAS[gender].defaultName : 'Coach');
    const industryLabel = industry ? labelFor(INDUSTRY_OPTIONS, industry) : 'onbekende sector';
    const goalLabel = LEVERAGE_GOAL_OPTIONS.find((o) => o.value === leverageGoal)?.label ?? 'onbekend doel';
    const base = `Je bent ${name}, een ${gender === 'female' ? 'vrouwelijke' : 'mannelijke'} business-challenger-coach met een directe, scherpe, no-nonsense toon. Je coacht een ondernemer in ${industryLabel}, kwartaaldoel: ${goalLabel}.\n\nDe ondernemer noemt deze consequentie als die het kwartaaldoel mist:\n"${painfulConsequence.trim()}"\n\n`;
    if (turn === 1) {
      return base + 'Stel EXACT 1 scherpe, doorvragende vraag (max 2 zinnen) die de ondernemer dwingt concreter te worden over waarom dit pijn doet of wie het zou merken. Geen advies, geen samenvatting, geen inleiding — begin direct met de vraag.';
    }
    return base + 'Dit is je laatste kans om door te vragen. Als het antwoord van de ondernemer hierboven al scherp en concreet is, sluit af met een korte bevestiging (max 1 zin, zonder vraagteken, geen advies, geen vervolgvraag). Alleen als het antwoord nog vaag is, stel dan 1 laatste scherpe vraag (max 2 zinnen).';
  }

  async function streamCoachReply(messages: DeepeningMessage[], systemPrompt: string): Promise<string> {
    const res = await fetch('/api/onboarding/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${AuthService.getToken()}` },
      body: JSON.stringify({ messages, systemPrompt }),
    });
    if (!res.ok || !res.body) throw new Error('Kon geen antwoord ophalen');
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let text = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      text += decoder.decode(value, { stream: true });
    }
    return text.trim();
  }

  const startDeepening = async () => {
    if (!painfulConsequence.trim()) return;
    setDeepeningActive(true);
    setDeepeningLoading(true);
    const opening: DeepeningMessage[] = [{ role: 'user', content: painfulConsequence.trim() }];
    setDeepeningMessages(opening);
    try {
      const reply = await streamCoachReply(opening, buildDeepeningSystemPrompt(1));
      setDeepeningMessages([...opening, { role: 'assistant', content: reply }]);
    } catch {
      setDeepeningActive(false);
    } finally {
      setDeepeningLoading(false);
    }
  };

  const submitDeepeningAnswer = async () => {
    if (!deepeningAnswer.trim()) return;
    const answer = deepeningAnswer.trim();
    const withAnswer = [...deepeningMessages, { role: 'user' as const, content: answer }];
    setDeepeningMessages(withAnswer);
    setDeepeningAnswer('');

    if (questionCount >= 2) {
      // Harde cap: na 2 vragen sluiten we lokaal af, geen 3e model-call.
      setDeepeningClosed(true);
      return;
    }

    setDeepeningLoading(true);
    try {
      const reply = await streamCoachReply(withAnswer, buildDeepeningSystemPrompt(2));
      setDeepeningMessages([...withAnswer, { role: 'assistant', content: reply }]);
      if (!reply.trim().endsWith('?')) setDeepeningClosed(true);
    } catch {
      setDeepeningClosed(true);
    } finally {
      setDeepeningLoading(false);
    }
  };

  const deepeningForProfile = () => {
    const pairs: { question: string; answer: string }[] = [];
    for (let i = 1; i < deepeningMessages.length; i += 1) {
      const msg = deepeningMessages[i];
      const prev = deepeningMessages[i - 1];
      if (msg.role === 'user' && prev.role === 'assistant') pairs.push({ question: prev.content, answer: msg.content });
    }
    return pairs.length > 0 ? pairs : undefined;
  };

  useEffect(() => {
    if (!AuthService.isAuthenticated()) { router.push('/auth/login'); return; }
    (async () => {
      try {
        const res = await fetch('/api/onboarding/profile', {
          headers: { Authorization: `Bearer ${AuthService.getToken()}` },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.completed) { router.push('/dashboard'); return; }
        }
      } catch {
        // kon status niet ophalen — laat gewoon de wizard zien
      } finally {
        setChecking(false);
      }
    })();
  }, [router]);

  const toggleTimeWaster = (value: string) => {
    setTopTimeWasters((prev) => {
      if (prev.includes(value)) return prev.filter((v) => v !== value);
      if (prev.length >= 3) return prev;
      return [...prev, value];
    });
  };

  const canProceed = (): boolean => {
    switch (step) {
      case 1: return gender !== null;
      case 2: return displayName.trim().length > 0;
      case 3: return industry !== null && teamSize !== null && businessModel !== null;
      case 4: return topTimeWasters.length > 0;
      case 5: return avoidanceBehavior !== null;
      case 6: return leverageGoal !== null;
      case 7: return painfulConsequence.trim().length > 0;
      default: return false;
    }
  };

  const submit = async () => {
    if (!gender || !displayName.trim() || !industry || !teamSize || !businessModel || !avoidanceBehavior || !leverageGoal || !painfulConsequence.trim()) return;
    setSubmitting(true);
    setError(null);
    const goalOption = LEVERAGE_GOAL_OPTIONS.find((o) => o.value === leverageGoal);
    const profile: UserOnboardingProfile = {
      coachProfile: {
        gender,
        displayName: displayName.trim(),
        voiceId: COACH_PERSONAS[gender].voiceId,
        toneSeverity: 'high_challenger',
      },
      businessDna: {
        industry: industry as UserOnboardingProfile['businessDna']['industry'],
        teamSize: teamSize as UserOnboardingProfile['businessDna']['teamSize'],
        businessModel: businessModel as UserOnboardingProfile['businessDna']['businessModel'],
        topTimeWasters: topTimeWasters as UserOnboardingProfile['businessDna']['topTimeWasters'],
        avoidanceBehavior: avoidanceBehavior as UserOnboardingProfile['businessDna']['avoidanceBehavior'],
        quarterlyLeverageGoal: leverageGoal as UserOnboardingProfile['businessDna']['quarterlyLeverageGoal'],
      },
      consequenceModule: {
        description: painfulConsequence.trim(),
        deepening: deepeningForProfile(),
      },
      assistantPreferences: {
        morningBriefingTime: '08:00',
        eveningReviewTime: '17:30',
        deliveryChannel: 'in_app',
        coachingTone: 'direct_and_challenging',
      },
      impactProfile: {
        missionStatement: '',
        targetBeneficiaries: '',
        quarterlyLeverageGoal: goalOption?.label ?? '',
        targetDeadline: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      },
    };

    try {
      const token = AuthService.getToken();
      const res = await fetch('/api/onboarding/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(profile),
      });
      if (!res.ok) { setError('Kon je profiel niet opslaan. Probeer het opnieuw.'); return; }
      await fetch('/api/ritual-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ meditationsEnabled }),
      }).catch(() => {});
      router.push('/dashboard');
    } catch {
      setError('Er ging iets mis. Probeer het opnieuw.');
    } finally {
      setSubmitting(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="sticky top-0 z-10 bg-white border-b border-line px-5 py-4">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <Image src="/logo.png" alt="Sparren.app logo" width={36} height={36} className="rounded-full" priority />
          <div className="flex-1">
            <p className="text-[14px] font-semibold text-ink">Sparren.app</p>
            <p className="text-[11px] text-ink-soft">Stap {step} van {TOTAL_STEPS} — je Bedrijfs-DNA</p>
          </div>
        </div>
        <div className="max-w-lg mx-auto mt-3 h-1 bg-surface-sunken rounded-full overflow-hidden">
          <div className="h-full bg-primary transition-all duration-300" style={{ width: `${(step / TOTAL_STEPS) * 100}%` }} />
        </div>
      </div>

      <div className="flex-1 max-w-lg mx-auto w-full px-5 py-6 space-y-5 overflow-y-auto">
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-[18px] font-semibold text-ink">Kies je challenger</h2>
              <p className="text-[13px] text-ink-soft mt-1">Welke toon past bij hoe jij aangesproken wilt worden?</p>
            </div>
            <CardOption
              selected={gender === 'male'}
              onClick={() => setGender('male')}
              title={`${COACH_PERSONAS.male.defaultName} — Mannelijk`}
              description={COACH_PERSONAS.male.description}
            />
            <CardOption
              selected={gender === 'female'}
              onClick={() => setGender('female')}
              title={`${COACH_PERSONAS.female.defaultName} — Vrouwelijk`}
              description={COACH_PERSONAS.female.description}
            />
          </div>
        )}

        {step === 2 && gender && (
          <div className="space-y-4">
            <div>
              <h2 className="text-[18px] font-semibold text-ink">Naam van je challenger</h2>
              <p className="text-[13px] text-ink-soft mt-1">Standaard {COACH_PERSONAS[gender].defaultName}, maar noem 'm zoals je wilt — bijvoorbeeld Coach, of de naam van een oude mentor.</p>
            </div>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder={COACH_PERSONAS[gender].defaultName}
              maxLength={40}
              className="w-full px-4 py-3 rounded-[14px] bg-surface-sunken border border-transparent text-[15px] outline-none focus:border-primary focus:bg-white transition-all"
              autoFocus
            />
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-[18px] font-semibold text-ink">Bedrijfsmodel & omvang</h2>
              <p className="text-[13px] text-ink-soft mt-1">Zodat de coach je situatie snapt, niet in algemeenheden praat.</p>
            </div>
            <div>
              <p className="text-[12px] font-medium text-ink-soft uppercase tracking-wider mb-2">Sector</p>
              <div className="flex flex-wrap gap-2">
                {INDUSTRY_OPTIONS.map((o) => (
                  <ChipButton key={o.value} selected={industry === o.value} onClick={() => setIndustry(o.value)}>{o.label}</ChipButton>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[12px] font-medium text-ink-soft uppercase tracking-wider mb-2">Teamgrootte</p>
              <div className="flex flex-wrap gap-2">
                {TEAM_SIZE_OPTIONS.map((o) => (
                  <ChipButton key={o.value} selected={teamSize === o.value} onClick={() => setTeamSize(o.value)}>{o.label}</ChipButton>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[12px] font-medium text-ink-soft uppercase tracking-wider mb-2">Verdienmodel</p>
              <div className="flex flex-wrap gap-2">
                {BUSINESS_MODEL_OPTIONS.map((o) => (
                  <ChipButton key={o.value} selected={businessModel === o.value} onClick={() => setBusinessModel(o.value)}>{o.label}</ChipButton>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-[18px] font-semibold text-ink">Je top-3 tijdvreters</h2>
              <p className="text-[13px] text-ink-soft mt-1">Kies maximaal 3 — de grootste operationele energielekken.</p>
            </div>
            <div className="space-y-2">
              {TIME_WASTER_OPTIONS.map((o) => {
                const selected = topTimeWasters.includes(o.value);
                return (
                  <CheckRow key={o.value} selected={selected} onClick={() => toggleTimeWaster(o.value)} disabled={!selected && topTimeWasters.length >= 3}>
                    {o.label}
                  </CheckRow>
                );
              })}
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-[18px] font-semibold text-ink">Persoonlijk vluchtgedrag</h2>
              <p className="text-[13px] text-ink-soft mt-1">Wees eerlijk: waar vlucht je in als het commercieel of operationeel spannend wordt?</p>
            </div>
            <div className="space-y-2">
              {AVOIDANCE_BEHAVIOR_OPTIONS.map((o) => (
                <CardOption key={o.value} selected={avoidanceBehavior === o.value} onClick={() => setAvoidanceBehavior(o.value)} title={o.label} />
              ))}
            </div>
          </div>
        )}

        {step === 6 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-[18px] font-semibold text-ink">De kwartaalhefboom</h2>
              <p className="text-[13px] text-ink-soft mt-1">Wat is je primaire doel voor de komende 90 dagen?</p>
            </div>
            <div className="space-y-2">
              {LEVERAGE_GOAL_OPTIONS.map((o) => (
                <CardOption key={o.value} selected={leverageGoal === o.value} onClick={() => setLeverageGoal(o.value)} title={o.label} description={o.description} />
              ))}
            </div>
          </div>
        )}

        {step === 7 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-[18px] font-semibold text-ink">De Pijnlijke Consequentie</h2>
              <p className="text-[13px] text-ink-soft mt-1">
                Een plan zonder stakes is vrijblijvend. Wat gebeurt er écht als je dit kwartaaldoel mist? Kies een voorbeeld of schrijf je eigen consequentie.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {CONSEQUENCE_PRESETS.map((preset) => (
                <ChipButton key={preset} selected={painfulConsequence === preset} onClick={() => setPainfulConsequence(preset)}>
                  {preset}
                </ChipButton>
              ))}
            </div>
            <textarea
              value={painfulConsequence}
              onChange={(e) => setPainfulConsequence(e.target.value.slice(0, 300))}
              placeholder="Bijv: als ik dit kwartaal mijn doel mis, doneer ik €500 aan..."
              rows={3}
              maxLength={300}
              className="w-full resize-none px-4 py-3 rounded-[14px] bg-surface-sunken border border-transparent text-[14px] outline-none focus:border-primary focus:bg-white transition-all"
            />

            {!deepeningActive && !deepeningSkipped && painfulConsequence.trim().length > 0 && (
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={startDeepening}
                  className="px-4 py-2.5 rounded-[14px] bg-primary-muted text-primary text-[13px] font-medium"
                >
                  Deel dit met {displayName.trim() || (gender ? COACH_PERSONAS[gender].defaultName : 'je coach')}
                </button>
                <button
                  type="button"
                  onClick={() => setDeepeningSkipped(true)}
                  className="text-[12px] text-ink-soft underline underline-offset-2"
                >
                  Overslaan
                </button>
              </div>
            )}

            {deepeningActive && (
              <div className="space-y-3 rounded-[14px] border border-line p-4">
                {deepeningMessages.slice(1).map((m, i) => (
                  <div
                    key={i}
                    className={`text-[13px] rounded-[12px] px-3.5 py-2.5 max-w-[90%] ${
                      m.role === 'assistant' ? 'bg-primary-muted text-ink mr-auto' : 'bg-surface-sunken text-ink ml-auto'
                    }`}
                  >
                    {m.content}
                  </div>
                ))}
                {deepeningLoading && (
                  <div className="text-[13px] rounded-[12px] px-3.5 py-2.5 max-w-[90%] bg-primary-muted text-ink-soft mr-auto">
                    Even denken...
                  </div>
                )}
                {showAnswerInput && (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={deepeningAnswer}
                      onChange={(e) => setDeepeningAnswer(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') submitDeepeningAnswer(); }}
                      placeholder="Je antwoord..."
                      className="flex-1 px-3.5 py-2.5 rounded-[12px] bg-surface-sunken border border-transparent text-[13px] outline-none focus:border-primary focus:bg-white transition-all"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={submitDeepeningAnswer}
                      disabled={!deepeningAnswer.trim()}
                      className="px-3.5 py-2.5 rounded-[12px] bg-primary text-white text-[13px] font-medium disabled:opacity-40"
                    >
                      Stuur
                    </button>
                  </div>
                )}
              </div>
            )}

            <div className="rounded-[14px] bg-surface-sunken px-4 py-3.5 flex items-center justify-between gap-4 mt-6">
              <div>
                <p className="text-[13px] font-medium text-ink">Meditaties</p>
                <p className="text-[11px] text-ink-soft mt-0.5">Optionele ochtend-centering op je dashboard</p>
              </div>
              <button
                type="button"
                onClick={() => setMeditationsEnabled((v) => !v)}
                className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${meditationsEnabled ? 'bg-primary' : 'bg-line'}`}
              >
                <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${meditationsEnabled ? 'translate-x-5' : ''}`} />
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-[16px] border border-red-100 bg-red-50 p-4">
            <p className="text-[13px] text-red-600">{error}</p>
          </div>
        )}
      </div>

      <div className="border-t border-line p-4">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          {step > 1 && (
            <button
              type="button"
              onClick={() => setStep((s) => s - 1)}
              className="w-11 h-11 rounded-[14px] bg-surface-sunken flex items-center justify-center shrink-0"
            >
              <ArrowLeft size={17} className="text-ink" />
            </button>
          )}
          {step < TOTAL_STEPS ? (
            <button
              type="button"
              onClick={() => canProceed() && setStep((s) => s + 1)}
              disabled={!canProceed()}
              className="flex-1 py-3 rounded-[14px] bg-primary text-white font-bold text-[14px] disabled:opacity-40 flex items-center justify-center gap-2"
            >
              Volgende <ArrowRight size={16} />
            </button>
          ) : (
            <button
              type="button"
              onClick={submit}
              disabled={!canProceed() || submitting}
              className="flex-1 py-3 rounded-[14px] bg-primary text-white font-bold text-[14px] disabled:opacity-60"
            >
              {submitting ? 'Bezig...' : 'Activeer mijn werkruimte'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
