'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import TelegramAvatar from '../components/TelegramAvatar';
import HomeIcon from '../components/HomeIcon';
import BottomNav from '../components/BottomNav';
import {
  authenticateTelegram,
  connectWallet,
  getTonBalance,
} from '../lib/api';
import {
  TonConnectButton,
  useTonAddress,
  useTonConnectUI,
} from '@tonconnect/ui-react';

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
    const walletAddress = useTonAddress();
    const [balance, setBalance] = useState('0');
    
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
    useEffect(() => {
  if (!walletAddress) {
    setBalance('0');
    return;
  }

  connectWallet(walletAddress)
    .then((wallet) => {
      console.log('GIFTY wallet connected:', wallet);
    })
    .catch((error) => {
      console.error('Wallet connection error:', error);
    });

  getTonBalance(walletAddress)
    .then((data) => {
      setBalance(data.balanceTon);
    })
    .catch((error) => {
      console.error('TON balance error:', error);
      setBalance('0');
    });
}, [walletAddress]);

  return (
    <main className="min-h-screen bg-[#f5f8ff] text-slate-900">
      <div className="mx-auto min-h-screen max-w-[480px] px-4 pb-24">

        {/* Header */}
        <header className="flex items-center justify-between py-4">
          <div className="min-w-0">
            <Image src="/orbit-logo.png" width={970} height={249} alt="ORBIT" priority className="h-auto w-36 object-contain sm:w-40" />
            <div className="mt-1 flex items-center gap-2">
              <span className="h-1 w-5 rounded-full bg-blue-700" />
              <span className="h-1 w-3 rounded-full bg-yellow-400" />
              <span className="h-1 w-2 rounded-full bg-red-500" />
              <p className="text-[10px] font-medium tracking-[0.18em] text-slate-500">DIGITAL COLLECTIBLES</p>
            </div>
          </div>

          <TonConnectButton />
        </header>

        {/* Balance */}
        <section className="mb-5 overflow-hidden rounded-3xl border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-yellow-50 p-5 shadow-[0_14px_36px_rgba(21,87,213,0.08)]">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">Your balance</p>
            <span className="rounded-full bg-yellow-100 px-2.5 py-1 text-[10px] font-semibold text-yellow-800">ORBIT WALLET</span>
          </div>

          <div className="mt-2 flex items-end justify-between">
            <div>
              <div className="text-3xl font-bold tracking-tight text-blue-950">{balance} <span className="text-lg text-blue-700">TON</span></div>
              <p className="mt-1 text-xs text-slate-500">
                Connect wallet to start trading
              </p>
            </div>

            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-2xl">
              💎
            </div>
          </div>
        </section>

        {/* Quick actions */}
        <div className="mb-6 grid grid-cols-3 gap-3">

          <a
            href="/market"
            className="rounded-2xl bg-slate-50 p-4 text-center transition hover:bg-slate-100"
          >
            <div className="text-xl">🛍️</div>
            <div className="mt-2 text-xs text-slate-700">Market</div>
          </a>

          <a
            href="/cases"
            className="rounded-2xl bg-slate-50 p-4 text-center transition hover:bg-slate-100"
          >
            <div className="text-xl">🎁</div>
            <div className="mt-2 text-xs text-slate-700">Cases</div>
          </a>

          <a
            href="/lucky"
            className="rounded-2xl bg-slate-50 p-4 text-center transition hover:bg-slate-100"
          >
            <div className="text-xl">🍀</div>
            <div className="mt-2 text-xs text-slate-700">Lucky</div>
          </a>

        </div>

        {/* Featured */}
        <section className="mb-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Featured</h2>

            <a
              href="/market"
              className="text-sm text-slate-500"
            >
              View all
            </a>
          </div>

          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
            <div className="flex h-52 items-center justify-center bg-gradient-to-br from-blue-100 via-white to-yellow-50 text-8xl">
              💎
            </div>

            <div className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold">Diamond Ring</h3>

                  <p className="mt-1 text-sm text-slate-500">
                    Telegram Gifts
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-xs text-slate-500">Price</p>
                  <p className="font-semibold">24.5 TON</p>
                </div>
              </div>

              <a
                href="/market"
                className="mt-4 block w-full rounded-2xl bg-blue-700 py-3 text-center font-semibold text-white transition hover:bg-blue-800"
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
              className="text-sm text-slate-500"
            >
              See all
            </a>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {gifts.map((gift) => (
              <div
                key={gift.name}
                className="overflow-hidden rounded-3xl border border-slate-200 bg-white"
              >
                <div className="flex h-36 items-center justify-center bg-gradient-to-br from-blue-50 to-slate-100 text-6xl">
                  {gift.emoji}
                </div>

                <div className="p-3">
                  <h3 className="truncate text-sm font-semibold">
                    {gift.name}
                  </h3>

                  <p className="mt-1 truncate text-xs text-slate-500">
                    {gift.collection}
                  </p>

                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-sm font-semibold">
                      {gift.price}
                    </span>

                    <a
                      href="/market"
                      className="rounded-xl bg-slate-100 px-3 py-2 text-xs transition hover:bg-slate-200"
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
        <BottomNav active="home" />

      </div>
    </main>
  );
}
