'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import BottomNav from '../../../components/BottomNav';
import GramIcon from '../../../components/GramIcon';
import OrbitWordmark from '../../../components/OrbitWordmark';
import { freeCase, freeCaseRewards, type CaseReward } from '../../../lib/caseData';
import { useOrbitLanguage } from '../../../components/OrbitLanguageContext';
import { openFreeCaseForBalance, getFreeCaseCooldown, resolveFreeCaseNft } from '../../../lib/api';

const WINNING_INDEX = 18;

function randomVisualReward() {
  return freeCaseRewards[Math.floor(Math.random() * freeCaseRewards.length)];
}

function formatCountdown(ms: number) {
  if (ms <= 0) return null;
  const totalSeconds = Math.floor(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/** Renders a single prize in the "What you can win" grid. */
function FreeCaseRewardCard({ reward, compact = false }: { reward: CaseReward; compact?: boolean }) {
  const [imageFailed, setImageFailed] = useState(false);
  const isGram = reward.id.startsWith('gram-');
  const isBear = reward.id === 'bear';
  const isNft = reward.id === 'candycane-nft';

  return (
    <div className={`relative block shrink-0 overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-[0_5px_16px_rgba(21,87,213,0.07)] ${compact ? 'w-[112px]' : 'w-full'}`}>
      <div className={`relative flex items-center justify-center overflow-hidden ${isNft ? 'bg-black' : 'bg-white'} ${compact ? 'h-[112px]' : 'aspect-square'}`}>
        {isGram ? (
          <span className="flex items-center gap-1.5 text-2xl font-bold text-blue-800">
            <GramIcon size={28} /> {reward.price}
          </span>
        ) : isBear ? (
          <span className="text-6xl" aria-hidden="true">🧸</span>
        ) : isNft ? (
          <>
            {!imageFailed && (
              <img
                src={reward.image}
                alt={reward.name}
                loading="lazy"
                referrerPolicy="no-referrer"
                onError={() => setImageFailed(true)}
                className="absolute inset-0 h-full w-full object-contain p-3"
                style={{ mixBlendMode: 'screen' }}
              />
            )}
          </>
        ) : (
          <span className="text-5xl" aria-hidden="true">{reward.emoji}</span>
        )}

        {isNft && (
          <span className="absolute right-2 top-2 rounded-full bg-white/95 px-2 py-1 text-[10px] font-bold text-blue-800 shadow-sm backdrop-blur">
            <GramIcon size={12} className="mr-0.5" />20
          </span>
        )}
      </div>
      <div className="p-2.5">
        <p className="truncate text-xs font-semibold text-slate-800">{reward.name}</p>
      </div>
    </div>
  );
}

export default function FreeCasePage() {
  const { t } = useOrbitLanguage();
  const [opening, setOpening] = useState(false);
  const [notice, setNotice] = useState('');
  const [wonReward, setWonReward] = useState<CaseReward | null>(null);
  const [rollItems, setRollItems] = useState<CaseReward[]>(freeCaseRewards);
  const [markerPosition, setMarkerPosition] = useState(50);
  const [cooldownEnd, setCooldownEnd] = useState<number | null>(null);
  const [countdown, setCountdown] = useState<string | null>(null);
  const [walletConnected, setWalletConnected] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [resolving, setResolving] = useState<'sell' | 'claim' | ''>('');
  const rouletteRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const animationTimerRef = useRef<number | null>(null);
  const requestIdRef = useRef<string | null>(null);
  const cooldownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load cooldown, conditions and any unresolved NFT win from the server on mount
  useEffect(() => {
    getFreeCaseCooldown()
      .then((status) => {
        if (status.cooldownEndsAt) {
          setCooldownEnd(new Date(status.cooldownEndsAt).getTime());
        }
        setWalletConnected(status.walletConnected ?? false);
        setSubscribed(status.subscribed ?? false);
        if (status.pendingNft) {
          // A previous NFT win was never resolved — reopen the choice dialog.
          requestIdRef.current = status.pendingNft.requestId;
          setWonReward(freeCaseRewards.find((item) => item.id === status.pendingNft!.reward.id) ?? null);
        }
      })
      .catch(() => {});
  }, []);

  // Tick countdown
  useEffect(() => {
    if (cooldownIntervalRef.current) clearInterval(cooldownIntervalRef.current);
    if (!cooldownEnd) {
      setCountdown(null);
      return;
    }
    const tick = () => {
      const remaining = cooldownEnd - Date.now();
      const formatted = formatCountdown(remaining);
      setCountdown(formatted);
      if (!formatted && cooldownIntervalRef.current) {
        clearInterval(cooldownIntervalRef.current);
        setCooldownEnd(null);
      }
    };
    tick();
    cooldownIntervalRef.current = setInterval(tick, 1000);
    return () => {
      if (cooldownIntervalRef.current) clearInterval(cooldownIntervalRef.current);
    };
  }, [cooldownEnd]);

  useEffect(() => {
    return () => {
      if (animationFrameRef.current !== null) window.cancelAnimationFrame(animationFrameRef.current);
      if (animationTimerRef.current !== null) window.clearTimeout(animationTimerRef.current);
    };
  }, []);

  const openCase = useCallback(async () => {
    if (opening || countdown) return;
    setOpening(true);
    setWonReward(null);
    setNotice('');
    requestIdRef.current ??= crypto.randomUUID();
    let reward: CaseReward;
    try {
      const settlement = await openFreeCaseForBalance(requestIdRef.current);
      const settledReward = freeCaseRewards.find((item) => item.id === settlement.reward.id);
      if (!settledReward) throw new Error(t('Could not open case'));
      reward = settledReward;
      if (settledReward.id !== 'candycane-nft') requestIdRef.current = null;
      // Set 24h cooldown from now
      setCooldownEnd(Date.now() + 24 * 60 * 60 * 1000);
    } catch (cause) {
      setOpening(false);
      setNotice(cause instanceof Error ? cause.message : t('Could not open case'));
      return;
    }

    const items = [...Array.from({ length: WINNING_INDEX }, randomVisualReward), reward, ...Array.from({ length: 5 }, randomVisualReward)];
    setRollItems(items);
    const nextMarkerPosition = 20 + Math.random() * 60;
    setMarkerPosition(nextMarkerPosition);
    const viewport = rouletteRef.current;
    if (!viewport) {
      setOpening(false);
      setWonReward(reward);
      return;
    }

    animationTimerRef.current = window.setTimeout(() => {
      const winningCard = viewport.querySelector<HTMLElement>(`[data-roll-index="${WINNING_INDEX}"]`);
      if (!winningCard) {
        setOpening(false);
        setWonReward(reward);
        return;
      }
      const startLeft = viewport.scrollLeft;
      const targetLeft = winningCard.offsetLeft + winningCard.offsetWidth / 2 - viewport.clientWidth * (nextMarkerPosition / 100);
      const startTime = performance.now();
      const duration = 7200;
      const animate = (now: number) => {
        const progress = Math.min(1, (now - startTime) / duration);
        const eased = 1 - Math.pow(1 - progress, 5);
        viewport.scrollLeft = startLeft + (targetLeft - startLeft) * eased;
        if (progress < 1) {
          animationFrameRef.current = window.requestAnimationFrame(animate);
          return;
        }
        setOpening(false);
        setWonReward(reward);
      };
      animationFrameRef.current = window.requestAnimationFrame(animate);
    }, 80);
  }, [opening, countdown, t]);

  const resolveNft = useCallback(async (action: 'sell' | 'claim') => {
    if (!requestIdRef.current || resolving) return;
    setResolving(action);
    try {
      const result = await resolveFreeCaseNft(requestIdRef.current, action);
      requestIdRef.current = null;
      setWonReward(null);
      setNotice(action === 'sell'
        ? t('Quick sale — credited to balance')
        : t('NFT claimed — added to inventory'));
      void result;
    } catch (cause) {
      setNotice(cause instanceof Error ? cause.message : t('Could not open case'));
    } finally {
      setResolving('');
    }
  }, [resolving, t]);

  const isNftWin = wonReward?.id === 'candycane-nft';
  const conditionsMet = walletConnected && subscribed;

  return (
    <main className="min-h-screen bg-[#f5f8ff] text-slate-900">
      <div className="mx-auto min-h-screen max-w-[480px] px-4 pb-28">
        <header className="flex items-center gap-3 py-5">
          <Link href="/cases" aria-label={t('Back to cases')} className="flex h-10 w-10 items-center justify-center rounded-full border border-blue-100 bg-white text-lg text-blue-800 shadow-sm">←</Link>
          <div>
            <OrbitWordmark suffix={t('CASE')} />
            <h1 className="text-xl font-bold leading-tight text-blue-950">{freeCase.name}</h1>
          </div>
        </header>

        <section className="overflow-hidden rounded-[28px] border border-blue-100 bg-white shadow-[0_12px_32px_rgba(21,87,213,0.09)]">
          <div className={`relative flex h-[220px] items-center overflow-hidden ${opening ? 'case-roulette-stage' : 'case-art-stage bg-white'}`}>
            {opening ? (
              <div className="relative h-full w-full">
                <div ref={rouletteRef} className="case-roulette-track absolute inset-0 z-10 flex items-center gap-2.5 overflow-hidden px-3">
                  {rollItems.map((reward, index) => <div key={`${reward.id}-${index}`} data-roll-index={index}><FreeCaseRewardCard reward={reward} compact /></div>)}
                </div>
                {opening && <span className="pointer-events-none absolute inset-y-0 z-20 w-1 -translate-x-1/2 bg-yellow-400 shadow-[0_0_12px_rgba(244,191,40,0.9)]" style={{ left: `${markerPosition}%` }} />}
              </div>
            ) : <Image src={freeCase.image} alt="FREE Case" fill sizes="(max-width: 480px) 100vw, 448px" className="object-contain p-2" priority />}
          </div>

          <div className="p-4 pt-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-blue-950">FREE CASE</h2>
                <p className="mt-0.5 text-xs text-slate-500">{t('Open every 24 hours')}</p>
              </div>
              <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">🎁 FREE</span>
            </div>

            <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50/70 px-3 py-2.5">
              <p className="text-[11px] font-bold text-blue-950">{t('FREE CASE')}</p>
              <p className="mt-0.5 text-[10px] leading-4 text-blue-800">{t('Connect wallet and subscribe to channel to open. Available every 24 hours.')}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <a
                  href={walletConnected ? undefined : 'https://t.me/wallet'}
                  target={walletConnected ? undefined : '_blank'}
                  rel="noreferrer"
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold ${walletConnected ? 'bg-emerald-100 text-emerald-700' : 'bg-white text-blue-700 shadow-sm'}`}
                >
                  {walletConnected ? '✓' : '🔗'} {t('TON wallet')}
                </a>
                <a
                  href={subscribed ? undefined : 'https://t.me/orbit_market_official'}
                  target={subscribed ? undefined : '_blank'}
                  rel="noreferrer"
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold ${subscribed ? 'bg-emerald-100 text-emerald-700' : 'bg-white text-blue-700 shadow-sm'}`}
                >
                  {subscribed ? '✓' : '📣'} {t('Channel subscription')}
                </a>
              </div>
            </div>
            {notice && <p role="status" className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">{notice}</p>}

            <button
              type="button"
              onClick={openCase}
              disabled={opening || !!countdown || !conditionsMet}
              className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 text-sm font-semibold text-white shadow-[0_8px_18px_rgba(16,185,129,0.25)] transition active:scale-[0.99] disabled:opacity-60"
            >
              {opening ? t('Opening…') : countdown ? `⏳ ${countdown}` : conditionsMet ? `🎁 ${t('Open')}` : t('Complete the conditions to open')}
            </button>
          </div>
        </section>

        <section className="mt-6">
          <div className="mb-3 flex items-end justify-between">
            <div>
              <p className="text-[10px] font-bold tracking-[0.16em] text-blue-700">{t('POSSIBLE PRIZES')}</p>
              <h2 className="mt-1 text-base font-bold text-blue-950">{t('What you can win')}</h2>
            </div>
            <span className="flex items-center gap-0.5 text-[10px] text-slate-500">
              <GramIcon size={11} className="text-blue-700" />20
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {freeCaseRewards.map((reward) => <FreeCaseRewardCard key={reward.id} reward={reward} />)}
          </div>
        </section>

        <BottomNav active="cases" />
      </div>

      {/* Win dialog */}
      {wonReward && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-blue-950/45 px-5 backdrop-blur-sm">
          <div className="w-full max-w-[340px] rounded-[28px] border border-blue-100 bg-white p-5 text-center shadow-2xl">
            <p className="text-[10px] font-bold tracking-[0.2em] text-emerald-600">{t('CASE PRIZE')}</p>
            <h2 className="mt-1 text-xl font-bold text-blue-950">{t('You got {name}!').replace('{name}', wonReward.name)}</h2>
            <div className="mx-auto mt-4 max-w-[210px]">
              <FreeCaseRewardCard reward={wonReward} />
            </div>
            {isNftWin ? (
              <>
                <p className="mt-3 text-xs font-semibold text-slate-600">{t('NFT won! Choose an action:')}</p>
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    disabled={Boolean(resolving)}
                    onClick={() => void resolveNft('sell')}
                    className="min-h-10 flex-1 rounded-2xl bg-amber-500 text-sm font-semibold text-white disabled:opacity-60"
                  >
                    {resolving === 'sell' ? '…' : t('Quick sale')}
                  </button>
                  <button
                    type="button"
                    disabled={Boolean(resolving)}
                    onClick={() => void resolveNft('claim')}
                    className="min-h-10 flex-1 rounded-2xl bg-emerald-600 text-sm font-semibold text-white disabled:opacity-60"
                  >
                    {resolving === 'claim' ? '…' : t('Claim')}
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="mt-3 text-xs font-semibold text-slate-600">{t('The prize was credited to your ORBIT balance.')}</p>
                <button type="button" onClick={() => setWonReward(null)} className="mt-4 min-h-12 w-full rounded-2xl bg-blue-700 text-sm font-semibold text-white">{t('Continue')}</button>
              </>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
