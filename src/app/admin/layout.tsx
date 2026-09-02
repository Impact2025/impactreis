'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  FileText,
  Menu,
  X,
  LogOut,
  Briefcase,
  Building2,
  Users,
  Target,
  CheckSquare,
  Receipt,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const sidebarItems = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { label: 'Blog', href: '/admin/blog', icon: FileText },
  { label: 'Bedrijven', href: '/admin/crm/bedrijven', icon: Building2 },
  { label: 'Contacten', href: '/admin/crm/contacten', icon: Users },
  { label: 'Deals', href: '/admin/crm/deals', icon: Target },
  { label: 'Taken', href: '/admin/crm/taken', icon: CheckSquare },
  { label: 'Administratie', href: '/admin/administratie', icon: Receipt },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch('/api/admin/auth', { method: 'DELETE' });
      router.push('/admin/login');
      router.refresh();
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface">
      <header className="fixed top-0 left-0 right-0 h-16 bg-surface-card border-b border-line z-50 flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-2 hover:bg-surface-sunken rounded-lg"
          >
            {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
          <Link href="/admin" className="font-bold text-lg text-ink flex items-center gap-2">
            <Briefcase size={20} className="text-primary" />
            Mijn Ondernemers OS <span className="text-primary">Admin</span>
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/" className="text-sm text-ink-soft hover:text-ink hidden sm:block">
            Naar de app
          </Link>
          <Button variant="secondary" size="sm" onClick={handleLogout} disabled={loggingOut}>
            <LogOut size={16} className="mr-2" />
            {loggingOut ? 'Uitloggen...' : 'Uitloggen'}
          </Button>
        </div>
      </header>

      <aside
        className={cn(
          'fixed top-16 left-0 w-60 h-[calc(100vh-4rem)] bg-surface-card border-r border-line z-40 transition-transform',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        )}
      >
        <nav className="p-3 space-y-1">
          {sidebarItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  isActive ? 'bg-primary-muted text-primary-dark' : 'text-ink-soft hover:bg-surface-sunken',
                )}
              >
                <item.icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/20 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <main className="pt-16 lg:pl-60">
        <div className="p-6 max-w-6xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
