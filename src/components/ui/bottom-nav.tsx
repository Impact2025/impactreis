'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  CalendarCheck, Target, Trophy, Sparkles, Menu as MenuIcon, X,
  Sunrise, Moon, CalendarDays, BookOpen, TrendingUp, Fingerprint,
  BookHeart, Compass, HeartHandshake, Brain, GraduationCap, Settings,
  ChevronRight,
} from 'lucide-react';

// Demo-guard: ACA, ADHD en Cursussen alleen zichtbaar voor demo-account (v.munster@weareimpact.nl)
const DEMO_ACCOUNT_EMAIL = 'v.munster@weareimpact.nl';

function useDemoAccess(): boolean {
  const [canAccess, setCanAccess] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        setCanAccess(user?.email === DEMO_ACCOUNT_EMAIL);
      }
    } catch {
      setCanAccess(false);
    }
  }, []);
  return canAccess;
}

const TABS = [
  { href: '/dashboard', icon: CalendarCheck, label: 'Vandaag' },
  { href: '/focus',     icon: Target,        label: 'Focus'   },
  { href: '/coach',     icon: Sparkles,      label: 'AIPA'    },
  { href: '/wins',      icon: Trophy,        label: 'Wins'    },
];

interface MenuItem {
  href: string;
  icon: typeof CalendarCheck;
  label: string;
  description: string;
  demoOnly?: boolean;
}

interface MenuGroup {
  title: string;
  items: MenuItem[];
}

/** Bovenste helft van het menu: dagelijkse/wekelijkse kernflow. */
const DAILY_GROUPS: MenuGroup[] = [
  {
    title: 'Rituelen',
    items: [
      { href: '/morning',       icon: Sunrise,      label: 'Ochtend Ritueel', description: 'Start je dag met focus' },
      { href: '/evening',       icon: Moon,         label: 'Avond Ritueel',   description: 'Sluit je dag bewust af' },
      { href: '/weekly-start',  icon: CalendarDays, label: 'Week Start',      description: 'Plan je week' },
      { href: '/weekly-review', icon: BookOpen,     label: 'Week Review',     description: 'Evalueer je week' },
    ],
  },
  {
    title: 'Groei',
    items: [
      { href: '/goals',    icon: Target,     label: 'Doelen',    description: 'RPM-doelen beheren' },
      { href: '/insights', icon: TrendingUp, label: 'Insights',  description: 'Trends en patronen' },
    ],
  },
];

/** Onderste helft van het menu: minder frequente verdieping + systeem.
 *  ACA Herstelpad, ADHD Klachten en Cursussen zijn demo-restricted (alleen voor v.munster@weareimpact.nl). */
const ALL_SECONDARY_GROUPS: MenuGroup[] = [
  {
    title: 'Verdieping',
    items: [
      { href: '/identity',        icon: Fingerprint,    label: 'Identiteit',      description: 'Claim wie je bent' },
      { href: '/dagboek',         icon: BookHeart,      label: 'Dagboek',         description: 'Hoe voel je je?' },
      { href: '/controle-cirkel', icon: Compass,        label: 'Controle Cirkel', description: 'Energie-oefening' },
      // Demo-only: alleen zichtbaar voor v.munster@weareimpact.nl
      { href: '/aca',             icon: HeartHandshake, label: 'ACA Herstelpad',  description: '7 weken naar de Liefdevolle Ouder', demoOnly: true },
      { href: '/adhd',            icon: Brain,          label: 'ADHD Klachten',   description: 'Meting voor medicatiestart', demoOnly: true },
      { href: '/courses',         icon: GraduationCap,  label: 'Cursussen',       description: 'Unleash Your Power', demoOnly: true },
    ],
  },
  {
    title: 'Systeem',
    items: [
      { href: '/settings', icon: Settings, label: 'Instellingen', description: 'Meldingen, e-mail, PWA' },
    ],
  },
];

/** Filtered groepen: demo-only items worden verborgen tenzij de gebruiker het demo-account is. */
function getFilteredGroups(canAccessDemo: boolean): MenuGroup[] {
  const filteredSecondary = ALL_SECONDARY_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => !item.demoOnly || canAccessDemo),
  }));
  return [...DAILY_GROUPS, ...filteredSecondary];
}

interface BottomNavProps {
  fab?: {
    onClick: () => void;
    label?: string;
  };
}

export function BottomNav({ fab }: BottomNavProps) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const canAccessDemo = useDemoAccess();
  const MENU_GROUPS = getFilteredGroups(canAccessDemo);

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + '/');

  const menuActive = MENU_GROUPS.some((g) => g.items.some((i) => isActive(i.href)));

  return (
    <>
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 bg-surface-card/95 backdrop-blur-md border-t border-line"
        style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}
      >
        <div className="relative flex items-center justify-around max-w-lg mx-auto px-1 pt-2 pb-1">
          {TABS.slice(0, 2).map((item) => {
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
                  className={active ? 'text-primary' : 'text-ink-soft'}
                />
                <span className={`text-[9px] font-medium tracking-wide ${active ? 'text-primary' : 'text-ink-soft'}`}>
                  {item.label}
                </span>
              </Link>
            );
          })}

          {/* Center: AIPA — elevated pill, or FAB when provided */}
          <div className="flex flex-col items-center flex-1 relative">
            {fab ? (
              <button
                onClick={fab.onClick}
                aria-label={fab.label ?? 'Toevoegen'}
                className="rounded-full bg-primary text-white flex items-center justify-center shadow-[0_4px_20px_rgba(81,96,80,0.4)] active:scale-95 transition-transform -mt-6"
                style={{ width: 52, height: 52 }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </button>
            ) : (
              <Link
                href={TABS[2].href}
                aria-label={TABS[2].label}
                className="flex flex-col items-center gap-1 -mt-5"
              >
                <span
                  className={`rounded-full flex items-center justify-center transition-colors ${
                    isActive(TABS[2].href) ? 'bg-primary' : 'bg-surface-inverse'
                  }`}
                  style={{ width: 44, height: 44, boxShadow: '0 4px 16px rgba(10,10,20,0.25)' }}
                >
                  <Sparkles size={19} className="text-white" strokeWidth={2} />
                </span>
                <span className={`text-[9px] font-medium tracking-wide ${isActive(TABS[2].href) ? 'text-primary' : 'text-ink-soft'}`}>
                  {TABS[2].label}
                </span>
              </Link>
            )}
          </div>

          {TABS.slice(3).map((item) => {
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
                  className={active ? 'text-primary' : 'text-ink-soft'}
                />
                <span className={`text-[9px] font-medium tracking-wide ${active ? 'text-primary' : 'text-ink-soft'}`}>
                  {item.label}
                </span>
              </Link>
            );
          })}

          {/* Menu */}
          <button
            onClick={() => setMenuOpen(true)}
            className="flex flex-col items-center gap-0.5 flex-1 py-1"
          >
            <MenuIcon
              size={21}
              strokeWidth={menuActive ? 2.5 : 1.8}
              className={menuActive ? 'text-primary' : 'text-ink-soft'}
            />
            <span className={`text-[9px] font-medium tracking-wide ${menuActive ? 'text-primary' : 'text-ink-soft'}`}>
              Menu
            </span>
          </button>
        </div>
      </nav>

      {menuOpen && (
        <div className="fixed inset-0 z-[60] flex flex-col justify-end">
          <div
            className="absolute inset-0 bg-ink/40 animate-fade-in"
            onClick={() => setMenuOpen(false)}
          />
          <div
            className="relative bg-surface rounded-t-[24px] max-h-[85vh] overflow-y-auto animate-sheet-up shadow-organic-lg"
            style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}
          >
            <div className="sticky top-0 bg-surface/95 backdrop-blur-md px-5 pt-4 pb-3 flex items-center justify-between border-b border-line">
              <div>
                <p className="text-[9px] font-bold tracking-[0.18em] text-primary uppercase">myAiPA</p>
                <h2 className="text-[18px] font-bold text-ink">Alles op één plek</h2>
              </div>
              <button
                onClick={() => setMenuOpen(false)}
                aria-label="Sluiten"
                className="w-9 h-9 rounded-full bg-surface-sunken flex items-center justify-center text-ink-soft hover:text-ink transition-colors"
              >
                <X size={17} />
              </button>
            </div>

            <div className="px-5 py-2">
              {MENU_GROUPS.map((group) => (
                <section key={group.title} className="py-3.5">
                  <h3 className="text-[10px] font-bold text-ink-soft tracking-[0.15em] uppercase mb-2 px-1">
                    {group.title}
                  </h3>
                  <div className="rounded-card border border-line bg-surface-card overflow-hidden">
                    {group.items.map((item, i) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMenuOpen(false)}
                        className={`flex items-center gap-3 px-4 py-3.5 hover:bg-surface-sunken transition-colors ${
                          i > 0 ? 'border-t border-line' : ''
                        }`}
                      >
                        <div className="w-9 h-9 rounded-[10px] bg-primary-muted flex items-center justify-center flex-shrink-0">
                          <item.icon size={16} className="text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-semibold text-ink">{item.label}</p>
                          <p className="text-[11px] text-ink-soft truncate">{item.description}</p>
                        </div>
                        <ChevronRight size={16} className="text-ink-soft flex-shrink-0" />
                      </Link>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
