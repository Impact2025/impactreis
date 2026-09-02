'use client';

import { useEffect, useState } from 'react';
import { Plus, Trash2, Receipt, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/admin/Modal';
import { cn } from '@/lib/utils';

interface Invoice {
  id: number;
  number: string;
  client_name: string;
  amount: number;
  status: string;
  issue_date: string;
  due_date: string | null;
}
interface Expense {
  id: number;
  description: string;
  category: string | null;
  amount: number;
  date: string;
}

const invoiceStatuses = [
  { key: 'open', label: 'Open' },
  { key: 'betaald', label: 'Betaald' },
  { key: 'te_laat', label: 'Te laat' },
  { key: 'geannuleerd', label: 'Geannuleerd' },
];

function euro(n: number): string {
  return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(n);
}

const emptyInvoice = { number: '', clientName: '', amount: '', status: 'open', issueDate: '', dueDate: '' };
const emptyExpense = { description: '', category: '', amount: '', date: '' };

export default function AdministratiePage() {
  const [tab, setTab] = useState<'facturen' | 'uitgaven'>('facturen');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [invoiceForm, setInvoiceForm] = useState(emptyInvoice);
  const [expenseForm, setExpenseForm] = useState(emptyExpense);
  const [error, setError] = useState('');

  const load = () => {
    Promise.all([
      fetch('/api/admin/facturen').then((r) => r.json()),
      fetch('/api/admin/uitgaven').then((r) => r.json()),
    ]).then(([inv, exp]) => {
      setInvoices(inv);
      setExpenses(exp);
      setLoading(false);
    });
  };
  useEffect(load, []);

  const saveInvoice = async () => {
    setError('');
    const res = await fetch('/api/admin/facturen', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...invoiceForm, amount: invoiceForm.amount ? Number(invoiceForm.amount) : 0 }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || 'Opslaan mislukt');
      return;
    }
    setShowInvoiceModal(false);
    setInvoiceForm(emptyInvoice);
    load();
  };

  const changeInvoiceStatus = async (inv: Invoice, status: string) => {
    await fetch(`/api/admin/facturen/${inv.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        number: inv.number,
        clientName: inv.client_name,
        amount: inv.amount,
        status,
        issueDate: inv.issue_date,
        dueDate: inv.due_date,
      }),
    });
    load();
  };

  const deleteInvoice = async (id: number) => {
    if (!confirm('Factuur verwijderen?')) return;
    await fetch(`/api/admin/facturen/${id}`, { method: 'DELETE' });
    load();
  };

  const saveExpense = async () => {
    await fetch('/api/admin/uitgaven', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...expenseForm, amount: expenseForm.amount ? Number(expenseForm.amount) : 0 }),
    });
    setShowExpenseModal(false);
    setExpenseForm(emptyExpense);
    load();
  };

  const deleteExpense = async (id: number) => {
    if (!confirm('Uitgave verwijderen?')) return;
    await fetch(`/api/admin/uitgaven/${id}`, { method: 'DELETE' });
    load();
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink mb-6">Administratie</h1>

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setTab('facturen')}
          className={cn(
            'px-4 py-2 rounded-lg text-sm font-medium',
            tab === 'facturen' ? 'bg-primary-muted text-primary-dark' : 'text-ink-soft hover:bg-surface-sunken',
          )}
        >
          Facturen
        </button>
        <button
          onClick={() => setTab('uitgaven')}
          className={cn(
            'px-4 py-2 rounded-lg text-sm font-medium',
            tab === 'uitgaven' ? 'bg-primary-muted text-primary-dark' : 'text-ink-soft hover:bg-surface-sunken',
          )}
        >
          Uitgaven
        </button>
      </div>

      {loading ? (
        <p className="text-ink-soft">Laden...</p>
      ) : tab === 'facturen' ? (
        <div>
          <div className="flex justify-end mb-4">
            <Button onClick={() => setShowInvoiceModal(true)}>
              <Plus size={18} className="mr-2" />
              Nieuwe factuur
            </Button>
          </div>
          {invoices.length === 0 ? (
            <div className="bg-surface-card border border-line rounded-xl p-10 text-center text-ink-soft">
              <Receipt size={32} className="mx-auto mb-3 text-outline" />
              Nog geen facturen.
            </div>
          ) : (
            <div className="bg-surface-card border border-line rounded-xl overflow-hidden">
              {invoices.map((inv) => (
                <div key={inv.id} className="flex items-center justify-between px-5 py-4 border-b border-line last:border-b-0 gap-4">
                  <div className="min-w-0">
                    <div className="font-medium text-ink truncate">{inv.number} · {inv.client_name}</div>
                    <div className="text-sm text-ink-soft">{euro(Number(inv.amount))} · {new Date(inv.issue_date).toLocaleDateString('nl-NL')}</div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <select
                      className="px-3 py-1.5 rounded-lg bg-surface-sunken border border-line text-sm text-ink"
                      value={inv.status}
                      onChange={(e) => changeInvoiceStatus(inv, e.target.value)}
                    >
                      {invoiceStatuses.map((s) => (
                        <option key={s.key} value={s.key}>{s.label}</option>
                      ))}
                    </select>
                    <Button variant="ghost" size="sm" onClick={() => deleteInvoice(inv.id)}>
                      <Trash2 size={16} className="text-error" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div>
          <div className="flex justify-end mb-4">
            <Button onClick={() => setShowExpenseModal(true)}>
              <Plus size={18} className="mr-2" />
              Nieuwe uitgave
            </Button>
          </div>
          {expenses.length === 0 ? (
            <div className="bg-surface-card border border-line rounded-xl p-10 text-center text-ink-soft">
              <Wallet size={32} className="mx-auto mb-3 text-outline" />
              Nog geen uitgaven.
            </div>
          ) : (
            <div className="bg-surface-card border border-line rounded-xl overflow-hidden">
              {expenses.map((exp) => (
                <div key={exp.id} className="flex items-center justify-between px-5 py-4 border-b border-line last:border-b-0">
                  <div>
                    <div className="font-medium text-ink">{exp.description}</div>
                    <div className="text-sm text-ink-soft">
                      {[exp.category, euro(Number(exp.amount)), new Date(exp.date).toLocaleDateString('nl-NL')].filter(Boolean).join(' · ')}
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => deleteExpense(exp.id)}>
                    <Trash2 size={16} className="text-error" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showInvoiceModal && (
        <Modal title="Nieuwe factuur" onClose={() => setShowInvoiceModal(false)}>
          <div className="space-y-4">
            {error && <div className="p-3 bg-error-soft text-error rounded-lg text-sm">{error}</div>}
            <Input label="Factuurnummer" value={invoiceForm.number} onChange={(e) => setInvoiceForm({ ...invoiceForm, number: e.target.value })} />
            <Input label="Klantnaam" value={invoiceForm.clientName} onChange={(e) => setInvoiceForm({ ...invoiceForm, clientName: e.target.value })} />
            <Input label="Bedrag (€)" type="number" value={invoiceForm.amount} onChange={(e) => setInvoiceForm({ ...invoiceForm, amount: e.target.value })} />
            <Input label="Factuurdatum" type="date" value={invoiceForm.issueDate} onChange={(e) => setInvoiceForm({ ...invoiceForm, issueDate: e.target.value })} />
            <Input label="Vervaldatum" type="date" value={invoiceForm.dueDate} onChange={(e) => setInvoiceForm({ ...invoiceForm, dueDate: e.target.value })} />
            <Button className="w-full" onClick={saveInvoice}>Opslaan</Button>
          </div>
        </Modal>
      )}

      {showExpenseModal && (
        <Modal title="Nieuwe uitgave" onClose={() => setShowExpenseModal(false)}>
          <div className="space-y-4">
            <Input label="Omschrijving" value={expenseForm.description} onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })} />
            <Input label="Categorie" value={expenseForm.category} onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })} />
            <Input label="Bedrag (€)" type="number" value={expenseForm.amount} onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })} />
            <Input label="Datum" type="date" value={expenseForm.date} onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })} />
            <Button className="w-full" onClick={saveExpense}>Opslaan</Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
