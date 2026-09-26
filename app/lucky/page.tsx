"use client";

import { useState } from "react";

const gifts = [
  { name: "Diamond Ring", emoji: "💎", price: "24.5 TON" },
  { name: "Astral Shard", emoji: "🔮", price: "18.2 TON" },
  { name: "Golden Bear", emoji: "🐻", price: "42 TON" },
  { name: "Crystal Heart", emoji: "💜", price: "31.8 TON" },
  { name: "Magic Mushroom", emoji: "🍄", price: "12.4 TON" },
  { name: "Star", emoji: "⭐", price: "8.9 TON" },
];

export default function LuckyPage() {
  const [selected, setSelected] = useState<number | null>(null);
  const [rolling, setRolling] = useState(false);
  const [result, setResult] = useState<(typeof gifts)[number] | null>(null);

  function playLucky() {
    if (rolling) return;

    setRolling(true);
    setResult(null);
    setSelected(null);

    let count = 0;

    const interval = setInterval(() => {
      setSelected(Math.floor(Math.random() * gifts.length));
      count++;

      if (count >= 12) {
        clearInterval(interval);

        const winner =
          gifts[Math.floor(Math.random() * gifts.length)];

        setSelected(gifts.indexOf(winner));

        setTimeout(() => {
          setResult(winner);
          setRolling(false);
        }, 500);
      }
    }, 120);
  }

  return (
    <main className="min-h-screen bg-[#0b0b0f] text-white">
      <div className="mx-auto min-h-screen max-w-[480px] px-4 pb-28">

        {/* Header */}
        <header className="py-5">
          <p className="text-sm text-white/40">GIFTY</p>
          <h1 className="text-2xl font-bold">Lucky Buy</h1>
        </header>

        {/* Intro */}
        <section className="rounded-3xl border border-white/10 bg-gradient-to-br from-[#30304b] to-[#15151c] p-6 text-center">

          <div className="text-6xl">🍀</div>

          <h2 className="mt-4 text-2xl font-bold">
            Try your luck
          </h2>

          <p className="mt-2 text-sm leading-6 text-white/40">
            Pick a random NFT from the available gifts.
          </p>

          <div className="mt-5 rounded-2xl bg-black/20 p-4">
            <p className="text-xs text-white/30">
              Demo entry
            </p>

            <p className="mt-1 text-xl font-bold">
              1 TON
            </p>
          </div>

        </section>

        {/* Gifts */}
        <section className="mt-6">

          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">
              Possible gifts
            </h2>

            <span className="text-xs text-white/30">
              {gifts.length} NFTs
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3">

            {gifts.map((gift, index) => (
              <div
                key={gift.name}
                className={`rounded-2xl border p-3 text-center transition ${
                  selected === index
                    ? "scale-105 border-white bg-white/10"
                    : "border-white/10 bg-[#15151c]"
                }`}
              >

                <div className="text-4xl">
                  {gift.emoji}
                </div>

                <p className="mt-2 truncate text-xs font-medium">
                  {gift.name}
                </p>

                <p className="mt-1 text-[10px] text-white/30">
                  {gift.price}
                </p>

              </div>
            ))}

          </div>

        </section>

        {/* Play */}
        <button
          onClick={playLucky}
          disabled={rolling}
          className="mt-6 w-full rounded-2xl bg-white py-4 font-semibold text-black transition active:scale-[0.98] disabled:opacity-50"
        >
          {rolling ? "Choosing..." : "🍀 Try Lucky Buy"}
        </button>

        {/* Result */}
        {result && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 px-5 backdrop-blur-sm">

            <div className="w-full max-w-[360px] rounded-3xl border border-white/10 bg-[#15151c] p-8 text-center">

              <p className="text-sm text-white/40">
                You got
              </p>

              <div className="my-7 text-9xl">
                {result.emoji}
              </div>

              <h2 className="text-2xl font-bold">
                {result.name}
              </h2>

              <p className="mt-2 text-white/40">
                Market value: {result.price}
              </p>

              <button
                onClick={() => setResult(null)}
                className="mt-6 w-full rounded-2xl bg-white py-4 font-semibold text-black"
              >
                Continue
              </button>

            </div>

          </div>
        )}

        {/* Bottom navigation */}
        <nav className="fixed bottom-0 left-1/2 z-50 w-full max-w-[480px] -translate-x-1/2 border-t border-white/10 bg-[#0b0b0f]/95 px-4 py-3 backdrop-blur-xl">

          <div className="grid grid-cols-4">

            <a
              href="/"
              className="flex flex-col items-center gap-1 text-white/40"
            >
              <span>🏠</span>
              <span className="text-[10px]">Home</span>
            </a>

            <a
              href="/market"
              className="flex flex-col items-center gap-1 text-white/40"
            >
              <span>🛍️</span>
              <span className="text-[10px]">Market</span>
            </a>

            <a
              href="/cases"
              className="flex flex-col items-center gap-1 text-white/40"
            >
              <span>🎁</span>
              <span className="text-[10px]">Cases</span>
            </a>

            <a
              href="/profile"
              className="flex flex-col items-center gap-1 text-white/40"
            >
              <span>👤</span>
              <span className="text-[10px]">Profile</span>
            </a>

          </div>

        </nav>

      </div>
    </main>
  );
}