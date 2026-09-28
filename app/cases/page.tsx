"use client";

import { useState } from "react";
import TelegramAvatar from "../../components/TelegramAvatar";

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
    <main className="min-h-screen bg-[#f5f8ff] text-slate-900">
      <div className="mx-auto min-h-screen max-w-[480px] px-4 pb-28">

        <header className="py-5">
          <p className="text-sm font-semibold tracking-[0.18em] text-blue-700">ORBIT</p>
          <h1 className="text-2xl font-bold">Cases</h1>
        </header>

        <div className="space-y-4">
          {cases.map((item) => (
            <div
              key={item.id}
              className="overflow-hidden rounded-3xl border border-slate-200 bg-white"
            >
              <div className="flex h-48 items-center justify-center bg-gradient-to-br from-blue-50 via-white to-yellow-50 text-8xl">
                {item.emoji}
              </div>

              <div className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-lg font-bold">{item.name}</h2>

                    <p className="mt-1 text-sm text-slate-500">
                      {item.description}
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 px-3 py-2 text-sm font-semibold">
                    {item.price}
                  </div>
                </div>

                <button
                  onClick={openCase}
                  disabled={opening}
                  className="mt-5 w-full rounded-2xl bg-blue-700 py-4 font-semibold text-white disabled:opacity-50"
                >
                  {opening ? "Opening..." : "Open case"}
                </button>
              </div>
            </div>
          ))}
        </div>

        {reward && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/45 px-5 backdrop-blur-sm">
            <div className="w-full max-w-[360px] rounded-3xl border border-blue-100 bg-white p-8 text-center shadow-2xl">

              <p className="text-sm text-slate-500">
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
                className="mt-6 w-full rounded-2xl bg-blue-700 py-4 font-semibold text-white"
              >
                Continue
              </button>

            </div>
          </div>
        )}

        <nav className="fixed bottom-0 left-1/2 z-50 w-full max-w-[480px] -translate-x-1/2 border-t border-slate-200 bg-white/95 px-4 py-3 shadow-[0_-8px_30px_rgba(21,87,213,0.08)] backdrop-blur-xl">

          <div className="grid grid-cols-4">

            <a
              href="/"
              className="flex flex-col items-center gap-1 text-slate-500"
            >
              <span>🏠</span>
              <span className="text-[10px]">Home</span>
            </a>

            <a
              href="/market"
              className="flex flex-col items-center gap-1 text-slate-500"
            >
              <span>🛍️</span>
              <span className="text-[10px]">Market</span>
            </a>

            <a
              href="/cases"
              className="flex flex-col items-center gap-1 text-blue-700"
            >
              <span>🎁</span>
              <span className="text-[10px]">Cases</span>
            </a>

            <a
              href="/profile"
              className="flex flex-col items-center gap-1 text-slate-500"
            >
              <TelegramAvatar size={22} />
              <span className="text-[10px]">Profile</span>
            </a>

          </div>

        </nav>

      </div>
    </main>
  );
}
