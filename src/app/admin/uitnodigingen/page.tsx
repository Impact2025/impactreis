'use client';

import { useEffect, useState } from 'react';
import { UserPlus, Trash2, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Invite {
  id: number;
  email: string;
  invited_at: string;
}

function formatDate(value: string): string {
  return new Date(value).toLocaleString('nl-NL', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function UitnodigingenPage() {
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');

  const load = () => {
    fetch('/api/admin/invites')
      .then((r) => r.json())
      .then((data) => {
        setInvites(data.invites ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };
  useEffect(load, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setAdding(true);
    try {
      const res = await fetch('/api/admin/invites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Toevoegen mislukt');
      }
      setEmail('');
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Toevoegen mislukt');
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (id: number) => {
    await fetch(`/api/admin/invites/${id}`, { method: 'DELETE' });
    load();
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink mb-2">Uitnodigingen</h1>
      <p className="text-sm text-ink-soft mb-6">
        Sparren.app is invite-only. Alleen e-mailadressen hieronder (of bestaande klanten) kunnen
        via de inloglink een account aanmaken.
      </p>

      <form onSubmit={handleAdd} className="flex gap-2 mb-6 max-w-md">
        <input
          type="email"
          placeholder="naam@bedrijf.nl"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="flex-1 px-4 py-2.5 rounded-lg bg-surface-sunken border border-line focus:border-primary focus:outline-none text-ink text-sm"
        />
        <Button type="submit" disabled={adding}>
          <UserPlus size={16} className="mr-1.5" /> {adding ? 'Bezig...' : 'Uitnodigen'}
        </Button>
      </form>
      {error && <p className="text-sm text-error mb-4">{error}</p>}

      {loading ? (
        <p className="text-ink-soft">Laden...</p>
      ) : invites.length === 0 ? (
        <div className="bg-surface-card border border-line rounded-xl p-10 text-center text-ink-soft">
          <Mail size={32} className="mx-auto mb-3 text-outline" />
          Nog geen uitnodigingen.
        </div>
      ) : (
        <div className="bg-surface-card border border-line rounded-xl overflow-hidden overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-ink-soft">
                <th className="px-5 py-3 font-medium">E-mail</th>
                <th className="px-5 py-3 font-medium">Uitgenodigd op</th>
                <th className="px-5 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {invites.map((i) => (
                <tr key={i.id} className="border-b border-line last:border-b-0">
                  <td className="px-5 py-3 font-medium text-ink">{i.email}</td>
                  <td className="px-5 py-3 text-ink-soft">{formatDate(i.invited_at)}</td>
                  <td className="px-5 py-3 text-right">
                    <Button variant="ghost" size="sm" onClick={() => handleRemove(i.id)}>
                      <Trash2 size={16} className="text-error" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
