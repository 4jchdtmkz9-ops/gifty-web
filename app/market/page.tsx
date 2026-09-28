'use client';

import { useEffect, useState } from 'react';
import { getGifts } from '../../lib/api';

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
    <main className="min-h-screen bg-[#0b0b0f] text-white">
      <div className="mx-auto min-h-screen max-w-[480px] px-4 pb-28">
        <header className="flex items-center justify-between py-5">
          <div>
            <p className="text-sm text-white/40">GIFTY</p>
            <h1 className="text-2xl font-bold">Marketplace</h1>
          </div>
          <span className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-xs text-white/60">
            GIFTY STOCK
          </span>
        </header>

        <div className="relative mb-4">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30">🔎</span>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search gifts..."
            className="w-full rounded-2xl border border-white/10 bg-[#15151c] py-4 pl-11 pr-4 text-sm outline-none placeholder:text-white/30 focus:border-white/20"
          />
        </div>

        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold">Available in GIFTY</h2>
          <span className="text-xs text-white/30">{filteredGifts.length} items</span>
        </div>

        {loading ? (
          <div className="py-20 text-center text-sm text-white/40">Loading GIFTY stock…</div>
        ) : loadError ? (
          <div className="py-16 text-center">
            <p className="font-semibold">Marketplace is temporarily unavailable</p>
            <p className="mt-2 text-sm text-white/40">Could not load GIFTY stock. Please try again.</p>
            <button
              onClick={() => setReloadKey((value) => value + 1)}
              className="mt-4 rounded-xl bg-white/10 px-4 py-2 text-sm"
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
            <p className="mt-1 text-sm text-white/35">
              {search ? 'Try another search' : 'New gifts will appear here when they are added to GIFTY stock.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filteredGifts.map((gift) => (
              <button
                key={gift.id}
                onClick={() => setSelectedGift(gift)}
                className="overflow-hidden rounded-3xl border border-white/10 bg-[#15151c] text-left transition hover:border-white/20 active:scale-[0.98]"
              >
                <div className="flex h-40 items-center justify-center bg-gradient-to-br from-[#292943] to-[#101016] text-6xl">
                  {gift.emoji || '🎁'}
                </div>
                <div className="p-3">
                  <h3 className="truncate text-sm font-semibold">{gift.name}</h3>
                  <p className="mt-1 truncate text-xs text-white/35">{gift.collection}</p>
                  <div className="mt-3">
                    <p className="text-[10px] text-white/30">Price</p>
                    <p className="text-sm font-semibold">{formatTon(gift.priceTon)}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        <nav className="fixed bottom-0 left-1/2 z-50 w-full max-w-[480px] -translate-x-1/2 border-t border-white/10 bg-[#0b0b0f]/95 px-4 py-3 backdrop-blur-xl">
          <div className="grid grid-cols-4">
            <a href="/" className="flex flex-col items-center gap-1 text-white/40">
              <span>🏠</span><span className="text-[10px]">Home</span>
            </a>
            <a href="/market" className="flex flex-col items-center gap-1 text-white">
              <span>🛍️</span><span className="text-[10px]">Market</span>
            </a>
            <a href="/cases" className="flex flex-col items-center gap-1 text-white/40">
              <span>🎁</span><span className="text-[10px]">Cases</span>
            </a>
            <a href="/profile" className="flex flex-col items-center gap-1 text-white/40">
              <span>👤</span><span className="text-[10px]">Profile</span>
            </a>
          </div>
        </nav>

        {selectedGift && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70 backdrop-blur-sm">
            <div className="w-full max-w-[480px] rounded-t-[32px] border-t border-white/10 bg-[#15151c] p-5">
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-lg font-semibold">Gift details</h2>
                <button
                  onClick={() => setSelectedGift(null)}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-white/60"
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>
              <div className="flex h-56 items-center justify-center rounded-3xl bg-gradient-to-br from-[#292943] to-[#101016] text-8xl">
                {selectedGift.emoji || '🎁'}
              </div>
              <div className="mt-5 flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-xl font-bold">{selectedGift.name}</h3>
                  <p className="mt-1 text-sm text-white/40">{selectedGift.collection}</p>
                </div>
                <span className="rounded-xl bg-white/5 px-3 py-2 text-xs text-white/60">GIFTY stock</span>
              </div>
              <div className="mt-5 rounded-2xl bg-white/5 p-4">
                <p className="text-xs text-white/30">Price</p>
                <p className="mt-1 text-2xl font-bold">{formatTon(selectedGift.priceTon)}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
