'use client';

import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/admin/Modal';

interface Company {
  id: number;
  name: string;
  website: string | null;
  industry: string | null;
  notes: string | null;
}

const empty = { name: '', website: '', industry: '', notes: '' };

export default function BedrijvenPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Company | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(empty);

  const load = () => {
    fetch('/api/admin/crm/companies')
      .then((r) => r.json())
      .then(setCompanies)
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const openNew = () => {
    setEditing(null);
    setForm(empty);
    setShowModal(true);
  };
  const openEdit = (c: Company) => {
    setEditing(c);
    setForm({ name: c.name, website: c.website ?? '', industry: c.industry ?? '', notes: c.notes ?? '' });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (editing) {
      await fetch(`/api/admin/crm/companies/${editing.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
    } else {
      await fetch('/api/admin/crm/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
    }
    setShowModal(false);
    load();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Bedrijf verwijderen?')) return;
    await fetch(`/api/admin/crm/companies/${id}`, { method: 'DELETE' });
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-ink">Bedrijven</h1>
        <Button onClick={openNew}>
          <Plus size={18} className="mr-2" />
          Nieuw bedrijf
        </Button>
      </div>

      {loading ? (
        <p className="text-ink-soft">Laden...</p>
      ) : companies.length === 0 ? (
        <div className="bg-surface-card border border-line rounded-xl p-10 text-center text-ink-soft">
          <Building2 size={32} className="mx-auto mb-3 text-outline" />
          Nog geen bedrijven.
        </div>
      ) : (
        <div className="bg-surface-card border border-line rounded-xl overflow-hidden">
          {companies.map((c) => (
            <div key={c.id} className="flex items-center justify-between px-5 py-4 border-b border-line last:border-b-0">
              <div>
                <div className="font-medium text-ink">{c.name}</div>
                <div className="text-sm text-ink-soft">{[c.industry, c.website].filter(Boolean).join(' · ')}</div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => openEdit(c)}>
                  <Pencil size={16} />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleDelete(c.id)}>
                  <Trash2 size={16} className="text-error" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <Modal title={editing ? 'Bedrijf bewerken' : 'Nieuw bedrijf'} onClose={() => setShowModal(false)}>
          <div className="space-y-4">
            <Input label="Naam" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Input label="Website" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} />
            <Input label="Branche" value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })} />
            <div>
              <label className="block text-sm font-medium text-ink-soft mb-2">Notities</label>
              <textarea
                className="w-full px-4 py-2.5 rounded-lg bg-surface-sunken border border-line focus:border-primary focus:outline-none text-ink"
                rows={3}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </div>
            <Button className="w-full" onClick={handleSave}>Opslaan</Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
