'use client';

import { useRef, useState } from 'react';
import { Check, X, Pencil, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ApprovalQueueItem } from '@/types';

// Agent-identiteit puur voor weergave (initiaal + naam) — geen aparte agent-tabel nodig voor dit
// niveau van detail. Uitbreiden met avatar/kleur per agent kan later zonder schema-wijziging.
const AGENT_LABELS: Record<string, string> = {
  iris: 'Iris',
  mara: 'Mara',
  bram: 'Bram',
  noor: 'Noor',
  toby: 'Toby',
  coach: 'AIPA',
};

// Swipe-drempel: onder dit aantal pixels veert de kaart terug i.p.v. door te schieten naar
// approve/reject — voorkomt dat een korte tik per ongeluk als beslissing telt.
const SWIPE_THRESHOLD = 96;

function confidenceColor(confidence: number): string {
  // Gedempte gradient van terracotta (laag) naar rustig groen (hoog) — nooit een hard stoplicht,
  // conform de Calm Tech-spec (§5, Confidence scores).
  if (confidence >= 0.85) return 'var(--agent-klaar)';
  if (confidence >= 0.6) return 'var(--agent-actief)';
  return 'var(--agent-wacht)';
}

function payloadTitle(item: ApprovalQueueItem): string {
  const p = item.payload as { title?: string; summary?: string; subject?: string };
  return p.title ?? p.summary ?? p.subject ?? 'Voorstel';
}

function payloadPreview(item: ApprovalQueueItem): string | undefined {
  const p = item.payload as { preview?: string; body?: string; description?: string };
  return p.preview ?? p.body ?? p.description;
}

export interface ApprovalCardProps {
  item: ApprovalQueueItem;
  onApprove: (item: ApprovalQueueItem) => void;
  onReject: (item: ApprovalQueueItem) => void;
  onEdit?: (item: ApprovalQueueItem) => void;
  /** Optimistic UI: laat de aanroeper de kaart lokaal direct laten verdwijnen, terwijl de
   *  daadwerkelijke agent-actie async op de achtergrond gebeurt (Calm Tech-principe §1.4). */
  removing?: boolean;
}

export function ApprovalCard({ item, onApprove, onReject, onEdit, removing }: ApprovalCardProps) {
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [diffOpen, setDiffOpen] = useState(false);
  const dragStart = useRef<number | null>(null);

  const confidencePct = item.confidence != null ? Math.round(item.confidence * 100) : null;

  const handlePointerDown = (e: React.PointerEvent) => {
    dragStart.current = e.clientX;
    setDragging(true);
    (e.target as Element).setPointerCapture?.(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (dragStart.current == null) return;
    setDragX(e.clientX - dragStart.current);
  };

  const handlePointerUp = () => {
    if (dragX > SWIPE_THRESHOLD) onApprove(item);
    else if (dragX < -SWIPE_THRESHOLD) onReject(item);
    setDragging(false);
    setDragX(0);
    dragStart.current = null;
  };

  const swipeHintOpacity = Math.min(1, Math.abs(dragX) / SWIPE_THRESHOLD);
  const swipeDirection = dragX > 0 ? 'approve' : 'reject';

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-[14px] border border-line bg-surface-card',
        removing && 'animate-fade-in pointer-events-none opacity-0 transition-opacity duration-150',
      )}
    >
      {/* Onderliggende swipe-hint — alleen zichtbaar tijdens het slepen */}
      {dragging && dragX !== 0 && (
        <div
          className={cn(
            'absolute inset-0 flex items-center px-5',
            swipeDirection === 'approve' ? 'justify-start bg-agent-klaar/15' : 'justify-end bg-agent-fout/15',
          )}
          style={{ opacity: swipeHintOpacity }}
        >
          {swipeDirection === 'approve' ? (
            <Check size={20} className="text-agent-klaar" />
          ) : (
            <X size={20} className="text-agent-fout" />
          )}
        </div>
      )}

      <div
        className="relative bg-surface-card px-4 py-3.5 select-none"
        style={{
          transform: `translateX(${dragX}px)`,
          transition: dragging ? 'none' : 'transform 150ms ease-out',
          touchAction: 'pan-y',
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={dragging ? handlePointerMove : undefined}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <div className="flex items-start justify-between gap-3 mb-1.5">
          <div className="flex items-center gap-2 min-w-0">
            <span
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
              style={{ background: 'var(--agent-wacht)' }}
              aria-hidden
            >
              {(AGENT_LABELS[item.agent_key] ?? item.agent_key).charAt(0)}
            </span>
            <span className="text-[13px] font-semibold text-ink truncate">
              {AGENT_LABELS[item.agent_key] ?? item.agent_key} &middot; {payloadTitle(item)}
            </span>
          </div>
          {confidencePct != null && (
            <span
              className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold tabular-nums text-white"
              style={{ background: confidenceColor(item.confidence!) }}
              title="Confidence score"
            >
              {confidencePct}%
            </span>
          )}
        </div>

        {item.reason && (
          <p className="text-[11px] text-ink-soft mb-2 leading-snug">{item.reason}</p>
        )}

        {payloadPreview(item) && (
          <p className="text-[12px] text-ink leading-relaxed mb-2 line-clamp-2">
            {payloadPreview(item)}
          </p>
        )}

        {item.diff && item.diff.length > 0 && (
          <div className="mb-2">
            <button
              type="button"
              onClick={() => setDiffOpen((v) => !v)}
              className="flex items-center gap-1 text-[11px] font-semibold text-primary"
            >
              {diffOpen ? 'Verberg wijzigingen' : 'Bekijk diff'}
              {diffOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
            {diffOpen && (
              <p className="mt-1.5 rounded-[10px] bg-surface-sunken px-3 py-2 text-[12px] leading-relaxed">
                {item.diff.map((part, i) => (
                  <span
                    key={i}
                    className={cn(
                      part.type === 'added' && 'text-agent-klaar underline decoration-agent-klaar/50',
                      part.type === 'removed' && 'text-agent-fout line-through opacity-70',
                    )}
                  >
                    {part.text}
                  </span>
                ))}
              </p>
            )}
          </div>
        )}

        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={() => onApprove(item)}
            className="flex-1 py-2 rounded-[10px] bg-primary text-white text-[12px] font-bold active:scale-[0.98] transition-transform"
          >
            <Check size={13} className="inline mr-1 -mt-0.5" />
            Goedkeuren
          </button>
          {onEdit && (
            <button
              type="button"
              onClick={() => onEdit(item)}
              className="px-3 py-2 rounded-[10px] bg-surface-sunken text-ink-soft text-[12px] font-semibold"
              aria-label="Wijzig"
            >
              <Pencil size={13} />
            </button>
          )}
          <button
            type="button"
            onClick={() => onReject(item)}
            className="px-3 py-2 rounded-[10px] bg-surface-sunken text-ink-soft text-[12px] font-semibold"
            aria-label="Afwijzen"
          >
            <X size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}
