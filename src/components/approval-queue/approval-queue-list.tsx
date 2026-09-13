'use client';

import { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { ApprovalCard } from './approval-card';
import type { ApprovalQueueItem } from '@/types';

export interface ApprovalQueueListProps {
  items: ApprovalQueueItem[];
  onDecide: (item: ApprovalQueueItem, status: 'approved' | 'rejected') => void | Promise<void>;
  onEdit?: (item: ApprovalQueueItem) => void;
  title?: string;
}

/**
 * Rendert de Approval Queue als swipe-/klikbare kaarten (Calm Tech §3.1/§5): optimistic UI —
 * een beslissing laat de kaart lokaal direct verdwijnen, de echte agent-actie (onDecide) loopt
 * async op de achtergrond. Bij "0 openstaand" verschijnt een rustige, niet-triomfantelijke
 * afgeronde-status i.p.v. een beloningsmoment — geen confetti.
 */
export function ApprovalQueueList({ items, onDecide, onEdit, title = 'Approval Queue' }: ApprovalQueueListProps) {
  const [removingIds, setRemovingIds] = useState<Set<number>>(new Set());
  const [dismissed, setDismissed] = useState<Set<number>>(new Set());

  const visible = items.filter((item) => !dismissed.has(item.id));

  const decide = (item: ApprovalQueueItem, status: 'approved' | 'rejected') => {
    setRemovingIds((prev) => new Set(prev).add(item.id));
    // Korte fade-en-collapse (150ms, zie spec §5) vóór de kaart echt uit de lijst valt, zodat de
    // optimistic-update niet abrupt aanvoelt terwijl onDecide async op de achtergrond draait.
    window.setTimeout(() => {
      setDismissed((prev) => new Set(prev).add(item.id));
    }, 150);
    void onDecide(item, status);
  };

  return (
    <section>
      <div className="flex items-center justify-between mb-3.5">
        <h2 className="text-[15px] font-bold text-ink">{title}</h2>
        {visible.length > 0 && (
          <span className="text-[10px] font-bold text-agent-wacht bg-agent-wacht/10 px-2 py-0.5 rounded-full tabular-nums">
            {visible.length} openstaand
          </span>
        )}
      </div>

      {visible.length === 0 ? (
        <div className="flex items-center gap-2.5 rounded-[14px] border border-line bg-surface-card px-4 py-4">
          <CheckCircle2 size={16} className="text-agent-klaar shrink-0" />
          <p className="text-[12px] text-ink-soft">Alles afgehandeld.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {visible.map((item) => (
            <ApprovalCard
              key={item.id}
              item={item}
              removing={removingIds.has(item.id)}
              onApprove={(i) => decide(i, 'approved')}
              onReject={(i) => decide(i, 'rejected')}
              onEdit={onEdit}
            />
          ))}
        </div>
      )}
    </section>
  );
}
