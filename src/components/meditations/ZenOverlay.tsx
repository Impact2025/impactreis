'use client';

import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { Meditation } from '@/lib/meditations/catalog';

interface ZenOverlayProps {
  meditation: Meditation;
  remainingSeconds: number | null;
  onTogglePlay: () => void;
  onClose: () => void;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function ZenOverlay({ meditation, remainingSeconds, onTogglePlay, onClose }: ZenOverlayProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Escape') onClose();
      if (e.code === 'Space') {
        e.preventDefault();
        onTogglePlay();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [onClose, onTogglePlay]);

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-surface-inverse/90 backdrop-blur-md animate-[fadeIn_0.4s_ease-out]"
      role="dialog"
      aria-modal="true"
      aria-label={`Zen-modus: ${meditation.title}`}
      onClick={onTogglePlay}
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        aria-label="Zen-modus sluiten"
        className="absolute top-6 right-6 w-10 h-10 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors"
      >
        <X size={20} />
      </button>

      <p className="text-[11px] font-bold tracking-[0.2em] text-white/50 uppercase mb-8">
        {meditation.title}
      </p>

      <div className="relative flex items-center justify-center w-56 h-56">
        <div className="absolute inset-0 rounded-full bg-primary/20 animate-[breathe_10s_ease-in-out_infinite]" />
        <div className="absolute inset-6 rounded-full bg-primary/30 animate-[breathe_10s_ease-in-out_infinite]" style={{ animationDelay: '0.3s' }} />
        <div className="relative w-24 h-24 rounded-full bg-primary/80" />
      </div>

      <p className="mt-10 text-[13px] text-white/50">Adem in... en uit.</p>

      {remainingSeconds !== null && (
        <p className="mt-3 text-[20px] font-mono text-white/80 tabular-nums">
          {formatTime(remainingSeconds)}
        </p>
      )}

      <p className="mt-8 text-[11px] text-white/30">Tik om te pauzeren · Esc om te sluiten</p>

      <style jsx>{`
        @keyframes breathe {
          0% { transform: scale(0.85); opacity: 0.5; }
          40% { transform: scale(1.05); opacity: 0.9; }
          100% { transform: scale(0.85); opacity: 0.5; }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>,
    document.body
  );
}
