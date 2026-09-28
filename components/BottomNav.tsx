'use client';

import Link from 'next/link';
import CasesIcon from './CasesIcon';
import HomeIcon from './HomeIcon';
import MarketIcon from './MarketIcon';
import TelegramAvatar from './TelegramAvatar';

type NavTab = 'home' | 'market' | 'cases' | 'profile';

const tabs: { id: NavTab; label: string; href: string }[] = [
  { id: 'home', label: 'Home', href: '/' },
  { id: 'market', label: 'Market', href: '/market' },
  { id: 'cases', label: 'Cases', href: '/cases' },
  { id: 'profile', label: 'Profile', href: '/profile' },
];

export default function BottomNav({ active }: { active: NavTab | null }) {
  return (
    <nav
      aria-label="Main navigation"
      className="fixed bottom-[calc(0.75rem+env(safe-area-inset-bottom))] left-1/2 z-50 flex w-[calc(100%-2rem)] max-w-[432px] -translate-x-1/2 items-center justify-around rounded-full border border-white/85 bg-white/75 px-2 py-2 shadow-[0_12px_36px_rgba(30,64,120,0.16),inset_0_1px_0_rgba(255,255,255,0.95)] backdrop-blur-2xl"
    >
      {tabs.map((tab) => {
        const selected = active === tab.id;

        return (
          <Link
            key={tab.id}
            href={tab.href}
            aria-current={selected ? 'page' : undefined}
            className={`flex min-w-[68px] flex-col items-center justify-center gap-1 rounded-full px-3 py-1.5 transition-colors ${
              selected
                ? 'bg-blue-50/90 text-blue-700'
                : 'text-slate-500 hover:bg-white/70'
            }`}
          >
            {tab.id === 'home' && <HomeIcon />}
            {tab.id === 'market' && <MarketIcon />}
            {tab.id === 'cases' && <CasesIcon />}
            {tab.id === 'profile' && <TelegramAvatar size={22} />}
            <span className="text-[10px] font-medium leading-none">{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
