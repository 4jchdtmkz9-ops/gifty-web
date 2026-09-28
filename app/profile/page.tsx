"use client";

import { useCallback, useEffect, useState } from "react";
import {
  acceptOffer,
  cancelOffer,
  getIncomingOffers,
  getListedGifts,
  getOffers,
  getOwnedGifts,
  rejectOffer,
  sellGift,
  unlistGift,
} from "../../lib/api";

type Gift = {
  id: string;
  name: string;
  collection: string;
  emoji?: string | null;
  priceTon: string | number;
  status: string;
};

type Offer = {
  id: string;
  amountTon: string | number;
  status: string;
  gift?: Gift;
  buyer?: { username?: string | null };
};

type Tab = "owned" | "listed" | "offers";

function formatTon(amount: string | number) {
  const value = Number(amount);
  return Number.isFinite(value) ? value.toLocaleString(undefined, { maximumFractionDigits: 9 }) : amount;
}

export default function ProfilePage() {
  const [tab, setTab] = useState<Tab>("owned");
  const [owned, setOwned] = useState<Gift[]>([]);
  const [listed, setListed] = useState<Gift[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [incomingOffers, setIncomingOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [priceEditor, setPriceEditor] = useState<{ gift: Gift; editing: boolean } | null>(null);
  const [priceInput, setPriceInput] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [ownedGifts, listedGifts, myOffers, receivedOffers] = await Promise.all([
        getOwnedGifts(),
        getListedGifts(),
        getOffers(),
        getIncomingOffers(),
      ]);
      setOwned(ownedGifts);
      setListed(listedGifts);
      setOffers(myOffers);
      setIncomingOffers(receivedOffers);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Не вдалося завантажити профіль");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function runAction(key: string, action: () => Promise<void>) {
    setBusy(key);
    setError("");
    try {
      await action();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Не вдалося виконати дію");
    } finally {
      setBusy("");
    }
  }

  function openPriceEditor(gift: Gift, editing: boolean) {
    setPriceInput(editing ? String(gift.priceTon) : "");
    setPriceEditor({ gift, editing });
  }

  async function saveListingPrice() {
    if (!priceEditor) return;
    const { gift, editing } = priceEditor;
    const price = priceInput.trim();
    await runAction(`sell:${gift.id}`, async () => {
      const updated = await sellGift(gift.id, price);
      if (!editing) setOwned((items) => items.filter((item) => item.id !== gift.id));
      setListed((items) => editing
        ? items.map((item) => item.id === gift.id ? updated : item)
        : [updated, ...items.filter((item) => item.id !== gift.id)]);
      setPriceEditor(null);
    });
  }

  async function removeListing(gift: Gift) {
    await runAction(`unlist:${gift.id}`, async () => {
      const updated = await unlistGift(gift.id);
      setListed((items) => items.filter((item) => item.id !== gift.id));
      setOwned((items) => [updated, ...items.filter((item) => item.id !== gift.id)]);
      setIncomingOffers((items) => items.map((offer) => offer.gift?.id === gift.id && offer.status === "PENDING" ? { ...offer, status: "CANCELLED" } : offer));
    });
  }

  async function withdrawOffer(offer: Offer) {
    await runAction(`cancel:${offer.id}`, async () => {
      const updated = await cancelOffer(offer.id);
      setOffers((items) => items.map((item) => item.id === offer.id ? { ...item, ...updated } : item));
    });
  }

  async function acceptIncomingOffer(offer: Offer) {
    await runAction(`accept:${offer.id}`, async () => {
      await acceptOffer(offer.id);
      setIncomingOffers((items) => items.map((item) => {
        if (item.id === offer.id) return { ...item, status: "ACCEPTED" };
        if (offer.gift && item.gift?.id === offer.gift.id && item.status === "PENDING") {
          return { ...item, status: "CANCELLED" };
        }
        return item;
      }));
      if (offer.gift) {
        setListed((items) => items.map((item) => item.id === offer.gift?.id ? { ...item, status: "RESERVED" } : item));
      }
    });
  }

  async function rejectIncomingOffer(offer: Offer) {
    await runAction(`reject:${offer.id}`, async () => {
      const updated = await rejectOffer(offer.id);
      setIncomingOffers((items) => items.map((item) => item.id === offer.id ? { ...item, ...updated } : item));
    });
  }

  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: "owned", label: "Owned", count: owned.length },
    { id: "listed", label: "Listed", count: listed.length },
    { id: "offers", label: "Offers", count: offers.length + incomingOffers.filter((offer) => offer.status === "PENDING").length },
  ];

  return (
    <main className="min-h-screen bg-[#0b0b0f] text-white">
      <div className="mx-auto min-h-screen max-w-[480px] px-4 pb-28">
        <header className="py-5">
          <p className="text-sm text-white/40">GIFTY</p>
          <h1 className="text-2xl font-bold">Profile</h1>
        </header>

        <section className="rounded-3xl border border-white/10 bg-[#15151c] p-5">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#555579] to-[#22222f] text-3xl">👤</div>
            <div>
              <h2 className="font-semibold">My collection</h2>
              <p className="mt-1 text-xs text-white/40">Your gifts and marketplace activity</p>
            </div>
          </div>
          <div className="mt-5 grid grid-cols-3 gap-2">
            {tabs.map((item) => (
              <button key={item.id} type="button" onClick={() => setTab(item.id)} className="rounded-2xl bg-white/5 p-3 text-center">
                <span className="block text-lg font-bold">{item.count}</span>
                <span className="text-[10px] text-white/40">{item.label}</span>
              </button>
            ))}
          </div>
        </section>

        <div className="mt-6 grid grid-cols-3 rounded-2xl bg-white/5 p-1" role="tablist">
          {tabs.map((item) => (
            <button key={item.id} type="button" role="tab" aria-selected={tab === item.id} onClick={() => setTab(item.id)} className={`rounded-xl py-3 text-xs font-medium ${tab === item.id ? "bg-white text-black" : "text-white/50"}`}>
              {item.label}
            </button>
          ))}
        </div>

        {error && <div role="alert" className="mt-4 rounded-2xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-200"><p>{error}</p><button type="button" onClick={() => void refresh()} className="mt-3 rounded-lg bg-white/10 px-3 py-2 text-xs text-white">Try again</button></div>}
        {loading ? <p className="mt-8 text-center text-sm text-white/40">Loading profile…</p> : (
          <>
            {tab === "owned" && (
              <section className="mt-5">
                <div className="mb-3 flex items-center justify-between"><h2 className="font-semibold">My gifts</h2><span className="text-xs text-white/40">{owned.length} items</span></div>
                {owned.length === 0 ? <EmptyState icon="🎁" title="No gifts yet" detail="Gifts you own will appear here." /> : (
                  <div className="grid grid-cols-2 gap-3">
                    {owned.map((gift) => <article key={gift.id} className="overflow-hidden rounded-3xl border border-white/10 bg-[#15151c]">
                      <div className="flex h-36 items-center justify-center bg-gradient-to-br from-[#292943] to-[#101016] text-6xl">{gift.emoji || "🎁"}</div>
                      <div className="p-3"><h3 className="truncate text-sm font-semibold">{gift.name}</h3><p className="mt-1 truncate text-xs text-white/40">{gift.collection}</p>
                        <button type="button" disabled={Boolean(busy)} onClick={() => openPriceEditor(gift, false)} className="mt-3 w-full rounded-xl bg-white py-2 text-xs font-semibold text-black disabled:opacity-50">Sell</button>
                      </div>
                    </article>)}
                  </div>
                )}
              </section>
            )}

            {tab === "listed" && (
              <section className="mt-5">
                <div className="mb-3 flex items-center justify-between"><h2 className="font-semibold">Listed for sale</h2><span className="text-xs text-white/40">{listed.length} items</span></div>
                {listed.length === 0 ? <EmptyState icon="🏷️" title="No active listings" detail="Gifts you list for sale will appear here." /> : listed.map((gift) => <article key={gift.id} className="mb-3 flex items-center gap-3 rounded-2xl border border-white/10 bg-[#15151c] p-3">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/5 text-3xl">{gift.emoji || "🎁"}</div>
                  <div className="min-w-0 flex-1"><h3 className="truncate text-sm font-semibold">{gift.name}</h3><p className="mt-1 truncate text-xs text-white/40">{gift.collection}</p><p className="mt-2 text-sm font-semibold">{formatTon(gift.priceTon)} TON</p>{gift.status === "RESERVED" && <p className="mt-1 text-[11px] text-amber-300">Reserved for an accepted offer</p>}</div>
                  <div className="flex flex-col gap-2"><button type="button" disabled={Boolean(busy) || gift.status === "RESERVED"} onClick={() => openPriceEditor(gift, true)} className="rounded-xl bg-white/10 px-3 py-2 text-xs disabled:opacity-50">Edit</button><button type="button" disabled={Boolean(busy) || gift.status === "RESERVED"} onClick={() => void removeListing(gift)} className="rounded-xl bg-white/5 px-3 py-2 text-xs text-white/60 disabled:opacity-50">{busy === `unlist:${gift.id}` ? "…" : "Unlist"}</button></div>
                </article>)}
              </section>
            )}

            {tab === "offers" && (
              <section className="mt-5 space-y-8">
                <OfferList title="My offers" emptyTitle="No offers sent" emptyDetail="Offers you make on gifts will appear here." offers={offers} busy={busy} actionLabel="Cancel offer" actionKey="cancel" onAction={withdrawOffer} />
                <OfferList title="Incoming offers" emptyTitle="No incoming offers" emptyDetail="Offers for your gifts will appear here." offers={incomingOffers} busy={busy} actionLabel="Accept" actionKey="accept" onAction={acceptIncomingOffer} onReject={rejectIncomingOffer} incoming />
              </section>
            )}
          </>
        )}

        {priceEditor && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 sm:items-center" onClick={() => !busy && setPriceEditor(null)}>
            <form role="dialog" aria-modal="true" aria-labelledby="price-editor-title" onSubmit={(event) => { event.preventDefault(); void saveListingPrice(); }} onClick={(event) => event.stopPropagation()} className="w-full max-w-[440px] rounded-3xl border border-white/10 bg-[#191922] p-5 shadow-2xl">
              <h2 id="price-editor-title" className="text-lg font-semibold">{priceEditor.editing ? "Edit listing price" : "List gift for sale"}</h2>
              <p className="mt-1 text-sm text-white/50">{priceEditor.gift.name}</p>
              <label htmlFor="listing-price" className="mt-5 block text-xs text-white/50">Price in TON</label>
              <input id="listing-price" inputMode="decimal" type="number" min="0.000000001" step="0.000000001" required value={priceInput} onChange={(event) => setPriceInput(event.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-white/30" placeholder="e.g. 2.5" />
              <div className="mt-5 grid grid-cols-2 gap-3">
                <button type="button" disabled={Boolean(busy)} onClick={() => setPriceEditor(null)} className="rounded-xl bg-white/10 py-3 text-sm disabled:opacity-50">Cancel</button>
                <button type="submit" disabled={Boolean(busy)} className="rounded-xl bg-white py-3 text-sm font-semibold text-black disabled:opacity-50">{busy ? "Saving…" : priceEditor.editing ? "Save price" : "List for sale"}</button>
              </div>
            </form>
          </div>
        )}
      </div>
    </main>
  );
}

function EmptyState({ icon, title, detail }: { icon: string; title: string; detail: string }) {
  return <div className="rounded-2xl border border-white/10 bg-[#15151c] p-6 text-center"><div className="text-4xl">{icon}</div><p className="mt-3 text-sm font-medium">{title}</p><p className="mt-1 text-xs text-white/40">{detail}</p></div>;
}

function OfferList({ title, emptyTitle, emptyDetail, offers, busy, actionLabel, actionKey, onAction, onReject, incoming = false }: {
  title: string; emptyTitle: string; emptyDetail: string; offers: Offer[]; busy: string;
  actionLabel: string; actionKey: "cancel" | "accept"; onAction: (offer: Offer) => Promise<void>; incoming?: boolean;
  onReject?: (offer: Offer) => Promise<void>;
}) {
  return <div>
    <div className="mb-3 flex items-center justify-between"><h2 className="font-semibold">{title}</h2><span className="text-xs text-white/40">{offers.length} offers</span></div>
    {offers.length === 0 ? <EmptyState icon={incoming ? "📥" : "📭"} title={emptyTitle} detail={emptyDetail} /> : offers.map((offer) => <article key={offer.id} className="mb-3 rounded-2xl border border-white/10 bg-[#15151c] p-4">
      <div className="flex items-center gap-3"><div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/5 text-3xl">{offer.gift?.emoji || "🎁"}</div><div className="min-w-0 flex-1"><h3 className="truncate text-sm font-semibold">{offer.gift?.name || "Gift"}</h3><p className="mt-1 text-xs text-white/40">{incoming ? (offer.buyer?.username ? `From @${offer.buyer.username}` : "Incoming offer") : "Your offer"}</p><p className="mt-1 font-semibold">{formatTon(offer.amountTon)} TON</p></div><span className="rounded-xl bg-white/5 px-2 py-2 text-[10px] text-white/60">{offer.status}</span></div>
      {offer.status === "PENDING" && <div className={incoming ? "mt-3 grid grid-cols-2 gap-2" : "mt-3"}>
        <button type="button" disabled={Boolean(busy)} onClick={() => void onAction(offer)} className={`w-full rounded-xl py-2 text-xs disabled:opacity-50 ${actionKey === "accept" ? "bg-white font-semibold text-black" : "bg-white/10"}`}>{busy === `${actionKey}:${offer.id}` ? "Please wait…" : actionLabel}</button>
        {incoming && onReject && <button type="button" disabled={Boolean(busy)} onClick={() => void onReject(offer)} className="w-full rounded-xl bg-white/10 py-2 text-xs disabled:opacity-50">{busy === `reject:${offer.id}` ? "Please wait…" : "Decline"}</button>}
      </div>}
    </article>)}
  </div>;
}
