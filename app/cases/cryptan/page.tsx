'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import BottomNav from '../../../components/BottomNav';
import CaseRewardCard from '../../../components/CaseRewardCard';
import { cryptanCase, cryptanRewards, type CaseReward } from '../../../lib/caseData';

const DEMO_PURCHASE_KEY = 'orbit-demo-case-cryptan-purchased';
const WINNING_INDEX = 18;

function pickReward() {
  let roll = Math.random() * 100;
  for (const reward of cryptanRewards) {
    if (roll < reward.chanceValue) return reward;
    roll -= reward.chanceValue;
  }
  return cryptanRewards[0];
}

function randomReward() {
  return cryptanRewards[Math.floor(Math.random() * cryptanRewards.length)];
}

export default function CryptanCasePage() {
  const [purchased, setPurchased] = useState(false);
  const [opening, setOpening] = useState(false);
  const [notice, setNotice] = useState('');
  const [wonReward, setWonReward] = useState<CaseReward | null>(null);
  const [rollItems, setRollItems] = useState<CaseReward[]>(cryptanRewards);
  const rouletteRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setPurchased(window.sessionStorage.getItem(DEMO_PURCHASE_KEY) === '1');
  }, []);

  function demoPurchase() {
    window.sessionStorage.setItem(DEMO_PURCHASE_KEY, '1');
    setPurchased(true);
    setNotice('Demo purchase complete — no TON was charged.');
  }

  function openCase() {
    if (!purchased || opening) return;

    const selected = pickReward();
    const items = [
      ...Array.from({ length: WINNING_INDEX }, randomReward),
      selected,
      ...Array.from({ length: 5 }, randomReward),
    ];
    setRollItems(items);
    setWonReward(null);
    setNotice('');
    setOpening(true);

    window.setTimeout(() => {
      const viewport = rouletteRef.current;
      const winningCard = viewport?.querySelector<HTMLElement>(`[data-roll-index="${WINNING_INDEX}"]`);
      if (!viewport || !winningCard) {
        setOpening(false);
        return;
      }

      const startLeft = viewport.scrollLeft;
      const targetLeft = winningCard.offsetLeft + winningCard.offsetWidth / 2 - viewport.clientWidth / 2;
      const startTime = performance.now();
      const duration = 4200;

      const animate = (now: number) => {
        const progress = Math.min(1, (now - startTime) / duration);
        const eased = 1 - Math.pow(1 - progress, 5);
        viewport.scrollLeft = startLeft + (targetLeft - startLeft) * eased;

        if (progress < 1) {
          window.requestAnimationFrame(animate);
          return;
        }

        window.sessionStorage.removeItem(DEMO_PURCHASE_KEY);
        setPurchased(false);
        setOpening(false);
        setWonReward(selected);
      };

      window.requestAnimationFrame(animate);
    }, 80);
  }

  return (
    <main className="min-h-screen bg-[#f5f8ff] text-slate-900">
      <div className="mx-auto min-h-screen max-w-[480px] px-4 pb-28">
        <header className="flex items-center gap-3 py-5">
          <Link href="/cases" aria-label="Back to cases" className="flex h-10 w-10 items-center justify-center rounded-full border border-blue-100 bg-white text-lg text-blue-800 shadow-sm">←</Link>
          <div>
            <p className="text-[10px] font-bold tracking-[0.2em] text-blue-700">ORBIT CASE</p>
            <h1 className="text-xl font-bold leading-tight text-blue-950">{cryptanCase.name}</h1>
          </div>
          <span className="ml-auto rounded-full border border-yellow-200 bg-yellow-50 px-2.5 py-1 text-[10px] font-semibold text-yellow-800">DEMO</span>
        </header>

        <section className="overflow-hidden rounded-[28px] border border-blue-100 bg-white shadow-[0_12px_32px_rgba(21,87,213,0.09)]">
          <div className="case-art-stage relative flex h-[220px] items-center overflow-hidden bg-white">
            {purchased || opening ? (
              <div className="relative h-full w-full">
                <div ref={rouletteRef} className="absolute inset-0 flex items-center gap-2.5 overflow-hidden px-3">
                  {rollItems.map((reward, index) => (
                    <div key={`${reward.id}-${index}`} data-roll-index={index}>
                      <CaseRewardCard reward={reward} compact />
                    </div>
                  ))}
                </div>
                {opening && <span className="pointer-events-none absolute inset-y-0 left-1/2 z-20 w-1 -translate-x-1/2 bg-yellow-400 shadow-[0_0_12px_rgba(244,191,40,0.9)]" />}
              </div>
            ) : (
              <Image src={cryptanCase.image} alt="Кейс Криптан" fill sizes="(max-width: 480px) 100vw, 448px" className="object-contain p-2" priority />
            )}
          </div>

          {purchased && (
            <div className="px-4 pt-3">
              <button
                type="button"
                onClick={openCase}
                disabled={opening}
                className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-blue-700 px-4 text-sm font-semibold text-white shadow-[0_8px_18px_rgba(21,87,213,0.2)] transition active:scale-[0.99] disabled:opacity-60"
              >
                {opening ? 'Opening…' : 'Open'}
              </button>
            </div>
          )}

          <div className="p-4 pt-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-blue-950">Криптан</h2>
                <p className="mt-0.5 text-xs text-slate-500">5 collectible Telegram gifts</p>
              </div>
              <span className="rounded-full bg-blue-50 px-3 py-1.5 text-sm font-bold text-blue-800">30 TON</span>
            </div>

            <div className="mt-4 rounded-2xl border border-yellow-200 bg-yellow-50/80 px-3 py-2.5">
              <p className="text-[11px] font-bold text-yellow-900">Demo only</p>
              <p className="mt-0.5 text-[10px] leading-4 text-yellow-800">No real TON is charged and no NFT is transferred in this preview.</p>
            </div>

            {notice && <p role="status" className="mt-3 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700">{notice}</p>}

            {!purchased && (
              <button
                type="button"
                onClick={demoPurchase}
                className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-blue-700 px-4 text-sm font-semibold text-white shadow-[0_8px_18px_rgba(21,87,213,0.2)] transition active:scale-[0.99]"
              >
                Buy case · 30 TON
              </button>
            )}
          </div>
        </section>

        <section className="mt-6">
          <div className="mb-3 flex items-end justify-between">
            <div>
              <p className="text-[10px] font-bold tracking-[0.16em] text-blue-700">POSSIBLE NFTS</p>
              <h2 className="mt-1 text-base font-bold text-blue-950">What you can win</h2>
            </div>
            <span className="text-[10px] text-slate-500">Prices in TON</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {cryptanRewards.map((reward) => <CaseRewardCard key={reward.id} reward={reward} />)}
          </div>
        </section>

        <BottomNav active="cases" />
      </div>

      {wonReward && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-blue-950/45 px-5 backdrop-blur-sm">
          <div className="w-full max-w-[340px] rounded-[28px] border border-blue-100 bg-white p-5 text-center shadow-2xl">
            <p className="text-[10px] font-bold tracking-[0.2em] text-blue-700">DEMO RESULT</p>
            <h2 className="mt-1 text-xl font-bold text-blue-950">You got {wonReward.name}!</h2>
            <div className="mx-auto mt-4 max-w-[210px]"><CaseRewardCard reward={wonReward} /></div>
            <p className="mt-3 text-[10px] leading-4 text-slate-500">Preview only. No payment was made and this NFT was not added to your profile.</p>
            <button type="button" onClick={() => setWonReward(null)} className="mt-4 min-h-12 w-full rounded-2xl bg-blue-700 text-sm font-semibold text-white">Continue</button>
          </div>
        </div>
      )}
    </main>
  );
}
