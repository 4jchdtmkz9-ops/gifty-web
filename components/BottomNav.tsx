'use client';

import Link from 'next/link';
import Image from 'next/image';
import MarketIcon from './MarketIcon';
import NavStickerIcon from './NavStickerIcon';
import TelegramTgsSticker from './TelegramTgsSticker';
import TelegramAvatar from './TelegramAvatar';
import { useOrbitLanguage } from './OrbitLanguageContext';

type NavTab = 'home' | 'market' | 'cases' | 'pvp' | 'profile';

const tabs: { id: NavTab; label: string; href: string }[] = [
  { id: 'home', label: 'Home', href: '/' },
  { id: 'market', label: 'Market', href: '/market' },
  { id: 'cases', label: 'Cases', href: '/cases' },
  { id: 'pvp', label: 'PVP', href: '/arena' },
  { id: 'profile', label: 'Profile', href: '/profile' },
];

export default function BottomNav({ active }: { active: NavTab | null }) {
  const { t } = useOrbitLanguage();

  return (
    <nav
      aria-label={t('Main navigation')}
      className="fixed bottom-[calc(0.75rem+env(safe-area-inset-bottom))] left-1/2 z-50 flex w-[calc(100%-1.25rem)] max-w-[460px] -translate-x-1/2 items-center justify-around rounded-full border border-white/85 bg-white/75 px-1.5 py-2 shadow-[0_12px_36px_rgba(30,64,120,0.16),inset_0_1px_0_rgba(255,255,255,0.95)] backdrop-blur-2xl"
    >
      {tabs.map((tab) => {
        const selected = active === tab.id;

        return (
          <Link
            key={tab.id}
            href={tab.href}
            aria-current={selected ? 'page' : undefined}
            className={`flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-full px-1 py-1.5 transition-colors ${
              selected
                ? 'bg-blue-50/90 text-blue-700'
                : 'text-slate-500 hover:bg-white/70'
            }`}
          >
            {tab.id === 'home' && <span className="nav-sticker-float"><Image src="/orbit-planet.png" alt="" width={330} height={249} className="h-5 w-[26px] object-contain" /></span>}
            {tab.id === 'market' && (
              <TelegramTgsSticker
                src="/stickers/market.json"
                className="nav-sticker-art nav-sticker-market"
                fallback={<MarketIcon />}
              />
            )}
            {tab.id === 'cases' && <span aria-hidden="true" className="nav-sticker-case text-[21px] leading-none">💼</span>}
            {tab.id === 'pvp' && <NavStickerIcon kind="pvp" />}
            {tab.id === 'profile' && <TelegramAvatar size={22} />}
            <span className="text-[10px] font-medium leading-none">{t(tab.label)}</span>
          </Link>
        );
      })}
    </nav>
  );
}
