'use client';

import { useEffect, useState } from 'react';
import { getGifts } from '../../lib/api';
import BottomNav from '../../components/BottomNav';
import TonBalanceBadge from '../../components/TonBalanceBadge';
import GramIcon from '../../components/GramIcon';
import { giftCollectionImage, normalizeGiftName, telegramGiftCollections } from '../../lib/telegramGiftCollections';

type StockGift = {
  id: string;
  name: string;
  collection: string;
  emoji: string | null;
  priceTon: string;
  imageUrl?: string | null;
  modelRarityPerMille?: number | null;
  backdropRarityPerMille?: number | null;
  symbolRarityPerMille?: number | null;
  backdropName?: string | null;
  backdropColor?: string | null;
  symbolName?: string | null;
  symbolImageUrl?: string | null;
};

type SortKey = 'price-asc' | 'price-desc' | 'model-rarity' | 'backdrop-rarity' | 'symbol-rarity';

const sortOptions: { id: SortKey; label: string }[] = [
  { id: 'price-asc', label: 'Price: low to high' },
  { id: 'price-desc', label: 'Price: high to low' },
  { id: 'model-rarity', label: 'Model rarity: rarest first' },
  { id: 'backdrop-rarity', label: 'Background rarity: rarest first' },
  { id: 'symbol-rarity', label: 'Symbol rarity: rarest first' },
];

const giftBackdrops = [
  ['Black', '#17191d'], ['Onyx Black', '#202329'], ['Gunmetal', '#30363d'], ['Mint Green', '#a8e6cf'],
  ['Camo Green', '#596b3a'], ['Mexican Pink', '#e94b9b'], ['Ivory White', '#f5f0df'], ['Lemongrass', '#d9e978'],
  ['Neon Blue', '#218cff'], ['Purple', '#8756d9'], ['Orange', '#f28b32'], ['Cyberpunk', '#fd4be3'],
  ['Platinum', '#d5d9df'], ['Midnight Blue', '#172c55'], ['Malachite', '#14a878'], ['Electric Indigo', '#6544df'],
  ['Desert Sand', '#c7a77a'], ['Pure Gold', '#e5b83e'], ['Emerald', '#168c5d'], ['Raspberry', '#d82f68'],
  ['Electric Purple', '#a239ea'], ['Light Olive', '#a8ad65'], ['Copper', '#b66a45'], ['Marine Blue', '#276a9b'],
  ['Grape', '#713f94'], ['Dark Lilac', '#9274aa'], ['Shamrock Green', '#39a66b'], ['Navy Blue', '#233b68'],
  ['Hunter Green', '#355b45'], ['Pistachio', '#afd082'], ['Pacific Cyan', '#25b5c6'], ['Strawberry', '#ee6f89'],
  ['French Blue', '#3978bd'], ['Burgundy', '#742d49'], ['Seal Brown', '#563d35'], ['Cobalt Blue', '#2756c6'],
  ['Tactical Pine', '#3b5144'], ['Sapphire', '#2458a6'], ['Old Gold', '#b18a3c'], ['Roman Silver', '#87939b'],
  ['Amber', '#e1a52c'], ['Persimmon', '#e8783f'], ['Pine Green', '#27634a'], ['Rifle Green', '#465448'],
  ['Tomato', '#e34b43'], ['Chestnut', '#89543f'], ['Turquoise', '#37c1bd'], ['Caramel', '#bd8752'],
  ['Indigo Dye', '#354d8c'], ['Fandango', '#c44491'], ['Carmine', '#b92e4b'], ['Aquamarine', '#68d6c7'],
  ['Dark Green', '#174b38'], ['Satin Gold', '#c6a456'], ['Ranger Green', '#596b51'], ['Khaki Green', '#9b9a5a'],
  ['Lavender', '#b8a0e0'], ['Azure Blue', '#39a1de'], ['Cappuccino', '#b28a6b'], ['Mystic Pearl', '#ded9ed'],
  ['Celtic Blue', '#2877bb'], ['Rosewood', '#70404e'], ['Chocolate', '#70452f'], ['Feldgrau', '#667267'],
  ['French Violet', '#7850a0'], ['Sky Blue', '#83c9ee'], ['English Violet', '#57446f'], ['Silver Blue', '#829caf'],
  ['Gunship Green', '#4b6255'], ['Coral Red', '#f27670'], ['Mustard', '#d2aa39'], ['Moonstone', '#83aaa7'],
  ['Steel Grey', '#75818a'], ['Battleship Grey', '#69737d'], ['Burnt Sienna', '#b9563d'], ['Deep Cyan', '#087e88'],
  ['Jade Green', '#45a982'], ['Carrot Juice', '#ed7d27'], ['Pacific Green', '#20aa87'], ['Fire Engine', '#cf3038'],
] as const;

function normalizeTrait(value: string) {
  return value.trim().toLocaleLowerCase();
}

function formatGram(price: string) {
  const amount = Number(price);
  return Number.isFinite(amount)
    ? `${amount.toLocaleString('en-US', { maximumFractionDigits: 3 })} GRAM`
    : `${price} GRAM`;
}

export default function MarketPage() {
  const [search, setSearch] = useState('');
  const [stock, setStock] = useState<StockGift[]>([]);
  const [selectedGift, setSelectedGift] = useState<StockGift | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [collectionOpen, setCollectionOpen] = useState(false);
  const [filterSearch, setFilterSearch] = useState('');
  const [backdropSearch, setBackdropSearch] = useState('');
  const [symbolSearch, setSymbolSearch] = useState('');
  const [collectionSearch, setCollectionSearch] = useState('');
  const [selectedCollections, setSelectedCollections] = useState<string[]>([]);
  const [selectedBackdrops, setSelectedBackdrops] = useState<string[]>([]);
  const [selectedSymbol, setSelectedSymbol] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [filterSection, setFilterSection] = useState<'collections' | 'backdrops' | 'symbols' | null>(null);
  const [selectedCollection, setSelectedCollection] = useState('all');
  const [sortBy, setSortBy] = useState<SortKey>('price-asc');

  useEffect(() => {
    let active = true;

    getGifts()
      .then((gifts) => {
        if (active) setStock(gifts);
      })
      .catch((error) => {
        console.error('Failed to load ORBIT stock:', error);
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

  const selectedCollectionName = telegramGiftCollections.find((item) => item.name === selectedCollection)?.giftName;
  const belongsToCollection = (gift: StockGift, collectionGiftName: string) =>
    normalizeGiftName(gift.name) === normalizeGiftName(collectionGiftName);

  const activeFilterCount = selectedCollections.length + selectedBackdrops.length + Number(Boolean(selectedSymbol)) + Number(Boolean(minPrice || maxPrice)) + Number(selectedCollection !== 'all');

  const filteredGifts = stock
    .filter((gift) => `${gift.name} ${gift.collection}`.toLowerCase().includes(search.trim().toLowerCase()))
    .filter((gift) => !selectedCollectionName || belongsToCollection(gift, selectedCollectionName))
    .filter((gift) => {
      const price = Number(gift.priceTon);
      return (minPrice === '' || (Number.isFinite(price) && price >= Number(minPrice)))
        && (maxPrice === '' || (Number.isFinite(price) && price <= Number(maxPrice)));
    })
    .filter((gift) => selectedBackdrops.length === 0 || selectedBackdrops.some((name) =>
      normalizeTrait(gift.backdropName ?? '') === normalizeTrait(name)
        || normalizeTrait(gift.backdropColor ?? '') === normalizeTrait(giftBackdrops.find(([backdropName]) => backdropName === name)?.[1] ?? ''),
    ))
    .filter((gift) => !selectedSymbol || normalizeTrait(gift.symbolName ?? '') === normalizeTrait(selectedSymbol))
    .filter((gift) => selectedCollections.length === 0 || selectedCollections.some((collectionName) => {
      const collection = telegramGiftCollections.find((item) => item.name === collectionName);
      return collection ? belongsToCollection(gift, collection.giftName) : false;
    }))
    .sort((a, b) => {
      if (sortBy === 'price-asc' || sortBy === 'price-desc') {
        const difference = Number(a.priceTon) - Number(b.priceTon);
        return sortBy === 'price-asc' ? difference : -difference;
      }

      const rarityKey = sortBy === 'model-rarity'
        ? 'modelRarityPerMille'
        : sortBy === 'backdrop-rarity'
          ? 'backdropRarityPerMille'
          : 'symbolRarityPerMille';
      const rarityA = a[rarityKey];
      const rarityB = b[rarityKey];
      if (rarityA == null && rarityB == null) return a.name.localeCompare(b.name);
      if (rarityA == null) return 1;
      if (rarityB == null) return -1;
      return rarityA - rarityB;
    });

  const filterChoices = telegramGiftCollections.filter((item) =>
    `${item.name} ${item.giftName}`.toLowerCase().includes(filterSearch.trim().toLowerCase()),
  );
  const collectionChoices = telegramGiftCollections.filter((item) =>
    `${item.name} ${item.giftName}`.toLowerCase().includes(collectionSearch.trim().toLowerCase()),
  );
  const backdropChoices = giftBackdrops.filter(([name]) => name.toLowerCase().includes(backdropSearch.trim().toLowerCase()));
  const symbolChoices = [...new Map(stock
    .filter((gift) => Boolean(gift.symbolName))
    .map((gift) => [normalizeTrait(gift.symbolName!), { name: gift.symbolName!, imageUrl: gift.symbolImageUrl ?? null }]),
  ).values()].filter((symbol) => symbol.name.toLowerCase().includes(symbolSearch.trim().toLowerCase()));

  const clearFilters = () => {
    setSelectedCollections([]);
    setSelectedBackdrops([]);
    setSelectedSymbol('');
    setMinPrice('');
    setMaxPrice('');
    setSelectedCollection('all');
    setFilterSearch('');
    setBackdropSearch('');
    setSymbolSearch('');
    setCollectionSearch('');
    setFilterSection(null);
  };

  return (
    <main className="min-h-screen bg-[#f5f8ff] text-slate-900">
      <div className="mx-auto min-h-screen max-w-[480px] px-4 pb-28">
        <header className="flex items-start justify-between gap-3 py-5">
          <div>
            <p className="text-sm font-semibold tracking-[0.18em] text-blue-700">ORBIT</p>
            <h1 className="text-2xl font-bold">Marketplace</h1>
          </div>
          <TonBalanceBadge />
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

        <div className="mb-5 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <button type="button" onClick={() => setFilterOpen(true)} className="inline-flex shrink-0 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 shadow-sm">
            <svg aria-hidden="true" viewBox="0 0 20 20" className="h-5 w-5" fill="none"><path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><circle cx="7" cy="5" r="2" fill="white" stroke="currentColor" strokeWidth="1.8"/><circle cx="13" cy="10" r="2" fill="white" stroke="currentColor" strokeWidth="1.8"/><circle cx="8" cy="15" r="2" fill="white" stroke="currentColor" strokeWidth="1.8"/></svg>
            Filter{activeFilterCount > 0 && <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700">{activeFilterCount}</span>}
            <span className="text-slate-400">⌄</span>
          </button>
          <button type="button" onClick={() => setSortOpen(true)} className="inline-flex shrink-0 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 shadow-sm">
            <svg aria-hidden="true" viewBox="0 0 20 20" className="h-5 w-5" fill="none"><path d="M6 16V4m0 0L3 7m3-3 3 3m5-3v12m0 0 3-3m-3 3-3-3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Sort <span className="text-slate-400">⌄</span>
          </button>
          <button type="button" onClick={() => setCollectionOpen(true)} className="inline-flex shrink-0 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 shadow-sm">
            <span className="max-w-28 truncate">{selectedCollection === 'all' ? 'Collection' : selectedCollection}</span>
            <span className="text-slate-400">⌄</span>
          </button>
          <button type="button" onClick={clearFilters} title="Clear filters" aria-label="Clear all filters" className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-red-100 bg-white text-red-500 shadow-sm transition hover:bg-red-50 active:scale-95">
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M8 6V4h8v2m3 0-.9 14H5.9L5 6m4 4v6m6-6v6" /></svg>
          </button>
        </div>

        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold">Available in ORBIT</h2>
          <span className="text-xs text-slate-400">{filteredGifts.length} items</span>
        </div>

        {loading ? (
          <div className="py-20 text-center text-sm text-slate-500">Loading ORBIT stock…</div>
        ) : loadError ? (
          <div className="py-16 text-center">
            <p className="font-semibold">Marketplace is temporarily unavailable</p>
            <p className="mt-2 text-sm text-slate-500">Could not load ORBIT stock. Please try again.</p>
            <button
              onClick={() => {
                setLoading(true);
                setLoadError(false);
                setReloadKey((value) => value + 1);
              }}
              className="mt-4 rounded-xl bg-slate-100 px-4 py-2 text-sm"
            >
              Retry
            </button>
          </div>
        ) : filteredGifts.length === 0 ? (
          <div className="py-20 text-center">
            <div className="text-5xl">🎁</div>
            <p className="mt-4 font-semibold">
              {search ? 'Nothing found' : 'ORBIT has no gifts in stock yet'}
            </p>
            <p className="mt-1 text-sm text-slate-400">
              {search ? 'Try another search' : 'New gifts will appear here when they are added to ORBIT stock.'}
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
                  {gift.imageUrl ? <img src={gift.imageUrl} alt={gift.name} loading="lazy" className="h-full w-full object-contain p-3" /> : gift.emoji || '🎁'}
                </div>
                <div className="p-3">
                  <h3 className="truncate text-sm font-semibold">{gift.name}</h3>
                  <p className="mt-1 truncate text-xs text-slate-400">{gift.collection}</p>
                  <div className="mt-3">
                    <p className="text-[10px] text-slate-400">Price</p>
            <p className="text-sm font-semibold"><GramIcon size={14} className="mr-1 text-blue-700" />{formatGram(gift.priceTon)}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
        <BottomNav active="market" />

        {filterOpen && (
          <div className="fixed inset-0 z-[110] flex items-end justify-center bg-slate-950/40 backdrop-blur-sm" onClick={() => setFilterOpen(false)}>
            <section role="dialog" aria-modal="true" aria-labelledby="market-filter-title" onClick={(event) => event.stopPropagation()} className="max-h-[82vh] w-full max-w-[480px] overflow-hidden rounded-t-[30px] bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                <div><h2 id="market-filter-title" className="text-lg font-bold">Filter NFTs</h2><p className="mt-0.5 text-xs text-slate-500">Search and select from {telegramGiftCollections.length} gift collections</p></div>
                <button type="button" onClick={() => setFilterOpen(false)} aria-label="Close filters" className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600">×</button>
              </div>
              <div className="max-h-[58vh] space-y-3 overflow-y-auto px-4 py-3">
                <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3">
                  <h3 className="mb-2 text-sm font-semibold text-slate-800">Price range <span className="font-normal text-slate-400">(TON)</span></h3>
                  <div className="grid grid-cols-2 gap-2">
                    <label className="text-xs text-slate-500">From<input type="number" min="0" step="any" inputMode="decimal" value={minPrice} onChange={(event) => setMinPrice(event.target.value)} placeholder="0" className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-blue-400" /></label>
                    <label className="text-xs text-slate-500">To<input type="number" min="0" step="any" inputMode="decimal" value={maxPrice} onChange={(event) => setMaxPrice(event.target.value)} placeholder="No limit" className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-blue-400" /></label>
                  </div>
                </div>

                <div className="overflow-hidden rounded-2xl border border-slate-100">
                  <button type="button" onClick={() => setFilterSection(filterSection === 'backdrops' ? null : 'backdrops')} className="flex w-full items-center justify-between px-3 py-3 text-left">
                    <span><span className="block text-sm font-semibold text-slate-800">Background</span><span className="text-xs text-slate-400">{selectedBackdrops.length ? selectedBackdrops.join(', ') : 'Choose backdrop color'}</span></span><span className="text-slate-400">{filterSection === 'backdrops' ? '⌃' : '⌄'}</span>
                  </button>
                  {filterSection === 'backdrops' && <div className="border-t border-slate-100 p-3">
                    <input value={backdropSearch} onChange={(event) => setBackdropSearch(event.target.value)} placeholder="Search background..." className="mb-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-blue-400" />
                    <div className="max-h-48 space-y-0.5 overflow-y-auto">
                      {backdropChoices.map(([name, color]) => <label key={name} className="flex cursor-pointer items-center gap-3 rounded-xl px-2 py-2 hover:bg-slate-50">
                        <span className="h-5 w-5 shrink-0 rounded-full border border-black/10 shadow-inner" style={{ backgroundColor: color }} />
                        <span className="flex-1 text-sm text-slate-700">{name}</span>
                        <input type="checkbox" checked={selectedBackdrops.includes(name)} onChange={() => setSelectedBackdrops((items) => items.includes(name) ? items.filter((item) => item !== name) : [...items, name])} className="h-4 w-4 accent-blue-700" aria-label={`Select ${name} background`} />
                      </label>)}
                    </div>
                  </div>}
                </div>

                <div className="overflow-hidden rounded-2xl border border-slate-100">
                  <button type="button" onClick={() => setFilterSection(filterSection === 'symbols' ? null : 'symbols')} className="flex w-full items-center justify-between px-3 py-3 text-left">
                    <span><span className="block text-sm font-semibold text-slate-800">Symbol</span><span className="text-xs text-slate-400">{selectedSymbol || 'Choose gift symbol'}</span></span><span className="text-slate-400">{filterSection === 'symbols' ? '⌃' : '⌄'}</span>
                  </button>
                  {filterSection === 'symbols' && <div className="border-t border-slate-100 p-3">
                    <input value={symbolSearch} onChange={(event) => setSymbolSearch(event.target.value)} placeholder="Search symbol..." className="mb-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-blue-400" />
                    {symbolChoices.length ? <div className="max-h-48 space-y-0.5 overflow-y-auto">{symbolChoices.map((symbol) => <button key={normalizeTrait(symbol.name)} type="button" onClick={() => setSelectedSymbol(selectedSymbol === symbol.name ? '' : symbol.name)} className={`flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left ${selectedSymbol === symbol.name ? 'bg-blue-50' : 'hover:bg-slate-50'}`}>
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-100 text-lg">{symbol.imageUrl ? <img src={symbol.imageUrl} alt="" className="h-full w-full object-contain" onError={(event) => { event.currentTarget.style.display = 'none'; }} /> : '✦'}</span>
                      <span className="flex-1 text-sm text-slate-700">{symbol.name}</span><span className="text-lg text-slate-500">{selectedSymbol === symbol.name ? '✓' : '›'}</span>
                    </button>)}</div> : <p className="py-5 text-center text-xs leading-5 text-slate-500">No symbol data in the current ORBIT inventory yet. Symbols will appear here when NFT trait data is added.</p>}
                  </div>}
                </div>

                <div className="overflow-hidden rounded-2xl border border-slate-100">
                  <button type="button" onClick={() => setFilterSection(filterSection === 'collections' ? null : 'collections')} className="flex w-full items-center justify-between px-3 py-3 text-left">
                    <span><span className="block text-sm font-semibold text-slate-800">Gift collections</span><span className="text-xs text-slate-400">{selectedCollections.length ? `${selectedCollections.length} selected` : `Select from ${telegramGiftCollections.length} collections`}</span></span><span className="text-slate-400">{filterSection === 'collections' ? '⌃' : '⌄'}</span>
                  </button>
                  {filterSection === 'collections' && <div className="border-t border-slate-100 p-3">
                    <input value={filterSearch} onChange={(event) => setFilterSearch(event.target.value)} placeholder="Search NFT by name..." className="mb-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-blue-400" />
                    <div className="max-h-52 overflow-y-auto">
                      {filterChoices.length === 0 ? <p className="py-5 text-center text-sm text-slate-500">No matching collections.</p> : filterChoices.map((gift) => {
                        const stockCount = stock.filter((stockGift) => belongsToCollection(stockGift, gift.giftName)).length;
                        return <label key={gift.slug} className="flex cursor-pointer items-center gap-3 border-b border-slate-100 py-2 last:border-0">
                          <span className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-50 text-lg"><span aria-hidden="true">🎁</span><img src={giftCollectionImage(gift.slug)} alt="" loading="lazy" className="absolute h-9 w-9 rounded-full object-cover" onError={(event) => { event.currentTarget.style.display = 'none'; }} /></span>
                          <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium text-slate-800">{gift.name}</span><span className="text-[11px] text-slate-400">{stockCount} in ORBIT stock</span></span>
                          <input type="checkbox" checked={selectedCollections.includes(gift.name)} onChange={() => setSelectedCollections((items) => items.includes(gift.name) ? items.filter((name) => name !== gift.name) : [...items, gift.name])} className="h-4 w-4 accent-blue-700" aria-label={`Select ${gift.name}`} />
                        </label>;
                      })}
                    </div>
                  </div>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 border-t border-slate-100 p-4">
                <button type="button" onClick={clearFilters} className="rounded-2xl bg-slate-100 py-3 text-sm font-semibold text-slate-700">Clear</button>
                <button type="button" onClick={() => setFilterOpen(false)} className="rounded-2xl bg-blue-700 py-3 text-sm font-semibold text-white">Show {filteredGifts.length} NFTs</button>
              </div>
            </section>
          </div>
        )}

        {sortOpen && (
          <div className="fixed inset-0 z-[110] flex items-end justify-center bg-slate-950/40 backdrop-blur-sm" onClick={() => setSortOpen(false)}>
            <section role="dialog" aria-modal="true" aria-labelledby="market-sort-title" onClick={(event) => event.stopPropagation()} className="w-full max-w-[480px] rounded-t-[30px] bg-white p-5 shadow-2xl">
              <div className="mb-3 flex items-center justify-between"><div><h2 id="market-sort-title" className="text-lg font-bold">Sort NFTs</h2><p className="mt-0.5 text-xs text-slate-500">Rarity sorting needs Telegram attributes. Items without them are ordered by name.</p></div><button type="button" onClick={() => setSortOpen(false)} aria-label="Close sorting" className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600">×</button></div>
              <div className="space-y-1">
                {sortOptions.map((option) => {
                  return <button key={option.id} type="button" onClick={() => { setSortBy(option.id); setSortOpen(false); }} className="flex w-full items-center justify-between rounded-xl px-3 py-3 text-left text-sm text-slate-700 hover:bg-slate-50">
                    <span>{option.label}</span>
                    <span className={`flex h-5 w-5 items-center justify-center rounded-full border ${sortBy === option.id ? 'border-blue-700 bg-blue-700 text-white' : 'border-slate-300 text-transparent'}`}>✓</span>
                  </button>;
                })}
              </div>
            </section>
          </div>
        )}

        {collectionOpen && (
          <div className="fixed inset-0 z-[110] flex items-end justify-center bg-slate-950/40 backdrop-blur-sm" onClick={() => setCollectionOpen(false)}>
            <section role="dialog" aria-modal="true" aria-labelledby="market-collection-title" onClick={(event) => event.stopPropagation()} className="max-h-[82vh] w-full max-w-[480px] overflow-hidden rounded-t-[30px] bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                <div><h2 id="market-collection-title" className="text-lg font-bold">Choose collection</h2><p className="mt-0.5 text-xs text-slate-500">{telegramGiftCollections.length} Telegram gift collections</p></div>
                <button type="button" onClick={() => setCollectionOpen(false)} aria-label="Close collections" className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600">×</button>
              </div>
              <div className="border-b border-slate-100 p-4">
                <input value={collectionSearch} onChange={(event) => setCollectionSearch(event.target.value)} placeholder="Search collection..." className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-400" />
              </div>
              <div className="max-h-[55vh] overflow-y-auto px-4 py-2">
                <button type="button" onClick={() => { setSelectedCollection('all'); setCollectionOpen(false); }} className="flex w-full items-center justify-between border-b border-slate-100 py-3 text-left text-sm font-semibold text-slate-700">
                  <span>All collections</span><span className={`flex h-5 w-5 items-center justify-center rounded-full border ${selectedCollection === 'all' ? 'border-blue-700 bg-blue-700 text-white' : 'border-slate-300 text-transparent'}`}>✓</span>
                </button>
                {collectionChoices.map((collection) => <button key={collection.slug} type="button" onClick={() => { setSelectedCollection(collection.name); setCollectionOpen(false); }} className="flex w-full items-center gap-3 border-b border-slate-100 py-3 text-left last:border-0">
                  <span className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-50">
                    <span aria-hidden="true">🎁</span>
                    <img src={giftCollectionImage(collection.slug)} alt="" loading="lazy" className="absolute h-11 w-11 rounded-xl object-cover" onError={(event) => { event.currentTarget.style.display = 'none'; }} />
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-800">{collection.name}</span>
                  <span className={`flex h-5 w-5 items-center justify-center rounded-full border ${selectedCollection === collection.name ? 'border-blue-700 bg-blue-700 text-white' : 'border-slate-300 text-transparent'}`}>✓</span>
                </button>)}
                {collectionChoices.length === 0 && <p className="py-10 text-center text-sm text-slate-500">No matching collections.</p>}
              </div>
            </section>
          </div>
        )}

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
                <span className="rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-600">ORBIT stock</span>
              </div>
              <div className="mt-5 rounded-2xl bg-slate-50 p-4">
                <p className="text-xs text-slate-400">Price</p>
            <p className="mt-1 text-2xl font-bold"><GramIcon size={20} className="mr-1 text-blue-700" />{formatGram(selectedGift.priceTon)}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
