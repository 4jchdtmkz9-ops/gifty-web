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

/** Collectible rewards from this case: the player picks a quick sale or claims them into the inventory. */
const COLLECTIBLE_IDS = new Set(['bear', 'candycane-nft']);

/** Renders a single prize in the "What you can win" grid. */
function FreeCaseRewardCard({ reward, compact = false }: { reward: CaseReward; compact?: boolean }) {
  const [imageFailed, setImageFailed] = useState(false);
  const isGram = reward.id.startsWith('gram-');
  const isBear = reward.id === 'bear';
  const isNft = reward.id === 'candycane-nft';
  const isCollectible = COLLECTIBLE_IDS.has(reward.id);

  return (
    <div className={`relative block shrink-0 overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-[0_5px_16px_rgba(21,87,213,0.07)] ${compact ? 'w-[112px]' : 'w-full'}`}>
      <div className={`relative flex items-center justify-center overflow-hidden ${isCollectible ? 'bg-black' : 'bg-white'} ${compact ? 'h-[112px]' : 'aspect-square'}`}>
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
              />
            )}
          </>
        ) : (
          <span className="text-5xl" aria-hidden="true">{reward.emoji}</span>
        )}

        {isCollectible && (
          <span className={`absolute right-2 top-2 rounded-full px-2 py-1 text-[10px] font-bold shadow-sm backdrop-blur ${isBear ? 'bg-amber-400/95 text-amber-950' : 'bg-white/95 text-blue-800'}`}>
            {isBear ? '★ 15' : <><GramIcon size={12} className="mr-0.5" />20</>}
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
      if (!COLLECTIBLE_IDS.has(settledReward.id)) requestIdRef.current = null;
      // Set 24h cooldown from now
      setCooldownEnd(Date.now() + 24 * 60 * 60 * 1000);
    } catch (cause) {
      setOpening(false);
      setNotice(cause instanceof Error ? cause.message : t('Could not open case'));
      return;
    }

    const items = [...Array.from({ length: WINNING_INDEX }, randomVisualReward), reward, ...Array.from({ length: 5 }, randomVisualReward)];
    setRollItems(items);
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
      // Always land the winning card under the centered marker.
      const targetLeft = winningCard.offsetLeft + winningCard.offsetWidth / 2 - viewport.clientWidth / 2;
      const startTime = performance.now();
      const duration = 7700;
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
        : t('Collectible claimed — added to inventory'));
      void result;
    } catch (cause) {
      setNotice(cause instanceof Error ? cause.message : t('Could not open case'));
    } finally {
      setResolving('');
    }
  }, [resolving, t]);

  const isCollectibleWin = Boolean(wonReward && COLLECTIBLE_IDS.has(wonReward.id));
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
                {opening && <span className="pointer-events-none absolute inset-y-0 left-1/2 z-20 w-1 -translate-x-1/2 bg-yellow-400 shadow-[0_0_12px_rgba(244,191,40,0.9)]" />}
              </div>
            ) : <Image src={freeCase.image} alt="FREE Case" fill sizes="(max-width: 480px) 100vw, 448px" className="object-contain p-2" priority />}
          </div>

          <div className="p-4 pt-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-blue-950">{t('FREE CASE')}</h2>
                <p className="mt-0.5 text-xs text-slate-500">{t('Open every 24 hours')}</p>
              </div>
            </div>

            {/* Conditions: wallet + channel subscription, verified server-side */}
            <div className="mt-4 space-y-2">
              <a
                href={walletConnected ? undefined : 'https://t.me/wallet'}
                target={walletConnected ? undefined : '_blank'}
                rel="noreferrer"
                className={`flex items-center gap-3 rounded-2xl border px-3.5 py-3 transition ${walletConnected ? 'border-emerald-200 bg-emerald-50/80' : 'border-blue-100 bg-white active:scale-[0.99]'}`}
              >
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-base ${walletConnected ? 'bg-emerald-100' : 'bg-blue-50'}`}>
                  {walletConnected ? '✓' : '🔗'}
                </span>
                <span className="flex-1">
                  <span className="block text-sm font-semibold text-blue-950">{t('TON wallet')}</span>
                  <span className={`block text-xs ${walletConnected ? 'text-emerald-600' : 'text-slate-400'}`}>
                    {walletConnected ? t('Connected') : t('Tap to connect')}
                  </span>
                </span>
                {!walletConnected && <span className="text-slate-300">›</span>}
              </a>
              <a
                href={subscribed ? undefined : 'https://t.me/orbit_market_official'}
                target={subscribed ? undefined : '_blank'}
                rel="noreferrer"
                className={`flex items-center gap-3 rounded-2xl border px-3.5 py-3 transition ${subscribed ? 'border-emerald-200 bg-emerald-50/80' : 'border-blue-100 bg-white active:scale-[0.99]'}`}
              >
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-base ${subscribed ? 'bg-emerald-100' : 'bg-blue-50'}`}>
                  {subscribed ? '✓' : '📣'}
                </span>
                <span className="flex-1">
                  <span className="block text-sm font-semibold text-blue-950">{t('ORBIT channel')}</span>
                  <span className={`block text-xs ${subscribed ? 'text-emerald-600' : 'text-slate-400'}`}>
                    {subscribed ? t('Subscribed') : t('Tap to subscribe')}
                  </span>
                </span>
                {!subscribed && <span className="text-slate-300">›</span>}
              </a>
            </div>
            {notice && <p role="status" className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">{notice}</p>}

            <button
              type="button"
              onClick={openCase}
              disabled={opening || !!countdown || !conditionsMet}
              className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 text-sm font-semibold text-white shadow-[0_8px_18px_rgba(16,185,129,0.25)] transition active:scale-[0.99] disabled:opacity-60"
            >
              {opening ? t('Opening…') : countdown ? `⏳ ${countdown}` : conditionsMet ? t('Open') : t('Complete the conditions to open')}
            </button>
          </div>
        </section>

        <section className="mt-6">
          <div className="mb-3 flex items-center gap-3">
            <h2 className="shrink-0 text-sm font-extrabold uppercase tracking-[0.18em] text-blue-950">{t('POSSIBLE PRIZES')}</h2>
            <span className="h-px flex-1 bg-gradient-to-r from-blue-200 to-transparent" />
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
            {isCollectibleWin ? (
              <>
                <p className="mt-3 text-sm font-semibold text-slate-600">{t('Collectible won! Choose an action:')}</p>
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    disabled={Boolean(resolving)}
                    onClick={() => void resolveNft('sell')}
                    className="min-h-11 flex-1 rounded-2xl bg-amber-500 text-sm font-semibold text-white disabled:opacity-60"
                  >
                    {resolving === 'sell' ? '…' : t('Quick sale')}
                  </button>
                  <button
                    type="button"
                    disabled={Boolean(resolving)}
                    onClick={() => void resolveNft('claim')}
                    className="min-h-11 flex-1 rounded-2xl bg-emerald-600 text-sm font-semibold text-white disabled:opacity-60"
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
