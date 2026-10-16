'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { getNftGiveawayStatus } from '../lib/api';
import { waitForTelegramInitData } from '../lib/telegram';
import { useOrbitLanguage } from './OrbitLanguageContext';

const copy = {
  en: { title: 'NFT · CHILLFLAME', hero: 'ACTIVE NOW', join: 'JOIN' },
  uk: { title: 'NFT · CHILLFLAME', hero: 'АКТИВНИЙ', join: 'УЧАСТЬ' },
  ru: { title: 'NFT · CHILLFLAME', hero: 'АКТИВЕН', join: 'УЧАСТИЕ' },
} as const;

// The prize of the running referral giveaway.
export const NFT_GIVEAWAY_PRIZE_URL = 'https://t.me/nft/ChillFlame-447145';
export const NFT_GIVEAWAY_PARTICIPANT_LIMIT = 10;

export default function NftGiveawayCard() {
  const { language } = useOrbitLanguage();
  const text = copy[language];
  const [participants, setParticipants] = useState<number | null>(null);
  const [full, setFull] = useState(false);

  const refresh = useCallback(async () => {
    try {
      await waitForTelegramInitData();
      const status = await getNftGiveawayStatus();
      setParticipants(status.participants);
      setFull(status.full);
    } catch {
      // Outside Telegram the live count is unavailable; the card still renders.
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const done = full || (participants ?? 0) >= NFT_GIVEAWAY_PARTICIPANT_LIMIT;

  return (
    <Link
      href="/giveaway"
      aria-label={`${text.title} — ${text.hero}`}
      className="nft-giveaway group relative block overflow-hidden rounded-[22px] border border-orange-500/25 bg-[linear-gradient(150deg,#1d1310_0%,#2a1a12_45%,#170f0c_100%)] shadow-[0_16px_40px_rgba(24,12,6,.45)] transition hover:-translate-y-0.5 hover:border-orange-400/40 hover:shadow-[0_20px_48px_rgba(249,115,22,.25)] active:scale-[.99]"
    >
      {/* Flame ambience */}
      <div aria-hidden="true" className="pointer-events-none absolute -left-16 -top-20 h-56 w-56 rounded-full bg-[#f97316]/25 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-24 -right-12 h-56 w-56 rounded-full bg-[#dc2626]/20 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,transparent_35%,rgba(255,255,255,.05)_50%,transparent_65%)]" />

      <div className="relative flex flex-col items-center px-5 py-7 text-center">
        <span
          className="flex h-14 w-14 items-center justify-center rounded-2xl border border-orange-400/25 bg-orange-950/40 text-[32px] shadow-[inset_0_1px_0_rgba(255,255,255,.12),0_4px_16px_rgba(249,115,22,.22)] transition duration-300 group-hover:scale-105"
          aria-hidden="true"
        >
          🔥
        </span>

        <p className="mt-3.5 text-[11px] font-semibold uppercase tracking-[.32em] text-orange-300/70">{text.title}</p>

        <div className="mt-2.5 flex w-full items-center justify-center gap-3">
          <span className="h-px flex-1 max-w-14 bg-gradient-to-r from-transparent to-orange-400/40" aria-hidden="true" />
          <h2 className="flex items-center gap-2 text-[20px] font-black uppercase leading-none tracking-[.22em] text-white/95 drop-shadow-[0_2px_12px_rgba(249,115,22,.5)]">
            <span className="h-2 w-2 rounded-full bg-orange-400 shadow-[0_0_8px_rgba(251,146,60,0.9)] animate-pulse" aria-hidden="true" />
            {text.hero}
          </h2>
          <span className="h-px flex-1 max-w-14 bg-gradient-to-l from-transparent to-orange-400/40" aria-hidden="true" />
        </div>

        <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-orange-400/25 bg-orange-500/10 px-4 py-1.5 shadow-[0_0_16px_rgba(249,115,22,0.16)] transition duration-200 group-hover:border-orange-400/40 group-hover:bg-orange-500/15">
          <span className="text-[13px] leading-none" aria-hidden="true">🎁</span>
          <span className="text-[11px] font-black tabular-nums tracking-[.14em] text-orange-200">
            {participants ?? '—'}/{NFT_GIVEAWAY_PARTICIPANT_LIMIT}
          </span>
          <span className="h-1 w-1 rounded-full bg-orange-400" aria-hidden="true" />
          <span className="text-[11px] font-black uppercase tracking-[.2em] text-white/95">{done ? '✓' : text.join}</span>
          <svg aria-hidden="true" viewBox="0 0 12 12" fill="none" className="h-2.5 w-2.5 text-orange-400 transition duration-200 group-hover:translate-x-0.5">
            <path d="M2.5 9.5 9.5 2.5M9.5 2.5H4.5M9.5 2.5V7.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
    </Link>
  );
}
