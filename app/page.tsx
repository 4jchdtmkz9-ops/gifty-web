'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import BottomNav from '../components/BottomNav';
import MarketIcon from '../components/MarketIcon';
import CasesIcon from '../components/CasesIcon';
import LuckyIcon from '../components/LuckyIcon';
import { formatTonBalance } from '../lib/formatTon';
import { useOrbitLanguage } from '../components/OrbitLanguageContext';
import GramIcon from '../components/GramIcon';
import {
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
    price: '24.5 GRAM',
    emoji: '💎',
  },
  {
    name: 'Astral Shard',
    collection: 'Limited Gifts',
    price: '18.2 GRAM',
    emoji: '🔮',
  },
  {
    name: 'Golden Bear',
    collection: 'Rare Gifts',
    price: '42 GRAM',
    emoji: '🐻',
  },
  {
    name: 'Crystal Heart',
    collection: 'Premium Gifts',
    price: '31.8 GRAM',
    emoji: '💜',
  },
];

export default function Home() {
    const { t } = useOrbitLanguage();
    const walletAddress = useTonAddress();
    const [balance, setBalance] = useState('0');
    
  useEffect(() => {
  if (!walletAddress) {
    setBalance('0');
    return;
  }

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
              <p className="text-[10px] font-medium tracking-[0.18em] text-slate-500">{t('DIGITAL COLLECTIBLES')}</p>
            </div>
          </div>

          <TonConnectButton />
        </header>

        {/* Balance */}
        <section className="mb-5 overflow-hidden rounded-3xl border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-yellow-50 p-5 shadow-[0_14px_36px_rgba(21,87,213,0.08)]">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">{t('Your balance')}</p>
            <span className="rounded-full bg-yellow-100 px-2.5 py-1 text-[10px] font-semibold text-yellow-800">{t('ORBIT WALLET')}</span>
          </div>

          <div className="mt-2 flex items-end justify-between">
            <div>
              <div className="flex items-center gap-1.5 text-3xl font-bold tracking-tight text-blue-950"><GramIcon size={22} className="text-blue-700" />{formatTonBalance(balance)} <span className="text-lg text-blue-700">GRAM</span></div>
              {!walletAddress && (
                <p className="mt-1 text-xs text-slate-500">
                  {t('Connect wallet to start trading')}
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Quick actions */}
        <div className="mb-6 grid grid-cols-3 gap-3">

          <Link
            href="/market"
            className="rounded-2xl border border-blue-100 bg-white p-4 text-center shadow-[0_4px_14px_rgba(21,87,213,0.05)] transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-[0_8px_20px_rgba(21,87,213,0.1)]"
          >
            <span className="mx-auto flex h-10 w-10 items-center justify-center text-slate-700">
              <MarketIcon size={22} />
            </span>
            <div className="mt-2 text-xs font-medium text-slate-700">{t('Market')}</div>
          </Link>

          <Link
            href="/cases"
            className="rounded-2xl border border-blue-100 bg-white p-4 text-center shadow-[0_4px_14px_rgba(21,87,213,0.05)] transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-[0_8px_20px_rgba(21,87,213,0.1)]"
          >
            <span className="mx-auto flex h-10 w-10 items-center justify-center text-slate-700">
              <CasesIcon size={22} />
            </span>
            <div className="mt-2 text-xs font-medium text-slate-700">{t('Cases')}</div>
          </Link>

          <Link
            href="/lucky"
            className="rounded-2xl border border-blue-100 bg-white p-4 text-center shadow-[0_4px_14px_rgba(21,87,213,0.05)] transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-[0_8px_20px_rgba(21,87,213,0.1)]"
          >
            <span className="mx-auto flex h-10 w-10 items-center justify-center text-slate-700">
              <LuckyIcon size={22} />
            </span>
            <div className="mt-2 text-xs font-medium text-slate-700">{t('Lucky')}</div>
          </Link>

        </div>

        {/* Featured */}
        <section className="mb-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">{t('Featured')}</h2>

            <Link
              href="/market"
              className="text-sm text-slate-500"
            >
              {t('View all')}
            </Link>
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
                    {t('Telegram Gifts')}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-xs text-slate-500">{t('Price')}</p>
                  <p className="font-semibold"><GramIcon size={15} className="mr-1 text-blue-700" />24.5 GRAM</p>
                </div>
              </div>

              <Link
                href="/market"
                className="mt-4 block w-full rounded-2xl bg-blue-700 py-3 text-center font-semibold text-white transition hover:bg-blue-800"
              >
                {t('Buy now')}
              </Link>
            </div>
          </div>
        </section>

        {/* Trending */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">{t('Trending gifts')}</h2>

            <Link
              href="/market"
              className="text-sm text-slate-500"
            >
              {t('See all')}
            </Link>
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
                    {t(gift.collection)}
                  </p>

                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-sm font-semibold">
                      <GramIcon size={14} className="mr-1 text-blue-700" />
                      {gift.price}
                    </span>

                    <Link
                      href="/market"
                      className="rounded-xl bg-slate-100 px-3 py-2 text-xs transition hover:bg-slate-200"
                    >
                      {t('Buy')}
                    </Link>
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
