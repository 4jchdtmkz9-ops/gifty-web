'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import BottomNav from '../../../components/BottomNav';
import CaseRewardCard from '../../../components/CaseRewardCard';
import GramIcon from '../../../components/GramIcon';
import OrbitWordmark from '../../../components/OrbitWordmark';
import { cryptanCase, cryptanRewards, type CaseReward } from '../../../lib/caseData';
import { useOrbitLanguage } from '../../../components/OrbitLanguageContext';

const WINNING_INDEX = 18;

function randomReward() {
  return cryptanRewards[Math.floor(Math.random() * cryptanRewards.length)];
}

export default function CryptanCasePage() {
  const { t } = useOrbitLanguage();
  const [purchased, setPurchased] = useState(false);
  const [opening, setOpening] = useState(false);
  const [notice, setNotice] = useState('');
  const [wonReward, setWonReward] = useState<CaseReward | null>(null);
  const [rollItems, setRollItems] = useState<CaseReward[]>(cryptanRewards);
  const [markerPosition, setMarkerPosition] = useState(50);
  const rouletteRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const animationTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (animationFrameRef.current !== null) window.cancelAnimationFrame(animationFrameRef.current);
      if (animationTimerRef.current !== null) window.clearTimeout(animationTimerRef.current);
    };
  }, []);

  function buyCase() {
    if (purchased || opening) return;
    setNotice('');
    setPurchased(true);
    setNotice(t('Demo case ready. No GRAM was charged.'));
  }

  function openCase() {
    if (!purchased || opening) return;
    setOpening(true);
    setWonReward(null);
    setNotice('');
    const reward = randomReward();

    const items = [...Array.from({ length: WINNING_INDEX }, randomReward), reward, ...Array.from({ length: 5 }, randomReward)];
    setRollItems(items);
    const nextMarkerPosition = 20 + Math.random() * 60;
    setMarkerPosition(nextMarkerPosition);
    const viewport = rouletteRef.current;
    if (!viewport) {
      setOpening(false);
      setWonReward(reward);
      setPurchased(false);
      return;
    }

    animationTimerRef.current = window.setTimeout(() => {
      const winningCard = viewport.querySelector<HTMLElement>(`[data-roll-index="${WINNING_INDEX}"]`);
      if (!winningCard) {
        setOpening(false);
        setNotice(t('Could not open case'));
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
        setPurchased(false);
        setOpening(false);
        setWonReward(reward);
      };
      animationFrameRef.current = window.requestAnimationFrame(animate);
    }, 80);
  }

  return (
    <main className="min-h-screen bg-[#f5f8ff] text-slate-900">
      <div className="mx-auto min-h-screen max-w-[480px] px-4 pb-28">
        <header className="flex items-center gap-3 py-5">
          <Link href="/cases" aria-label={t('Back to cases')} className="flex h-10 w-10 items-center justify-center rounded-full border border-blue-100 bg-white text-lg text-blue-800 shadow-sm">←</Link>
          <div>
            <OrbitWordmark suffix={t('CASE')} />
            <h1 className="text-xl font-bold leading-tight text-blue-950">{cryptanCase.name}</h1>
          </div>
        </header>

        <section className="overflow-hidden rounded-[28px] border border-blue-100 bg-white shadow-[0_12px_32px_rgba(21,87,213,0.09)]">
          <div className={`relative flex h-[220px] items-center overflow-hidden ${purchased || opening ? 'case-roulette-stage' : 'case-art-stage bg-white'}`}>
            {purchased || opening ? (
              <div className="relative h-full w-full">
                <div ref={rouletteRef} className="case-roulette-track absolute inset-0 z-10 flex items-center gap-2.5 overflow-hidden px-3">
                  {rollItems.map((reward, index) => <div key={`${reward.id}-${index}`} data-roll-index={index}><CaseRewardCard reward={reward} compact /></div>)}
                </div>
                {opening && <span className="pointer-events-none absolute inset-y-0 z-20 w-1 -translate-x-1/2 bg-yellow-400 shadow-[0_0_12px_rgba(244,191,40,0.9)]" style={{ left: `${markerPosition}%` }} />}
              </div>
            ) : <Image src={cryptanCase.image} alt="Кейс Криптан" fill sizes="(max-width: 480px) 100vw, 448px" className="object-contain p-2" priority />}
          </div>

          {purchased && <div className="px-4 pt-3"><button type="button" onClick={openCase} disabled={opening} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-blue-700 px-4 text-sm font-semibold text-white shadow-[0_8px_18px_rgba(21,87,213,0.2)] transition active:scale-[0.99] disabled:opacity-60">{t(opening ? 'Opening…' : 'Open')}</button></div>}

          <div className="p-4 pt-3">
            <div className="flex items-center justify-between gap-3">
              <div><h2 className="text-lg font-bold text-blue-950">Криптан</h2><p className="mt-0.5 text-xs text-slate-500">{t('5 collectible Telegram gifts')}</p></div>
              <span className="rounded-full bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-800">{t('DEMO')}</span>
            </div>

            <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50/70 px-3 py-2.5">
              <p className="text-[11px] font-bold text-blue-950">{t('Demo only')}</p>
              <p className="mt-0.5 text-[10px] leading-4 text-blue-800">{t('No GRAM is charged and demo prizes are not added to your balance or inventory.')}</p>
            </div>
            {notice && <p role="status" className="mt-3 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700">{notice}</p>}

            {!purchased && <button type="button" onClick={buyCase} disabled={opening} className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-blue-700 px-4 text-sm font-semibold text-white shadow-[0_8px_18px_rgba(21,87,213,0.2)] transition active:scale-[0.99] disabled:opacity-60">{t('Try demo')}</button>}
          </div>
        </section>

        <section className="mt-6">
          <div className="mb-3 flex items-end justify-between"><div><p className="text-[10px] font-bold tracking-[0.16em] text-blue-700">{t('POSSIBLE NFTS')}</p><h2 className="mt-1 text-base font-bold text-blue-950">{t('What you can win')}</h2></div><span className="text-[10px] text-slate-500"><GramIcon size={11} className="mr-0.5 text-blue-700" />{t('Prices in GRAM')}</span></div>
          <div className="grid grid-cols-2 gap-3">{cryptanRewards.map((reward) => <CaseRewardCard key={reward.id} reward={reward} />)}</div>
        </section>

        <BottomNav active="cases" />
      </div>

      {wonReward && <div className="fixed inset-0 z-[110] flex items-center justify-center bg-blue-950/45 px-5 backdrop-blur-sm">
        <div className="w-full max-w-[340px] rounded-[28px] border border-blue-100 bg-white p-5 text-center shadow-2xl">
          <p className="text-[10px] font-bold tracking-[0.2em] text-blue-700">{t('CASE PRIZE')}</p>
          <h2 className="mt-1 text-xl font-bold text-blue-950">{t('You got {name}!').replace('{name}', wonReward.name)}</h2>
          <div className="mx-auto mt-4 max-w-[210px]"><CaseRewardCard reward={wonReward} /></div>
          <p className="mt-3 text-xs font-semibold text-slate-600">{t('Demo prize only · no balance or inventory changes')}</p>
          <button type="button" onClick={() => setWonReward(null)} className="mt-4 min-h-12 w-full rounded-2xl bg-blue-700 text-sm font-semibold text-white">{t('Continue')}</button>
        </div>
      </div>}
    </main>
  );
}
