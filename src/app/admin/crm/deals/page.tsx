'use client';

import { useEffect, useState } from 'react';
import { Plus, Trash2, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/admin/Modal';

interface Company {
  id: number;
  name: string;
}
interface Deal {
  id: number;
  company_id: number | null;
  company_name: string | null;
  title: string;
  value: number;
  stage: string;
  notes: string | null;
}

const stages = [
  { key: 'lead', label: 'Lead' },
  { key: 'qualified', label: 'Gekwalificeerd' },
  { key: 'voorstel', label: 'Voorstel' },
  { key: 'onderhandeling', label: 'Onderhandeling' },
  { key: 'gewonnen', label: 'Gewonnen' },
  { key: 'verloren', label: 'Verloren' },
];

const empty = { companyId: '', title: '', value: '', stage: 'lead', notes: '' };

function euro(n: number): string {
  return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(n);
}

export default function DealsPage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(empty);

  const load = () => {
    Promise.all([
      fetch('/api/admin/crm/deals').then((r) => r.json()),
      fetch('/api/admin/crm/companies').then((r) => r.json()),
    ]).then(([d, co]) => {
      setDeals(d);
      setCompanies(co);
      setLoading(false);
    });
  };
  useEffect(load, []);

  const openNew = () => {
    setForm(empty);
    setShowModal(true);
  };

  const handleSave = async () => {
    const payload = {
      ...form,
      companyId: form.companyId ? Number(form.companyId) : null,
      value: form.value ? Number(form.value) : 0,
    };
    await fetch('/api/admin/crm/deals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    setShowModal(false);
    load();
  };

  const handleStageChange = async (deal: Deal, stage: string) => {
    await fetch(`/api/admin/crm/deals/${deal.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        companyId: deal.company_id,
        title: deal.title,
        value: deal.value,
        stage,
        notes: deal.notes,
      }),
    });
    load();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Deal verwijderen?')) return;
    await fetch(`/api/admin/crm/deals/${id}`, { method: 'DELETE' });
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-ink">Deals</h1>
        <Button onClick={openNew}>
          <Plus size={18} className="mr-2" />
          Nieuwe deal
        </Button>
      </div>

      {loading ? (
        <p className="text-ink-soft">Laden...</p>
      ) : deals.length === 0 ? (
        <div className="bg-surface-card border border-line rounded-xl p-10 text-center text-ink-soft">
          <Target size={32} className="mx-auto mb-3 text-outline" />
          Nog geen deals.
        </div>
      ) : (
        <div className="bg-surface-card border border-line rounded-xl overflow-hidden">
          {deals.map((d) => (
            <div key={d.id} className="flex items-center justify-between px-5 py-4 border-b border-line last:border-b-0 gap-4">
              <div className="min-w-0">
                <div className="font-medium text-ink truncate">{d.title}</div>
                <div className="text-sm text-ink-soft">{[d.company_name, euro(Number(d.value))].filter(Boolean).join(' · ')}</div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <select
                  className="px-3 py-1.5 rounded-lg bg-surface-sunken border border-line text-sm text-ink"
                  value={d.stage}
                  onChange={(e) => handleStageChange(d, e.target.value)}
                >
                  {stages.map((s) => (
                    <option key={s.key} value={s.key}>{s.label}</option>
                  ))}
                </select>
                <Button variant="ghost" size="sm" onClick={() => handleDelete(d.id)}>
                  <Trash2 size={16} className="text-error" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <Modal title="Nieuwe deal" onClose={() => setShowModal(false)}>
          <div className="space-y-4">
            <Input label="Titel" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <div>
              <label className="block text-sm font-medium text-ink-soft mb-2">Bedrijf</label>
              <select
                className="w-full px-4 py-2.5 rounded-lg bg-surface-sunken border border-line focus:border-primary focus:outline-none text-ink"
                value={form.companyId}
                onChange={(e) => setForm({ ...form, companyId: e.target.value })}
              >
                <option value="">Geen</option>
                {companies.map((co) => (
                  <option key={co.id} value={co.id}>{co.name}</option>
                ))}
              </select>
            </div>
            <Input label="Waarde (€)" type="number" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} />
            <div>
              <label className="block text-sm font-medium text-ink-soft mb-2">Fase</label>
              <select
                className="w-full px-4 py-2.5 rounded-lg bg-surface-sunken border border-line focus:border-primary focus:outline-none text-ink"
                value={form.stage}
                onChange={(e) => setForm({ ...form, stage: e.target.value })}
              >
                {stages.map((s) => (
                  <option key={s.key} value={s.key}>{s.label}</option>
                ))}
              </select>
            </div>
            <Button className="w-full" onClick={handleSave}>Opslaan</Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
