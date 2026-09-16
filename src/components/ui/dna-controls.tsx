'use client';

import { Check } from 'lucide-react';

// Gedeeld tussen de onboarding-wizard (src/app/onboarding/page.tsx) en de Bedrijfs-DNA sectie
// in Instellingen (src/app/settings/page.tsx) — zelfde chips/cards, zodat bewerken achteraf
// er niet anders uitziet of aanvoelt dan de eerste intake.

export function ChipButton({ selected, onClick, children, disabled }: { selected: boolean; onClick: () => void; children: React.ReactNode; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`text-[13px] px-3.5 py-2 rounded-full border transition-colors text-left disabled:opacity-40 ${
        selected
          ? 'border-primary bg-primary-muted text-primary font-medium'
          : 'border-line text-ink hover:border-primary/50'
      }`}
    >
      {children}
    </button>
  );
}

export function CardOption({ selected, onClick, title, description }: { selected: boolean; onClick: () => void; title: string; description?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left rounded-[14px] border p-4 transition-colors ${
        selected ? 'border-primary bg-primary-muted' : 'border-line bg-surface-sunken hover:border-primary/40'
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className={`text-[14px] font-semibold ${selected ? 'text-primary' : 'text-ink'}`}>{title}</p>
          {description && <p className="text-[12px] text-ink-soft mt-1">{description}</p>}
        </div>
        {selected && <Check size={18} className="text-primary shrink-0" />}
      </div>
    </button>
  );
}

export function CheckRow({ selected, onClick, disabled, children }: { selected: boolean; onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`w-full flex items-center gap-3 rounded-[14px] px-4 py-3 text-left transition-colors disabled:opacity-40 ${
        selected ? 'bg-primary-muted text-primary' : 'bg-surface-sunken text-ink'
      }`}
    >
      <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${selected ? 'border-primary bg-primary' : 'border-line'}`}>
        {selected && <Check size={12} className="text-white" />}
      </span>
      <span className="text-[13px]">{children}</span>
    </button>
  );
}
