'use client';

import { useEffect, useState } from 'react';
import { Plus, Trash2, CheckSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/admin/Modal';
import { cn } from '@/lib/utils';

interface Task {
  id: number;
  title: string;
  description: string | null;
  due_date: string | null;
  done: boolean;
}

const empty = { title: '', description: '', dueDate: '' };

export default function TakenPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(empty);

  const load = () => {
    fetch('/api/admin/crm/tasks')
      .then((r) => r.json())
      .then(setTasks)
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const handleSave = async () => {
    await fetch('/api/admin/crm/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setShowModal(false);
    setForm(empty);
    load();
  };

  const toggleDone = async (task: Task) => {
    await fetch(`/api/admin/crm/tasks/${task.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...task, dueDate: task.due_date, done: !task.done }),
    });
    load();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Taak verwijderen?')) return;
    await fetch(`/api/admin/crm/tasks/${id}`, { method: 'DELETE' });
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-ink">Taken</h1>
        <Button onClick={() => setShowModal(true)}>
          <Plus size={18} className="mr-2" />
          Nieuwe taak
        </Button>
      </div>

      {loading ? (
        <p className="text-ink-soft">Laden...</p>
      ) : tasks.length === 0 ? (
        <div className="bg-surface-card border border-line rounded-xl p-10 text-center text-ink-soft">
          <CheckSquare size={32} className="mx-auto mb-3 text-outline" />
          Nog geen taken.
        </div>
      ) : (
        <div className="bg-surface-card border border-line rounded-xl overflow-hidden">
          {tasks.map((t) => (
            <div key={t.id} className="flex items-center justify-between px-5 py-4 border-b border-line last:border-b-0">
              <label className="flex items-center gap-3 min-w-0 cursor-pointer">
                <input type="checkbox" checked={t.done} onChange={() => toggleDone(t)} className="w-4 h-4 accent-primary" />
                <div className="min-w-0">
                  <div className={cn('font-medium text-ink truncate', t.done && 'line-through text-ink-soft')}>{t.title}</div>
                  {t.due_date && <div className="text-sm text-ink-soft">{new Date(t.due_date).toLocaleDateString('nl-NL')}</div>}
                </div>
              </label>
              <Button variant="ghost" size="sm" onClick={() => handleDelete(t.id)}>
                <Trash2 size={16} className="text-error" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <Modal title="Nieuwe taak" onClose={() => setShowModal(false)}>
          <div className="space-y-4">
            <Input label="Titel" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <Input label="Deadline" type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
            <div>
              <label className="block text-sm font-medium text-ink-soft mb-2">Omschrijving</label>
              <textarea
                className="w-full px-4 py-2.5 rounded-lg bg-surface-sunken border border-line focus:border-primary focus:outline-none text-ink"
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <Button className="w-full" onClick={handleSave}>Opslaan</Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
