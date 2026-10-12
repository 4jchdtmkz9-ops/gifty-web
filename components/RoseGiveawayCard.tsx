'use client';

import { useCallback, useEffect, useState } from 'react';
import { getRoseGiveawayStatus, type RoseGiveawayWinner } from '../lib/api';
import { waitForTelegramInitData } from '../lib/telegram';
import { useOrbitLanguage } from './OrbitLanguageContext';

const copy = {
  en: {
    giveaway: 'GIVEAWAYS', title: 'Eternal Rose', finished: 'Finished', participantsLabel: 'participants',
    winnerLabel: 'WINNER', winnerFallback: 'ORBIT participant', drawComplete: 'Draw complete',
  },
  uk: {
    giveaway: 'РОЗІГРАШІ', title: 'Eternal Rose', finished: 'Завершено', participantsLabel: 'учасників',
    winnerLabel: 'ПЕРЕМОЖЕЦЬ', winnerFallback: 'Учасник ORBIT', drawComplete: 'Розіграш завершено',
  },
  ru: {
    giveaway: 'РОЗЫГРЫШИ', title: 'Eternal Rose', finished: 'Завершено', participantsLabel: 'участников',
    winnerLabel: 'ПОБЕДИТЕЛЬ', winnerFallback: 'Участник ORBIT', drawComplete: 'Розыгрыш завершён',
  },
} as const;

export default function RoseGiveawayCard() {
  const { language } = useOrbitLanguage();
  const text = copy[language];
  const [participants, setParticipants] = useState<number | null>(null);
  const [winner, setWinner] = useState<RoseGiveawayWinner | null>(null);

  const participantsWord = (count: number) => {
    if (language === 'en') return count === 1 ? text.participantsLabel : text.participantsLabel;
    const lastTwo = count % 100;
    const last = count % 10;
    if (language === 'uk') return last === 1 && lastTwo !== 11 ? 'учасник' : last >= 2 && last <= 4 && (lastTwo < 12 || lastTwo > 14) ? 'учасники' : 'учасників';
    return last === 1 && lastTwo !== 11 ? 'участник' : last >= 2 && last <= 4 && (lastTwo < 12 || lastTwo > 14) ? 'участника' : 'участников';
  };

  const refresh = useCallback(async () => {
    try {
      await waitForTelegramInitData();
      const result = await getRoseGiveawayStatus();
      setParticipants(result.participants);
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
    : null;

  const summary = winnerName
    ? `${text.winnerLabel}: ${winnerName}`
    : participants !== null && participants > 0
      ? `${participants} ${participantsWord(participants)}`
      : text.drawComplete;

  return (
    <section className="rose-giveaway mb-6 overflow-hidden rounded-[18px] border border-slate-200 bg-white shadow-[0_6px_22px_rgba(15,23,42,.06)]">
      <div className="flex items-center justify-center gap-2 bg-slate-50/70 px-4 py-1.5">
        <span className="text-[10px] font-black tracking-[.16em] text-[#1557d5]">ORBIT</span>
        <span className="text-[9px] font-semibold tracking-[.12em] text-slate-500">{text.giveaway}</span>
      </div>

      <div className="flex items-center gap-3 px-4 py-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] border border-rose-100 bg-rose-50 text-[22px]" aria-hidden="true">
          🌹
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-bold text-slate-900">{text.title}</p>
          <p className="mt-0.5 truncate text-[11px] text-slate-500">{summary}</p>
        </div>
        <span className="flex shrink-0 items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700">
          <span aria-hidden="true">✓</span>
          {text.finished}
        </span>
      </div>
    </section>
  );
}
