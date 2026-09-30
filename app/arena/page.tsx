'use client';

import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import BottomNav from '../../components/BottomNav';
import GramIcon from '../../components/GramIcon';
import OrbitWordmark from '../../components/OrbitWordmark';
import TonBalanceBadge from '../../components/TonBalanceBadge';
import { useOrbitLanguage } from '../../components/OrbitLanguageContext';
import { getTelegramInitData } from '../../lib/telegram';
import {
  answerPvpInvitation,
  createPvpRoom,
  getPvpInvitations,
  getPvpRoom,
  getPublicArenaRooms,
  joinPublicArena,
  joinPvpRoom,
  searchPvpUsers,
  startPvpRound,
  type PvpInvitation,
  type PvpPlayer,
  type PvpRoom,
} from '../../lib/api';

function nameOf(player?: PvpPlayer | null) {
  return player?.username ? `@${player.username}` : player?.firstName || 'Player';
}

function formatGram(value: string | number) {
  return Number(value).toFixed(9).replace(/0+$/, '').replace(/\.$/, '');
}

type RollPhase = 'idle' | 'flying' | 'zooming' | 'result';
type ArenaPolygon = ArenaPoint[];
type WeightedTile = { id: string; player: PvpRoom['participants'][number]; x: number; y: number; width: number; height: number; polygon: ArenaPolygon };
type ArenaPoint = { x: number; y: number };
type ArenaMotion = { start: ArenaPoint; target: ArenaPoint; frames: Keyframe[] };

function polygonArea(polygon: ArenaPolygon) {
  return Math.abs(polygon.reduce((sum, point, index) => {
    const next = polygon[(index + 1) % polygon.length];
    return sum + point.x * next.y - next.x * point.y;
  }, 0)) / 2;
}

function clipPolygon(polygon: ArenaPolygon, nx: number, ny: number, threshold: number, keepBelow: boolean): ArenaPolygon {
  const output: ArenaPolygon = [];
  for (let i = 0; i < polygon.length; i++) {
    const current = polygon[i];
    const next = polygon[(i + 1) % polygon.length];
    const currentValue = current.x * nx + current.y * ny - threshold;
    const nextValue = next.x * nx + next.y * ny - threshold;
    const currentInside = keepBelow ? currentValue <= 1e-8 : currentValue >= -1e-8;
    const nextInside = keepBelow ? nextValue <= 1e-8 : nextValue >= -1e-8;
    if (currentInside) output.push(current);
    if (currentInside !== nextInside) {
      const ratio = currentValue / (currentValue - nextValue);
      output.push({ x: current.x + (next.x - current.x) * ratio, y: current.y + (next.y - current.y) * ratio });
    }
  }
  return output;
}

function splitPolygon(polygon: ArenaPolygon, ratio: number, angle: number): [ArenaPolygon, ArenaPolygon] {
  const nx = Math.cos(angle);
  const ny = Math.sin(angle);
  const projections = polygon.map(({ x, y }) => x * nx + y * ny);
  let low = Math.min(...projections);
  let high = Math.max(...projections);
  const targetArea = polygonArea(polygon) * ratio;
  for (let i = 0; i < 28; i++) {
    const middle = (low + high) / 2;
    if (polygonArea(clipPolygon(polygon, nx, ny, middle, true)) < targetArea) low = middle;
    else high = middle;
  }
  const cut = (low + high) / 2;
  return [clipPolygon(polygon, nx, ny, cut, true), clipPolygon(polygon, nx, ny, cut, false)];
}

function makeWeightedTiles(players: PvpRoom['participants']): WeightedTile[] {
  if (!players.length) return [];
  const amount = (player: PvpRoom['participants'][number]) => Math.max(0, Number(player.stakeGram));
  let seed = players.reduce((value, player) => [...player.id].reduce((hash, char) => (hash * 31 + char.charCodeAt(0)) >>> 0, value), 2166136261);
  const nextRandom = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 0x100000000; };
  const split = (items: typeof players, polygon: ArenaPolygon, depth: number): WeightedTile[] => {
    const xs = polygon.map(({ x }) => x);
    const ys = polygon.map(({ y }) => y);
    const x = Math.min(...xs); const y = Math.min(...ys);
    const width = Math.max(...xs) - x; const height = Math.max(...ys) - y;
    if (items.length === 1) return [{ id: items[0].id, player: items[0], x, y, width, height, polygon }];
    const total = items.reduce((sum, player) => sum + amount(player), 0) || items.length;
    let running = 0;
    let splitAt = 1;
    let closest = Infinity;
    for (let i = 1; i < items.length; i++) {
      running += amount(items[i - 1]) || 1;
      const distance = Math.abs(total / 2 - running);
      if (distance < closest) { closest = distance; splitAt = i; }
    }
    const first = items.slice(0, splitAt);
    const rest = items.slice(splitAt);
    const firstTotal = first.reduce((sum, player) => sum + (amount(player) || 1), 0);
    const ratio = firstTotal / total;
    const angles = [0, Math.PI / 2, Math.PI / 4, -Math.PI / 4, Math.PI / 3, -Math.PI / 3];
    const [firstPolygon, restPolygon] = splitPolygon(polygon, ratio, angles[Math.floor(nextRandom() * angles.length)]);
    return [...split(first, firstPolygon, depth + 1), ...split(rest, restPolygon, depth + 2)];
  };
  return split(players, [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 100 }, { x: 0, y: 100 }], 0);
}

function tileClipPath(tile: WeightedTile) {
  const points = tile.polygon.map(({ x, y }) => `${((x - tile.x) / tile.width) * 100}% ${((y - tile.y) / tile.height) * 100}%`);
  return `polygon(${points.join(', ')})`;
}

function foldArenaAxis(value: number) {
  const wrapped = ((value % 200) + 200) % 200;
  return wrapped <= 100 ? wrapped : 200 - wrapped;
}

function chooseBouncingDestination(start: number, target: number) {
  const possible: number[] = [];
  for (let cell = -8; cell <= 8; cell++) {
    for (const point of [target + cell * 200, 200 - target + cell * 200]) {
      const crossings = Math.abs(Math.floor(point / 100) - Math.floor(start / 100));
      if (crossings >= 4 && crossings <= 9) possible.push(point);
    }
  }
  return possible[Math.floor(Math.random() * possible.length)] ?? target + (target >= start ? 600 : -600);
}

function makeArenaMotion(tile: WeightedTile): ArenaMotion {
  const insetX = Math.min(tile.width * 0.28, 4);
  const insetY = Math.min(tile.height * 0.28, 4);
  const target = {
    x: tile.x + insetX + Math.random() * Math.max(tile.width - insetX * 2, 0),
    y: tile.y + insetY + Math.random() * Math.max(tile.height - insetY * 2, 0),
  };
  const start = { x: 8 + Math.random() * 84, y: 8 + Math.random() * 84 };
  const endX = chooseBouncingDestination(start.x, target.x);
  const endY = chooseBouncingDestination(start.y, target.y);
  const frameCount = 72;
  const frames = Array.from({ length: frameCount }, (_, index): Keyframe => {
    const progress = index / (frameCount - 1);
    // Fast launch, then a gradual and readable slowdown.
    const eased = 1 - Math.pow(1 - progress, 3.2);
    return {
      left: `${foldArenaAxis(start.x + (endX - start.x) * eased)}%`,
      top: `${foldArenaAxis(start.y + (endY - start.y) * eased)}%`,
      offset: progress,
    };
  });
  return { start, target, frames };
}

function SquareRoom({ room, rollingSeconds, onShare, copied, onJoin, busy, stake, setStake, onEnter, rollPhase, t }: {
  room: PvpRoom | null; rollingSeconds: number | null; onShare: () => void; copied: boolean;
  onJoin: () => void;
  busy: boolean; stake: string; setStake: (stake: string) => void; onEnter: () => void;
  rollPhase: RollPhase; t: (key: string) => string;
}) {
  const participants = room?.participants ?? [];
  const tiles = makeWeightedTiles(participants);
  const totalStake = participants.reduce((sum, player) => sum + Number(player.stakeGram), 0);
  const winnerTile = tiles.find(({ player }) => player.userId === room?.winnerId);
  const pot = room ? Number(room.stakeGram) * (room.isPublic ? 1 : Math.max(1, participants.length)) : 0;
  const [ballMotion, setBallMotion] = useState<ArenaMotion | null>(null);
  const ballRef = useRef<HTMLDivElement | null>(null);
  const zoomPoint = ballMotion?.target ?? (winnerTile ? { x: winnerTile.x + winnerTile.width / 2, y: winnerTile.y + winnerTile.height / 2 } : null);
  const zoomStyle = zoomPoint ? { '--zoom-x': `${zoomPoint.x}%`, '--zoom-y': `${zoomPoint.y}%` } as CSSProperties : undefined;
  const isCompleted = room?.status === 'COMPLETED';

  useEffect(() => {
    if (rollPhase === 'idle' || !winnerTile) {
      if (ballMotion) setBallMotion(null);
      return;
    }
    if (rollPhase !== 'flying' || ballMotion) return;
    setBallMotion(makeArenaMotion(winnerTile));
  }, [ballMotion, rollPhase, room?.id, winnerTile?.id, winnerTile?.x, winnerTile?.y, winnerTile?.width, winnerTile?.height]);

  useEffect(() => {
    const ball = ballRef.current;
    if (!ballMotion || !ball) return;
    ball.style.left = `${ballMotion.start.x}%`;
    ball.style.top = `${ballMotion.start.y}%`;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      ball.style.left = `${ballMotion.target.x}%`;
      ball.style.top = `${ballMotion.target.y}%`;
      return;
    }
    const animation = ball.animate(ballMotion.frames, { duration: 7000, easing: 'linear', fill: 'forwards' });
    animation.onfinish = () => {
      ball.style.left = `${ballMotion.target.x}%`;
      ball.style.top = `${ballMotion.target.y}%`;
    };
    return () => animation.cancel();
  }, [ballMotion]);

  return (
    <section className="arena-room-shell overflow-hidden rounded-[28px] border border-blue-100 bg-white shadow-[0_12px_34px_rgba(21,87,213,.09)]">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[11px] font-extrabold text-blue-700">01</span>
          <div className="min-w-0"><p className="text-[9px] font-bold uppercase tracking-[.17em] text-slate-400">{t('ROOM 01 · CLASSIC')}</p><h2 className="truncate text-sm font-bold text-blue-950">{t('Portals Arena')}</h2></div>
        </div>
        <div className="flex items-center gap-2">{room && <button onClick={onShare} className="shrink-0 rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-[10px] font-bold text-blue-700">{copied ? t('Link copied') : t('Share room')} ↗</button>}</div>
      </div>

      <div className="p-4">
        <div className="mb-3 flex items-end justify-between gap-3">
          <div><p className="text-[9px] font-bold uppercase tracking-[.15em] text-slate-400">{t('POT')}</p><p className="mt-1 inline-flex items-center text-lg font-extrabold text-blue-950"><GramIcon size={19} className="mr-1.5 text-blue-600" />{room ? formatGram(pot) : '0'} <span className="ml-1 text-xs font-bold text-blue-700">GRAM</span></p></div>
          <div className="text-right"><p className="text-[9px] font-semibold uppercase tracking-wide text-slate-400">{t('PLAYERS')}</p><p className="text-sm font-extrabold text-slate-700">{participants.length}</p></div>
        </div>

        <div className={`arena-bet-board relative aspect-square overflow-hidden rounded-[22px] border border-blue-100 bg-[#f5f8ff] ${rollPhase === 'flying' ? 'is-flying' : ''} ${rollPhase === 'zooming' ? 'is-zooming' : ''}`} style={zoomStyle} aria-label={t('Arena player squares')}>
          {tiles.length ? tiles.map(({ id, player, x, y, width, height }, index) => {
            const isWinner = isCompleted && room?.winnerId === player.userId && (rollPhase === 'zooming' || rollPhase === 'result');
            const chance = totalStake > 0 ? Number(player.stakeGram) / totalStake * 100 : 0;
            const palette = ['#1557d5', '#f4bf28', '#e8505b', '#e7efff', '#163362'];
            const darkText = index === 1 || index === 3;
            return <div key={id} className={`arena-bet-tile ${isWinner ? 'is-winner' : ''}`} style={{ left: `${x}%`, top: `${y}%`, width: `${width}%`, height: `${height}%`, clipPath: tileClipPath({ id, player, x, y, width, height, polygon: tiles[index].polygon }), backgroundColor: palette[index % palette.length], color: darkText ? '#14294b' : '#fff', animationDelay: `${index * 90}ms` }}>
              {player.user.photoUrl && <img src={player.user.photoUrl} alt="" className="arena-bet-avatar" />}
              <span className="arena-bet-name">{nameOf(player.user)}</span>
              <span className="arena-bet-amount">{formatGram(player.stakeGram)} GRAM · {chance < 0.01 ? '<0.01%' : `${chance.toFixed(chance < 1 ? 2 : 1)}%`}</span>
            </div>;
          }) : <div className="absolute inset-0 flex flex-col items-center justify-center px-8 text-center"><p className="text-sm font-semibold text-blue-950">{t('Arena square is open')}</p><p className="mt-1 text-[11px] text-slate-500">{t('Choose your stake to enter')}</p></div>}
          {ballMotion && (rollPhase === 'flying' || rollPhase === 'zooming') && <div ref={ballRef} className="arena-bouncing-orb" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="7.5"/><path d="M12 1.8v4M12 18.2v4M1.8 12h4M18.2 12h4"/><circle cx="12" cy="12" r="1.8" className="arena-orb-core"/></svg></div>}
        </div>

        {(!room || room.isPublic) && <div className="mt-3 flex items-center gap-2 rounded-2xl border border-slate-200 bg-white p-1.5 pl-3">
          <GramIcon size={18} className="shrink-0 text-blue-600" />
          <input aria-label={t('Your stake')} inputMode="decimal" value={stake} onChange={(event) => setStake(event.target.value)} className="min-w-0 flex-1 border-0 bg-transparent py-2 text-base font-bold text-slate-800 outline-none" placeholder="1" />
          <span className="text-[10px] font-bold text-blue-700">GRAM</span>
          <button disabled={busy || !stake || Number(stake) <= 0 || rollPhase !== 'idle' || (room?.status === 'COUNTDOWN' && room.viewerIsParticipant)} onClick={onEnter} className="shrink-0 rounded-xl bg-blue-700 px-4 py-3 text-[10px] font-bold text-white disabled:opacity-50">{busy ? t('Joining…') : t('Join')}</button>
        </div>}
        {(!room || room.isPublic) && <p className="mt-2 text-center text-[10px] text-slate-500">{t('Your square size and win chance match your stake.')} · {t('DEMO · NO PAYMENT')}</p>}
        {room?.isPublic === false && !room.viewerIsParticipant && room.status === 'WAITING' && <button onClick={onJoin} disabled={busy} className="mt-3 w-full rounded-xl bg-blue-700 py-3 text-xs font-bold text-white disabled:opacity-50">{busy ? t('Joining…') : t('Join private room')} · {formatGram(room.stakeGram)} GRAM</button>}

        {(!room || room.status === 'WAITING') && <div className="mt-3 flex items-center justify-center gap-2 rounded-xl bg-slate-50 py-2.5 text-center"><span className="h-2 w-2 animate-pulse rounded-full bg-blue-500"/><p className="text-[10px] font-semibold text-slate-600">{!room ? t('Waiting for players') : participants.length < 2 ? t('Waiting for one more player') : t('Waiting for players')}</p></div>}
        {room?.status === 'COUNTDOWN' && rollingSeconds !== null && <div className="arena-countdown-wrap mt-3 flex items-center justify-between rounded-2xl border border-blue-100 bg-blue-50/70 px-4 py-3"><div><p className="text-[9px] font-bold uppercase tracking-[.16em] text-blue-500">{t('ROUND STARTS IN')}</p><p className="mt-1 text-xs font-bold text-blue-950">{t('Players are locked in')}</p></div><div className="arena-countdown-number flex h-14 w-14 items-center justify-center rounded-full border-[3px] border-blue-600 bg-white text-2xl font-black tabular-nums text-blue-700">{rollingSeconds}</div></div>}
        {isCompleted && <p className="mt-3 text-center text-[10px] font-semibold text-slate-500">{t('Round complete')} · {t('Winner')}: {nameOf(room.winner)}</p>}
      </div>
    </section>
  );
}

export default function ArenaPage() {
  const { t } = useOrbitLanguage();
  const [initData, setInitData] = useState('');
  const [authReady, setAuthReady] = useState(false);
  const [publicRooms, setPublicRooms] = useState<PvpRoom[]>([]);
  const [activeRoom, setActiveRoom] = useState<PvpRoom | null>(null);
  const [invitations, setInvitations] = useState<PvpInvitation[]>([]);
  const [stake, setStake] = useState('1');
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<PvpPlayer[]>([]);
  const [selectedPlayers, setSelectedPlayers] = useState<PvpPlayer[]>([]);
  const [privateRoomOpen, setPrivateRoomOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [rollPhase, setRollPhase] = useState<RollPhase>('idle');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const activeRoomRef = useRef<PvpRoom | null>(null);
  const refreshBusy = useRef(false);
  const setRoom = useCallback((room: PvpRoom | null) => { activeRoomRef.current = room; setActiveRoom(room); }, []);

  useEffect(() => {
    const current = getTelegramInitData();
    if (current) { setInitData(current); setAuthReady(true); return; }
    const timer = window.setInterval(() => {
      const next = getTelegramInitData();
      if (next) { setInitData(next); setAuthReady(true); window.clearInterval(timer); }
    }, 250);
    const timeout = window.setTimeout(() => setAuthReady(true), 5000);
    return () => { window.clearInterval(timer); window.clearTimeout(timeout); };
  }, []);

  useEffect(() => {
    if (!initData) return;
    let cancelled = false;
    const refresh = async () => {
      if (refreshBusy.current) return;
      refreshBusy.current = true;
      try {
        const [rooms, nextInvitations] = await Promise.all([getPublicArenaRooms(initData), getPvpInvitations(initData)]);
        if (cancelled) return;
        setPublicRooms(rooms);
        setInvitations(nextInvitations);
        const current = activeRoomRef.current;
        if (current?.isPublic) {
          const updated = rooms.find(({ id }) => id === current.id);
          const openTable = rooms.find((room) => room.isPublic && (room.status === 'WAITING' || room.status === 'COUNTDOWN'));
          if (current.status === 'COMPLETED' && rollPhase === 'idle' && openTable && openTable.id !== current.id) setRoom(openTable);
          else if (updated) setRoom(updated);
          else if (current.status === 'COMPLETED') setRoom(null);
          else setRoom(await getPvpRoom(current.code, initData));
        } else if (current) {
          setRoom(await getPvpRoom(current.code, initData));
        } else {
          const joined = rooms.find((room) => room.viewerIsParticipant && (room.status === 'WAITING' || room.status === 'COUNTDOWN'));
          if (joined) { setRoom(joined); if (joined.viewerStakeGram) setStake(joined.viewerStakeGram); }
          else {
            const inviteCode = new URLSearchParams(window.location.search).get('room');
            if (inviteCode) setRoom(await getPvpRoom(inviteCode, initData));
            else {
              const openTable = rooms.find((room) => room.isPublic && (room.status === 'WAITING' || room.status === 'COUNTDOWN'));
              if (openTable) setRoom(openTable);
              else {
                setRoom(null);
              }
            }
          }
        }
      } catch (cause) {
        if (!cancelled && !activeRoomRef.current) setError(cause instanceof Error ? cause.message : t('Arena could not load'));
      } finally { refreshBusy.current = false; }
    };
    void refresh();
    const interval = window.setInterval(() => { void refresh(); }, 1500);
    return () => { cancelled = true; window.clearInterval(interval); };
  }, [initData, rollPhase, setRoom, t]);

  useEffect(() => {
    if (activeRoom?.status !== 'COUNTDOWN') return;
    const timer = window.setInterval(() => setNow(Date.now()), 200);
    return () => window.clearInterval(timer);
  }, [activeRoom?.status, activeRoom?.countdownEndsAt]);

  useEffect(() => {
    if (activeRoom?.status !== 'COMPLETED') return;
    setRollPhase('flying');
    const zoomTimer = window.setTimeout(() => setRollPhase('zooming'), 6100);
    const resultTimer = window.setTimeout(() => setRollPhase('result'), 7200);
    const resetTimer = window.setTimeout(() => {
      setRollPhase('idle');
      setRoom(null);
      window.history.replaceState(null, '', '/arena');
    }, 9900);
    return () => { window.clearTimeout(zoomTimer); window.clearTimeout(resultTimer); window.clearTimeout(resetTimer); };
  }, [activeRoom?.id, activeRoom?.status, setRoom]);

  useEffect(() => {
    if (!privateRoomOpen || !initData || query.trim().replace(/^@/, '').length < 2) { setSearchResults([]); return; }
    let cancelled = false;
    const timer = window.setTimeout(() => searchPvpUsers(query.trim(), initData).then((users) => { if (!cancelled) setSearchResults(users); }).catch((cause) => { if (!cancelled) setError(cause instanceof Error ? cause.message : t('Search failed')); }), 250);
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, [initData, privateRoomOpen, query, t]);

  const countdown = activeRoom?.countdownEndsAt ? Math.max(0, Math.ceil((Date.parse(activeRoom.countdownEndsAt) - now) / 1000)) : null;
  const joinPublic = async (value: string) => {
    if (!initData) return;
    setBusy(true); setError('');
    try {
      const room = await joinPublicArena(value, initData);
      setRoom(room); setStake(room.viewerStakeGram ?? value); setRollPhase('idle');
      window.history.replaceState(null, '', `/arena?room=${encodeURIComponent(room.code)}`);
    } catch (cause) { setError(cause instanceof Error ? cause.message : t('Could not join room')); }
    finally { setBusy(false); }
  };

  const joinExactRoom = async (room: PvpRoom) => {
    if (!initData) return;
    setBusy(true); setError('');
    try {
      const joined = room.isPublic ? await joinPublicArena(stake, initData) : await joinPvpRoom(room.code, initData);
      setRoom(joined); setStake(joined.viewerStakeGram ?? (joined.isPublic ? stake : joined.stakeGram)); setRollPhase('idle');
      window.history.replaceState(null, '', `/arena?room=${encodeURIComponent(joined.code)}`);
    } catch (cause) { setError(cause instanceof Error ? cause.message : t('Could not join room')); }
    finally { setBusy(false); }
  };

  const answerInvite = async (invitation: PvpInvitation, accept: boolean) => {
    if (!initData) return;
    setBusy(true); setError('');
    try {
      const room = await answerPvpInvitation(invitation.id, accept, initData);
      setInvitations((items) => items.filter(({ id }) => id !== invitation.id));
      if (accept) { setRoom(room); setRollPhase('idle'); window.history.replaceState(null, '', `/arena?room=${encodeURIComponent(room.code)}`); }
    } catch (cause) { setError(cause instanceof Error ? cause.message : t('Could not answer invitation')); }
    finally { setBusy(false); }
  };

  const createPrivateRoom = async () => {
    if (!initData) return;
    setBusy(true); setError('');
    try {
      const room = await createPvpRoom(stake, selectedPlayers.map(({ id }) => id), initData);
      setRoom(room); setRollPhase('idle'); setSelectedPlayers([]); setQuery(''); setPrivateRoomOpen(false);
      window.history.replaceState(null, '', `/arena?room=${encodeURIComponent(room.code)}`);
    } catch (cause) { setError(cause instanceof Error ? cause.message : t('Could not create room')); }
    finally { setBusy(false); }
  };

  const startPrivateRound = async () => {
    if (!initData || !activeRoom) return;
    setBusy(true); setError('');
    try { setRoom(await startPvpRound(activeRoom.code, initData)); }
    catch (cause) { setError(cause instanceof Error ? cause.message : t('Could not start round')); }
    finally { setBusy(false); }
  };

  const shareRoom = async (room = activeRoom) => {
    if (!room) return;
    const link = `${window.location.origin}/arena?room=${room.code}`;
    try {
      if (navigator.share) await navigator.share({ title: 'ORBIT Arena', url: link });
      else await navigator.clipboard.writeText(link);
      setCopied(true); window.setTimeout(() => setCopied(false), 1600);
    } catch { setError(t('Could not share room')); }
  };

  const togglePlayer = (player: PvpPlayer) => setSelectedPlayers((items) => items.some(({ id }) => id === player.id) ? items.filter(({ id }) => id !== player.id) : [...items, player]);

  return (
    <main className="min-h-screen bg-[#f5f8ff] text-slate-900">
      <div className="mx-auto min-h-screen max-w-[480px] px-4 pb-28">
        <header className="flex items-center justify-between gap-3 py-4">
          <div><OrbitWordmark /><h1 className="mt-1 text-2xl font-bold tracking-tight text-blue-950">{t('Arena')}</h1></div>
          <div className="flex shrink-0 flex-col items-end gap-1.5"><TonBalanceBadge /><span className="rounded-full bg-yellow-50 px-2 py-0.5 text-[8px] font-bold uppercase tracking-wide text-yellow-800">{t('DEMO')}</span></div>
        </header>

        {!authReady ? <section className="rounded-3xl border border-blue-100 bg-white p-5 text-center text-sm text-slate-500">{t('Connecting to Telegram…')}</section> : !initData ? <section className="rounded-3xl border border-blue-100 bg-white p-5 text-center"><p className="font-semibold text-slate-800">{t('Open ORBIT inside Telegram')}</p><p className="mt-2 text-xs text-slate-500">{t('Telegram sign-in is needed for shared rooms and invitations.')}</p></section> : <>
          {error && <div role="alert" className="mb-3 rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}<button className="float-right font-bold" onClick={() => setError('')} aria-label={t('Close')}>×</button></div>}
          {invitations.length > 0 && <section className="mb-3 rounded-2xl border border-blue-100 bg-white p-3"><div className="mb-2 flex items-center justify-between"><h2 className="text-xs font-bold text-blue-950">{t('Arena invitations')}</h2><span className="rounded-full bg-blue-50 px-2 py-1 text-[9px] font-bold text-blue-700">{invitations.length}</span></div><div className="space-y-2">{invitations.map((invite) => <div key={invite.id} className="flex items-center gap-2 rounded-xl bg-slate-50 p-2"><span className="min-w-0 flex-1 truncate text-[10px] font-semibold text-slate-700">{nameOf(invite.sender)} · {invite.room.stakeGram} GRAM</span><button disabled={busy} onClick={() => void answerInvite(invite, true)} className="rounded-lg bg-blue-700 px-2.5 py-1.5 text-[9px] font-bold text-white">{t('Join')}</button><button disabled={busy} onClick={() => void answerInvite(invite, false)} className="rounded-lg bg-slate-200 px-2 py-1.5 text-[9px] font-bold text-slate-500">×</button></div>)}</div></section>}

          <SquareRoom room={activeRoom} rollingSeconds={countdown} onShare={() => void shareRoom()} copied={copied} onJoin={() => activeRoom && void joinExactRoom(activeRoom)} busy={busy} stake={stake} setStake={setStake} onEnter={() => void joinPublic(stake)} rollPhase={rollPhase} t={t} />

          {activeRoom?.isPublic === false && activeRoom.status === 'WAITING' && activeRoom.viewerIsCreator && <section className="mt-3 rounded-2xl border border-blue-100 bg-white p-3"><p className="mb-2 text-center text-[10px] text-slate-500">{t('Waiting for invited players to accept.')}</p><button disabled={busy || activeRoom.participants.length < 2} onClick={() => void startPrivateRound()} className="w-full rounded-xl bg-blue-700 py-2.5 text-xs font-bold text-white disabled:bg-slate-300">{t('Start demo round')}</button></section>}

          <div className="mt-3 text-center"><button onClick={() => setPrivateRoomOpen((open) => !open)} className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-slate-500"><span aria-hidden="true">↗</span>{t('Custom room by link')}</button></div>
          {privateRoomOpen && <section className="mt-2 rounded-2xl border border-slate-200 bg-white p-3">
            <h2 className="text-xs font-bold text-blue-950">{t('Create a private room')}</h2><p className="mt-1 text-[10px] text-slate-500">{t('Invite selected friends. They will receive a private room link.')}</p>
            <div className="relative mt-3"><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t('Search username…')} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-800 outline-none focus:border-blue-400"/>{searchResults.length > 0 && <div className="absolute inset-x-0 top-[calc(100%+4px)] z-20 max-h-40 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1 shadow-xl">{searchResults.map((player) => <button key={player.id} onClick={() => { togglePlayer(player); setQuery(''); setSearchResults([]); }} className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs hover:bg-blue-50"><span>{nameOf(player)}</span><span className="text-blue-600">{selectedPlayers.some(({ id }) => id === player.id) ? '✓' : '+'}</span></button>)}</div>}</div>
            {selectedPlayers.length > 0 && <div className="my-2 flex flex-wrap gap-1">{selectedPlayers.map((player) => <button key={player.id} onClick={() => togglePlayer(player)} className="rounded-full bg-blue-50 px-2 py-1 text-[9px] font-semibold text-blue-700">{nameOf(player)} ×</button>)}</div>}
            <div className="mt-3 flex gap-2"><button disabled={busy} onClick={() => void createPrivateRoom()} className="flex-1 rounded-xl bg-slate-900 py-2.5 text-[10px] font-bold text-white">{busy ? t('Creating room…') : t('Create private room link')}</button><button onClick={() => setPrivateRoomOpen(false)} className="rounded-xl bg-slate-100 px-3 text-[10px] font-semibold text-slate-500">{t('Close')}</button></div>
          </section>}
        </>}
        {rollPhase === 'result' && activeRoom?.status === 'COMPLETED' && <div className="arena-result-backdrop fixed inset-0 z-50 flex items-center justify-center p-5" role="dialog" aria-modal="true" aria-labelledby="arena-result-title">
          <section className="arena-result-modal w-full max-w-[340px] rounded-[28px] border border-yellow-300 bg-white p-6 text-center shadow-2xl">
            <p className="text-[10px] font-bold uppercase tracking-[.2em] text-yellow-700">{t('ARENA WINNER')}</p>
            {activeRoom.winner?.photoUrl && <img src={activeRoom.winner.photoUrl} alt="" className="mx-auto mt-4 h-20 w-20 rounded-full border-4 border-yellow-300 object-cover" />}
            <h2 id="arena-result-title" className="mt-3 text-2xl font-black text-blue-950">{nameOf(activeRoom.winner)}</h2>
            <p className="mt-3 inline-flex items-center text-lg font-extrabold text-blue-900"><GramIcon size={20} className="mr-2 text-blue-600" />{formatGram(activeRoom.isPublic ? activeRoom.stakeGram : Number(activeRoom.stakeGram) * activeRoom.participants.length)} GRAM</p>
            <p className="mt-1 text-[10px] text-slate-500">{t('Demo result only. Nothing was transferred.')}</p>
            <button onClick={() => setRollPhase('idle')} className="mt-5 w-full rounded-2xl bg-blue-700 py-3 text-sm font-bold text-white">{t('Continue')}</button>
          </section>
        </div>}
        <BottomNav active="pvp" />
      </div>
    </main>
  );
}
