'use client';

import { useCallback, useEffect, useState, type CSSProperties } from 'react';
import { enterRoseGiveaway, getRoseGiveawayStatus, type RoseGiveawayWinner } from '../lib/api';
import { useOrbitLanguage } from './OrbitLanguageContext';

const CHANNEL_URL = 'https://t.me/orbit_market_official';

const copy = {
  en: {
    giveaway: 'GIVEAWAY', title: 'Eternal Rose', subtitle: 'One Telegram collectible · one winner', condition: 'Entry requirement', referralTitle: 'Your referral link', referralHint: 'Each verified invite adds +10% draw weight.', referralCount: 'verified invites', referralBonus: 'bonus weight', referralUnavailable: 'Open this Mini App in Telegram to get your personal link.', copyLink: 'Copy', copied: 'Copied', enter: 'Participate', entered: "You're in the draw", checking: 'Checking…', verify: 'We could not verify your subscription. Make sure you joined the channel and try again.', unavailable: 'Subscription check is unavailable right now. Please try again shortly.', openTelegram: 'Open ORBIT in Telegram to enter.', winnerLabel: 'WINNER', winnerFallback: 'ORBIT participant', full: 'The draw is complete',
  },
  uk: {
    giveaway: 'РОЗІГРАШ', title: 'Eternal Rose', subtitle: 'Один колекційний подарунок Telegram · один переможець', condition: 'Умова участі', referralTitle: 'Твоє реферальне посилання', referralHint: 'Кожне підтверджене запрошення додає +10% ваги в розіграші.', referralCount: 'підтверджених запрошень', referralBonus: 'бонус до ваги', referralUnavailable: 'Відкрий Mini App у Telegram, щоб отримати особисте посилання.', copyLink: 'Копіювати', copied: 'Скопійовано', enter: 'Брати участь', entered: 'Ти береш участь', checking: 'Перевіряємо…', verify: 'Не вдалося підтвердити підписку. Переконайся, що підписався на канал, і спробуй ще раз.', unavailable: 'Зараз не вдалося перевірити підписку. Спробуй трохи пізніше.', openTelegram: 'Відкрий ORBIT у Telegram, щоб взяти участь.', winnerLabel: 'ПЕРЕМОЖЕЦЬ', winnerFallback: 'Учасник ORBIT', full: 'Розіграш завершено',
  },
  ru: {
    giveaway: 'РОЗЫГРЫШ', title: 'Eternal Rose', subtitle: 'Один коллекционный подарок Telegram · один победитель', condition: 'Условие участия', referralTitle: 'Твоя реферальная ссылка', referralHint: 'Каждое подтверждённое приглашение добавляет +10% веса в розыгрыше.', referralCount: 'подтверждённых приглашений', referralBonus: 'бонус к весу', referralUnavailable: 'Открой Mini App в Telegram, чтобы получить личную ссылку.', copyLink: 'Копировать', copied: 'Скопировано', enter: 'Участвовать', entered: 'Ты участвуешь', checking: 'Проверяем…', verify: 'Не удалось подтвердить подписку. Убедись, что подписался на канал, и попробуй ещё раз.', unavailable: 'Сейчас не удалось проверить подписку. Попробуй немного позже.', openTelegram: 'Открой ORBIT в Telegram, чтобы участвовать.', winnerLabel: 'ПОБЕДИТЕЛЬ', winnerFallback: 'Участник ORBIT', full: 'Розыгрыш завершён',
  },
} as const;

export default function RoseGiveawayCard() {
  const { language } = useOrbitLanguage();
  const text = copy[language];
  const [entered, setEntered] = useState(false);
  const [participants, setParticipants] = useState<number | null>(null);
  const [winner, setWinner] = useState<RoseGiveawayWinner | null>(null);
  const [referralLink, setReferralLink] = useState<string | null>(null);
  const [referralCount, setReferralCount] = useState(0);
  const [referralBonusPercent, setReferralBonusPercent] = useState(0);
  const [copied, setCopied] = useState(false);
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
      setReferralLink(result.referralLink);
      setReferralCount(result.referralCount);
      setReferralBonusPercent(result.referralBonusPercent);
    } catch {
      // The card remains useful outside Telegram; the action explains that Telegram is required.
    }
  }, []);

  useEffect(() => {
    void refresh();
    const interval = window.setInterval(() => { void refresh(); }, 15_000);
    return () => window.clearInterval(interval);
  }, [refresh]);

  async function participate() {
    setLoading(true);
    setError(null);
    try {
      const result = await enterRoseGiveaway();
      setEntered(true);
      setParticipants(result.participants);
      setWinner(result.winner);
      setFull(result.full);
      setReferralLink(result.referralLink);
      setReferralCount(result.referralCount);
      setReferralBonusPercent(result.referralBonusPercent);
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

  async function copyReferralLink() {
    if (!referralLink) return;
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setError(text.unavailable);
    }
  }

  return (
    <section className="rose-giveaway relative mb-6 overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-[0_6px_22px_rgba(15,23,42,.06)]">
      {justEntered && <div className="giveaway-confetti" aria-hidden="true">{Array.from({ length: 14 }, (_, i) => <i key={i} style={{ '--i': i } as CSSProperties} />)}</div>}
      <div className="flex items-baseline justify-center gap-2 px-4 pb-2 pt-3 text-center">
        <span className="text-[12px] font-black tracking-[.16em] text-[#1557d5]">ORBIT</span>
        <span className="text-[10px] font-semibold tracking-[.12em] text-slate-500">{text.giveaway}</span>
      </div>
      <div className="rose-giveaway-header flex items-center gap-3.5 border-b border-rose-700 bg-[linear-gradient(115deg,#b51f3d_0%,#d52f4d_58%,#a91f46_100%)] px-4 py-4">
        <div className="rose-giveaway-art flex h-[68px] w-[68px] shrink-0 items-center justify-center rounded-[18px] border border-rose-100 bg-white text-[38px]" aria-label="Eternal Rose">🌹</div>
        <div className="min-w-0 flex-1">
          <h2 className="mt-1 text-[18px] font-bold leading-tight text-white">{text.title}</h2>
          <p className="mt-1 text-[11px] leading-snug text-white/80">{text.subtitle}</p>
        </div>
        <span className="self-start rounded-full border border-white/25 bg-white/15 px-2 py-1 text-[10px] font-semibold text-white">×1</span>
      </div>

      <div className="px-4 pb-4 pt-3.5">
        <div className="flex items-center justify-between gap-3 rounded-[14px] border border-slate-100 bg-slate-50 px-3 py-2.5">
          <div className="min-w-0">
            <p className="text-[9px] font-semibold uppercase tracking-[.09em] text-slate-500">{text.condition}</p>
            <a href={CHANNEL_URL} target="_blank" rel="noreferrer" className="mt-0.5 inline-flex max-w-full items-center gap-1 text-[13px] font-semibold text-blue-700 hover:underline">
              @orbit_market_official <span aria-hidden="true" className="text-[11px]">↗</span>
            </a>
          </div>
        </div>
        <div className="rose-referral-box mt-3 rounded-[14px] border border-rose-100 bg-rose-50/70 px-3 py-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[11px] font-bold text-slate-900">{text.referralTitle}</p>
              <p className="mt-0.5 text-[10px] leading-snug text-slate-600">{text.referralHint}</p>
            </div>
            <span className="shrink-0 rounded-full bg-white px-2 py-1 text-[10px] font-bold text-rose-700">+10%</span>
          </div>
          {referralLink ? (
            <div className="mt-2 flex min-w-0 items-center gap-2">
              <a href={referralLink} title={referralLink} className="rose-referral-link min-w-0 flex-1 truncate rounded-[10px] border border-rose-100 bg-white px-2.5 py-2 text-[10px] font-medium text-slate-700">
                {referralLink.replace('https://', '')}
              </a>
              <button type="button" onClick={copyReferralLink} className="shrink-0 rounded-[10px] bg-[#b51f3d] px-3 py-2 text-[10px] font-bold text-white transition hover:brightness-95">
                {copied ? text.copied : text.copyLink}
              </button>
            </div>
          ) : <p className="mt-2 text-[10px] text-slate-500">{text.referralUnavailable}</p>}
          {referralCount > 0 && <p className="mt-2 text-[10px] font-semibold text-rose-700">{referralCount} {text.referralCount} · +{referralBonusPercent}% {text.referralBonus}</p>}
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
          <div className="mt-4">
            <button type="button" onClick={participate} disabled={loading || entered || full} className="flex h-12 w-full items-center justify-center gap-2 rounded-[14px] bg-[linear-gradient(90deg,#b51f3d_0%,#d52f4d_58%,#a91f46_100%)] px-3 text-[13px] font-bold text-white transition hover:brightness-95 active:scale-[.99] disabled:cursor-default disabled:bg-emerald-600">
              {loading ? text.checking : entered ? <><span aria-hidden="true">✓</span>{text.entered}</> : full ? text.full : text.enter}
            </button>
          </div>
        )}
        {error && <p role="status" className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-[11px] leading-snug text-rose-700">{error}</p>}
        <div className="mt-3.5 rounded-[14px] bg-slate-50 px-3 py-2.5">
          <div className="mb-2 flex items-center justify-between text-[10px] font-medium text-slate-600">
            <span>{participants === null ? ' ' : `${participants.toLocaleString()} / 10 ${participantsWord(participants)}`}</span>
            {entered && !winner && <span className="font-semibold text-emerald-600">{text.entered}</span>}
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-rose-50" role="progressbar" aria-valuemin={0} aria-valuemax={10} aria-valuenow={participants ?? 0} aria-label={`${participants ?? 0} of 10 participants`}>
            <div className="h-full rounded-full bg-[linear-gradient(90deg,#b51f3d_0%,#d52f4d_58%,#a91f46_100%)] transition-[width] duration-500" style={{ width: `${Math.min(100, ((participants ?? 0) / 10) * 100)}%` }} />
          </div>
        </div>
      </div>
    </section>
  );
}
