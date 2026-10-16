'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useTonAddress, useTonConnectUI } from '@tonconnect/ui-react';
import { enterNftGiveaway, getNftGiveawayStatus, type NftGiveawayStatus } from '../../lib/api';
import { useOrbitLanguage } from '../../components/OrbitLanguageContext';
import { NFT_GIVEAWAY_PARTICIPANT_LIMIT, NFT_GIVEAWAY_PRIZE_URL } from '../../components/NftGiveawayCard';

const CHANNEL_URL = 'https://t.me/orbit_market_official';

export default function NftGiveawayPage() {
  const { t } = useOrbitLanguage();
  const walletAddress = useTonAddress();
  const [tonConnectUi] = useTonConnectUI();
  const [status, setStatus] = useState<NftGiveawayStatus | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const refresh = useCallback(async () => {
    try {
      setStatus(await getNftGiveawayStatus());
      setError('');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t('Could not load the NFT giveaway'));
    }
  }, [t]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // Keep the participant count fresh while the page stays open.
  useEffect(() => {
    const interval = window.setInterval(() => {
      if (document.visibilityState === 'visible') void refresh();
    }, 30_000);
    const onVisible = () => {
      if (document.visibilityState === 'visible') void refresh();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [refresh]);

  // The app shell syncs a freshly connected wallet to the backend — recheck after it lands.
  useEffect(() => {
    if (!walletAddress) return;
    const timer = window.setTimeout(() => void refresh(), 1500);
    return () => window.clearTimeout(timer);
  }, [walletAddress, refresh]);

  const conditions = status?.conditions;
  const allConditions = Boolean(conditions?.subscribed && conditions?.walletConnected && conditions?.arenaStake);
  const entered = status?.entered ?? false;
  const full = status?.full ?? false;
  const winner = status?.winner ?? null;
  const participants = status?.participants ?? 0;
  const canEnter = Boolean(status) && allConditions && !entered && !full && !busy;

  async function doEnter() {
    if (!canEnter) return;
    setBusy(true);
    try {
      setStatus(await enterNftGiveaway());
      setError('');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t('Could not enter the giveaway'));
    } finally {
      setBusy(false);
    }
  }

  async function copyReferral() {
    if (!status?.referralLink) return;
    try {
      await navigator.clipboard.writeText(status.referralLink);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard access is unavailable outside a secure context.
    }
  }

  const winnerName = winner
    ? (winner.firstName || winner.lastName
        ? [winner.firstName, winner.lastName].filter(Boolean).join(' ')
        : winner.username
          ? `@${winner.username}`
          : t('Winner'))
    : null;
  const progress = Math.min(100, (participants / NFT_GIVEAWAY_PARTICIPANT_LIMIT) * 100);

  const conditionRowClass = (met: boolean) =>
    `flex items-center gap-3 rounded-2xl border px-3.5 py-3 transition active:scale-[0.99] ${
      met ? 'border-emerald-200 bg-emerald-50/80' : 'border-blue-100 bg-white'
    }`;

  return (
    <main className="min-h-screen bg-[#f5f8ff] text-slate-900">
      <div className="mx-auto min-h-screen max-w-[480px] px-4 pb-16">
        <header className="flex items-center gap-3 py-5">
          <Link href="/" aria-label={t('Home')} className="flex h-10 w-10 items-center justify-center rounded-full border border-blue-100 bg-white text-lg text-blue-800 shadow-sm">
            ←
          </Link>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-orange-600">ORBIT GIVEAWAY</p>
            <h1 className="truncate text-xl font-bold leading-tight text-blue-950">{t('REFERRAL NFT GIVEAWAY')}</h1>
          </div>
        </header>

        {/* Prize hero */}
        <section className="relative overflow-hidden rounded-[28px] border border-orange-500/25 bg-[linear-gradient(150deg,#1d1310_0%,#2a1a12_45%,#170f0c_100%)] p-5 text-white shadow-[0_16px_40px_rgba(24,12,6,.4)]">
          <div aria-hidden="true" className="pointer-events-none absolute -left-16 -top-20 h-52 w-52 rounded-full bg-[#f97316]/25 blur-3xl" />
          <div aria-hidden="true" className="pointer-events-none absolute -bottom-24 -right-12 h-52 w-52 rounded-full bg-[#dc2626]/20 blur-3xl" />
          <div className="relative flex items-start gap-4">
            <span className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-orange-400/25 shadow-[0_4px_16px_rgba(249,115,22,.25)]" aria-hidden="true">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/nft/chillflame.jpg" alt="" className="h-full w-full object-cover" />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[.3em] text-orange-300/70">NFT · CHILLFLAME</p>
              <p className="mt-1.5 text-[13px] leading-snug text-orange-100/85">
                {t('Want to grab a cool NFT? Take part in our referral contest and win prizes!')}
              </p>
            </div>
          </div>
          <a
            href={NFT_GIVEAWAY_PRIZE_URL}
            target="_blank"
            rel="noreferrer"
            className="relative mt-4 inline-flex items-center gap-2 rounded-full border border-orange-400/30 bg-orange-500/15 px-4 py-2 text-[11px] font-black uppercase tracking-[.16em] text-orange-100 transition hover:bg-orange-500/25"
          >
            {t('View NFT')}
            <svg aria-hidden="true" viewBox="0 0 12 12" fill="none" className="h-3 w-3">
              <path d="M2.5 9.5 9.5 2.5M9.5 2.5H4.5M9.5 2.5V7.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
        </section>

        {/* Winner */}
        {winner && winnerName && (
          <section className="mt-3 flex items-center gap-3 rounded-3xl border border-amber-200 bg-amber-50/80 p-4 shadow-sm">
            {winner.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={winner.photoUrl} alt="" className="h-11 w-11 shrink-0 rounded-full object-cover" />
            ) : (
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-amber-100 text-xl" aria-hidden="true">🏆</span>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-amber-600">{t('Winner')}</p>
              <p className="truncate text-sm font-bold text-blue-950">{winnerName}</p>
            </div>
            <span className="text-xl" aria-hidden="true">🏆</span>
          </section>
        )}

        {/* Progress to the draw */}
        <section className="mt-3 rounded-3xl border border-orange-100 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">{t('Participants')}</span>
            <span className="text-sm font-black tabular-nums text-orange-600">
              {participants}/{NFT_GIVEAWAY_PARTICIPANT_LIMIT}
            </span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
            <span className="block h-full rounded-full bg-gradient-to-r from-orange-400 to-red-500 transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
        </section>

        {/* Conditions */}
        <section className="mt-3 rounded-3xl border border-blue-100 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-black text-blue-950">{t('How to participate')}</h2>
          <div className="mt-3 space-y-2">
            <a href={CHANNEL_URL} target="_blank" rel="noreferrer" className={conditionRowClass(Boolean(conditions?.subscribed))}>
              <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-base ${conditions?.subscribed ? 'bg-emerald-100' : 'bg-orange-50'}`} aria-hidden="true">
                {conditions?.subscribed ? '✓' : '📣'}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-blue-950">{t('Subscribe to our Telegram channel')}</span>
                <span className={`block text-xs ${conditions?.subscribed ? 'text-emerald-600' : 'text-slate-400'}`}>
                  {conditions?.subscribed ? t('Subscribed') : t('Tap to subscribe')}
                </span>
              </span>
              {!conditions?.subscribed && <span className="text-slate-300">›</span>}
            </a>

            <button
              type="button"
              onClick={() => void tonConnectUi.openModal()}
              className={`${conditionRowClass(Boolean(conditions?.walletConnected))} w-full text-left`}
            >
              <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-base ${conditions?.walletConnected ? 'bg-emerald-100' : 'bg-orange-50'}`} aria-hidden="true">
                {conditions?.walletConnected ? '✓' : '🔗'}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-blue-950">{t('Connect your wallet on the site or in the bot')}</span>
                <span className={`block text-xs ${conditions?.walletConnected ? 'text-emerald-600' : 'text-slate-400'}`}>
                  {conditions?.walletConnected ? t('Connected') : t('Tap to connect')}
                </span>
              </span>
              {!conditions?.walletConnected && <span className="text-slate-300">›</span>}
            </button>

            <Link href="/arena" className={conditionRowClass(Boolean(conditions?.arenaStake))}>
              <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-base ${conditions?.arenaStake ? 'bg-emerald-100' : 'bg-orange-50'}`} aria-hidden="true">
                {conditions?.arenaStake ? '✓' : '💰'}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-blue-950">{t('Bet at least 0.1 TON in the Arena')}</span>
                <span className={`block text-xs ${conditions?.arenaStake ? 'text-emerald-600' : 'text-slate-400'}`}>
                  {conditions?.arenaStake ? t('Done') : t('Tap to open the Arena')}
                </span>
              </span>
              {!conditions?.arenaStake && <span className="text-slate-300">›</span>}
            </Link>
          </div>
        </section>

        {/* Enter */}
        <button
          type="button"
          onClick={() => void doEnter()}
          disabled={!canEnter}
          className={`mt-4 w-full rounded-2xl py-4 text-base font-black text-white transition active:scale-[0.98] ${
            entered
              ? 'bg-emerald-500 shadow-[0_8px_24px_rgba(16,185,129,0.3)]'
              : 'bg-orange-500 shadow-[0_8px_24px_rgba(249,115,22,0.35)]'
          } ${canEnter ? '' : 'opacity-60'}`}
        >
          {busy
            ? t('Entering…')
            : !status
              ? t('Connecting…')
              : entered
                ? t('You are participating')
                : full
                  ? t('Giveaway complete')
                  : !allConditions
                    ? t('Complete all conditions')
                    : t('Enter the giveaway')}
        </button>

        {error && (
          <p role="alert" className="mt-2 rounded-xl bg-red-500/10 px-3 py-2 text-center text-xs font-semibold text-red-500">{error}</p>
        )}

        {/* Referral */}
        {status?.referralLink && (
          <section className="mt-3 rounded-3xl border border-blue-100 bg-white p-4 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-700">{t('Your referral link')}</p>
            <div className="mt-2 flex items-center gap-2">
              <a
                href={status.referralLink}
                title={status.referralLink}
                className="min-w-0 flex-1 truncate rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-[11px] font-medium text-slate-700"
              >
                {status.referralLink.replace('https://', '')}
              </a>
              <button
                type="button"
                onClick={() => void copyReferral()}
                className={`shrink-0 rounded-xl px-3 py-2.5 text-[11px] font-bold transition ${copied ? 'bg-emerald-500 text-white' : 'bg-blue-700 text-white hover:bg-blue-800'}`}
              >
                {copied ? t('Copied') : t('Copy')}
              </button>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <div className="rounded-2xl bg-slate-50 px-3 py-2.5">
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">{t('Friends invited')}</p>
                <p className="mt-0.5 text-sm font-black tabular-nums text-blue-800">
                  {status.referralCount}
                  <span className="ml-1 text-[10px] font-bold text-orange-500">+{status.referralBonusPercent}%</span>
                </p>
              </div>
              <div className="rounded-2xl bg-slate-50 px-3 py-2.5">
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">{t('Link opens')}</p>
                <p className="mt-0.5 text-sm font-black tabular-nums text-blue-800">{status.referralVisitCount}</p>
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
