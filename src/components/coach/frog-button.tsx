'use client';

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Flame, X, RefreshCw, Phone, PenLine, Code2, Calculator } from 'lucide-react';
import { AuthService } from '@/lib/auth';
import { api } from '@/lib/api';
import { getToday } from '@/lib/weekflow.service';
import { TIME_WASTER_OPTIONS } from '@/lib/onboarding';
import type { FrogModus } from '@/lib/coach';

// Confrontatie per tijdvreter-categorie i.p.v. een verzonnen personage ("Marcus zegt: ...") —
// een spiegel praat niet over zichzelf in de derde persoon, die toont het feitelijke gedrag.
const KIKKER_HEADLINES: Partial<Record<string, string>> = {
  inbox_email: 'Je verstopt je in de inbox.',
  offertes_opvolging: 'Je laat offertes koud worden.',
  telefonische_bereikbaarheid: 'Je wacht tot de telefoon jou vindt.',
  facturatie_debiteuren: 'Je stelt het innen van je eigen geld uit.',
  personeelsplanning: 'Je verdrinkt in het rooster, niet in het echte werk.',
  brandjes_blussen: 'Je vlucht in operationele ruis.',
};
const DEFAULT_KIKKER_HEADLINE = 'Je stelt dit uit.';

// Bepaalt icoon/labels per actie-modus — zie determineFrogModus in lib/coach.ts. Zonder dit
// stuurde de UI altijd op bellen ("Ik pak nu de telefoon"), ook bij bouw- of schrijfwerk.
const MODUS_CONFIG: Record<FrogModus, {
  icon: typeof Phone;
  sectionLabel: string;
  fallbackText: string;
  confirmLabel: string;
  confirmQuestion: string;
  confirmYesLabel: string;
}> = {
  bellen: {
    icon: Phone,
    sectionLabel: 'Openingszinnen — kies er één',
    fallbackText: 'Geen zinnen beschikbaar — bel toch. Nu.',
    confirmLabel: 'Ik pak nu de telefoon',
    confirmQuestion: 'Heb je gebeld?',
    confirmYesLabel: 'Ja, gebeld',
  },
  schrijven: {
    icon: PenLine,
    sectionLabel: 'Eerste zinnen — kies er één',
    fallbackText: 'Geen zinnen beschikbaar — schrijf toch. Nu.',
    confirmLabel: 'Ik begin nu met schrijven',
    confirmQuestion: 'Heb je geschreven?',
    confirmYesLabel: 'Ja, geschreven',
  },
  bouwen: {
    icon: Code2,
    sectionLabel: 'Eerste acties — kies er één',
    fallbackText: 'Geen acties beschikbaar — bouw toch. Nu.',
    confirmLabel: 'Ik begin nu met bouwen',
    confirmQuestion: 'Heb je gebouwd?',
    confirmYesLabel: 'Ja, gebouwd',
  },
  analyseren: {
    icon: Calculator,
    sectionLabel: 'Eerste stappen — kies er één',
    fallbackText: 'Geen stappen beschikbaar — begin toch. Nu.',
    confirmLabel: 'Ik begin nu met de cijfers',
    confirmQuestion: 'Is het gelukt?',
    confirmYesLabel: 'Ja, gedaan',
  },
};

const SELF_TIMER_SECONDS = 15 * 60;
const MAX_CALENDAR_DEADLINE_SECONDS = 45 * 60;
const MIN_CALENDAR_DEADLINE_SECONDS = 90;
const CALENDAR_LOOKAHEAD_MS = 4 * 60 * 60 * 1000;

function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function formatClock(iso: string): string {
  return new Date(iso).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });
}

export interface FrogButtonHandle {
  /** Opent de sessie extern — gebruikt door de "Jouw volgende stap"-kaart op het dashboard,
   *  zodat die kaart's "Doorbreek uitstel"-CTA niet langer naar zichzelf linkt (/dashboard,
   *  een no-op) maar deze knop daadwerkelijk activeert. */
  open: () => void;
}

export interface FrogButtonProps {
  /** false wanneer het dashboard de trigger-knop zelf al toont (Challenger-modus in de
   *  "Jouw volgende stap"-hero-kaart) — de sessie-modal blijft dan wel beschikbaar via de ref,
   *  zodat er niet twee identieke "Doorbreek Uitstel"-knoppen naast elkaar staan. */
  showTrigger?: boolean;
}

/** MECHANISME 1 — De Kikker-knop: on-demand uitsteldoder. Start een 15-minuten countdown en
 *  toont 3 kant-en-klare openingszinnen, zodat het gesprek zonder nadenken begonnen kan worden.
 *  Geen audioprimer (geen voice-assets beschikbaar) — de tekst doet hetzelfde werk. */
export const FrogButton = forwardRef<FrogButtonHandle, FrogButtonProps>(function FrogButton({ showTrigger = true }, ref) {
  const [open, setOpen] = useState(false);
  const [seconds, setSeconds] = useState(SELF_TIMER_SECONDS);
  const [running, setRunning] = useState(false);
  const [deadline, setDeadline] = useState<{ summary: string; at: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [lines, setLines] = useState<string[]>([]);
  const [modus, setModus] = useState<FrogModus>('bellen');
  const [todaysFrog, setTodaysFrog] = useState<string | null>(null);
  const [todaysFrogCategory, setTodaysFrogCategory] = useState<string | null>(null);
  const [checkedToday, setCheckedToday] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [weekCount, setWeekCount] = useState<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Toon hoe vaak deze week écht gebeld is (niet hoe vaak de knop geopend is) — anders
  // beloont de teller schijnbewegingen in plaats van het daadwerkelijk doorbreken van uitstel.
  useEffect(() => {
    api.logs.getAll()
      .then((logs: any[]) => {
        const now = new Date();
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const count = (logs ?? []).filter((l) => {
          if (l?.type !== 'kikker') return false;
          const raw = l?.data;
          const data = typeof raw === 'string' ? JSON.parse(raw) : raw;
          if (!data?.called) return false;
          const ts = new Date(l?.timestamp ?? l?.date_string ?? l?.date);
          return ts >= weekAgo;
        }).length;
        setWeekCount(count);
      })
      .catch(() => {});
  }, []);

  // Laat vooraf zien wélke taak dit betreft — niet pas na het klikken. Zonder dit weet niemand,
  // laat staan een nieuwe gebruiker, waar deze knop over gaat vóórdat de 15 minuten al lopen.
  useEffect(() => {
    const todayStr = getToday('Europe/Amsterdam');
    api.logs.getByTypeAndDate('morning', todayStr)
      .then((logs: any[]) => {
        const raw = logs?.[0]?.data;
        const data = typeof raw === 'string' ? JSON.parse(raw) : raw;
        const category = data?.kikkerCategory as string | undefined;
        if (category) {
          setTodaysFrogCategory(category);
          const label = TIME_WASTER_OPTIONS.find((o) => o.value === category)?.label ?? category;
          setTodaysFrog(data?.kikkerDetail ? `${label} — ${data.kikkerDetail}` : label);
        }
      })
      .catch(() => {})
      .finally(() => setCheckedToday(true));
  }, []);

  useEffect(() => {
    if (!running) return;
    intervalRef.current = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          setRunning(false);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running]);

  const startSession = async () => {
    setOpen(true);
    setDeadline(null);
    setRunning(true);
    setLoading(true);

    // Een echte deadline (de volgende afspraak in de agenda) is geloofwaardiger dan een vaste
    // 15-minutenklok. Alleen gebruiken als die deadline ook echt druk oplevert (binnen 4 uur en
    // met genoeg tijd om nog te bellen) — anders val terug op de zelfgekozen sprint.
    const token = AuthService.getToken();
    const findDeadline = fetch('/api/calendar/today', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { configured?: boolean; events?: { summary: string; start: string | null }[] } | null) => {
        if (!data?.configured || !data.events?.length) return null;
        const now = Date.now();
        const upcoming = data.events
          .filter((e) => e.start && new Date(e.start).getTime() > now)
          .sort((a, b) => new Date(a.start!).getTime() - new Date(b.start!).getTime())[0];
        if (!upcoming?.start) return null;
        const secondsUntil = Math.floor((new Date(upcoming.start).getTime() - now) / 1000);
        if (secondsUntil < MIN_CALENDAR_DEADLINE_SECONDS || secondsUntil > MAX_CALENDAR_DEADLINE_SECONDS) {
          return null;
        }
        return { summary: upcoming.summary, at: upcoming.start, seconds: secondsUntil };
      })
      .catch(() => null);

    const fetchLines = fetch('/api/coach/kikker', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ task: todaysFrog, category: todaysFrogCategory }),
    })
      .then((res) => (res.ok ? res.json() : null))
      .catch(() => null);

    const [deadlineResult, linesData] = await Promise.all([findDeadline, fetchLines]);

    if (deadlineResult) {
      setDeadline({ summary: deadlineResult.summary, at: deadlineResult.at });
      setSeconds(deadlineResult.seconds);
    } else {
      setSeconds(SELF_TIMER_SECONDS);
    }
    if (linesData) {
      setModus((linesData.modus as FrogModus) ?? 'bellen');
      setLines(linesData.lines ?? []);
    }
    setLoading(false);
  };

  useImperativeHandle(ref, () => ({ open: startSession }));

  const close = () => {
    setRunning(false);
    setOpen(false);
    setConfirming(false);
    setDeadline(null);
  };

  const logOutcome = async (called: boolean, dismissed = false) => {
    const todayStr = getToday('Europe/Amsterdam');
    try {
      await api.logs.create({
        type: 'kikker',
        date: todayStr,
        called,
        dismissed,
        task: todaysFrog,
        secondsLeft: seconds,
        deadlineSource: deadline ? 'calendar' : 'self',
        deadlineSummary: deadline?.summary ?? null,
      });
      if (called) setWeekCount((c) => (c ?? 0) + 1);
    } catch {
      // stil — de bevestiging is een geheugensteun, geen kritiek pad
    }
    close();
  };

  // X-knop: registreert dit als ontweken sprint (zelfde gewicht als 'gevlucht_in_veiligheid'
  // in het avondritueel — zie loadCoachContext/loadTodayEveningVerdict in lib/coach.ts) i.p.v.
  // geruisloos wegklikken zonder spoor.
  const dismiss = () => { void logOutcome(false, true); };

  return (
    <>
      {showTrigger && (
        <button
          onClick={startSession}
          className="w-full flex items-center gap-3 rounded-card bg-red-600 p-4 mb-6 hover:bg-red-700 transition-colors shadow-organic"
        >
          <div className="w-10 h-10 rounded-[10px] bg-white/15 flex items-center justify-center flex-shrink-0">
            <Flame size={18} className="text-white" />
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-[13px] font-bold text-white">Doorbreek Uitstel</p>
            <p className="text-[11px] text-white/70 leading-snug truncate">
              {!checkedToday
                ? '15 minuten, geen nadenken'
                : todaysFrog
                ? `Vandaag: ${todaysFrog}`
                : 'Nog geen belangrijkste taak gekozen — vul eerst je ochtendritueel in'}
              {weekCount !== null && weekCount > 0 ? ` · ${weekCount}x deze week doorbroken` : ''}
            </p>
          </div>
        </button>
      )}

      {open && (() => {
        const cfg = MODUS_CONFIG[modus];
        const ModusIcon = cfg.icon;
        const headline = (todaysFrogCategory && KIKKER_HEADLINES[todaysFrogCategory]) ?? DEFAULT_KIKKER_HEADLINE;
        return (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-[20px] p-6 space-y-5">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[15px] font-bold text-ink">{headline}</p>
                <p className="text-[12px] text-ink-soft mt-0.5">15 minuten sprint. Geen uitvluchten, geen uitstel.</p>
                {todaysFrog && <p className="text-[11px] text-ink-soft/70 truncate mt-1">{todaysFrog}</p>}
              </div>
              <button onClick={dismiss} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-sunken shrink-0">
                <X size={16} className="text-ink-soft" />
              </button>
            </div>

            <div className="text-center py-4">
              <p className={`text-[40px] font-bold tabular-nums ${seconds === 0 ? 'text-red-600' : 'text-ink'}`}>
                {formatTime(seconds)}
              </p>
              <p className="text-[12px] text-ink-soft mt-1">
                {seconds === 0
                  ? `Tijd om. ${cfg.confirmQuestion}`
                  : deadline
                  ? `Tot "${deadline.summary}" om ${formatClock(deadline.at)}`
                  : 'Zelfgekozen sprint — geen excuus, geen echte deadline.'}
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-[11px] font-medium text-ink-soft uppercase tracking-wider">{cfg.sectionLabel}</p>
              {loading ? (
                <div className="flex items-center gap-2 text-[13px] text-ink-soft py-3">
                  <RefreshCw size={14} className="animate-spin" /> Zinnen genereren...
                </div>
              ) : lines.length > 0 ? (
                lines.map((line, i) => (
                  <div key={i} className="rounded-[12px] bg-surface-sunken px-4 py-3 flex items-start gap-2.5">
                    <ModusIcon size={14} className="text-primary shrink-0 mt-0.5" />
                    <p className="text-[13px] text-ink leading-relaxed">{line}</p>
                  </div>
                ))
              ) : (
                <p className="text-[13px] text-ink-soft py-2">{cfg.fallbackText}</p>
              )}
            </div>

            {confirming ? (
              <div className="space-y-2">
                <p className="text-[13px] text-ink text-center font-medium">{cfg.confirmQuestion}</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => logOutcome(false)}
                    className="flex-1 py-3 rounded-[14px] bg-surface-sunken text-ink-soft font-bold text-[14px]"
                  >
                    Nog niet
                  </button>
                  <button
                    onClick={() => logOutcome(true)}
                    className="flex-1 py-3 rounded-[14px] bg-primary text-white font-bold text-[14px]"
                  >
                    {cfg.confirmYesLabel}
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setConfirming(true)}
                className="w-full py-3 rounded-[14px] bg-primary text-white font-bold text-[14px]"
              >
                {cfg.confirmLabel}
              </button>
            )}
          </div>
        </div>
        );
      })()}
    </>
  );
});
