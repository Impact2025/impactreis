'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Target, Trophy, BarChart3, Settings } from 'lucide-react';

const NAV_ITEMS = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/goals',     icon: Target,          label: 'Doelen'    },
  { href: '/wins',      icon: Trophy,          label: 'Wins'      },
  { href: '/insights',  icon: BarChart3,       label: 'Insights'  },
  { href: '/settings',  icon: Settings,        label: 'Systeem'   },
];

interface BottomNavProps {
  fab?: {
    onClick: () => void;
    label?: string;
  };
}

export function BottomNav({ fab }: BottomNavProps) {
  const pathname = usePathname();

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + '/');

  const leftItems  = NAV_ITEMS.slice(0, 2);
  const rightItems = NAV_ITEMS.slice(3);   // Insights, Systeem
  const centerItem = NAV_ITEMS[2];         // Wins (always rendered as tab; FAB overlays it)

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-[#e8e8ec]"
      style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}
    >
      <div className="relative flex items-center justify-around max-w-lg mx-auto px-1 pt-2 pb-1">

        {/* Left items */}
        {leftItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center gap-0.5 flex-1 py-1"
            >
              <item.icon
                size={21}
                strokeWidth={active ? 2.5 : 1.8}
                className={active ? 'text-[#00cc66]' : 'text-[#8a8a9a]'}
              />
              <span className={`text-[9px] font-medium tracking-wide ${active ? 'text-[#00cc66]' : 'text-[#8a8a9a]'}`}>
                {item.label}
              </span>
            </Link>
          );
        })}

        {/* Center FAB slot */}
        <div className="flex flex-col items-center flex-1 relative">
          {fab ? (
            <button
              onClick={fab.onClick}
              aria-label={fab.label ?? 'Toevoegen'}
              className="w-13 h-13 rounded-full bg-[#00cc66] text-white flex items-center justify-center shadow-[0_4px_20px_rgba(0,204,102,0.4)] active:scale-95 transition-transform -mt-6"
              style={{ width: 52, height: 52 }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </button>
          ) : (
            /* Wins tab shown in center slot when no FAB */
            <Link
              href={centerItem.href}
              className="flex flex-col items-center gap-0.5 py-1 w-full"
            >
              {(() => {
                const active = isActive(centerItem.href);
                return (
                  <>
                    <centerItem.icon
                      size={21}
                      strokeWidth={active ? 2.5 : 1.8}
                      className={active ? 'text-[#00cc66]' : 'text-[#8a8a9a]'}
                    />
                    <span className={`text-[9px] font-medium tracking-wide ${active ? 'text-[#00cc66]' : 'text-[#8a8a9a]'}`}>
                      {centerItem.label}
                    </span>
                  </>
                );
              })()}
            </Link>
          )}
        </div>

        {/* Right items */}
        {rightItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center gap-0.5 flex-1 py-1"
            >
              <item.icon
                size={21}
                strokeWidth={active ? 2.5 : 1.8}
                className={active ? 'text-[#00cc66]' : 'text-[#8a8a9a]'}
              />
              <span className={`text-[9px] font-medium tracking-wide ${active ? 'text-[#00cc66]' : 'text-[#8a8a9a]'}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
