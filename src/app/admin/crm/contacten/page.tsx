'use client';

import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/admin/Modal';

interface Company {
  id: number;
  name: string;
}
interface Contact {
  id: number;
  company_id: number | null;
  company_name: string | null;
  name: string;
  email: string | null;
  phone: string | null;
  role: string | null;
  notes: string | null;
}

const empty = { companyId: '', name: '', email: '', phone: '', role: '', notes: '' };

export default function ContactenPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Contact | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(empty);

  const load = () => {
    Promise.all([
      fetch('/api/admin/crm/contacts').then((r) => r.json()),
      fetch('/api/admin/crm/companies').then((r) => r.json()),
    ]).then(([c, co]) => {
      setContacts(c);
      setCompanies(co);
      setLoading(false);
    });
  };
  useEffect(load, []);

  const openNew = () => {
    setEditing(null);
    setForm(empty);
    setShowModal(true);
  };
  const openEdit = (c: Contact) => {
    setEditing(c);
    setForm({
      companyId: c.company_id ? String(c.company_id) : '',
      name: c.name,
      email: c.email ?? '',
      phone: c.phone ?? '',
      role: c.role ?? '',
      notes: c.notes ?? '',
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    const payload = { ...form, companyId: form.companyId ? Number(form.companyId) : null };
    if (editing) {
      await fetch(`/api/admin/crm/contacts/${editing.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } else {
      await fetch('/api/admin/crm/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    }
    setShowModal(false);
    load();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Contact verwijderen?')) return;
    await fetch(`/api/admin/crm/contacts/${id}`, { method: 'DELETE' });
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-ink">Contacten</h1>
        <Button onClick={openNew}>
          <Plus size={18} className="mr-2" />
          Nieuw contact
        </Button>
      </div>

      {loading ? (
        <p className="text-ink-soft">Laden...</p>
      ) : contacts.length === 0 ? (
        <div className="bg-surface-card border border-line rounded-xl p-10 text-center text-ink-soft">
          <Users size={32} className="mx-auto mb-3 text-outline" />
          Nog geen contacten.
        </div>
      ) : (
        <div className="bg-surface-card border border-line rounded-xl overflow-hidden">
          {contacts.map((c) => (
            <div key={c.id} className="flex items-center justify-between px-5 py-4 border-b border-line last:border-b-0">
              <div>
                <div className="font-medium text-ink">{c.name}</div>
                <div className="text-sm text-ink-soft">
                  {[c.role, c.company_name, c.email, c.phone].filter(Boolean).join(' · ')}
                </div>
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
        <Modal title={editing ? 'Contact bewerken' : 'Nieuw contact'} onClose={() => setShowModal(false)}>
          <div className="space-y-4">
            <Input label="Naam" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
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
            <Input label="Rol" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} />
            <Input label="E-mail" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <Input label="Telefoon" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
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
