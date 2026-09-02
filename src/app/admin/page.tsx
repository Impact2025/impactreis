'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FileText, Target, CheckSquare, Receipt } from 'lucide-react';

interface Stats {
  posts: { status: string; count: number }[];
  deals: { stage: string; count: number; total: number }[];
  openTasks: number;
  invoices: { status: string; count: number; total: number }[];
}

function euro(n: number): string {
  return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(n);
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch('/api/admin/stats')
      .then((r) => r.json())
      .then(setStats)
      .catch(() => {});
  }, []);

  const draftPosts = stats?.posts.find((p) => p.status === 'draft')?.count ?? 0;
  const publishedPosts = stats?.posts.find((p) => p.status === 'published')?.count ?? 0;
  const openDeals = stats?.deals.reduce((sum, d) => sum + d.count, 0) ?? 0;
  const openDealsValue = stats?.deals.reduce((sum, d) => sum + d.total, 0) ?? 0;
  const openInvoices = stats?.invoices.find((i) => i.status === 'open');

  const cards = [
    {
      label: 'Blog',
      href: '/admin/blog',
      icon: FileText,
      value: `${publishedPosts} gepubliceerd`,
      sub: `${draftPosts} concept${draftPosts === 1 ? '' : 'en'}`,
    },
    {
      label: 'Open deals',
      href: '/admin/crm/deals',
      icon: Target,
      value: `${openDeals} deal${openDeals === 1 ? '' : 's'}`,
      sub: euro(openDealsValue),
    },
    {
      label: 'Openstaande taken',
      href: '/admin/crm/taken',
      icon: CheckSquare,
      value: `${stats?.openTasks ?? 0}`,
      sub: 'te doen',
    },
    {
      label: 'Openstaande facturen',
      href: '/admin/administratie',
      icon: Receipt,
      value: `${openInvoices?.count ?? 0}`,
      sub: euro(openInvoices?.total ?? 0),
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="bg-surface-card border border-line rounded-xl p-5 hover:shadow-sm transition-shadow"
          >
            <div className="flex items-center gap-2 text-ink-soft text-sm mb-3">
              <card.icon size={16} />
              {card.label}
            </div>
            <div className="text-xl font-bold text-ink">{card.value}</div>
            <div className="text-sm text-ink-soft mt-1">{card.sub}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
