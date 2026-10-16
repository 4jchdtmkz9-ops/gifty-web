'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import TelegramTgsSticker from '../../components/TelegramTgsSticker';
import StarIcon from '../../components/StarIcon';
import GramIcon from '../../components/GramIcon';
import BotDepositDialog from '../../components/BotDepositDialog';
import { useOrbitLanguage } from '../../components/OrbitLanguageContext';
import { cashOutRushBet, getBotBalance, getRushState, placeRushBet, type RushPhase, type RushState } from '../../lib/api';
import { formatStars } from '../../lib/currency';

// Must mirror the server growth curve (rush.controller.ts): x2 every ~8s.
const GROWTH_PER_MS = Math.LN2 / 8_000;

const ROCKETS = ['/stickers/rush-rocket-1.json', '/stickers/rush-rocket-2.json', '/stickers/rush-rocket-3.json'];

function multiplierAtMs(startedMs: number, nowMs: number) {
  return Math.exp(GROWTH_PER_MS * Math.max(0, nowMs - startedMs));
}

function formatGramShort(value: string | number) {
  const num = Number(value);
  if (!Number.isFinite(num)) return '0';
  return String(Number(num.toFixed(2)));
}

/** Past-round chip colouring: grey <2, blue 2–10, orange 10+. */
function historyChipClass(multiplier: number) {
  if (multiplier >= 10) return 'bg-orange-500/90 text-white';
  if (multiplier >= 2) return 'bg-blue-600/90 text-white';
  return 'bg-white/10 text-slate-300';
}

export default function RushPage() {
  const { t } = useOrbitLanguage();
  const [state, setState] = useState<RushState | null>(null);
  const [error, setError] = useState('');
  const [clockOffset, setClockOffset] = useState(0);
  const [tick, setTick] = useState(() => Date.now());
  const [currency, setCurrency] = useState<'STARS' | 'GRAM'>('STARS');
  const [stake, setStake] = useState('1');
  const [autoOn, setAutoOn] = useState(false);
  const [autoMult, setAutoMult] = useState('2.00');
  const [busy, setBusy] = useState(false);
  const [crashFlash, setCrashFlash] = useState(false);
  const [depositOpen, setDepositOpen] = useState(false);
  const [depositConfigured, setDepositConfigured] = useState(false);
  const phaseRef = useRef<RushPhase | null>(null);
  const rocketIndex = useRef(1 + Math.floor(Math.random() * ROCKETS.length)).current;

  // ── state polling + clock sync ──────────────────────────────────
  const refresh = useCallback(async () => {
    try {
      const next = await getRushState();
      setState(next);
      setClockOffset(new Date(next.serverNow).getTime() - Date.now());
      setError('');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t('Could not place bet'));
    }
  }, [t]);

  useEffect(() => {
    void refresh();
    const interval = window.setInterval(() => void refresh(), 800);
    return () => window.clearInterval(interval);
  }, [refresh]);

  useEffect(() => {
    void getBotBalance()
      .then((balance) => setDepositConfigured(balance.depositConfigured))
      .catch(() => undefined);
  }, []);

  // Smooth countdown/multiplier between polls while the round is live.
  const phase = state?.round.phase ?? null;
  const driftRef = useRef(0);
  const liveMultRef = useRef(1);
  useEffect(() => {
    if (phase !== 'FLYING' && phase !== 'BETTING') return;
    let frame = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      // Starfield speed in band-%/s: slow idle drift, warp-speed in flight.
      const speed = phase === 'FLYING' ? Math.min(220, 24 + 10 * liveMultRef.current) : 7;
      driftRef.current += speed * dt;
      setTick(Date.now());
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [phase]);

  // Crash effect: red flash the moment the round dies.
  useEffect(() => {
    if (phaseRef.current === 'FLYING' && phase === 'CRASHED') {
      setCrashFlash(true);
      const timer = window.setTimeout(() => setCrashFlash(false), 900);
      phaseRef.current = phase;
      return () => window.clearTimeout(timer);
    }
    phaseRef.current = phase;
  }, [phase]);

  // ── derived timing ──────────────────────────────────────────────
  const serverNowMs = Date.now() + clockOffset;
  const round = state?.round ?? null;
  const flyingStartedMs = round?.flyingStartedAt ? new Date(round.flyingStartedAt).getTime() : null;
  const liveMultiplier =
    phase === 'FLYING' && flyingStartedMs != null
      ? multiplierAtMs(flyingStartedMs, Math.max(serverNowMs, tick + clockOffset))
      : phase === 'CRASHED' && round?.crashMultiplier
        ? Number(round.crashMultiplier)
        : 1;
  const bettingLeftMs = phase === 'BETTING' && round ? Math.max(0, new Date(round.bettingEndsAt).getTime() - serverNowMs) : 0;

  const myBet = state?.myBet ?? null;
  const myActiveBet = myBet?.status === 'ACTIVE' ? myBet : null;
  const myCap = myActiveBet?.capMultiplier ? Number(myActiveBet.capMultiplier) : null;
  // A capped bet dies (server marks it LOST) as soon as the rocket passes the cap.
  const myCappedOut = myCap != null && phase === 'FLYING' && Math.floor(liveMultiplier * 100) / 100 >= myCap;
  const myPayoutMultiplier = myCap != null ? Math.min(liveMultiplier, myCap) : liveMultiplier;
  const myLivePayout =
    myActiveBet && phase === 'FLYING'
      ? myActiveBet.currency === 'STARS'
        ? Math.floor(myActiveBet.stakeStars * myPayoutMultiplier)
        : formatGramShort(Number(myActiveBet.stakeGram) * myPayoutMultiplier)
      : null;
  liveMultRef.current = liveMultiplier;

  // The rocket holds the center of the screen: it only tilts and grows with the multiplier.
  const progress = Math.min(1, Math.log(Math.max(1, liveMultiplier)) / Math.log(26));
  const rocketStyle = {
    left: '50%',
    top: '58%',
    transform: `translate(-50%, -50%) rotate(${-8 + progress * 4}deg) scale(${0.85 + progress * 0.4})`,
  } as const;

  const stakeStars = currency === 'STARS' ? Math.floor(Number(stake) || 0) : 0;
  const stakeGramValue = currency === 'GRAM' ? Number(stake) : 0;
  const stakeValid = currency === 'STARS' ? stakeStars >= 1 : Number.isFinite(stakeGramValue) && stakeGramValue >= 0.01;
  const autoTarget = Number(autoMult);
  const autoValid = !autoOn || (Number.isFinite(autoTarget) && autoTarget >= 1.1 && autoTarget <= 500);

  const presets = currency === 'STARS' ? ['1', '5', '10', '50'] : ['0.01', '0.1', '0.5', '1'];

  const canBet = phase === 'BETTING' && !myBet && stakeValid && autoValid && !busy;
  const canCashout = phase === 'FLYING' && Boolean(myActiveBet) && !myCappedOut && !busy;

  async function doBet() {
    if (!canBet) return;
    setBusy(true);
    try {
      await placeRushBet({
        requestId: crypto.randomUUID(),
        currency,
        stars: currency === 'STARS' ? stakeStars : undefined,
        gram: currency === 'GRAM' ? stake : undefined,
        autoCashoutAt: autoOn ? autoTarget : null,
      });
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t('Could not place bet'));
    } finally {
      setBusy(false);
    }
  }

  async function doCashout() {
    if (!canCashout || !myActiveBet) return;
    setBusy(true);
    try {
      await cashOutRushBet(myActiveBet.id);
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t('Could not cash out'));
    } finally {
      setBusy(false);
    }
  }

  const players = state?.players ?? [];
  const starsBalance = state?.balanceStars ?? 0;
  const gramBalance = state?.balanceGram ?? '0';

  // Two identical stacked star bands scroll and loop seamlessly; the flight
  // loop below advances `driftRef` so the field warps past during the round.
  const starField = useMemo(
    () =>
      Array.from({ length: 42 }, (_, index) => ({
        id: index,
        left: (index * 37.7) % 100,
        top: (index * 61.3) % 100,
        size: index % 7 === 0 ? 2 : 1,
        opacity: index % 5 === 0 ? 0.9 : 0.55,
      })),
    [],
  );

  return (
    <main className="min-h-screen bg-[#070b16] text-white">
      <div className="relative mx-auto flex min-h-screen max-w-[480px] flex-col overflow-hidden px-4 pb-6">
        {/* Space background: radial glow + two looping star bands that fly past */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(120%_70%_at_50%_-10%,#101a36_0%,#070b16_60%)]" />
          <div className="absolute inset-x-0" style={{ top: `${driftRef.current % 100 - 100}%`, height: '200%' }}>
            {[0, 1].map((band) => (
              <div key={band} className="absolute inset-0" style={{ top: `${band * 50}%`, height: '50%' }}>
                {starField.map((star) => (
                  <span
                    key={star.id}
                    className="absolute rounded-full bg-white"
                    style={{ left: `${star.left}%`, top: `${star.top}%`, width: star.size, height: star.size, opacity: star.opacity }}
                  />
                ))}
              </div>
            ))}
          </div>
          {crashFlash && <div className="rush-crash-flash absolute inset-0 bg-red-500/30" />}
        </div>

        {/* Header: GRAM + Stars balances, tap to top up */}
        <header className="relative z-10 flex items-center justify-between py-3">
          <Link href="/" aria-label={t('Home')} className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-slate-300 transition hover:bg-white/10">
            <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="h-4 w-4"><path d="M12.5 4 6.5 10l6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </Link>
          <h1 className="text-lg font-black tracking-[0.35em] text-white">RUSH</h1>
          <button
            type="button"
            onClick={() => setDepositOpen(true)}
            aria-label={t('Your balance')}
            className="flex items-center gap-2 rounded-full bg-white/5 py-1.5 pl-2.5 pr-1.5 text-sm font-bold tabular-nums transition hover:bg-white/10"
          >
            <span className="flex items-center gap-1 text-blue-200">
              <GramIcon size={15} className="text-blue-400" />
              {formatGramShort(gramBalance)}
            </span>
            <span className="h-3.5 w-px bg-white/15" />
            <span className="flex items-center gap-1 text-amber-400">
              {formatStars(starsBalance)}
              <StarIcon size={15} />
            </span>
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/15 text-white">+</span>
          </button>
        </header>

        {/* Round history */}
        <div className="relative z-10 -mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
          {(state?.history ?? []).map((entry) => (
            <span key={entry.number} className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold tabular-nums ${historyChipClass(Number(entry.crashMultiplier))}`}>
              x{entry.crashMultiplier}
            </span>
          ))}
          {(!state || state.history.length === 0) && <span className="text-[11px] text-slate-500">{t('Round history appears here')}</span>}
        </div>

        {/* Flight area */}
        <div className="relative z-10 min-h-[300px] flex-1">
          {/* Multiplier */}
          <div className="absolute inset-x-0 top-8 text-center">
            {phase === 'BETTING' && (
              <>
                <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-slate-400">{t('Betting closed in')}</p>
                <p className="mt-1 text-5xl font-black tabular-nums text-white">{(bettingLeftMs / 1000).toFixed(1)}s</p>
              </>
            )}
            {phase === 'FLYING' && (
              <p className="text-6xl font-black tabular-nums text-white drop-shadow-[0_0_24px_rgba(96,165,250,0.45)]">x{liveMultiplier.toFixed(2)}</p>
            )}
            {phase === 'CRASHED' && (
              <>
                <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-red-400">{t('Crashed')}</p>
                <p className="mt-1 text-6xl font-black tabular-nums text-red-500">x{round?.crashMultiplier}</p>
              </>
            )}
            {!phase && <p className="text-sm text-slate-400">{t('Connecting…')}</p>}
          </div>

          {/* Rocket */}
          {phase !== 'CRASHED' && (
            <div aria-hidden="true" className="absolute" style={rocketStyle}>
              <div className="rush-rocket-glow absolute left-1/2 top-1/2 -z-10 h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-400/20 blur-2xl" />
              <TelegramTgsSticker src={ROCKETS[rocketIndex]} size={112} className="block" fallback={<span className="block text-5xl">🚀</span>} />
            </div>
          )}
          {phase === 'CRASHED' && crashFlash && (
            <div aria-hidden="true" className="rush-explosion absolute h-24 w-24 rounded-full bg-orange-500/70 blur-xl" style={rocketStyle} />
          )}

          {/* My bet result banner */}
          {myBet?.status === 'CASHED_OUT' && (
            <div className="absolute inset-x-0 bottom-2 text-center">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-4 py-2 text-sm font-bold text-emerald-400">
                {t('Cashed out')} x{myBet.cashoutMultiplier}
                {myBet.currency === 'STARS' ? <> · +{formatStars(myBet.payoutStars)} <StarIcon size={13} /></> : <> · +{formatGramShort(myBet.payoutGram)} GRAM</>}
              </span>
            </div>
          )}
          {myBet?.status === 'LOST' && phase === 'CRASHED' && (
            <div className="absolute inset-x-0 bottom-2 text-center">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/15 px-4 py-2 text-sm font-bold text-red-400">
                {myBet.capMultiplier ? `${t('Capped out')} x${myBet.capMultiplier}` : t('The rocket crashed before your cash-out')}
              </span>
            </div>
          )}
          {/* Capped low-stake bet: dies the moment the rocket passes its cap */}
          {myCappedOut && (
            <div className="absolute inset-x-0 bottom-2 text-center">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/15 px-4 py-2 text-sm font-bold text-red-400">
                {t('Capped out')} x{myCap?.toFixed(2)}
              </span>
            </div>
          )}
        </div>

        {/* Control panel */}
        <div className="relative z-10 rounded-3xl border border-white/5 bg-[#0e1526]/90 p-4 backdrop-blur">
          {/* Stake row */}
          <div className="flex items-center gap-2">
            <div className="flex min-w-0 flex-1 items-center gap-2 rounded-2xl bg-white/5 px-3 py-2.5">
              <input
                aria-label={t('Stake')}
                data-static-keyboard
                data-keep-visible-with-keyboard
                type="number"
                inputMode="decimal"
                min="0"
                step="any"
                value={stake}
                onChange={(event) => setStake(event.target.value)}
                disabled={busy || Boolean(myBet) || phase === 'CRASHED'}
                className="min-w-0 flex-1 bg-transparent text-base font-bold tabular-nums text-white outline-none placeholder:text-slate-600 disabled:opacity-60"
                placeholder="1"
              />
              <span className="flex shrink-0 items-center gap-1 text-sm font-bold text-amber-400">
                {currency === 'STARS' ? <StarIcon size={15} /> : <><GramIcon size={15} className="text-blue-400" /> GRAM</>}
              </span>
            </div>
            <div className="flex shrink-0 rounded-2xl bg-white/5 p-1">
              {(['STARS', 'GRAM'] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => { setCurrency(option); setStake(option === 'STARS' ? '1' : '0.1'); }}
                  disabled={busy || Boolean(myBet) || phase === 'CRASHED'}
                  className={`flex h-8 w-9 items-center justify-center rounded-xl text-xs font-bold transition ${currency === option ? 'bg-blue-600 text-white' : 'text-slate-400'}`}
                  aria-label={option}
                >
                  {option === 'STARS' ? <StarIcon size={13} /> : <GramIcon size={13} />}
                </button>
              ))}
            </div>
          </div>

          {/* Quick presets */}
          <div className="mt-2 flex gap-1.5">
            {presets.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setStake(preset)}
                disabled={busy || Boolean(myBet) || phase === 'CRASHED'}
                className={`rounded-full px-3 py-1 text-[11px] font-bold transition ${stake === preset ? 'bg-blue-600 text-white' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}
              >
                {preset}
              </button>
            ))}
          </div>

          {/* Auto-stop */}
          <div className="mt-3 flex items-center justify-between rounded-2xl bg-white/5 px-3 py-2.5">
            <span className="text-sm font-semibold text-slate-300">{t('Auto-stop')}</span>
            <div className="flex items-center gap-2">
              {autoOn && (
                <input
                  aria-label={t('Auto-stop multiplier')}
                  data-static-keyboard
                  data-keep-visible-with-keyboard
                  type="number"
                  inputMode="decimal"
                  min="1.1"
                  max="500"
                  step="0.01"
                  value={autoMult}
                  onChange={(event) => setAutoMult(event.target.value)}
                  disabled={busy || Boolean(myBet)}
                  className="w-16 rounded-lg bg-white/5 px-2 py-1 text-right text-sm font-bold tabular-nums text-white outline-none"
                />
              )}
              <button
                type="button"
                role="switch"
                aria-checked={autoOn}
                aria-label={t('Auto-stop')}
                onClick={() => setAutoOn((value) => !value)}
                disabled={busy || Boolean(myBet)}
                className={`relative h-6 w-11 rounded-full transition ${autoOn ? 'bg-blue-600' : 'bg-white/10'}`}
              >
                <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${autoOn ? 'left-[22px]' : 'left-0.5'}`} />
              </button>
            </div>
          </div>

          {/* Personal flight cap (low-stake rounds) */}
          {myBet?.capMultiplier && (
            <p className="mt-2 rounded-xl bg-orange-500/10 px-3 py-2 text-center text-xs font-bold text-orange-400">
              {t('This round is capped at')} x{Number(myBet.capMultiplier).toFixed(2)}
            </p>
          )}

          {/* Main action */}
          {canCashout && myActiveBet ? (
            <button
              type="button"
              onClick={() => void doCashout()}
              disabled={busy}
              className="mt-3 w-full rounded-2xl bg-emerald-500 py-4 text-base font-black text-white shadow-[0_8px_24px_rgba(16,185,129,0.35)] transition active:scale-[0.98] disabled:opacity-60"
            >
              {t('Cash out')} · {myActiveBet.currency === 'STARS' ? (
                <span className="inline-flex items-center gap-1">{myLivePayout} <StarIcon size={16} /></span>
              ) : (
                <>{myLivePayout} GRAM</>
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => void doBet()}
              disabled={!canBet}
              className="mt-3 w-full rounded-2xl bg-blue-600 py-4 text-base font-black text-white shadow-[0_8px_24px_rgba(37,99,235,0.4)] transition active:scale-[0.98] disabled:opacity-40"
            >
              {myBet ? (
                t('Bet placed · waiting for take-off')
              ) : phase === 'CRASHED' ? (
                t('Next round soon')
              ) : phase === 'FLYING' ? (
                t('Round in flight · next round after crash')
              ) : (
                <span className="inline-flex items-center justify-center gap-1.5">
                  {t('Bet')} {stake} {currency === 'STARS' ? <StarIcon size={16} /> : 'GRAM'}
                </span>
              )}
            </button>
          )}

          {error && <p role="alert" className="mt-2 rounded-xl bg-red-500/10 px-3 py-2 text-center text-xs font-semibold text-red-400">{error}</p>}

          {/* Players */}
          <div className="mt-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">
              {t('Players')} ({players.length})
            </p>
            <div className="mt-2 max-h-40 space-y-1.5 overflow-y-auto [scrollbar-width:none]">
              {players.length === 0 && <p className="py-2 text-center text-xs text-slate-600">{t('No bets in this round yet')}</p>}
              {players.map((player, index) => (
                <div key={`${player.name}-${index}`} className="flex items-center gap-2.5 rounded-xl bg-white/[0.03] px-2.5 py-2">
                  {player.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={player.photoUrl} alt="" className="h-7 w-7 shrink-0 rounded-full object-cover" />
                  ) : (
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold">{player.name.slice(0, 1).toUpperCase()}</span>
                  )}
                  <span className="min-w-0 flex-1 truncate text-xs font-semibold text-slate-200">{player.name}</span>
                  {player.status === 'CASHED_OUT' && (
                    <span className="flex shrink-0 items-center gap-1 text-xs font-bold tabular-nums text-emerald-400">
                      x{player.cashoutMultiplier} · {player.currency === 'STARS' ? formatStars(player.payoutStars) : formatGramShort(player.payoutGram)}
                      {player.currency === 'STARS' ? <StarIcon size={11} /> : <GramIcon size={11} />}
                    </span>
                  )}
                  {player.status === 'LOST' && (
                    <span className="shrink-0 text-xs font-bold text-red-400/80">
                      {player.capMultiplier ? `MAX x${Number(player.capMultiplier).toFixed(2)}` : <>{t('Crashed')} x{round?.crashMultiplier ?? '—'}</>}
                    </span>
                  )}
                  {player.status === 'ACTIVE' && (
                    <span className="flex shrink-0 items-center gap-1.5">
                      {player.capMultiplier && <span className="text-[10px] font-bold tabular-nums text-orange-400">MAX x{Number(player.capMultiplier).toFixed(2)}</span>}
                      <span className="rush-live-dot rounded-full bg-amber-400" />
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <BotDepositDialog open={depositOpen} configured={depositConfigured} onClose={() => setDepositOpen(false)} onConfirmed={() => void refresh()} />
    </main>
  );
}
