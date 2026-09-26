"use client";

import { useState } from "react";

const cases = [
  {
    id: 1,
    name: "Starter Case",
    price: "1 TON",
    emoji: "🎁",
    description: "A small collection of surprise gifts",
  },
  {
    id: 2,
    name: "Rare Case",
    price: "5 TON",
    emoji: "💎",
    description: "Higher chance of rare gifts",
  },
  {
    id: 3,
    name: "Legendary Case",
    price: "15 TON",
    emoji: "👑",
    description: "Only premium and legendary rewards",
  },
];

const rewards = ["💎", "🔮", "🐻", "💜", "🍄", "⭐"];

export default function CasesPage() {
  const [opening, setOpening] = useState(false);
  const [reward, setReward] = useState<string | null>(null);

  function openCase() {
    setOpening(true);
    setReward(null);

    setTimeout(() => {
      const randomReward =
        rewards[Math.floor(Math.random() * rewards.length)];

      setReward(randomReward);
      setOpening(false);
    }, 1200);
  }

  return (
    <main className="min-h-screen bg-[#0b0b0f] text-white">
      <div className="mx-auto min-h-screen max-w-[480px] px-4 pb-28">

        <header className="py-5">
          <p className="text-sm text-white/40">GIFTY</p>
          <h1 className="text-2xl font-bold">Cases</h1>
        </header>

        <div className="space-y-4">
          {cases.map((item) => (
            <div
              key={item.id}
              className="overflow-hidden rounded-3xl border border-white/10 bg-[#15151c]"
            >
              <div className="flex h-48 items-center justify-center bg-gradient-to-br from-[#30304b] to-[#111117] text-8xl">
                {item.emoji}
              </div>

              <div className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-lg font-bold">{item.name}</h2>

                    <p className="mt-1 text-sm text-white/40">
                      {item.description}
                    </p>
                  </div>

                  <div className="rounded-xl bg-white/5 px-3 py-2 text-sm font-semibold">
                    {item.price}
                  </div>
                </div>

                <button
                  onClick={openCase}
                  disabled={opening}
                  className="mt-5 w-full rounded-2xl bg-white py-4 font-semibold text-black disabled:opacity-50"
                >
                  {opening ? "Opening..." : "Open case"}
                </button>
              </div>
            </div>
          ))}
        </div>

        {reward && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 px-5 backdrop-blur-sm">
            <div className="w-full max-w-[360px] rounded-3xl border border-white/10 bg-[#15151c] p-8 text-center">

              <p className="text-sm text-white/40">
                Congratulations!
              </p>

              <div className="my-8 text-9xl">
                {reward}
              </div>

              <h2 className="text-xl font-bold">
                You received a gift
              </h2>

              <button
                onClick={() => setReward(null)}
                className="mt-6 w-full rounded-2xl bg-white py-4 font-semibold text-black"
              >
                Continue
              </button>

            </div>
          </div>
        )}

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
              className="flex flex-col items-center gap-1 text-white"
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