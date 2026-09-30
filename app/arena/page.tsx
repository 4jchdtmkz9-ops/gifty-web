'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import BottomNav from '../../components/BottomNav';
import GramIcon from '../../components/GramIcon';
import OrbitWordmark from '../../components/OrbitWordmark';
import TonBalanceBadge from '../../components/TonBalanceBadge';
import ArenaIcon from '../../components/ArenaIcon';
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

function SquareRoom({ room, rollingSeconds, onShare, copied, onJoin, busy, stake, setStake, onEnter, t }: {
  room: PvpRoom | null; rollingSeconds: number | null; onShare: () => void; copied: boolean;
  onJoin: () => void; busy: boolean; stake: string; setStake: (stake: string) => void;
  onEnter: () => void; t: (key: string) => string;
}) {
  const participants = room?.participants ?? [];
  const count = Math.max(6, participants.length);
  const completed = room?.status === 'COMPLETED';

  return (
    <section className="arena-room-shell overflow-hidden rounded-[28px] border border-blue-100 bg-white shadow-[0_12px_34px_rgba(21,87,213,.09)]">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700"><ArenaIcon size={21} /></span>
          <div className="min-w-0"><p className="text-[9px] font-bold uppercase tracking-[.17em] text-slate-400">{t('ROOM 01 · CLASSIC')}</p><h2 className="truncate text-sm font-bold text-blue-950">{t('Portals Arena')}</h2></div>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-lg border border-slate-100 px-2 py-1.5 text-[9px] font-semibold text-slate-400">{t('Gates Room')}</span>
          {room && <button onClick={onShare} className="shrink-0 rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-[10px] font-bold text-blue-700">{copied ? t('Link copied') : t('Share room')} ↗</button>}
        </div>
      </div>

      <div className="p-4">
        <div className="mb-3 flex items-end justify-between gap-3">
          <div><p className="text-[9px] font-bold uppercase tracking-[.15em] text-slate-400">{t('STAKE')}</p><p className="mt-1 inline-flex items-center text-lg font-extrabold text-blue-950"><GramIcon size={19} className="mr-1.5 text-blue-600" />{room?.stakeGram ?? '—'} <span className="ml-1 text-xs font-bold text-blue-700">GRAM</span></p></div>
          <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-emerald-500"/><span className="text-[10px] font-semibold text-slate-500">{room?.status === 'COUNTDOWN' ? t('ROUND STARTS IN') : room?.status === 'COMPLETED' ? t('Finished') : t('WAITING FOR PLAYERS')}</span><span className="rounded-lg bg-slate-50 px-2.5 py-1.5 text-xs font-extrabold tabular-nums text-slate-700">{participants.length}</span></div>
        </div>

        <div className="arena-static-board grid grid-cols-3 gap-2" aria-label={t('Arena player squares')}>
          {Array.from({ length: count }, (_, index) => {
            const player = participants[index]?.user;
            const isWinner = Boolean(completed && room?.winnerId === participants[index]?.userId);
            return <div key={participants[index]?.id ?? `empty-${index}`} className={`arena-player-square relative flex aspect-square min-w-0 flex-col items-center justify-center overflow-hidden rounded-[18px] border ${player ? 'border-blue-100 bg-white' : 'border-dashed border-slate-200 bg-slate-50/80'} ${isWinner ? 'is-winner' : ''}`}>
              {player ? <>
                {player.photoUrl ? <img src={player.photoUrl} alt="" className={`mb-1.5 h-10 w-10 rounded-full border object-cover ${isWinner ? 'border-yellow-300' : 'border-blue-100'}`} /> : <span className={`mb-1.5 flex h-10 w-10 items-center justify-center rounded-full border text-sm font-bold ${isWinner ? 'border-yellow-300 bg-yellow-100 text-yellow-900' : 'border-blue-100 bg-blue-50 text-blue-700'}`}>{(player.firstName || player.username || 'P').slice(0, 1).toUpperCase()}</span>}
                <span className="max-w-full truncate px-1 text-center text-[10px] font-bold text-slate-700">{nameOf(player)}</span>
                {isWinner && <span className="absolute right-1.5 top-1.5 text-[13px]" aria-label={t('Winner')}>🏆</span>}
              </> : <><span className="text-xl font-light text-slate-300">＋</span><span className="mt-1 text-[9px] font-medium text-slate-400">{t('OPEN SLOT')}</span></>}
            </div>;
          })}
        </div>

        {!room && <div className="mt-3 rounded-xl bg-slate-50 px-3 py-2.5 text-center"><p className="text-[10px] font-medium text-slate-500">{t('Enter a stake below to take your square')}</p></div>}

        <div className="mt-3 flex items-center gap-2 rounded-2xl border border-slate-200 bg-white p-1.5 pl-3">
          <GramIcon size={18} className="shrink-0 text-blue-600" />
          <input aria-label={t('Stake per player')} inputMode="decimal" value={stake} onChange={(event) => setStake(event.target.value)} className="min-w-0 flex-1 border-0 bg-transparent py-2 text-base font-bold text-slate-800 outline-none" placeholder="1" />
          <span className="text-[10px] font-bold text-blue-700">GRAM</span>
          <button disabled={busy || !stake || Number(stake) <= 0} onClick={onEnter} className="shrink-0 rounded-xl bg-blue-700 px-4 py-3 text-[10px] font-bold text-white disabled:opacity-50">{busy ? t('Joining…') : t('Join')}</button>
        </div>

        {room?.status === 'WAITING' && <div className="mt-3 flex items-center justify-center gap-2 rounded-xl bg-slate-50 py-2.5 text-center"><span className="h-2 w-2 animate-pulse rounded-full bg-blue-500"/><p className="text-[10px] font-semibold text-slate-600">{participants.length < 2 ? t('Waiting for one more player') : t('Waiting for players')}</p></div>}
        {room?.status === 'COUNTDOWN' && rollingSeconds !== null && <div className="arena-countdown-wrap mt-3 flex items-center justify-between rounded-2xl border border-blue-100 bg-blue-50/70 px-4 py-3"><div><p className="text-[9px] font-bold uppercase tracking-[.16em] text-blue-500">{t('ROUND STARTS IN')}</p><p className="mt-1 text-xs font-bold text-blue-950">{t('Players are locked in')}</p></div><div className="arena-countdown-number flex h-14 w-14 items-center justify-center rounded-full border-[3px] border-blue-600 bg-white text-2xl font-black tabular-nums text-blue-700">{rollingSeconds}</div></div>}
        {completed && <div className="arena-win-card mt-3 rounded-2xl border border-yellow-200 bg-gradient-to-r from-yellow-50 via-white to-blue-50 px-4 py-4 text-center"><div className="arena-trophy mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100 text-2xl">🏆</div><p className="text-[9px] font-bold uppercase tracking-[.2em] text-yellow-700">{t('ARENA WINNER')}</p><p className="mt-1 text-lg font-black text-blue-950">{nameOf(room?.winner)}</p><p className="mt-1 inline-flex items-center text-xs font-semibold text-slate-600">{t('DEMO POT')} <GramIcon size={13} className="mx-1" />{(Number(room?.stakeGram ?? 0) * participants.length).toFixed(3)} GRAM</p><p className="mt-1 text-[9px] text-slate-400">{t('Demo result only. Nothing was transferred.')}</p></div>}

        {room && !room.viewerIsParticipant && room.status !== 'COMPLETED' && <button disabled={busy} onClick={onJoin} className="mt-3 w-full rounded-xl bg-blue-700 py-3 text-xs font-bold text-white disabled:opacity-50">{busy ? t('Joining…') : t('Take a square')} · {room.stakeGram} GRAM</button>}
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
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
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
          if (updated) setRoom(updated);
          else if (current.status !== 'COMPLETED') setRoom(await getPvpRoom(current.code, initData));
        } else if (current) {
          setRoom(await getPvpRoom(current.code, initData));
        } else {
          const joined = rooms.find((room) => room.viewerIsParticipant);
          if (joined) setRoom(joined);
          else {
            const inviteCode = new URLSearchParams(window.location.search).get('room');
            if (inviteCode) setRoom(await getPvpRoom(inviteCode, initData));
          }
        }
      } catch (cause) {
        if (!cancelled && !activeRoomRef.current) setError(cause instanceof Error ? cause.message : t('Arena could not load'));
      } finally { refreshBusy.current = false; }
    };
    void refresh();
    const interval = window.setInterval(() => { void refresh(); }, 1500);
    return () => { cancelled = true; window.clearInterval(interval); };
  }, [initData, setRoom, t]);

  useEffect(() => {
    if (activeRoom?.status !== 'COUNTDOWN') return;
    const timer = window.setInterval(() => setNow(Date.now()), 200);
    return () => window.clearInterval(timer);
  }, [activeRoom?.status, activeRoom?.countdownEndsAt]);

  useEffect(() => {
    if (!privateRoomOpen || !initData || query.trim().replace(/^@/, '').length < 2) { setSearchResults([]); return; }
    let cancelled = false;
    const timer = window.setTimeout(() => searchPvpUsers(query.trim(), initData).then((users) => { if (!cancelled) setSearchResults(users); }).catch((cause) => { if (!cancelled) setError(cause instanceof Error ? cause.message : t('Search failed')); }), 250);
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, [initData, privateRoomOpen, query, t]);

  const countdown = activeRoom?.countdownEndsAt ? Math.max(0, Math.ceil((Date.parse(activeRoom.countdownEndsAt) - now) / 1000)) : null;
  const joinPublic = async (value: string) => {
    if (!initData) return;
    setBusy(true); setError(''); setNotice('');
    try {
      const room = await joinPublicArena(value, initData);
      setRoom(room); setStake(room.stakeGram);
      window.history.replaceState(null, '', `/arena?room=${encodeURIComponent(room.code)}`);
      setNotice(t('You entered the public arena'));
    } catch (cause) { setError(cause instanceof Error ? cause.message : t('Could not join room')); }
    finally { setBusy(false); }
  };

  const joinExactRoom = async (room: PvpRoom) => {
    if (!initData) return;
    setBusy(true); setError('');
    try {
      const joined = room.isPublic ? await joinPublicArena(room.stakeGram, initData) : await joinPvpRoom(room.code, initData);
      setRoom(joined); setStake(joined.stakeGram);
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
      if (accept) { setRoom(room); window.history.replaceState(null, '', `/arena?room=${encodeURIComponent(room.code)}`); }
    } catch (cause) { setError(cause instanceof Error ? cause.message : t('Could not answer invitation')); }
    finally { setBusy(false); }
  };

  const createPrivateRoom = async () => {
    if (!initData) return;
    setBusy(true); setError('');
    try {
      const room = await createPvpRoom(stake, selectedPlayers.map(({ id }) => id), initData);
      setRoom(room); setSelectedPlayers([]); setQuery(''); setPrivateRoomOpen(false);
      window.history.replaceState(null, '', `/arena?room=${encodeURIComponent(room.code)}`);
      setNotice(t('Arena room created'));
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
          <div><OrbitWordmark /><h1 className="mt-1 flex items-center gap-2 text-2xl font-bold tracking-tight text-blue-950"><ArenaIcon size={24} />{t('Arena')}</h1></div>
          <div className="flex shrink-0 flex-col items-end gap-1.5"><TonBalanceBadge /><span className="rounded-full bg-yellow-50 px-2 py-0.5 text-[8px] font-bold uppercase tracking-wide text-yellow-800">{t('DEMO')}</span></div>
        </header>

        {!authReady ? <section className="rounded-3xl border border-blue-100 bg-white p-5 text-center text-sm text-slate-500">{t('Connecting to Telegram…')}</section> : !initData ? <section className="rounded-3xl border border-blue-100 bg-white p-5 text-center"><p className="font-semibold text-slate-800">{t('Open ORBIT inside Telegram')}</p><p className="mt-2 text-xs text-slate-500">{t('Telegram sign-in is needed for shared rooms and invitations.')}</p></section> : <>
          {error && <div role="alert" className="mb-3 rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}<button className="float-right font-bold" onClick={() => setError('')} aria-label={t('Close')}>×</button></div>}
          {notice && <div className="mb-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">{notice}</div>}

          {invitations.length > 0 && <section className="mb-3 rounded-2xl border border-blue-100 bg-white p-3"><div className="mb-2 flex items-center justify-between"><h2 className="text-xs font-bold text-blue-950">{t('Arena invitations')}</h2><span className="rounded-full bg-blue-50 px-2 py-1 text-[9px] font-bold text-blue-700">{invitations.length}</span></div><div className="space-y-2">{invitations.map((invite) => <div key={invite.id} className="flex items-center gap-2 rounded-xl bg-slate-50 p-2"><span className="min-w-0 flex-1 truncate text-[10px] font-semibold text-slate-700">{nameOf(invite.sender)} · {invite.room.stakeGram} GRAM</span><button disabled={busy} onClick={() => void answerInvite(invite, true)} className="rounded-lg bg-blue-700 px-2.5 py-1.5 text-[9px] font-bold text-white">{t('Join')}</button><button disabled={busy} onClick={() => void answerInvite(invite, false)} className="rounded-lg bg-slate-200 px-2 py-1.5 text-[9px] font-bold text-slate-500">×</button></div>)}</div></section>}

          <SquareRoom room={activeRoom} rollingSeconds={countdown} onShare={() => void shareRoom()} copied={copied} onJoin={() => activeRoom && void joinExactRoom(activeRoom)} busy={busy} stake={stake} setStake={setStake} onEnter={() => void joinPublic(stake)} t={t} />

          {activeRoom?.isPublic === false && activeRoom.status === 'WAITING' && activeRoom.viewerIsCreator && <section className="mt-3 rounded-2xl border border-blue-100 bg-white p-3"><p className="mb-2 text-center text-[10px] text-slate-500">{t('Waiting for invited players to accept.')}</p><button disabled={busy || activeRoom.participants.length < 2} onClick={() => void startPrivateRound()} className="w-full rounded-xl bg-blue-700 py-2.5 text-xs font-bold text-white disabled:bg-slate-300">{t('Start demo round')}</button></section>}

          <div className="mt-3 text-center"><button onClick={() => setPrivateRoomOpen((open) => !open)} className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-slate-500"><span aria-hidden="true">↗</span>{t('Custom room by link')}</button></div>
          {privateRoomOpen && <section className="mt-2 rounded-2xl border border-slate-200 bg-white p-3">
            <h2 className="text-xs font-bold text-blue-950">{t('Create a private room')}</h2><p className="mt-1 text-[10px] text-slate-500">{t('Invite selected friends. They will receive a private room link.')}</p>
            <div className="relative mt-3"><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t('Search username…')} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-800 outline-none focus:border-blue-400"/>{searchResults.length > 0 && <div className="absolute inset-x-0 top-[calc(100%+4px)] z-20 max-h-40 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1 shadow-xl">{searchResults.map((player) => <button key={player.id} onClick={() => { togglePlayer(player); setQuery(''); setSearchResults([]); }} className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs hover:bg-blue-50"><span>{nameOf(player)}</span><span className="text-blue-600">{selectedPlayers.some(({ id }) => id === player.id) ? '✓' : '+'}</span></button>)}</div>}</div>
            {selectedPlayers.length > 0 && <div className="my-2 flex flex-wrap gap-1">{selectedPlayers.map((player) => <button key={player.id} onClick={() => togglePlayer(player)} className="rounded-full bg-blue-50 px-2 py-1 text-[9px] font-semibold text-blue-700">{nameOf(player)} ×</button>)}</div>}
            <div className="mt-3 flex gap-2"><button disabled={busy} onClick={() => void createPrivateRoom()} className="flex-1 rounded-xl bg-slate-900 py-2.5 text-[10px] font-bold text-white">{busy ? t('Creating room…') : t('Create private room link')}</button><button onClick={() => setPrivateRoomOpen(false)} className="rounded-xl bg-slate-100 px-3 text-[10px] font-semibold text-slate-500">{t('Close')}</button></div>
          </section>}
        </>}
        <BottomNav active={null} />
      </div>
    </main>
  );
}
