"use client";

import { useEffect, useState } from "react";
import { getGifts, createTransaction, createOffer } from '../../lib/api';



export default function MarketPage() {
  const [search, setSearch] = useState("");
  const [marketGifts, setMarketGifts] = useState<any[]>([]);
  useEffect(() => {
  getGifts()
    .then((data) => {
      setMarketGifts(
        data.map((gift: any) => ({
          id: gift.id,
          name: gift.name,
          collection: gift.collection,
          price: Number(gift.priceTon),
          emoji: gift.emoji ?? "🎁",
          rarity: "Rare",
        })),
      );
    })
    .catch((error) => {
      console.error("Failed to load gifts:", error);
    });
}, []);
  const [selectedGift, setSelectedGift] = useState<any | null>(null);

  const filteredGifts = marketGifts.filter((gift) => {
  const text = `${gift.name} ${gift.collection}`.toLowerCase();

  return text.includes(search.toLowerCase());
});

  return (
    <main className="min-h-screen bg-[#0b0b0f] text-white">
      <div className="mx-auto min-h-screen max-w-[480px] px-4 pb-28">
        {/* Header */}
        <header className="flex items-center justify-between py-5">
          <div>
            <p className="text-sm text-white/40">GIFTY</p>
            <h1 className="text-2xl font-bold">Marketplace</h1>
          </div>

          <button className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm">
            💎 0 TON
          </button>
        </header>

        {/* Search */}
        <div className="relative mb-4">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30">
            🔎
          </span>

          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search gifts..."
            className="w-full rounded-2xl border border-white/10 bg-[#15151c] py-4 pl-11 pr-4 text-sm outline-none placeholder:text-white/30 focus:border-white/20"
          />
        </div>

        {/* Filters */}
        <div className="mb-6 flex gap-2 overflow-x-auto pb-1">
          <button className="whitespace-nowrap rounded-xl bg-white px-4 py-2 text-xs font-semibold text-black">
            All
          </button>

          <button className="whitespace-nowrap rounded-xl bg-white/5 px-4 py-2 text-xs text-white/60">
            New
          </button>

          <button className="whitespace-nowrap rounded-xl bg-white/5 px-4 py-2 text-xs text-white/60">
            Rare
          </button>

          <button className="whitespace-nowrap rounded-xl bg-white/5 px-4 py-2 text-xs text-white/60">
            Epic
          </button>

          <button className="whitespace-nowrap rounded-xl bg-white/5 px-4 py-2 text-xs text-white/60">
            Legendary
          </button>
        </div>

        {/* Results */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold">Trending</h2>

          <span className="text-xs text-white/30">
            {filteredGifts.length} items
          </span>
        </div>

        {/* NFT grid */}
        <div className="grid grid-cols-2 gap-3">
          {filteredGifts.map((gift) => (
            <button
              key={gift.id}
              onClick={() => setSelectedGift(gift)}
              className="overflow-hidden rounded-3xl border border-white/10 bg-[#15151c] text-left transition hover:border-white/20 active:scale-[0.98]"
            >
              <div className="relative flex h-40 items-center justify-center bg-gradient-to-br from-[#292943] to-[#101016] text-6xl">
                {gift.emoji}

                <span className="absolute right-2 top-2 rounded-lg bg-black/40 px-2 py-1 text-[10px] text-white/60 backdrop-blur">
                  {gift.rarity ?? "Common"}
                </span>
              </div>

              <div className="p-3">
                <h3 className="truncate text-sm font-semibold">
                  {gift.name}
                </h3>

                <p className="mt-1 truncate text-xs text-white/35">
                  {gift.collection}
                </p>

                <div className="mt-3 flex items-end justify-between">
                  <div>
                    <p className="text-[10px] text-white/30">Price</p>
                    <p className="text-sm font-semibold">{gift.price} TON</p>
                  </div>

                  <span className="rounded-xl bg-white/10 px-3 py-2 text-xs">
                    View
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Empty state */}
        {filteredGifts.length === 0 && (
          <div className="py-20 text-center">
            <div className="text-5xl">🔎</div>
            <p className="mt-4 font-semibold">Nothing found</p>
            <p className="mt-1 text-sm text-white/30">
              Try another search
            </p>
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
              className="flex flex-col items-center gap-1 text-white"
            >
              <span>🛍️</span>
              <span className="text-[10px]">Market</span>
            </a>

            <button className="flex flex-col items-center gap-1 text-white/40">
              <span>🎁</span>
              <span className="text-[10px]">Cases</span>
            </button>

            <button className="flex flex-col items-center gap-1 text-white/40">
              <span>👤</span>
              <span className="text-[10px]">Profile</span>
            </button>
          </div>
        </nav>

        {/* NFT detail modal */}
        {selectedGift && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70 backdrop-blur-sm">
            <div className="w-full max-w-[480px] rounded-t-[32px] border-t border-white/10 bg-[#15151c] p-5">
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-lg font-semibold">NFT Details</h2>

                <button
                  onClick={() => setSelectedGift(null)}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-white/60"
                >
                  ✕
                </button>
              </div>

              <div className="flex h-56 items-center justify-center rounded-3xl bg-gradient-to-br from-[#292943] to-[#101016] text-8xl">
                {selectedGift.emoji}
              </div>

              <div className="mt-5">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xl font-bold">
                      {selectedGift.name}
                    </h3>

                    <p className="mt-1 text-sm text-white/40">
                      {selectedGift.collection}
                    </p>
                  </div>

                  <span className="rounded-xl bg-white/5 px-3 py-2 text-xs text-white/60">
                    {selectedGift.rarity ?? "Common"}
                  </span>
                </div>

                <div className="mt-5 rounded-2xl bg-white/5 p-4">
                  <p className="text-xs text-white/30">Current price</p>
                  <p className="mt-1 text-2xl font-bold">
                    {selectedGift.price} TON
                  </p>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
<button
  onClick={async () => {
    if (!selectedGift) return;

    try {
      const transaction = await createTransaction({
        type: 'BUY',
        amountTon: String(selectedGift.price),
        giftId: selectedGift.id,
      });

      console.log('GIFTY transaction created:', transaction);
      alert('Purchase created successfully');
    } catch (error) {
      console.error('Purchase error:', error);
      alert('Failed to create purchase');
    }
  }}
  className="rounded-2xl bg-white py-4 font-semibold text-black"
>
  Buy
</button>

                  <button
  onClick={async () => {
    if (!selectedGift) return;

    const amount = prompt(
      `Enter your offer for ${selectedGift.name} in TON:`,
    );

    if (!amount) return;

    try {
      const offer = await createOffer({
        amountTon: amount,
        giftId: selectedGift.id,
        buyerId: 'cmuirp33o0000xq06adzp8oe8',
      });

      console.log('GIFTY offer created:', offer);
      alert('Offer created successfully');
    } catch (error) {
      console.error('Offer error:', error);
      alert('Failed to create offer');
    }
  }}
  className="rounded-2xl bg-white/10 py-4 font-semibold"
>
  Make offer
</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}