'use client';

import { useOrbitLanguage } from './OrbitLanguageContext';

const copy = {
  en: {
    hero: 'ACTIVE NOW',
    title: 'NFT · STATUE OF LIBERTY',
    rule: 'Min. 3 spins (15 ⭐️)',
    condition: 'Roll 777 · 5 ⭐️ per spin',
    hint: 'Tap to view rules & enter on Telegram',
  },
  uk: {
    hero: 'АКТИВНИЙ',
    title: 'NFT · СТАТУЯ СВОБОДИ',
    rule: 'Мін. 3 спіни (15 ⭐️)',
    condition: 'Вибити 777 · 5 ⭐️ за спін',
    hint: 'Натисніть для участі в Telegram-каналі',
  },
  ru: {
    hero: 'АКТИВЕН',
    title: 'NFT · СТАТУЯ СВОБОДЫ',
    rule: 'Мин. 3 спина (15 ⭐️)',
    condition: 'Выбить 777 · 5 ⭐️ за спин',
    hint: 'Нажмите для участия в Telegram-канале',
  },
} as const;

// The official channel post for the Statue of Liberty NFT giveaway.
const STATUE_GIVEAWAY_POST_URL = 'https://t.me/orbit_market_official/45';

export default function StatueGiveawayCard() {
  const { language } = useOrbitLanguage();
  const text = copy[language];

  return (
    <a
      href={STATUE_GIVEAWAY_POST_URL}
      target="_blank"
      rel="noreferrer"
      aria-label={`${text.title} — ${text.hero}`}
      className="statue-giveaway group relative block overflow-hidden rounded-[22px] border border-emerald-500/20 bg-[linear-gradient(150deg,#0e1820_0%,#13242e_45%,#0d171d_100%)] shadow-[0_16px_40px_rgba(8,16,24,.45)] transition hover:-translate-y-0.5 hover:border-emerald-400/35 hover:shadow-[0_20px_48px_rgba(16,185,129,.25)] active:scale-[.99]"
    >
      {/* Ambient Liberty emerald & oceanic cyan glows */}
      <div aria-hidden="true" className="pointer-events-none absolute -left-16 -top-20 h-56 w-56 rounded-full bg-[#10b981]/25 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-24 -right-12 h-56 w-56 rounded-full bg-[#0284c7]/25 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-40 w-40 rounded-full bg-[#f59e0b]/10 blur-2xl" />

      {/* Faint diagonal sheen */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,transparent_35%,rgba(255,255,255,.05)_50%,transparent_65%)]" />

      <div className="relative flex flex-col items-center px-5 py-7 text-center">
        {/* Statue emoji icon with glowing border */}
        <span
          className="flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-400/20 bg-emerald-950/30 text-[32px] shadow-[inset_0_1px_0_rgba(255,255,255,.12),0_4px_16px_rgba(16,185,129,.18)] transition duration-300 group-hover:scale-105"
          aria-hidden="true"
        >
          🗽
        </span>

        <p className="mt-3.5 text-[11px] font-semibold uppercase tracking-[.32em] text-emerald-300/70">
          {text.title}
        </p>

        <div className="mt-2.5 flex w-full items-center justify-center gap-3">
          <span className="h-px flex-1 max-w-14 bg-gradient-to-r from-transparent to-emerald-400/40" aria-hidden="true" />
          <h2 className="flex items-center gap-2 text-[20px] font-black uppercase leading-none tracking-[.22em] text-white/95 drop-shadow-[0_2px_12px_rgba(16,185,129,.5)]">
            <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)] animate-pulse" aria-hidden="true" />
            {text.hero}
          </h2>
          <span className="h-px flex-1 max-w-14 bg-gradient-to-l from-transparent to-emerald-400/40" aria-hidden="true" />
        </div>

        {/* Giveaway condition badge */}
        <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3.5 py-1.5 shadow-[0_0_12px_rgba(16,185,129,0.12)]">
          <span className="text-[9px] font-bold uppercase tracking-[.18em] text-emerald-300/80">🍀 777</span>
          <span className="h-1 w-1 rounded-full bg-emerald-400" aria-hidden="true" />
          <span className="text-[12px] font-bold text-white/95">{text.rule}</span>
        </div>

        <p className="mt-3 text-[10px] font-medium text-white/45 transition group-hover:text-emerald-300/80">
          {text.hint} <span aria-hidden="true">→</span>
        </p>
      </div>
    </a>
  );
}
