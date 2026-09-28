'use client';

import { useEffect, useState } from 'react';
import { getMarketplaceNfts } from '../../lib/api';

type MarketplaceNft = {
  id: string;
  name: string;
  photo_url: string;
  collection_id: string;
  external_collection_number: number;
  status: string;
  attributes: Array<{ type: string; value: string; rarity_per_mille: number }>;
  price: string | null;
  floor_price?: string | null;
  animation_url?: string | null;
  ton_address?: string | null;
};

const PAGE_SIZE = 50;

function formatTon(price: string | null) {
  if (!price) return 'Price unavailable';
  const amount = Number(price);
  return Number.isFinite(amount)
    ? `${amount.toLocaleString('en-US', { maximumFractionDigits: 3 })} TON`
    : `${price} TON`;
}

export default function MarketPage() {
  const [search, setSearch] = useState('');
  const [marketGifts, setMarketGifts] = useState<MarketplaceNft[]>([]);
  const [selectedGift, setSelectedGift] = useState<MarketplaceNft | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(() => {
      setLoading(true);
      setLoadError(false);
      getMarketplaceNfts(0, search)
        .then((data) => {
          if (!active) return;
          setMarketGifts(data.items);
          setTotalCount(data.totalCount);
        })
        .catch((error) => {
          console.error('Failed to load Portals listings:', error);
          if (active) {
            setMarketGifts([]);
            setTotalCount(0);
            setLoadError(true);
          }
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }, search ? 300 : 0);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [search, reloadKey]);

  async function loadMore() {
    setLoadingMore(true);
    try {
      const data = await getMarketplaceNfts(marketGifts.length, search);
      setMarketGifts((current) => [...current, ...data.items]);
      setTotalCount(data.totalCount);
    } catch (error) {
      console.error('Failed to load more Portals listings:', error);
      setLoadError(true);
    } finally {
      setLoadingMore(false);
    }
  }

  const filteredGifts = marketGifts;

  return (
    <main className="min-h-screen bg-[#0b0b0f] text-white">
      <div className="mx-auto min-h-screen max-w-[480px] px-4 pb-28">
        <header className="flex items-center justify-between py-5">
          <div>
            <p className="text-sm text-white/40">GIFTY</p>
            <h1 className="text-2xl font-bold">Marketplace</h1>
          </div>
          <span className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-xs text-white/60">
            PORTALS
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
          <h2 className="font-semibold">Live Portals listings</h2>
          <span className="text-xs text-white/30">
            {totalCount.toLocaleString()} items
          </span>
        </div>

        {loading ? (
          <div className="py-20 text-center text-sm text-white/40">Loading live listings…</div>
        ) : loadError ? (
          <div className="py-16 text-center">
            <p className="font-semibold">Marketplace is temporarily unavailable</p>
            <p className="mt-2 text-sm text-white/40">
              Live Portals listings could not be loaded. Please try again shortly.
            </p>
            <button
              onClick={() => setReloadKey((value) => value + 1)}
              className="mt-4 rounded-xl bg-white/10 px-4 py-2 text-sm"
            >
              Retry
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              {filteredGifts.map((gift) => (
                <button
                  key={gift.id}
                  onClick={() => setSelectedGift(gift)}
                  className="overflow-hidden rounded-3xl border border-white/10 bg-[#15151c] text-left transition hover:border-white/20 active:scale-[0.98]"
                >
                  <div className="relative flex h-40 items-center justify-center overflow-hidden bg-gradient-to-br from-[#292943] to-[#101016]">
                    {gift.photo_url ? (
                      <div
                        role="img"
                        aria-label={gift.name}
                        className="absolute inset-0 bg-contain bg-center bg-no-repeat"
                        style={{ backgroundImage: `url("${gift.photo_url.replaceAll('"', '%22')}")` }}
                      />
                    ) : (
                      <span className="text-6xl">🎁</span>
                    )}
                    <span className="absolute right-2 top-2 rounded-lg bg-black/50 px-2 py-1 text-[10px] text-white/80 backdrop-blur">
                      #{gift.external_collection_number}
                    </span>
                  </div>

                  <div className="p-3">
                    <h3 className="truncate text-sm font-semibold">{gift.name}</h3>
                    <p className="mt-1 truncate text-xs text-white/35">
                      Telegram Gift · {gift.attributes?.map((attribute) => attribute.value).join(' · ') || 'Collectible'}
                    </p>
                    <div className="mt-3 flex items-end justify-between">
                      <div>
                        <p className="text-[10px] text-white/30">Price</p>
                        <p className="text-sm font-semibold">{formatTon(gift.price)}</p>
                      </div>
                      <span className="rounded-xl bg-white/10 px-3 py-2 text-xs">View</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {!filteredGifts.length && (
              <div className="py-20 text-center">
                <div className="text-5xl">🔎</div>
                <p className="mt-4 font-semibold">Nothing found</p>
                <p className="mt-1 text-sm text-white/30">Try another search</p>
              </div>
            )}

            {marketGifts.length < totalCount && (
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="mt-5 w-full rounded-2xl bg-white/10 py-3 text-sm font-medium disabled:opacity-50"
              >
                {loadingMore ? 'Loading…' : 'Load more'}
              </button>
            )}
          </>
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
                <h2 className="text-lg font-semibold">NFT Details</h2>
                <button
                  onClick={() => setSelectedGift(null)}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-white/60"
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>
              <div className="flex h-56 items-center justify-center overflow-hidden rounded-3xl bg-gradient-to-br from-[#292943] to-[#101016]">
                {selectedGift.photo_url && (
                  <div
                    role="img"
                    aria-label={selectedGift.name}
                    className="h-full w-full bg-contain bg-center bg-no-repeat"
                    style={{ backgroundImage: `url("${selectedGift.photo_url.replaceAll('"', '%22')}")` }}
                  />
                )}
              </div>
              <div className="mt-5 flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-xl font-bold">{selectedGift.name}</h3>
                  <p className="mt-1 text-sm text-white/40">
                    Telegram Gift #{selectedGift.external_collection_number}
                  </p>
                </div>
                <span className="rounded-xl bg-white/5 px-3 py-2 text-xs text-white/60">Portals</span>
              </div>
              <div className="mt-5 rounded-2xl bg-white/5 p-4">
                <p className="text-xs text-white/30">Current Portals price</p>
                <p className="mt-1 text-2xl font-bold">{formatTon(selectedGift.price)}</p>
              </div>
              {!!selectedGift.attributes?.length && (
                <div className="mt-4 grid grid-cols-3 gap-2">
                  {selectedGift.attributes.map((attribute) => (
                    <div key={`${attribute.type}-${attribute.value}`} className="rounded-xl bg-white/5 p-3">
                      <p className="text-[10px] capitalize text-white/35">{attribute.type}</p>
                      <p className="mt-1 truncate text-xs font-medium">{attribute.value}</p>
                    </div>
                  ))}
                </div>
              )}
              <p className="mt-4 text-center text-xs text-white/35">
                Purchases in GIFTY will be available in the next stage.
              </p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
