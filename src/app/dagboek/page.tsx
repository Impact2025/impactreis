'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Trash2, Sun, Moon, Check } from 'lucide-react';
import { AuthService } from '@/lib/auth';
import { BottomNav } from '@/components/ui/bottom-nav';

type Moment = 'ochtend' | 'avond';

interface DagboekEntry {
  id: string;
  type: string;
  date_string: string;
  timestamp: string;
  data: {
    stemming: number;
    tekst?: string;
  };
}

const STEMMINGEN = [
  { waarde: 1, label: 'Zwaar' },
  { waarde: 2, label: 'Matig' },
  { waarde: 3, label: 'Oké'   },
  { waarde: 4, label: 'Goed'  },
  { waarde: 5, label: 'Super' },
];

function getMomentLabel(type: string) {
  return type === 'dagboek_ochtend' ? 'Ochtend' : 'Avond';
}

function getMomentIcon(type: string) {
  return type === 'dagboek_ochtend'
    ? <Sun size={13} className="inline-block mr-1 text-tertiary" />
    : <Moon size={13} className="inline-block mr-1 text-accent" />;
}

function groupByDate(entries: DagboekEntry[]) {
  const groups: Record<string, DagboekEntry[]> = {};
  for (const e of entries) {
    if (!groups[e.date_string]) groups[e.date_string] = [];
    groups[e.date_string].push(e);
  }
  return groups;
}

export default function DagboekPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [entries, setEntries] = useState<DagboekEntry[]>([]);

  const today = new Date().toISOString().split('T')[0];
  const currentHour = new Date().getHours();
  const defaultMoment: Moment = currentHour < 13 ? 'ochtend' : 'avond';

  const [moment, setMoment] = useState<Moment>(defaultMoment);
  const [stemming, setStemming] = useState<number | null>(null);
  const [tekst, setTekst] = useState('');

  useEffect(() => {
    const user = AuthService.getUser();
    if (!user) { router.push('/auth/login'); return; }
    fetchEntries();
  }, [router]);

  const fetchEntries = async () => {
    try {
      const res = await fetch('/api/dagboek', {
        headers: { Authorization: `Bearer ${AuthService.getToken()}` },
      });
      if (res.ok) setEntries(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const todayHasEntry = (m: Moment) =>
    entries.some(e => e.date_string === today && e.type === `dagboek_${m}`);

  const handleSave = async () => {
    if (!stemming) return;
    setSaving(true);
    try {
      const res = await fetch('/api/dagboek', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${AuthService.getToken()}` },
        body: JSON.stringify({ moment, stemming, tekst, date: today }),
      });
      if (res.ok) {
        await fetchEntries();
        setStemming(null);
        setTekst('');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/dagboek/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${AuthService.getToken()}` },
      });
      setEntries(prev => prev.filter(e => e.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const groups = groupByDate(entries);
  const sortedDates = Object.keys(groups).sort((a, b) => b.localeCompare(a));

  const alreadySaved = todayHasEntry(moment);
  const savedEntry = entries.find(e => e.date_string === today && e.type === `dagboek_${moment}`);
  const savedMood = STEMMINGEN.find(s => s.waarde === savedEntry?.data?.stemming);

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface pb-28">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-surface border-b border-line">
        <div className="max-w-lg mx-auto px-5 py-4 flex items-center gap-3">
          <Link
            href="/dashboard"
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-surface-sunken transition-colors"
          >
            <ArrowLeft size={18} className="text-ink" />
          </Link>
          <h1 className="text-[17px] font-semibold text-ink">Dagboek</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-5 pt-5 space-y-4">

        {/* Moment toggle */}
        <div className="flex gap-2">
          {(['ochtend', 'avond'] as Moment[]).map((m) => (
            <button
              key={m}
              onClick={() => { setMoment(m); setStemming(null); setTekst(''); }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-[12px] text-[13px] font-medium transition-colors ${
                moment === m
                  ? 'bg-surface-inverse text-on-surface-inverse'
                  : 'bg-surface-sunken text-ink-soft'
              }`}
            >
              {m === 'ochtend'
                ? <Sun size={14} className={moment === m ? 'text-tertiary-soft' : 'text-tertiary'} />
                : <Moon size={14} className={moment === m ? 'text-accent-soft' : 'text-accent'} />}
              {m.charAt(0).toUpperCase() + m.slice(1)}
              {todayHasEntry(m) && (
                <span className="w-1.5 h-1.5 rounded-full bg-primary ml-0.5" />
              )}
            </button>
          ))}
        </div>

        {/* Entry form */}
        <div className="rounded-card border border-line bg-surface-card p-5 shadow-organic">
          {alreadySaved ? (
            <div className="text-center py-4">
              <div className="w-11 h-11 rounded-full bg-primary-muted flex items-center justify-center mx-auto mb-3">
                <Check size={20} className="text-primary" />
              </div>
              <p className="text-[14px] font-medium text-ink">
                Al ingevuld vandaag{savedMood ? ` — ${savedMood.label.toLowerCase()}` : ''}
              </p>
              <p className="text-[12px] text-ink-soft mt-1">
                {savedEntry?.data?.tekst || ''}
              </p>
              <button
                onClick={() => { if (savedEntry) handleDelete(savedEntry.id); }}
                className="mt-4 text-[12px] text-ink-soft hover:text-error transition-colors flex items-center gap-1 mx-auto"
              >
                <Trash2 size={12} /> Opnieuw invullen
              </button>
            </div>
          ) : (
            <>
              <p className="text-[13px] text-ink-soft mb-4">
                Hoe voel je je deze {moment}?
              </p>

              {/* Mood selector — 1-5 intensity scale, no emoji */}
              <div className="flex justify-between gap-1.5 mb-5">
                {STEMMINGEN.map((s) => {
                  const selected = stemming === s.waarde;
                  return (
                    <button
                      key={s.waarde}
                      onClick={() => setStemming(s.waarde)}
                      className={`flex flex-col items-center gap-2 flex-1 py-3 rounded-[12px] border transition-all ${
                        selected
                          ? 'bg-primary-muted border-primary/40'
                          : 'bg-transparent border-line hover:bg-surface-sunken'
                      }`}
                    >
                      <span
                        className="w-3 h-3 rounded-full transition-colors"
                        style={{
                          backgroundColor: selected ? 'var(--green)' : 'var(--border)',
                          opacity: selected ? 1 : 0.4 + s.waarde * 0.1,
                        }}
                      />
                      <span className={`text-[9px] font-medium ${selected ? 'text-ink' : 'text-ink-soft'}`}>
                        {s.label}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Optional text */}
              {stemming && (
                <textarea
                  value={tekst}
                  onChange={(e) => setTekst(e.target.value)}
                  placeholder="Optioneel: schrijf iets over hoe je je voelt..."
                  rows={3}
                  className="w-full resize-none bg-surface-sunken border border-line rounded-[12px] px-4 py-3 text-[14px] text-ink placeholder-ink-soft outline-none focus:border-primary transition-colors mb-4"
                />
              )}

              <button
                onClick={handleSave}
                disabled={!stemming || saving}
                className="w-full py-3 bg-primary text-white rounded-[12px] text-[14px] font-semibold disabled:opacity-40 active:scale-[0.98] transition-transform"
              >
                {saving ? 'Opslaan...' : 'Opslaan'}
              </button>
            </>
          )}
        </div>

        {/* History */}
        {sortedDates.length > 0 && (
          <div className="space-y-3 pt-2">
            <p className="text-[11px] font-medium text-ink-soft uppercase tracking-wider">Eerdere notities</p>
            {sortedDates.map((date) => {
              const dayEntries = groups[date];
              const label = date === today
                ? 'Vandaag'
                : new Date(date).toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' });
              return (
                <div key={date} className="rounded-card border border-line bg-surface-card overflow-hidden">
                  <div className="px-5 py-3 border-b border-line bg-surface-sunken">
                    <p className="text-[12px] font-semibold text-ink capitalize">{label}</p>
                  </div>
                  {dayEntries.map((entry) => {
                    const d = typeof entry.data === 'string' ? JSON.parse(entry.data) : entry.data;
                    const s = STEMMINGEN.find(x => x.waarde === d.stemming);
                    return (
                      <div key={entry.id} className="px-5 py-4 flex items-start gap-3 border-b border-line last:border-b-0">
                        <span
                          className="w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0"
                          style={{ backgroundColor: 'var(--green)', opacity: 0.3 + (s?.waarde ?? 3) * 0.14 }}
                          title={s?.label}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            {getMomentIcon(entry.type)}
                            <span className="text-[11px] font-medium text-ink-soft">{getMomentLabel(entry.type)}</span>
                            {s && (
                              <span className="text-[11px] text-ink-soft">&middot; {s.label}</span>
                            )}
                            <span className="text-[11px] text-ink-soft ml-auto">
                              {new Date(entry.timestamp).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          {d.tekst && (
                            <p className="text-[13px] text-ink leading-relaxed">{d.tekst}</p>
                          )}
                        </div>
                        <button
                          onClick={() => handleDelete(entry.id)}
                          className="text-line hover:text-error transition-colors flex-shrink-0"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
