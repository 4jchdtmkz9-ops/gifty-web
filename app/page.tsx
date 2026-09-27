'use client';

import { useEffect } from 'react';
import { authenticateTelegram } from '../lib/api';
import { TonConnectButton } from '@tonconnect/ui-react';

const gifts = [
  {
    name: 'Diamond Ring',
    collection: 'Telegram Gifts',
    price: '24.5 TON',
    emoji: '💎',
  },
  {
    name: 'Astral Shard',
    collection: 'Limited Gifts',
    price: '18.2 TON',
    emoji: '🔮',
  },
  {
    name: 'Golden Bear',
    collection: 'Rare Gifts',
    price: '42 TON',
    emoji: '🐻',
  },
  {
    name: 'Crystal Heart',
    collection: 'Premium Gifts',
    price: '31.8 TON',
    emoji: '💜',
  },
];

export default function Home() {
  useEffect(() => {
    authenticateTelegram()
      .then((user) => {
        if (user) {
          console.log('GIFTY Telegram user:', user);
        }
      })
      .catch((error) => {
        console.error('Telegram authentication error:', error);
      });
  }, []);

  return (
    <main className="min-h-screen bg-[#0b0b0f] text-white">
      <div className="mx-auto min-h-screen max-w-[480px] px-4 pb-24">

        {/* Header */}
        <header className="flex items-center justify-between py-5">
          <div>
            <p className="text-sm text-white/50">Welcome to</p>
            <h1 className="text-2xl font-bold tracking-tight">GIFTY</h1>
          </div>

          <TonConnectButton />
        </header>

        {/* Balance */}
        <section className="mb-5 rounded-3xl border border-white/10 bg-gradient-to-br from-[#252538] to-[#15151d] p-5">
          <p className="text-sm text-white/50">Your balance</p>

          <div className="mt-2 flex items-end justify-between">
            <div>
              <div className="text-3xl font-bold">0 TON</div>
              <p className="mt-1 text-xs text-white/40">
                Connect wallet to start trading
              </p>
            </div>

            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-2xl">
              💎
            </div>
          </div>
        </section>

        {/* Quick actions */}
        <div className="mb-6 grid grid-cols-3 gap-3">

          <a
            href="/market"
            className="rounded-2xl bg-white/5 p-4 text-center transition hover:bg-white/10"
          >
            <div className="text-xl">🛍️</div>
            <div className="mt-2 text-xs text-white/70">Market</div>
          </a>

          <a
            href="/cases"
            className="rounded-2xl bg-white/5 p-4 text-center transition hover:bg-white/10"
          >
            <div className="text-xl">🎁</div>
            <div className="mt-2 text-xs text-white/70">Cases</div>
          </a>

          <a
            href="/lucky"
            className="rounded-2xl bg-white/5 p-4 text-center transition hover:bg-white/10"
          >
            <div className="text-xl">🍀</div>
            <div className="mt-2 text-xs text-white/70">Lucky</div>
          </a>

        </div>

        {/* Featured */}
        <section className="mb-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Featured</h2>

            <a
              href="/market"
              className="text-sm text-white/40"
            >
              View all
            </a>
          </div>

          <div className="overflow-hidden rounded-3xl border border-white/10 bg-[#15151c]">
            <div className="flex h-52 items-center justify-center bg-gradient-to-br from-[#373758] via-[#1e1e30] to-[#111117] text-8xl">
              💎
            </div>

            <div className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold">Diamond Ring</h3>

                  <p className="mt-1 text-sm text-white/40">
                    Telegram Gifts
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-xs text-white/40">Price</p>
                  <p className="font-semibold">24.5 TON</p>
                </div>
              </div>

              <a
                href="/market"
                className="mt-4 block w-full rounded-2xl bg-white py-3 text-center font-semibold text-black transition hover:bg-white/90"
              >
                Buy now
              </a>
            </div>
          </div>
        </section>

        {/* Trending */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Trending gifts</h2>

            <a
              href="/market"
              className="text-sm text-white/40"
            >
              See all
            </a>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {gifts.map((gift) => (
              <div
                key={gift.name}
                className="overflow-hidden rounded-3xl border border-white/10 bg-[#15151c]"
              >
                <div className="flex h-36 items-center justify-center bg-gradient-to-br from-[#25253a] to-[#111117] text-6xl">
                  {gift.emoji}
                </div>

                <div className="p-3">
                  <h3 className="truncate text-sm font-semibold">
                    {gift.name}
                  </h3>

                  <p className="mt-1 truncate text-xs text-white/40">
                    {gift.collection}
                  </p>

                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-sm font-semibold">
                      {gift.price}
                    </span>

                    <a
                      href="/market"
                      className="rounded-xl bg-white/10 px-3 py-2 text-xs transition hover:bg-white/20"
                    >
                      Buy
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Bottom navigation */}
        <nav className="fixed bottom-0 left-1/2 z-50 w-full max-w-[480px] -translate-x-1/2 border-t border-white/10 bg-[#0b0b0f]/95 px-4 py-3 backdrop-blur-xl">
          <div className="grid grid-cols-4">

            <a
              href="/"
              className="flex flex-col items-center gap-1 text-white"
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