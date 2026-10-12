'use client';

import { useCallback, useEffect, useState } from 'react';
import { getRoseGiveawayStatus, type RoseGiveawayWinner } from '../lib/api';
import { waitForTelegramInitData } from '../lib/telegram';
import { useOrbitLanguage } from './OrbitLanguageContext';

const copy = {
  en: {
    hero: 'FINISHED', title: 'Eternal Rose', winnerLabel: 'Winner',
    winnerFallback: 'ORBIT participant', drawComplete: 'Draw complete',
  },
  uk: {
    hero: 'ЗАВЕРШЕНО', title: 'Eternal Rose', winnerLabel: 'Переможець',
    winnerFallback: 'Учасник ORBIT', drawComplete: 'Розіграш завершено',
  },
  ru: {
    hero: 'ЗАВЕРШЁН', title: 'Eternal Rose', winnerLabel: 'Победитель',
    winnerFallback: 'Участник ORBIT', drawComplete: 'Розыгрыш завершён',
  },
} as const;

// Winner of the concluded "Eternal Rose" draw. It was decided in the channel,
// not through the bot, so the database has no entry and we show it here instead.
const CONCLUDED_WINNER_USERNAME = 'Isiieluu';

export default function RoseGiveawayCard() {
  const { language } = useOrbitLanguage();
  const text = copy[language];
  const [winner, setWinner] = useState<RoseGiveawayWinner | null>(null);

  const refresh = useCallback(async () => {
    try {
      await waitForTelegramInitData();
      const result = await getRoseGiveawayStatus();
      setWinner(result.winner);
    } catch {
      // Outside Telegram the status is unavailable; the finished card still renders.
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const winnerName = winner
    ? (winner.firstName || winner.lastName
        ? [winner.firstName, winner.lastName].filter(Boolean).join(' ')
        : winner.username
          ? `@${winner.username}`
          : text.winnerFallback)
    : CONCLUDED_WINNER_USERNAME ? `@${CONCLUDED_WINNER_USERNAME}` : text.drawComplete;

  return (
    <section className="rose-giveaway relative mb-6 overflow-hidden rounded-[22px] border border-white/5 bg-[linear-gradient(150deg,#181420_0%,#241826_45%,#161220_100%)] shadow-[0_16px_40px_rgba(10,8,18,.45)]">
      {/* Soft rose glow */}
      <div aria-hidden="true" className="pointer-events-none absolute -left-16 -top-20 h-56 w-56 rounded-full bg-[#d52f4d]/25 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-24 -right-12 h-56 w-56 rounded-full bg-[#7c2d5a]/25 blur-3xl" />
      {/* Faint diagonal sheen */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,transparent_35%,rgba(255,255,255,.05)_50%,transparent_65%)]" />

      <div className="relative flex flex-col items-center px-5 py-7 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-[30px] shadow-[inset_0_1px_0_rgba(255,255,255,.08)] grayscale-[.35]" aria-hidden="true">
          🌹
        </span>

        <p className="mt-3.5 text-[11px] font-semibold uppercase tracking-[.32em] text-white/45">{text.title}</p>

        <div className="mt-2.5 flex w-full items-center justify-center gap-3">
          <span className="h-px flex-1 max-w-14 bg-gradient-to-r from-transparent to-white/25" aria-hidden="true" />
          <h2 className="text-[20px] font-black uppercase leading-none tracking-[.22em] text-white/90 drop-shadow-[0_2px_12px_rgba(213,47,77,.45)]">
            {text.hero}
          </h2>
          <span className="h-px flex-1 max-w-14 bg-gradient-to-l from-transparent to-white/25" aria-hidden="true" />
        </div>

        <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5">
          <span className="text-[9px] font-bold uppercase tracking-[.18em] text-white/40">{text.winnerLabel}</span>
          <span className="h-1 w-1 rounded-full bg-[#d52f4d]" aria-hidden="true" />
          <span className="text-[12px] font-bold text-white/90">{winnerName}</span>
        </div>
      </div>
    </section>
  );
}
