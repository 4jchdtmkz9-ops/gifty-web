'use client';

import { useState } from 'react';
import BottomNav from '../../components/BottomNav';
import GramIcon from '../../components/GramIcon';
import TonBalanceBadge from '../../components/TonBalanceBadge';

type LuckyReward = {
  id: string;
  kind: 'gram' | 'nft';
  name: string;
  valueGram: string;
  chance: number;
  emoji?: string;
  imageUrl?: string;
};

const rewards: LuckyReward[] = [
  { id: 'gram-01', kind: 'gram', name: 'GRAM', valueGram: '0.1', chance: 22, emoji: '✦' },
  { id: 'gram-02', kind: 'gram', name: 'GRAM', valueGram: '0.2', chance: 28, emoji: '✦' },
  { id: 'gram-05', kind: 'gram', name: 'GRAM', valueGram: '0.5', chance: 30, emoji: '✦' },
  { id: 'gram-1', kind: 'gram', name: 'GRAM', valueGram: '1', chance: 15, emoji: '✦' },
  { id: 'chill-flame', kind: 'nft', name: 'Chill Flame', valueGram: '6', chance: 5, imageUrl: 'https://nft.fragment.com/gift/chillflame-135698.webp' },
  { id: 'plush-pepe', kind: 'nft', name: 'Plush Pepe', valueGram: '7999', chance: 0, imageUrl: 'https://nft.fragment.com/gift/plushpepe-1829.webp' },
];

const spinPriceGram = '1';

function chooseWeightedReward() {
  const available = rewards.filter((reward) => reward.chance > 0);
  const roll = Math.random() * available.reduce((total, reward) => total + reward.chance, 0);
  let threshold = 0;

  for (const reward of available) {
    threshold += reward.chance;
    if (roll < threshold) return reward;
  }

  return available[available.length - 1];
}

function RewardArt({ reward, large = false }: { reward: LuckyReward; large?: boolean }) {
  const size = large ? 'h-32 w-32' : 'h-14 w-14';

  if (reward.kind === 'gram') {
    return <div className={`flex ${size} items-center justify-center rounded-full bg-blue-50 text-blue-700`}>
      <GramIcon size={large ? 60 : 34} />
    </div>;
  }

  return <div className={`relative flex ${size} items-center justify-center overflow-hidden rounded-2xl bg-slate-100 text-4xl`}>
    <span aria-hidden="true">🎁</span>
    <img src={reward.imageUrl} alt={reward.name} className="absolute inset-0 h-full w-full object-contain" onError={(event) => { event.currentTarget.style.display = 'none'; }} />
  </div>;
}

export default function LuckyPage() {
  const [selected, setSelected] = useState<string | null>(null);
  const [rolling, setRolling] = useState(false);
  const [result, setResult] = useState<LuckyReward | null>(null);

  function playLucky() {
    if (rolling) return;

    setRolling(true);
    setResult(null);
    setSelected(null);

    let count = 0;
    const interval = setInterval(() => {
      const highlighted = rewards[Math.floor(Math.random() * rewards.length)];
      setSelected(highlighted.id);
      count++;

      if (count >= 16) {
        clearInterval(interval);
        const winner = chooseWeightedReward();
        setSelected(winner.id);

        setTimeout(() => {
          setResult(winner);
          setRolling(false);
        }, 550);
      }
    }, 110);
  }

  return (
    <main className="min-h-screen bg-[#f5f8ff] text-slate-900">
      <div className="mx-auto min-h-screen max-w-[480px] px-4 pb-32">
        <header className="flex items-center justify-between gap-2 py-2">
          <div>
            <p className="text-sm font-semibold tracking-[0.18em] text-blue-700">ORBIT</p>
            <h1 className="text-2xl font-bold">Lucky Buy</h1>
          </div>
          <TonBalanceBadge />
        </header>

        <section className="rounded-3xl border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-yellow-50 p-4 text-center shadow-[0_14px_36px_rgba(21,87,213,0.08)]">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-700 text-2xl text-white shadow-lg shadow-blue-700/20">✦</div>
          <h2 className="mt-2 text-xl font-bold">Try your luck</h2>
          <p className="mt-1 text-xs leading-5 text-slate-500">Spin for GRAM rewards or a Telegram gift.</p>

          <div className="mt-3 rounded-2xl bg-slate-100 p-2.5">
            <p className="text-[11px] text-slate-400">Demo spin price</p>
            <p className="mt-0.5 text-lg font-bold"><GramIcon size={16} className="mr-1 text-blue-700" />{spinPriceGram} GRAM</p>
            <p className="mt-0.5 text-[11px] leading-4 text-slate-500">Demo only — no GRAM charged, nothing added to inventory.</p>
          </div>
        </section>

        <section className="mt-4">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="font-semibold">Possible rewards</h2>
            <span className="text-xs text-slate-400">6 rewards</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {rewards.map((reward) => (
              <div key={reward.id} className={`relative flex min-h-[112px] flex-col items-center rounded-2xl border p-2 text-center transition ${selected === reward.id ? 'scale-[1.03] border-blue-500 bg-blue-50 shadow-md' : 'border-slate-200 bg-white'}`}>
                <RewardArt reward={reward} />
                {reward.kind === 'gram' ? (
                  <p className="mt-1 flex items-center justify-center text-sm font-bold"><GramIcon size={15} className="mr-1 text-blue-700" />{reward.valueGram}</p>
                ) : (
                  <>
                    <p className="mt-1 max-w-full truncate text-[11px] font-semibold">{reward.name}</p>
                    <p className="mt-0.5 flex items-center justify-center text-[11px] text-slate-500"><GramIcon size={12} className="mr-1 text-blue-700" />{reward.valueGram}</p>
                  </>
                )}
              </div>
            ))}
          </div>
        </section>

        <button type="button" onClick={playLucky} disabled={rolling} className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] left-1/2 z-40 w-[calc(100%-2rem)] max-w-[448px] -translate-x-1/2 rounded-2xl bg-blue-700 py-3.5 font-semibold text-white shadow-lg shadow-blue-900/20 transition active:scale-[0.98] disabled:opacity-50">
          Spin
        </button>

        {result && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/45 px-5 backdrop-blur-sm" onClick={() => setResult(null)}>
            <div role="dialog" aria-modal="true" aria-labelledby="lucky-result-title" onClick={(event) => event.stopPropagation()} className="w-full max-w-[360px] rounded-3xl border border-slate-200 bg-white p-7 text-center shadow-2xl">
              <p className="text-sm text-slate-500">Demo result</p>
              <div className="my-6 flex justify-center"><RewardArt reward={result} large /></div>
              <h2 id="lucky-result-title" className="text-2xl font-bold">{result.kind === 'gram' ? 'You got' : result.name}</h2>
              <p className="mt-2 flex items-center justify-center text-lg font-semibold text-slate-700"><GramIcon size={17} className="mr-1 text-blue-700" />{result.valueGram}{result.kind === 'gram' ? '' : ' GRAM value'}</p>
              <p className="mt-2 text-xs text-slate-500">Demo only. Nothing was charged or added to your inventory.</p>
              <button type="button" onClick={() => setResult(null)} className="mt-6 w-full rounded-2xl bg-blue-700 py-4 font-semibold text-white">Continue</button>
            </div>
          </div>
        )}

        <BottomNav active={null} />
      </div>
    </main>
  );
}
