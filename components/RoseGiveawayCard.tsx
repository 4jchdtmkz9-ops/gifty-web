'use client';

import { useCallback, useEffect, useState, type CSSProperties } from 'react';
import { enterRoseGiveaway, getRoseGiveawayStatus, type RoseGiveawayWinner } from '../lib/api';
import { useOrbitLanguage } from './OrbitLanguageContext';

const CHANNEL_URL = 'https://t.me/orbit_market_official';

const copy = {
  en: {
    eyebrow: 'ORBIT GIVEAWAY', title: 'Eternal Rose', subtitle: 'One Telegram collectible · one winner', condition: 'Entry requirement', subscribe: 'Open channel', enter: "I'm subscribed · Enter", entered: "You're in the draw", checking: 'Checking…', verify: 'We could not verify your subscription. Make sure you joined the channel and try again.', unavailable: 'Subscription check is unavailable right now. Please try again shortly.', openTelegram: 'Open ORBIT in Telegram to enter.', winnerLabel: 'WINNER', winnerFallback: 'ORBIT participant', full: 'The draw is complete', drawAtTen: 'Winner is drawn automatically at 10 participants',
  },
  uk: {
    eyebrow: 'РОЗІГРАШ ORBIT', title: 'Eternal Rose', subtitle: 'Один колекційний подарунок Telegram · один переможець', condition: 'Умова участі', subscribe: 'Відкрити канал', enter: 'Я підписаний · Брати участь', entered: 'Ти береш участь', checking: 'Перевіряємо…', verify: 'Не вдалося підтвердити підписку. Переконайся, що підписався на канал, і спробуй ще раз.', unavailable: 'Зараз не вдалося перевірити підписку. Спробуй трохи пізніше.', openTelegram: 'Відкрий ORBIT у Telegram, щоб взяти участь.', winnerLabel: 'ПЕРЕМОЖЕЦЬ', winnerFallback: 'Учасник ORBIT', full: 'Розіграш завершено', drawAtTen: 'Переможця буде обрано випадково після 10 учасників',
  },
  ru: {
    eyebrow: 'РОЗЫГРЫШ ORBIT', title: 'Eternal Rose', subtitle: 'Один коллекционный подарок Telegram · один победитель', condition: 'Условие участия', subscribe: 'Открыть канал', enter: 'Я подписан · Участвовать', entered: 'Ты участвуешь', checking: 'Проверяем…', verify: 'Не удалось подтвердить подписку. Убедись, что подписался на канал, и попробуй ещё раз.', unavailable: 'Сейчас не удалось проверить подписку. Попробуй немного позже.', openTelegram: 'Открой ORBIT в Telegram, чтобы участвовать.', winnerLabel: 'ПОБЕДИТЕЛЬ', winnerFallback: 'Участник ORBIT', full: 'Розыгрыш завершён', drawAtTen: 'Победитель будет выбран случайно после 10 участников',
  },
} as const;

export default function RoseGiveawayCard() {
  const { language } = useOrbitLanguage();
  const text = copy[language];
  const [entered, setEntered] = useState(false);
  const [participants, setParticipants] = useState<number | null>(null);
  const [winner, setWinner] = useState<RoseGiveawayWinner | null>(null);
  const [full, setFull] = useState(false);
  const [loading, setLoading] = useState(false);
  const [justEntered, setJustEntered] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const participantsWord = (count: number) => {
    const lastTwo = count % 100;
    const last = count % 10;
    if (language === 'uk') return last === 1 && lastTwo !== 11 ? 'учасник' : last >= 2 && last <= 4 && (lastTwo < 12 || lastTwo > 14) ? 'учасники' : 'учасників';
    if (language === 'ru') return last === 1 && lastTwo !== 11 ? 'участник' : last >= 2 && last <= 4 && (lastTwo < 12 || lastTwo > 14) ? 'участника' : 'участников';
    return count === 1 ? 'participant' : 'participants';
  };

  const refresh = useCallback(async () => {
    try {
      const result = await getRoseGiveawayStatus();
      setEntered(result.entered);
      setParticipants(result.participants);
      setWinner(result.winner);
      setFull(result.full);
    } catch {
      // The card remains useful outside Telegram; the action explains that Telegram is required.
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  async function participate() {
    setLoading(true);
    setError(null);
    try {
      const result = await enterRoseGiveaway();
      setEntered(true);
      setParticipants(result.participants);
      setWinner(result.winner);
      setFull(result.full);
      setJustEntered(true);
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : '';
      if (message.includes('Subscribe to')) setError(text.verify);
      else if (message.includes('Open ORBIT')) setError(text.openTelegram);
      else if (message.includes('full')) { setError(null); void refresh(); }
      else if (message.includes('administrator') || message.includes('configured') || message.includes('verify')) setError(text.unavailable);
      else setError(text.unavailable);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rose-giveaway relative mb-6 overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-sm">
      {justEntered && <div className="giveaway-confetti" aria-hidden="true">{Array.from({ length: 14 }, (_, i) => <i key={i} style={{ '--i': i } as CSSProperties} />)}</div>}
      <div className="rose-giveaway-header flex items-center gap-3.5 px-4 pb-4 pt-4">
        <div className="rose-giveaway-art flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-[18px] border border-slate-200 bg-[#f7f7f5] text-[39px]" aria-label="Eternal Rose">🌹</div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-[10px] font-bold tracking-[.12em] text-rose-600">{text.eyebrow}</p>
            <span className="rounded-md bg-rose-50 px-1.5 py-0.5 text-[9px] font-semibold text-rose-700">×1</span>
          </div>
          <h2 className="mt-1 text-[17px] font-bold leading-tight text-slate-900">{text.title}</h2>
          <p className="mt-1 text-[11px] leading-snug text-slate-500">{text.subtitle}</p>
        </div>
      </div>

      <div className="px-4 pb-4">
        <div className="border-t border-slate-100 pt-3">
          <p className="text-[10px] font-semibold uppercase tracking-[.08em] text-slate-500">{text.condition}</p>
          <a href={CHANNEL_URL} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-sm font-semibold text-blue-700 hover:text-blue-800">
            @orbit_market_official <span aria-hidden="true" className="text-xs">↗</span>
          </a>
        </div>
        {winner ? (
          <div aria-live="polite" className="mt-3 flex items-center gap-3 rounded-[17px] border border-amber-200 bg-amber-50/70 px-3 py-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white text-sm font-bold text-slate-500 ring-1 ring-amber-200" style={winner.photoUrl ? { backgroundImage: `url("${winner.photoUrl}")`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}>
              {!winner.photoUrl && (winner.firstName?.[0] ?? winner.username?.[0] ?? 'O').toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[9px] font-bold tracking-[.12em] text-amber-700">{text.winnerLabel} · {text.full}</p>
              <p className="mt-0.5 truncate text-sm font-bold text-slate-900">{winner.firstName || winner.lastName ? [winner.firstName, winner.lastName].filter(Boolean).join(' ') : winner.username ? `@${winner.username}` : text.winnerFallback}</p>
              {winner.username && <p className="truncate text-xs text-slate-500">@{winner.username}</p>}
            </div>
            <span className="text-lg" aria-hidden="true">🏆</span>
          </div>
        ) : (
          <div className="mt-3 flex flex-col gap-2">
            <a href={CHANNEL_URL} target="_blank" rel="noreferrer" className="inline-flex w-fit items-center gap-1 text-xs font-semibold text-blue-700 hover:text-blue-800">
              {text.subscribe} <span aria-hidden="true">↗</span>
            </a>
            <button type="button" onClick={participate} disabled={loading || entered || full} className="flex h-11 w-full items-center justify-center gap-2 rounded-[14px] bg-blue-700 px-3 text-xs font-bold text-white transition hover:bg-blue-800 active:scale-[.99] disabled:cursor-default disabled:bg-emerald-600">
              {loading ? text.checking : entered ? <><span aria-hidden="true">✓</span>{text.entered}</> : full ? text.full : text.enter}
            </button>
            <p className="text-[10px] text-slate-400">{text.drawAtTen}</p>
          </div>
        )}
        {error && <p role="status" className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-[11px] leading-snug text-rose-700">{error}</p>}
        <div className="mt-3">
          <div className="mb-1.5 flex items-center justify-between text-[10px] text-slate-500">
            <span>{participants === null ? ' ' : `${participants.toLocaleString()} / 10 ${participantsWord(participants)}`}</span>
            {entered && !winner && <span className="font-semibold text-emerald-600">{text.entered}</span>}
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-valuemin={0} aria-valuemax={10} aria-valuenow={participants ?? 0} aria-label={`${participants ?? 0} of 10 participants`}>
            <div className="h-full rounded-full bg-blue-600 transition-[width] duration-500" style={{ width: `${Math.min(100, ((participants ?? 0) / 10) * 100)}%` }} />
          </div>
        </div>
      </div>
    </section>
  );
}
