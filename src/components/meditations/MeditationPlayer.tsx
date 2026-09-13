'use client';

import { useEffect, useRef, useState } from 'react';
import { Play, Pause } from 'lucide-react';
import { Meditation, MEDITATION_CATEGORY_LABELS } from '@/lib/meditations/catalog';
import { api } from '@/lib/api';
import { ZenOverlay } from './ZenOverlay';

interface MeditationPlayerProps {
  meditation: Meditation;
  compact?: boolean;
  onComplete?: () => void;
  /** Toon een gedimde, fullscreen ademhalings-overlay tijdens het afspelen (aan by default). */
  zenMode?: boolean;
}

export function MeditationPlayer({ meditation, compact = false, onComplete, zenMode = true }: MeditationPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  // Spatiebalk = play/pause, maar alleen als dit component focus heeft — voorkomt dat
  // spatie elders op de pagina (formulieren, andere knoppen) per ongeluk deze audio start.
  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      }
    };
    node.addEventListener('keydown', handleKeyDown);
    return () => node.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying]);

  const handleEnded = () => {
    setIsPlaying(false);
    setProgress(0);
    setRemainingSeconds(null);
    api.meditations.complete({
      meditationId: meditation.id,
      durationSeconds: Math.round(audioRef.current?.duration ?? 0),
    }).catch(() => {});
    onComplete?.();
  };

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      role="group"
      aria-label={`Meditatie: ${meditation.title}`}
      className="w-full rounded-2xl border border-line bg-surface-card p-4 text-ink outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
    >
      <audio
        ref={audioRef}
        src={meditation.audioSrc}
        preload="none"
        onTimeUpdate={() => {
          if (audioRef.current?.duration) {
            setProgress((audioRef.current.currentTime / audioRef.current.duration) * 100);
            setRemainingSeconds(audioRef.current.duration - audioRef.current.currentTime);
          }
        }}
        onEnded={handleEnded}
      />

      {zenMode && isPlaying && (
        <ZenOverlay
          meditation={meditation}
          remainingSeconds={remainingSeconds}
          onTogglePlay={togglePlay}
          onClose={togglePlay}
        />
      )}

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={togglePlay}
            aria-label={isPlaying ? 'Pauzeer meditatie' : 'Start meditatie'}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-muted text-primary hover:bg-primary/20 transition-colors"
          >
            {isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" className="ml-0.5" />}
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-[13px] font-semibold text-ink truncate">{meditation.title}</p>
              <span className="text-[9px] font-bold tracking-[0.1em] text-primary uppercase shrink-0">
                {MEDITATION_CATEGORY_LABELS[meditation.category]}
              </span>
            </div>
            {!compact && (
              <p className="text-[12px] text-ink-soft truncate">{meditation.description}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isPlaying && (
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
            </span>
          )}
          <span className="text-[11px] font-mono text-ink-soft">{meditation.durationLabel}</span>
        </div>
      </div>

      <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-surface-sunken">
        <div
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
