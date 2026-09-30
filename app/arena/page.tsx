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
  getMyPvpRooms,
  getPvpInvitations,
  getPvpRoom,
  joinPvpRoom,
  searchPvpUsers,
  startPvpRound,
  type PvpInvitation,
  type PvpPlayer,
  type PvpRoom,
} from '../../lib/api';

function displayName(player?: PvpPlayer | null) {
  return player?.username ? `@${player.username}` : player?.firstName || 'Player';
}

function Avatar({ player, highlighted = false }: { player: PvpPlayer; highlighted?: boolean }) {
  const initials = (player.firstName || player.username || 'P').slice(0, 1).toUpperCase();
  return <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border text-sm font-bold ${highlighted ? 'border-yellow-300 bg-yellow-100 text-yellow-800' : 'border-blue-100 bg-blue-50 text-blue-700'}`}>{initials}</span>;
}

export default function ArenaPage() {
  const { t } = useOrbitLanguage();
  const [initData, setInitData] = useState('');
  const [authReady, setAuthReady] = useState(false);
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<PvpPlayer[]>([]);
  const [selectedPlayers, setSelectedPlayers] = useState<PvpPlayer[]>([]);
  const [stake, setStake] = useState('1');
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [activeRoom, setActiveRoom] = useState<PvpRoom | null>(null);
  const [invitations, setInvitations] = useState<PvpInvitation[]>([]);
  const [myRooms, setMyRooms] = useState<PvpRoom[]>([]);
  const [busy, setBusy] = useState(false);
  const [rolling, setRolling] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const rollLock = useRef(false);
  const activeRoomRef = useRef<PvpRoom | null>(null);
  const lastRoomStatus = useRef<Record<string, string>>({});

  useEffect(() => { activeRoomRef.current = activeRoom; }, [activeRoom]);

  useEffect(() => {
    const current = getTelegramInitData();
    if (current) {
      setInitData(current);
      setAuthReady(true);
      return;
    }
    const timer = window.setInterval(() => {
      const next = getTelegramInitData();
      if (next) {
        setInitData(next);
        setAuthReady(true);
        window.clearInterval(timer);
      }
    }, 250);
    const timeout = window.setTimeout(() => setAuthReady(true), 5000);
    return () => { window.clearInterval(timer); window.clearTimeout(timeout); };
  }, []);

  const loadRoom = useCallback(async (code: string, join = false) => {
    if (!initData) return;
    const room = join ? await joinPvpRoom(code, initData) : await getPvpRoom(code, initData);
    lastRoomStatus.current[room.code] = room.status;
    setActiveRoom(room);
    setRoomCodeInput(code);
    window.history.replaceState(null, '', `/arena?room=${encodeURIComponent(code)}`);
  }, [initData]);

  useEffect(() => {
    if (!initData) return;
    const params = new URLSearchParams(window.location.search);
    const code = params.get('room');
    let cancelled = false;
    const refresh = async () => {
      try {
        const [nextInvitations, rooms] = await Promise.all([getPvpInvitations(initData), getMyPvpRooms(initData)]);
        if (cancelled) return;
        setInvitations(nextInvitations);
        setMyRooms(rooms);
        if (code && !activeRoomRef.current && !rollLock.current) {
          const room = await getPvpRoom(code, initData);
          if (!cancelled) { lastRoomStatus.current[room.code] = room.status; setActiveRoom(room); }
        } else if (!activeRoomRef.current && rooms.length && !rollLock.current) {
          lastRoomStatus.current[rooms[0].code] = rooms[0].status;
          setActiveRoom(rooms[0]);
        } else if (activeRoomRef.current && !rollLock.current) {
          const updated = await getPvpRoom(activeRoomRef.current.code, initData);
          if (!cancelled) {
            const previousStatus = lastRoomStatus.current[updated.code];
            lastRoomStatus.current[updated.code] = updated.status;
            if (previousStatus === 'WAITING' && updated.status === 'COMPLETED') {
              rollLock.current = true;
              setRolling(true);
              window.setTimeout(() => {
                setActiveRoom(updated);
                setRolling(false);
                rollLock.current = false;
              }, 3200);
            } else setActiveRoom(updated);
          }
        }
      } catch (cause) {
        if (!cancelled && !activeRoomRef.current) setError(cause instanceof Error ? cause.message : t('Arena could not load'));
      }
    };
    void refresh();
    const interval = window.setInterval(() => { void refresh(); }, 3000);
    return () => { cancelled = true; window.clearInterval(interval); };
  }, [initData, t]);

  useEffect(() => {
    if (!initData || query.trim().replace(/^@/, '').length < 2) {
      setSearchResults([]);
      return;
    }
    let cancelled = false;
    const timer = window.setTimeout(() => {
      searchPvpUsers(query.trim(), initData)
        .then((players) => { if (!cancelled) setSearchResults(players); })
        .catch((cause) => { if (!cancelled) setError(cause instanceof Error ? cause.message : t('Search failed')); });
    }, 250);
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, [initData, query, t]);

  const isCreator = Boolean(activeRoom?.viewerIsCreator);
  const pot = activeRoom ? Number(activeRoom.stakeGram) * activeRoom.participants.length : 0;

  const createRoom = async () => {
    if (!initData) return;
    setBusy(true); setError(''); setNotice('');
    try {
      const room = await createPvpRoom(stake, selectedPlayers.map(({ id }) => id), initData);
      lastRoomStatus.current[room.code] = room.status;
      setActiveRoom(room);
      setSelectedPlayers([]); setQuery(''); setSearchResults([]);
      window.history.replaceState(null, '', `/arena?room=${encodeURIComponent(room.code)}`);
      const delivery = room.notificationStats;
      setNotice(delivery && delivery.failed > 0
        ? `${t('Arena room created')} ${t('Some invitations could not be delivered; they remain in the app.')}`
        : t('Arena room created'));
    } catch (cause) { setError(cause instanceof Error ? cause.message : t('Could not create room')); }
    finally { setBusy(false); }
  };

  const answerInvite = async (invite: PvpInvitation, accept: boolean) => {
    if (!initData) return;
    setBusy(true); setError('');
    try {
      const room = await answerPvpInvitation(invite.id, accept, initData);
      lastRoomStatus.current[room.code] = room.status;
      setInvitations((items) => items.filter(({ id }) => id !== invite.id));
      if (accept) {
        setActiveRoom(room);
        window.history.replaceState(null, '', `/arena?room=${encodeURIComponent(room.code)}`);
        setNotice(t('You joined the arena'));
      }
    } catch (cause) { setError(cause instanceof Error ? cause.message : t('Could not answer invitation')); }
    finally { setBusy(false); }
  };

  const startRound = async () => {
    if (!activeRoom || !initData || rolling) return;
    setBusy(true); setError(''); rollLock.current = true;
    try {
      const completed = await startPvpRound(activeRoom.code, initData);
      lastRoomStatus.current[completed.code] = completed.status;
      setRolling(true);
      window.setTimeout(() => {
        setActiveRoom(completed);
        setRolling(false);
        rollLock.current = false;
        setBusy(false);
      }, 3200);
    } catch (cause) { rollLock.current = false; setBusy(false); setError(cause instanceof Error ? cause.message : t('Could not start round')); }
  };

  const copyInvite = async () => {
    if (!activeRoom) return;
    const link = `${window.location.origin}/arena?room=${activeRoom.code}`;
    try {
      if (navigator.share) await navigator.share({ title: 'ORBIT Arena', url: link });
      else await navigator.clipboard.writeText(link);
      setCopied(true); window.setTimeout(() => setCopied(false), 1800);
    } catch { setError(t('Could not share room')); }
  };

  const togglePlayer = (player: PvpPlayer) => setSelectedPlayers((items) =>
    items.some(({ id }) => id === player.id) ? items.filter(({ id }) => id !== player.id) : [...items, player],
  );

  return (
    <main className="min-h-screen bg-[#f5f8ff] text-slate-900">
      <div className="mx-auto min-h-screen max-w-[480px] px-4 pb-28">
        <header className="flex items-start justify-between gap-3 py-5">
          <div>
            <OrbitWordmark />
            <h1 className="mt-1 flex items-center gap-2 text-2xl font-bold tracking-tight text-blue-950"><ArenaIcon size={24} />{t('Arena')}</h1>
            <p className="mt-1 text-xs text-slate-500">{t('Invite friends. One spin. One winner.')}</p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-2"><TonBalanceBadge /><span className="rounded-full border border-yellow-200 bg-yellow-50 px-2.5 py-1 text-[10px] font-semibold text-yellow-800">{t('DEMO · NO PAYMENT')}</span></div>
        </header>

        <section className="mb-4 grid grid-cols-2 gap-3" aria-label={t('Arena rooms')}>
          <div className="rounded-2xl border border-blue-200 bg-white p-3 shadow-[0_6px_20px_rgba(21,87,213,0.08)]">
            <div className="flex items-center justify-between"><span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-700"><ArenaIcon size={19} /></span><span className="rounded-full bg-emerald-50 px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-emerald-700">{t('LIVE DEMO')}</span></div>
            <h2 className="mt-3 text-sm font-bold text-blue-950">{t('Classic Arena')}</h2><p className="mt-1 text-[10px] leading-4 text-slate-500">{t('One shared stake · any number of players')}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white/70 p-3 opacity-75">
            <div className="flex items-center justify-between"><span className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-500">Ⅱ</span><span className="rounded-full bg-slate-100 px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-slate-500">{t('COMING SOON')}</span></div>
            <h2 className="mt-3 text-sm font-bold text-slate-700">{t('Gates Room')}</h2><p className="mt-1 text-[10px] leading-4 text-slate-500">{t('Second game mode')}</p>
          </div>
        </section>

        <div className="mb-4 rounded-2xl border border-yellow-200 bg-yellow-50 px-3 py-2.5 text-[11px] leading-4 text-yellow-900">
          <strong>{t('Demo mode')}.</strong> {t('GRAM is shown as a stake only. No wallet is charged, no balance changes, and no NFT is awarded.')}
        </div>

        {!authReady ? <section className="rounded-3xl border border-blue-100 bg-white p-5 text-center text-sm text-slate-500">{t('Connecting to Telegram…')}</section> : !initData ? (
          <section className="rounded-3xl border border-blue-100 bg-white p-5 text-center"><p className="font-semibold text-slate-800">{t('Open ORBIT inside Telegram')}</p><p className="mt-2 text-xs text-slate-500">{t('Telegram sign-in is needed for shared rooms and invitations.')}</p></section>
        ) : <>
          {error && <div role="alert" className="mb-3 rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}<button className="float-right font-bold" onClick={() => setError('')} aria-label={t('Close')}>×</button></div>}
          {notice && <div className="mb-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">{notice}</div>}

          {invitations.length > 0 && <section className="mb-4 rounded-3xl border border-blue-100 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between"><h2 className="text-sm font-bold text-blue-950">{t('Arena invitations')}</h2><span className="rounded-full bg-blue-50 px-2 py-1 text-[10px] font-bold text-blue-700">{invitations.length}</span></div>
            <div className="space-y-2">{invitations.map((invite) => <div key={invite.id} className="flex items-center gap-2 rounded-2xl bg-slate-50 p-2.5">
              <Avatar player={invite.sender} /><div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold">{displayName(invite.sender)} {t('invited you')}</p><p className="mt-0.5 flex items-center text-[10px] text-slate-500"><GramIcon size={12} className="mr-1" />{invite.room.stakeGram} GRAM · {invite.room._count.participants} {t('players')}</p></div>
              <button disabled={busy} onClick={() => void answerInvite(invite, true)} className="rounded-xl bg-blue-700 px-3 py-2 text-[10px] font-bold text-white disabled:opacity-50">{t('Join')}</button>
              <button disabled={busy} onClick={() => void answerInvite(invite, false)} className="rounded-xl bg-slate-200 px-2.5 py-2 text-[10px] font-semibold text-slate-600 disabled:opacity-50">×</button>
            </div>)}</div>
          </section>}

          {activeRoom ? <section className="mb-4 overflow-hidden rounded-3xl border border-blue-100 bg-white shadow-[0_10px_30px_rgba(21,87,213,0.08)]">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3"><div><p className="text-[10px] font-semibold uppercase tracking-[.16em] text-slate-400">{t('ROOM CODE')}</p><p className="font-mono text-sm font-bold tracking-[.16em] text-blue-800">{activeRoom.code}</p></div><button onClick={() => void copyInvite()} className="rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-[10px] font-semibold text-blue-700">{copied ? t('Link copied') : t('Invite friends')}</button></div>
            <div className="p-4">
              <div className={`arena-spin-stage relative mb-4 overflow-hidden rounded-2xl border border-blue-100 px-3 py-4 ${rolling ? 'is-spinning' : ''}`}>
                <div className="pointer-events-none absolute bottom-2 left-1/2 top-2 z-10 w-0.5 -translate-x-1/2 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,.55)]" />
                <div className="flex min-h-[88px] items-center gap-3 overflow-hidden px-2">
                  {(rolling ? [...activeRoom.participants, ...activeRoom.participants, ...activeRoom.participants] : activeRoom.participants).map((participant, index) => <div key={`${participant.id}-${index}`} className={`flex w-[76px] shrink-0 flex-col items-center gap-1 rounded-xl border bg-white/80 px-2 py-2 ${!rolling && activeRoom.winnerId === participant.userId ? 'border-yellow-300 bg-yellow-50' : 'border-blue-50'}`}><Avatar player={participant.user} highlighted={!rolling && activeRoom.winnerId === participant.userId} /><span className="w-full truncate text-center text-[9px] font-semibold text-slate-600">{displayName(participant.user)}</span></div>)}
                </div>
                {rolling && <div className="absolute inset-x-0 bottom-0 h-1 origin-left animate-pulse bg-blue-600" />}
              </div>

              <div className="mb-4 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-xl bg-slate-50 p-2"><p className="text-[9px] uppercase tracking-wide text-slate-400">{t('PLAYERS')}</p><p className="mt-1 text-sm font-bold text-slate-800">{activeRoom.participants.length}</p></div>
                <div className="rounded-xl bg-slate-50 p-2"><p className="text-[9px] uppercase tracking-wide text-slate-400">{t('EACH')}</p><p className="mt-1 inline-flex items-center justify-center text-sm font-bold text-slate-800"><GramIcon size={14} className="mr-1" />{activeRoom.stakeGram}</p></div>
                <div className="rounded-xl bg-blue-50 p-2"><p className="text-[9px] uppercase tracking-wide text-blue-500">{t('DEMO POT')}</p><p className="mt-1 inline-flex items-center justify-center text-sm font-bold text-blue-800"><GramIcon size={14} className="mr-1" />{pot.toFixed(3)} GRAM</p></div>
              </div>

              <div className="mb-4 max-h-28 overflow-y-auto rounded-xl bg-slate-50 p-2">
                <div className="grid grid-cols-2 gap-1.5">{activeRoom.participants.map((participant) => <div key={participant.id} className="flex min-w-0 items-center gap-1.5 rounded-lg bg-white px-2 py-1.5"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-50 text-[9px] font-bold text-blue-700">{(participant.user.firstName || participant.user.username || 'P').slice(0, 1).toUpperCase()}</span><span className="truncate text-[9px] font-semibold text-slate-600">{displayName(participant.user)}</span>{activeRoom.winnerId === participant.userId && !rolling && <span className="ml-auto text-[10px]" aria-label={t('Winner')}>🏆</span>}</div>)}</div>
              </div>

              {!activeRoom.viewerIsParticipant && activeRoom.status === 'WAITING' ? <button disabled={busy} onClick={async () => { setBusy(true); setError(''); try { await loadRoom(activeRoom.code, true); } catch (cause) { setError(cause instanceof Error ? cause.message : t('Could not join room')); } finally { setBusy(false); } }} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-700 py-3.5 text-sm font-bold text-white disabled:opacity-50">{busy ? t('Joining…') : t('Join room')}<span className="inline-flex items-center text-blue-100"><GramIcon size={14} className="mr-1" />{activeRoom.stakeGram} GRAM</span></button> : rolling ? <div className="rounded-2xl bg-blue-50 py-3 text-center"><p className="text-sm font-bold text-blue-800">{t('The arena is rolling…')}</p><p className="mt-1 text-[10px] text-slate-500">{t('Picking one winner')}</p></div> : activeRoom.status === 'COMPLETED' ? <div className="arena-win-card rounded-2xl border border-yellow-200 bg-gradient-to-r from-yellow-50 via-white to-blue-50 p-4 text-center">
                <div className="arena-trophy mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100 text-2xl">🏆</div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-yellow-700">{t('ARENA WINNER')}</p><p className="mt-1 text-xl font-black text-blue-950">{displayName(activeRoom.winner)}</p><p className="mt-1 inline-flex items-center text-xs font-semibold text-slate-600">{t('Demo prize')}: <GramIcon size={13} className="mx-1" />{pot.toFixed(3)} GRAM</p><p className="mt-2 text-[10px] text-slate-400">{t('Demo result only. Nothing was transferred.')}</p>
              </div> : <div className="space-y-3">
                <p className="text-center text-xs text-slate-500">{activeRoom.participants.length < 2 ? t('Waiting for one more player to join.') : t('Everyone plays at the same stake.')}</p>
                {isCreator && <button disabled={busy || activeRoom.participants.length < 2} onClick={() => void startRound()} className="w-full rounded-2xl bg-blue-700 py-3.5 text-sm font-bold text-white shadow-[0_8px_18px_rgba(21,87,213,.2)] transition active:scale-[.99] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none">{busy ? t('Preparing…') : t('Start demo round')}</button>}
                {!isCreator && <p className="rounded-xl bg-slate-50 px-3 py-2 text-center text-[10px] text-slate-500">{t('Waiting for the room host to start.')}</p>}
              </div>}
              <div className="mt-4 flex items-center justify-between"><button onClick={() => { setActiveRoom(null); window.history.replaceState(null, '', '/arena'); }} className="text-[11px] font-semibold text-slate-400">{t('Close room')}</button>{activeRoom.status === 'COMPLETED' && <button onClick={() => { setActiveRoom(null); window.history.replaceState(null, '', '/arena'); }} className="text-[11px] font-semibold text-blue-700">{t('Create another room')} →</button>}</div>
            </div>
          </section> : <section className="mb-4 rounded-3xl border border-blue-100 bg-white p-4 shadow-sm">
            <div className="mb-4 flex items-start justify-between"><div><h2 className="text-base font-bold text-blue-950">{t('Create a private room')}</h2><p className="mt-1 text-[11px] text-slate-500">{t('Set one demo stake and invite as many friends as you like.')}</p></div><span className="rounded-xl bg-blue-50 p-2 text-blue-700"><ArenaIcon size={20} /></span></div>
            <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wide text-slate-500" htmlFor="arena-stake">{t('Stake per player')}</label>
            <div className="mb-4 flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-1"><GramIcon size={19} className="shrink-0 text-blue-600" /><input id="arena-stake" inputMode="decimal" value={stake} onChange={(event) => setStake(event.target.value)} className="min-w-0 flex-1 border-0 bg-transparent py-2.5 text-base font-bold text-slate-800 outline-none" placeholder="1"/><span className="text-xs font-bold text-blue-700">GRAM</span></div>
            <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wide text-slate-500" htmlFor="arena-search">{t('Invite by Telegram username')}</label>
            <div className="relative mb-2"><input id="arena-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t('Search username…')} className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-blue-400"/>
              {searchResults.length > 0 && <div className="absolute inset-x-0 top-[calc(100%+5px)] z-20 max-h-48 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl">{searchResults.map((player) => <button key={player.id} onClick={() => { togglePlayer(player); setQuery(''); setSearchResults([]); }} className="flex w-full items-center gap-2 rounded-xl p-2 text-left hover:bg-blue-50"><Avatar player={player}/><span className="min-w-0 flex-1 truncate text-xs font-semibold text-slate-700">{displayName(player)}</span><span className="text-lg text-blue-600">{selectedPlayers.some(({ id }) => id === player.id) ? '✓' : '+'}</span></button>)}</div>}
            </div>
            {query.trim().length >= 2 && searchResults.length === 0 && <p className="mb-2 text-[10px] text-slate-400">{t('No users found. Friends need to open ORBIT once before they can be invited.')}</p>}
            {selectedPlayers.length > 0 && <div className="mb-4 flex flex-wrap gap-1.5">{selectedPlayers.map((player) => <button key={player.id} onClick={() => togglePlayer(player)} className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1.5 text-[10px] font-semibold text-blue-700">{displayName(player)} <span aria-hidden="true">×</span></button>)}</div>}
            <button disabled={busy || !stake || Number(stake) <= 0} onClick={() => void createRoom()} className="mt-2 w-full rounded-2xl bg-blue-700 py-3.5 text-sm font-bold text-white shadow-[0_8px_18px_rgba(21,87,213,.2)] transition active:scale-[.99] disabled:bg-slate-300 disabled:shadow-none">{busy ? t('Creating room…') : t('Create demo room')}<span className="ml-2 text-blue-200">→</span></button>
            <p className="mt-2 text-center text-[9px] leading-4 text-slate-400">{t('Invited players accept the same displayed stake. No funds are collected.')}</p>
          </section>}

          {!activeRoom && <>
            <section className="mb-4 rounded-3xl border border-slate-200 bg-white p-4">
              <h2 className="text-sm font-bold text-blue-950">{t('Join with a room code')}</h2><p className="mt-1 text-[10px] text-slate-500">{t('Anyone with the invite link can join while the round is waiting.')}</p>
              <div className="mt-3 flex gap-2"><input value={roomCodeInput} onChange={(event) => setRoomCodeInput(event.target.value.toUpperCase())} placeholder={t('Room code')} className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2.5 font-mono text-sm uppercase tracking-wider outline-none focus:border-blue-400"/><button disabled={busy || !roomCodeInput.trim()} onClick={async () => { setBusy(true); setError(''); try { await loadRoom(roomCodeInput.trim(), true); } catch (cause) { setError(cause instanceof Error ? cause.message : t('Could not join room')); } finally { setBusy(false); } }} className="rounded-xl bg-slate-900 px-4 text-xs font-bold text-white disabled:opacity-40">{t('Join')}</button></div>
            </section>
            {myRooms.length > 0 && <section className="mb-4"><h2 className="mb-2 px-1 text-xs font-bold text-slate-500">{t('RECENT ROOMS')}</h2><div className="space-y-2">{myRooms.slice(0, 4).map((room) => <button key={room.id} onClick={() => void loadRoom(room.code)} className="flex w-full items-center justify-between rounded-2xl border border-slate-100 bg-white px-3 py-3 text-left"><span><span className="block font-mono text-xs font-bold tracking-wider text-blue-800">{room.code}</span><span className="mt-1 block text-[10px] text-slate-500">{room.participants.length} {t('players')} · {room.status === 'WAITING' ? t('Waiting') : t('Finished')}</span></span><span className={`rounded-full px-2 py-1 text-[9px] font-bold ${room.status === 'WAITING' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{room.status === 'WAITING' ? t('OPEN') : t('DONE')}</span></button>)}</div></section>}
          </>}
        </>}

        <BottomNav active={null} />
      </div>
    </main>
  );
}
