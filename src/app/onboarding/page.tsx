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
import { ChipButton, CardOption, CheckRow, WeekdayPicker } from '@/components/ui/dna-controls';
import { DEFAULT_RITUAL_SETTINGS } from '@/lib/weekflow.service';
import { DEFAULT_PREFERENCES, isNotificationSupported, requestPermission, savePreferences, scheduleAllNotifications } from '@/lib/notifications.service';

const TOTAL_STEPS = 8;

const STEP_LABELS = [
  'je challenger',
  'je naam',
  'je bedrijf',
  'je tijdvreters',
  'je vluchtgedrag',
  'je kwartaalhefboom',
  'de consequentie',
  'je ritme',
];

const COMMON_TIMEZONES = [
  'Europe/Amsterdam',
  'Europe/London',
  'Europe/Berlin',
  'Europe/Paris',
  'Europe/Madrid',
  'America/New_York',
  'America/Los_Angeles',
  'Asia/Singapore',
  'Asia/Dubai',
  'Australia/Sydney',
  'UTC',
];

type Gender = 'male' | 'female';

// Advies op stap 8 grijpt terug op wat de ondernemer net over zichzelf invulde (stap 4-6), zodat
// het voelt als een coach die meedenkt i.p.v. een generiek instellingenformulier.
function scheduleAdvice(topTimeWasters: string[], avoidanceBehavior: string | null, leverageGoal: string | null) {
  const morning = topTimeWasters.includes('inbox_email')
    ? 'Jij gaf aan dat je inbox een tijdvreter is — zet je ochtendreminder vóór 08:00, zodat je het ritueel doet vóórdat de mail opent.'
    : topTimeWasters.includes('telefonische_bereikbaarheid')
    ? 'Bereikbaarheid vreet je tijd — start vroeg, vóórdat de telefoon begint te rinkelen.'
    : avoidanceBehavior === 'telefoontjes_uitstellen'
    ? 'Jij schuift moeilijke gesprekken voor je uit — een vroege reminder geeft je een duwtje vóórdat de dag je meesleurt.'
    : 'Een vast moment aan het begin van de dag houdt het ritueel een gewoonte in plaats van een taak.';

  const workDays = avoidanceBehavior === 'te_snel_ja_zeggen'
    ? 'Bewaak je grenzen ook hier: laat weekenden weekenden, dan telt het niet mee als "gemist".'
    : 'Standaard maandag t/m vrijdag — pas aan als jouw werkweek er anders uitziet.';

  const focus = leverageGoal === 'capaciteit'
    ? 'Jouw doel is capaciteit vrijspelen — reserveer je focusblokken vroeg, vóórdat operationele ruis de dag vult.'
    : leverageGoal === 'marge'
    ? 'Jouw doel is marge — gebruik de focusblokken voor het werk dat je uurtarief of projectprijs echt omhoog brengt, niet voor de inbox.'
    : leverageGoal === 'rust_focus'
    ? 'Jouw doel is rust & focus — hou de blokken kort en scherp, zodat er ook echt ruimte overblijft.'
    : 'Twee vaste blokken houden je belangrijkste werk uit de waan van de dag.';

  return { morning, workDays, focus };
}

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [checking, setChecking] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [gender, setGender] = useState<Gender | null>(null);
  // De eigen naam van de ondernemer — apart van `displayName` hieronder (de naam van de
  // AI-coach-persona). Zonder dit veld viel het dashboard terug op het e-mailadres-prefix
  // (bv. "Goedemiddag, Info" voor info@bedrijf.nl).
  const [userName, setUserName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [industry, setIndustry] = useState<string | null>(null);
  const [teamSize, setTeamSize] = useState<string | null>(null);
  const [businessModel, setBusinessModel] = useState<string | null>(null);
  const [topTimeWasters, setTopTimeWasters] = useState<string[]>([]);
  const [avoidanceBehavior, setAvoidanceBehavior] = useState<string | null>(null);
  const [leverageGoal, setLeverageGoal] = useState<string | null>(null);
  const [painfulConsequence, setPainfulConsequence] = useState('');
  const [meditationsEnabled, setMeditationsEnabled] = useState(true);

  // Stap 8 — "Zet je ritme": ritueel-instellingen die anders pas bij toeval in Instellingen
  // ontdekt worden. Alles heeft al een verstandige default, dus deze stap is nooit blokkerend.
  const [timezone, setTimezone] = useState(DEFAULT_RITUAL_SETTINGS.timezone);
  const [workDays, setWorkDays] = useState<number[]>(DEFAULT_RITUAL_SETTINGS.workDays);
  const [morningTime, setMorningTime] = useState(DEFAULT_PREFERENCES.morningTime);
  const [eveningTime, setEveningTime] = useState(DEFAULT_PREFERENCES.eveningTime);
  const [focusBlock1Start, setFocusBlock1Start] = useState(DEFAULT_RITUAL_SETTINGS.focusBlock1Start);
  const [focusBlock2Start, setFocusBlock2Start] = useState(DEFAULT_RITUAL_SETTINGS.focusBlock2Start);
  const [notifOptIn, setNotifOptIn] = useState(true);
  const [notifPermission, setNotifPermission] = useState<NotificationPermission | 'unsupported'>('default');

  // Coach-verdieping op de consequentie (stap 7): optioneel, max 2 vragen. Volledig additief —
  // blokkeert nooit "Activeer mijn werkruimte", dat blijft alleen aan painfulConsequence hangen.
  type DeepeningMessage = { role: 'user' | 'assistant'; content: string };
  const [deepeningActive, setDeepeningActive] = useState(false);
  const [deepeningSkipped, setDeepeningSkipped] = useState(false);
  const [deepeningMessages, setDeepeningMessages] = useState<DeepeningMessage[]>([]);
  const [deepeningLoading, setDeepeningLoading] = useState(false);
  const [deepeningAnswer, setDeepeningAnswer] = useState('');
  const [deepeningClosed, setDeepeningClosed] = useState(false);
  // Definitief oordeel na de laatste doorvraag: blijft `true` zolang de consequentie tandeloos
  // is gebleven ("Niemand", "nvt", te kort) — canProceed() voor stap 7 hangt hieraan zodat de
  // ondernemer niet stilzwijgend kan ontsnappen, en wordt pas gewist zodra de tekst écht herschreven is.
  const [deepeningWeak, setDeepeningWeak] = useState(false);

  const isWeakAnswer = (text: string) => {
    const t = text.trim().toLowerCase().replace(/[.!?]+$/, '');
    if (t.length < 12) return true;
    return ['niemand', 'niks', 'niets', 'nvt', 'geen', 'geen idee', 'weet niet', 'geen idee eigenlijk'].includes(t);
  };

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
      // Harde cap: na 2 vragen sluiten we lokaal af, geen 3e model-call — maar wel een hard,
      // deterministisch oordeel in plaats van stilte, anders ontsnapt een tandeloos antwoord
      // ("Niemand") zonder dat de coach ooit echt confronteert.
      const weak = isWeakAnswer(answer);
      setDeepeningWeak(weak);
      setDeepeningMessages([
        ...withAnswer,
        {
          role: 'assistant',
          content: weak
            ? 'Dat is geen stok achter de deur, dat is een excuus — een sanctie die niemand raakt, raakt jou ook niet. Herschrijf je consequentie hierboven tot die wél iemand of iets concreets kost (geld, reputatie, je team) voordat je verdergaat.'
            : 'Duidelijk — dat is scherp genoeg om je aan vast te houden als het lastig wordt.',
        },
      ]);
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
    try {
      const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (detected) setTimezone(detected);
    } catch {
      // val terug op DEFAULT_RITUAL_SETTINGS.timezone
    }
    setNotifPermission(isNotificationSupported() ? Notification.permission : 'unsupported');
  }, []);

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

  const toggleWorkDay = (day: number) => {
    setWorkDays((prev) => {
      const next = prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day];
      if (next.length === 0) return prev; // minstens één werkdag
      return next.sort((a, b) => a - b);
    });
  };

  const handleEnableNotifications = async () => {
    const permission = await requestPermission();
    setNotifPermission(permission);
    if (permission !== 'granted') setNotifOptIn(false);
  };

  const canProceed = (): boolean => {
    switch (step) {
      case 1: return userName.trim().length > 0 && gender !== null;
      case 2: return displayName.trim().length > 0;
      case 3: return industry !== null && teamSize !== null && businessModel !== null;
      case 4: return topTimeWasters.length > 0;
      case 5: return avoidanceBehavior !== null;
      case 6: return leverageGoal !== null;
      case 7: return painfulConsequence.trim().length > 0 && !deepeningWeak;
      case 8: return true;
      default: return false;
    }
  };

  const submit = async () => {
    if (!userName.trim() || !gender || !displayName.trim() || !industry || !teamSize || !businessModel || !avoidanceBehavior || !leverageGoal || !painfulConsequence.trim()) return;
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
        body: JSON.stringify({ ...profile, userName: userName.trim() }),
      });
      if (!res.ok) { setError('Kon je profiel niet opslaan. Probeer het opnieuw.'); return; }
      await fetch('/api/ritual-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ meditationsEnabled, timezone, workDays, focusBlock1Start, focusBlock2Start }),
      }).catch(() => {});
      savePreferences({ enabled: notifOptIn, morningTime, eveningTime });
      if (notifOptIn && notifPermission === 'granted') scheduleAllNotifications();
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
            <p className="text-[11px] text-ink-soft">Stap {step} van {TOTAL_STEPS} — {STEP_LABELS[step - 1]}</p>
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
              <h2 className="text-[18px] font-semibold text-ink">Wat is je naam?</h2>
              <p className="text-[13px] text-ink-soft mt-1">Zo spreekt de app je aan — los van je e-mailadres.</p>
            </div>
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="Voornaam"
              maxLength={40}
              className="w-full px-4 py-3 rounded-[14px] bg-surface-sunken border border-transparent text-[15px] outline-none focus:border-primary focus:bg-white transition-all"
              autoFocus
            />
            <div className="pt-2">
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
              onChange={(e) => {
                setPainfulConsequence(e.target.value.slice(0, 300));
                if (deepeningWeak) setDeepeningWeak(false);
              }}
              placeholder="Bijv: als ik dit kwartaal mijn doel mis, doneer ik €500 aan..."
              rows={3}
              maxLength={300}
              className="w-full resize-none px-4 py-3 rounded-[14px] bg-surface-sunken border border-transparent text-[14px] outline-none focus:border-primary focus:bg-white transition-all"
            />
            {deepeningWeak && (
              <p className="text-[12px] font-medium text-red-600">
                Herschrijf de consequentie hierboven — pas dan kun je verder.
              </p>
            )}

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

          </div>
        )}

        {step === 8 && (() => {
          const advice = scheduleAdvice(topTimeWasters, avoidanceBehavior, leverageGoal);
          return (
            <div className="space-y-5">
              <div>
                <h2 className="text-[18px] font-semibold text-ink">Zet je ritme</h2>
                <p className="text-[13px] text-ink-soft mt-1">
                  Op basis van wat je net vertelde, hier een startpunt. Alles staat al goed — pas aan wat niet klopt.
                </p>
              </div>

              <div className="rounded-[14px] border border-line p-4 space-y-2">
                <p className="text-[13px] font-medium text-ink">Tijdzone</p>
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full bg-surface-sunken rounded-[10px] px-3 py-2 text-[13px] text-ink border-none outline-none"
                >
                  {(COMMON_TIMEZONES.includes(timezone) ? COMMON_TIMEZONES : [timezone, ...COMMON_TIMEZONES]).map((tz) => (
                    <option key={tz} value={tz}>{tz}</option>
                  ))}
                </select>
              </div>

              <div className="rounded-[14px] border border-line p-4 space-y-2">
                <p className="text-[13px] font-medium text-ink">Werkdagen</p>
                <WeekdayPicker selectedDays={workDays} onToggle={toggleWorkDay} />
                <p className="text-[12px] text-ink-soft">{advice.workDays}</p>
              </div>

              <div className="rounded-[14px] border border-line p-4 space-y-2">
                <p className="text-[13px] font-medium text-ink">Ochtend- en avondreminder</p>
                <div className="flex items-center gap-3">
                  <input
                    type="time"
                    value={morningTime}
                    onChange={(e) => setMorningTime(e.target.value)}
                    className="flex-1 bg-surface-sunken rounded-[10px] px-3 py-2 text-[13px] text-ink border-none outline-none"
                  />
                  <input
                    type="time"
                    value={eveningTime}
                    onChange={(e) => setEveningTime(e.target.value)}
                    className="flex-1 bg-surface-sunken rounded-[10px] px-3 py-2 text-[13px] text-ink border-none outline-none"
                  />
                </div>
                <p className="text-[12px] text-ink-soft">{advice.morning}</p>
                {notifPermission !== 'unsupported' && notifPermission !== 'granted' && (
                  <button
                    type="button"
                    onClick={handleEnableNotifications}
                    className="mt-1 px-3.5 py-2 rounded-[10px] bg-primary-muted text-primary text-[13px] font-medium"
                  >
                    Zet herinneringen aan
                  </button>
                )}
                {notifPermission === 'granted' && (
                  <p className="text-[12px] text-primary font-medium">Herinneringen staan aan.</p>
                )}
              </div>

              <div className="rounded-[14px] border border-line p-4 space-y-2">
                <p className="text-[13px] font-medium text-ink">Focusblokken</p>
                <div className="flex items-center gap-3">
                  <input
                    type="time"
                    value={focusBlock1Start}
                    onChange={(e) => setFocusBlock1Start(e.target.value)}
                    className="flex-1 bg-surface-sunken rounded-[10px] px-3 py-2 text-[13px] text-ink border-none outline-none"
                  />
                  <input
                    type="time"
                    value={focusBlock2Start}
                    onChange={(e) => setFocusBlock2Start(e.target.value)}
                    className="flex-1 bg-surface-sunken rounded-[10px] px-3 py-2 text-[13px] text-ink border-none outline-none"
                  />
                </div>
                <p className="text-[12px] text-ink-soft">{advice.focus}</p>
              </div>

              <div className="rounded-[14px] bg-surface-sunken px-4 py-3.5 flex items-center justify-between gap-4">
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
          );
        })()}

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
              {submitting ? 'Bezig...' : 'Start met dit ritme'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
