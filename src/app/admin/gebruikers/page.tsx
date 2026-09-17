'use client';

import { useEffect, useState } from 'react';
import { Users, UserCheck, UserPlus, UserX, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/admin/Modal';

interface User {
  id: number;
  email: string;
  role: string;
  created_at: string;
  last_login_at: string | null;
  login_count: number;
  organization_name: string | null;
  organization_plan: string | null;
}

interface Stats {
  total: number;
  active_7d: number;
  active_30d: number;
  never_logged_in: number;
  new_7d: number;
}

function formatDate(value: string | null): string {
  if (!value) return '—';
  return new Date(value).toLocaleString('nl-NL', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function statusBadge(lastLoginAt: string | null): { label: string; className: string } {
  if (!lastLoginAt) return { label: 'Nooit ingelogd', className: 'bg-surface-sunken text-ink-soft' };
  const days = (Date.now() - new Date(lastLoginAt).getTime()) / 86_400_000;
  if (days <= 7) return { label: 'Actief', className: 'bg-primary-muted text-primary-dark' };
  if (days <= 30) return { label: 'Minder actief', className: 'bg-amber-100 text-amber-700' };
  return { label: 'Inactief', className: 'bg-error-soft text-error' };
}

export default function GebruikersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [toDelete, setToDelete] = useState<User | null>(null);
  const [confirmText, setConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);

  const load = () => {
    fetch('/api/admin/users')
      .then((r) => r.json())
      .then((data) => {
        setUsers(data.users ?? []);
        setStats(data.stats ?? null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };
  useEffect(load, []);

  const closeModal = () => {
    setToDelete(null);
    setConfirmText('');
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/users/${toDelete.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Verwijderen mislukt');
      closeModal();
      load();
    } catch {
      alert('Verwijderen mislukt. Probeer het opnieuw.');
    } finally {
      setDeleting(false);
    }
  };

  const cards = [
    { label: 'Totaal gebruikers', value: stats?.total ?? 0, icon: Users },
    { label: 'Actief (7 dagen)', value: stats?.active_7d ?? 0, icon: UserCheck },
    { label: 'Nieuw (7 dagen)', value: stats?.new_7d ?? 0, icon: UserPlus },
    { label: 'Nooit ingelogd', value: stats?.never_logged_in ?? 0, icon: UserX },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink mb-6">Gebruikers</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {cards.map((c) => (
          <div key={c.label} className="bg-surface-card border border-line rounded-xl p-5">
            <div className="flex items-center gap-2 text-ink-soft text-sm mb-3">
              <c.icon size={16} />
              {c.label}
            </div>
            <div className="text-xl font-bold text-ink">{c.value}</div>
          </div>
        ))}
      </div>

      {loading ? (
        <p className="text-ink-soft">Laden...</p>
      ) : users.length === 0 ? (
        <div className="bg-surface-card border border-line rounded-xl p-10 text-center text-ink-soft">
          <Users size={32} className="mx-auto mb-3 text-outline" />
          Nog geen gebruikers.
        </div>
      ) : (
        <div className="bg-surface-card border border-line rounded-xl overflow-hidden overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-ink-soft">
                <th className="px-5 py-3 font-medium">E-mail</th>
                <th className="px-5 py-3 font-medium">Organisatie</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Laatste login</th>
                <th className="px-5 py-3 font-medium">Logins</th>
                <th className="px-5 py-3 font-medium">Geregistreerd</th>
                <th className="px-5 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const badge = statusBadge(u.last_login_at);
                return (
                  <tr key={u.id} className="border-b border-line last:border-b-0">
                    <td className="px-5 py-3 font-medium text-ink">{u.email}</td>
                    <td className="px-5 py-3 text-ink-soft">{u.organization_name ?? '—'}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${badge.className}`}>
                        {badge.label}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-ink-soft">{formatDate(u.last_login_at)}</td>
                    <td className="px-5 py-3 text-ink-soft">{u.login_count}</td>
                    <td className="px-5 py-3 text-ink-soft">{formatDate(u.created_at)}</td>
                    <td className="px-5 py-3 text-right">
                      <Button variant="ghost" size="sm" onClick={() => setToDelete(u)}>
                        <Trash2 size={16} className="text-error" />
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {toDelete && (
        <Modal title="Account verwijderen" onClose={closeModal}>
          <div className="space-y-4">
            <p className="text-sm text-ink-soft leading-relaxed">
              Je staat op het punt <strong className="text-ink">{toDelete.email}</strong> en al hun data
              (rituelen, doelen, cursusvoortgang, voorkeuren) permanent te verwijderen. Dit kan niet ongedaan
              worden gemaakt.
            </p>
            <div>
              <label className="block text-sm font-medium text-ink-soft mb-2">
                Typ het e-mailadres ter bevestiging
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg bg-surface-sunken border border-line focus:border-primary focus:outline-none text-ink"
                placeholder={toDelete.email}
                autoFocus
              />
            </div>
            <Button
              variant="danger"
              className="w-full"
              disabled={confirmText !== toDelete.email || deleting}
              onClick={handleDelete}
            >
              {deleting ? 'Verwijderen...' : 'Definitief verwijderen'}
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
