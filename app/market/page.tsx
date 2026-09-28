'use client';

import HomeIcon from "../../components/HomeIcon";
import { useEffect, useState } from 'react';
import { getGifts } from '../../lib/api';
import TelegramAvatar from '../../components/TelegramAvatar';
import BottomNav from '../../components/BottomNav';

type StockGift = {
  id: string;
  name: string;
  collection: string;
  emoji: string | null;
  priceTon: string;
};

function formatTon(price: string) {
  const amount = Number(price);
  return Number.isFinite(amount)
    ? `${amount.toLocaleString('en-US', { maximumFractionDigits: 3 })} TON`
    : `${price} TON`;
}

export default function MarketPage() {
  const [search, setSearch] = useState('');
  const [stock, setStock] = useState<StockGift[]>([]);
  const [selectedGift, setSelectedGift] = useState<StockGift | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setLoadError(false);

    getGifts()
      .then((gifts) => {
        if (active) setStock(gifts);
      })
      .catch((error) => {
        console.error('Failed to load GIFTY stock:', error);
        if (active) {
          setStock([]);
          setLoadError(true);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [reloadKey]);

  const filteredGifts = stock.filter((gift) =>
    `${gift.name} ${gift.collection}`.toLowerCase().includes(search.trim().toLowerCase()),
  );

  return (
    <main className="min-h-screen bg-[#f5f8ff] text-slate-900">
      <div className="mx-auto min-h-screen max-w-[480px] px-4 pb-28">
        <header className="flex items-center justify-between py-5">
          <div>
            <p className="text-sm font-semibold tracking-[0.18em] text-blue-700">ORBIT</p>
            <h1 className="text-2xl font-bold">Marketplace</h1>
          </div>
          <span className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-2 text-xs font-semibold tracking-wide text-blue-700">
            GIFTY STOCK
          </span>
        </header>

        <div className="relative mb-4">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">🔎</span>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search gifts..."
            className="w-full rounded-2xl border border-slate-200 bg-white py-4 pl-11 pr-4 text-sm shadow-sm outline-none placeholder:text-slate-400 focus:border-blue-400"
          />
        </div>

        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold">Available in GIFTY</h2>
          <span className="text-xs text-slate-400">{filteredGifts.length} items</span>
        </div>

        {loading ? (
          <div className="py-20 text-center text-sm text-slate-500">Loading GIFTY stock…</div>
        ) : loadError ? (
          <div className="py-16 text-center">
            <p className="font-semibold">Marketplace is temporarily unavailable</p>
            <p className="mt-2 text-sm text-slate-500">Could not load GIFTY stock. Please try again.</p>
            <button
              onClick={() => setReloadKey((value) => value + 1)}
              className="mt-4 rounded-xl bg-slate-100 px-4 py-2 text-sm"
            >
              Retry
            </button>
          </div>
        ) : filteredGifts.length === 0 ? (
          <div className="py-20 text-center">
            <div className="text-5xl">🎁</div>
            <p className="mt-4 font-semibold">
              {search ? 'Nothing found' : 'GIFTY has no gifts in stock yet'}
            </p>
            <p className="mt-1 text-sm text-slate-400">
              {search ? 'Try another search' : 'New gifts will appear here when they are added to GIFTY stock.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filteredGifts.map((gift) => (
              <button
                key={gift.id}
                onClick={() => setSelectedGift(gift)}
                className="overflow-hidden rounded-3xl border border-slate-200 bg-white text-left transition hover:border-blue-200 active:scale-[0.98]"
              >
                <div className="flex h-40 items-center justify-center bg-gradient-to-br from-blue-50 via-white to-yellow-50 text-6xl">
                  {gift.emoji || '🎁'}
                </div>
                <div className="p-3">
                  <h3 className="truncate text-sm font-semibold">{gift.name}</h3>
                  <p className="mt-1 truncate text-xs text-slate-400">{gift.collection}</p>
                  <div className="mt-3">
                    <p className="text-[10px] text-slate-400">Price</p>
                    <p className="text-sm font-semibold">{formatTon(gift.priceTon)}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
        <BottomNav active="market" />

        {selectedGift && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/35 backdrop-blur-sm">
            <div className="w-full max-w-[480px] rounded-t-[32px] border-t border-slate-200 bg-white p-5">
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-lg font-semibold">Gift details</h2>
                <button
                  onClick={() => setSelectedGift(null)}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-50 text-slate-600"
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>
              <div className="flex h-56 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-50 to-slate-100 text-8xl">
                {selectedGift.emoji || '🎁'}
              </div>
              <div className="mt-5 flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-xl font-bold">{selectedGift.name}</h3>
                  <p className="mt-1 text-sm text-slate-500">{selectedGift.collection}</p>
                </div>
                <span className="rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-600">GIFTY stock</span>
              </div>
              <div className="mt-5 rounded-2xl bg-slate-50 p-4">
                <p className="text-xs text-slate-400">Price</p>
                <p className="mt-1 text-2xl font-bold">{formatTon(selectedGift.priceTon)}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
