"use client";

import { useCallback, useEffect, useState } from "react";
import {
  acceptOffer,
  cancelOffer,
  getIncomingOffers,
  getListedGifts,
  getOffers,
  getOwnedGifts,
  getProfileHistory,
  releaseOfferAcceptance,
  rejectOffer,
  sellGift,
  unlistGift,
} from "../../lib/api";
import TelegramAvatar from "../../components/TelegramAvatar";
import HomeIcon from "../../components/HomeIcon";
import { getTelegramInitData } from "../../lib/telegram";

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

type HistoryItem = {
  id: string;
  kind: "TRANSACTION" | "OFFER";
  event: string;
  status: string;
  amountTon?: string | number | null;
  createdAt: string;
  gift?: Gift | null;
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
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showAllHistory, setShowAllHistory] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [priceEditor, setPriceEditor] = useState<{ gift: Gift; editing: boolean } | null>(null);
  const [priceInput, setPriceInput] = useState("");

  const refresh = useCallback(async (options?: { silent?: boolean }) => {
    if (!getTelegramInitData()) {
      setError("Open your profile inside the GIFTY Telegram bot to load your account.");
      setLoading(false);
      return;
    }

    if (!options?.silent) setLoading(true);
    setError("");
    try {
      const [ownedGifts, listedGifts, myOffers, receivedOffers, activity] = await Promise.all([
        getOwnedGifts(),
        getListedGifts(),
        getOffers(),
        getIncomingOffers(),
        getProfileHistory(),
      ]);
      setOwned(ownedGifts);
      setListed(listedGifts);
      setOffers(myOffers);
      setIncomingOffers(receivedOffers);
      setHistory(activity);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Не вдалося завантажити профіль");
    } finally {
      setLoading(false);
    }
  }, []);

  async function refreshHistoryQuietly() {
    try {
      setHistory(await getProfileHistory());
    } catch (cause) {
      console.error("Could not refresh profile history:", cause);
    }
  }

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
      void refreshHistoryQuietly();
    });
  }

  async function removeListing(gift: Gift) {
    await runAction(`unlist:${gift.id}`, async () => {
      const updated = await unlistGift(gift.id);
      setListed((items) => items.filter((item) => item.id !== gift.id));
      setOwned((items) => [updated, ...items.filter((item) => item.id !== gift.id)]);
      setIncomingOffers((items) => items.map((offer) => offer.gift?.id === gift.id && offer.status === "PENDING" ? { ...offer, status: "CANCELLED" } : offer));
      void refreshHistoryQuietly();
    });
  }

  async function withdrawOffer(offer: Offer) {
    await runAction(`cancel:${offer.id}`, async () => {
      const updated = await cancelOffer(offer.id);
      setOffers((items) => items.map((item) => item.id === offer.id ? { ...item, ...updated } : item));
      void refreshHistoryQuietly();
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
      void refreshHistoryQuietly();
    });
  }

  async function rejectIncomingOffer(offer: Offer) {
    await runAction(`reject:${offer.id}`, async () => {
      const updated = await rejectOffer(offer.id);
      setIncomingOffers((items) => items.map((item) => item.id === offer.id ? { ...item, ...updated } : item));
      void refreshHistoryQuietly();
    });
  }

  async function releaseAcceptedOffer(offer: Offer) {
    await runAction(`release:${offer.id}`, async () => {
      const updated = await releaseOfferAcceptance(offer.id);
      setIncomingOffers((items) => items.map((item) => item.id === offer.id ? { ...item, ...updated } : item));
      if (offer.gift) {
        setListed((items) => items.map((item) => item.id === offer.gift?.id ? { ...item, status: "LISTED" } : item));
      }
      void refreshHistoryQuietly();
    });
  }

  const activeOffers = offers.filter((offer) => !["CANCELLED", "REJECTED"].includes(offer.status));
  const activeIncomingOffers = incomingOffers.filter((offer) => !["CANCELLED", "REJECTED"].includes(offer.status));
  const visibleHistory = showAllHistory ? history : history.slice(0, 4);

  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: "owned", label: "Owned", count: owned.length },
    { id: "listed", label: "Listed", count: listed.length },
    { id: "offers", label: "Offers", count: activeOffers.length + activeIncomingOffers.length },
  ];

  return (
    <main className="min-h-screen bg-[#f5f8ff] text-slate-900">
      <div className="mx-auto min-h-screen max-w-[480px] px-4 pb-28">
        <header className="flex items-center justify-between py-5">
          <div>
            <p className="text-sm font-semibold tracking-[0.18em] text-blue-700">ORBIT</p>
            <h1 className="text-2xl font-bold">Profile</h1>
          </div>
          <button type="button" onClick={() => void refresh()} disabled={loading || Boolean(busy)} aria-label="Refresh profile" className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-lg text-blue-700 shadow-sm disabled:opacity-50">↻</button>
        </header>

        <section className="rounded-3xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-4">
            <TelegramAvatar size={64} />
            <div>
              <h2 className="font-semibold">My collection</h2>
              <p className="mt-1 text-xs text-slate-500">Your gifts and marketplace activity</p>
            </div>
          </div>
          <div className="mt-5 grid grid-cols-3 gap-2">
            {tabs.map((item) => (
              <button key={item.id} type="button" onClick={() => setTab(item.id)} className="rounded-2xl bg-slate-50 p-3 text-center">
                <span className="block text-lg font-bold">{item.count}</span>
                <span className="text-[10px] text-slate-500">{item.label}</span>
              </button>
            ))}
          </div>
        </section>

        <div className="mt-6 grid grid-cols-3 rounded-2xl bg-slate-50 p-1" role="tablist">
          {tabs.map((item) => (
            <button key={item.id} type="button" role="tab" aria-selected={tab === item.id} onClick={() => setTab(item.id)} className={`rounded-xl py-3 text-xs font-medium ${tab === item.id ? "bg-blue-700 text-white shadow-sm" : "text-slate-500"}`}>
              {item.label}
            </button>
          ))}
        </div>

        {error && <div role="alert" className="mt-4 rounded-2xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-700"><p>{error}</p><button type="button" onClick={() => void refresh()} className="mt-3 rounded-lg bg-slate-100 px-3 py-2 text-xs text-slate-900">Try again</button></div>}
        {loading ? <p className="mt-8 text-center text-sm text-slate-500">Loading profile…</p> : (
          <>
            {tab === "owned" && (
              <section className="mt-5">
                <div className="mb-3 flex items-center justify-between"><h2 className="font-semibold">My gifts</h2><span className="text-xs text-slate-500">{owned.length} items</span></div>
                {owned.length === 0 ? <EmptyState icon="🎁" title="No gifts yet" detail="Gifts you own will appear here." /> : (
                  <div className="grid grid-cols-2 gap-3">
                    {owned.map((gift) => <article key={gift.id} className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
                      <div className="flex h-36 items-center justify-center bg-gradient-to-br from-blue-50 to-slate-100 text-6xl">{gift.emoji || "🎁"}</div>
                      <div className="p-3"><h3 className="truncate text-sm font-semibold">{gift.name}</h3><p className="mt-1 truncate text-xs text-slate-500">{gift.collection}</p>
                        <button type="button" disabled={Boolean(busy)} onClick={() => openPriceEditor(gift, false)} className="mt-3 w-full rounded-xl bg-blue-700 py-2 text-xs font-semibold text-white disabled:opacity-50">Sell</button>
                      </div>
                    </article>)}
                  </div>
                )}
              </section>
            )}

            {tab === "listed" && (
              <section className="mt-5">
                <div className="mb-3 flex items-center justify-between"><h2 className="font-semibold">Listed for sale</h2><span className="text-xs text-slate-500">{listed.length} items</span></div>
                {listed.length === 0 ? <EmptyState icon="🏷️" title="No active listings" detail="Gifts you list for sale will appear here." /> : listed.map((gift) => <article key={gift.id} className="mb-3 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-slate-50 text-3xl">{gift.emoji || "🎁"}</div>
                  <div className="min-w-0 flex-1"><h3 className="truncate text-sm font-semibold">{gift.name}</h3><p className="mt-1 truncate text-xs text-slate-500">{gift.collection}</p><p className="mt-2 text-sm font-semibold">{formatTon(gift.priceTon)} TON</p>{gift.status === "RESERVED" && <p className="mt-1 text-[11px] text-amber-700">Reserved for an accepted offer</p>}</div>
                  <div className="flex flex-col gap-2"><button type="button" disabled={Boolean(busy) || gift.status === "RESERVED"} onClick={() => openPriceEditor(gift, true)} className="rounded-xl bg-slate-100 px-3 py-2 text-xs disabled:opacity-50">Edit</button><button type="button" disabled={Boolean(busy) || gift.status === "RESERVED"} onClick={() => void removeListing(gift)} className="rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-600 disabled:opacity-50">{busy === `unlist:${gift.id}` ? "…" : "Unlist"}</button></div>
                </article>)}
              </section>
            )}

            {tab === "offers" && (
              <section className="mt-5 space-y-8">
                <OfferList title="My offers" emptyTitle="No active offers" emptyDetail="Offers you make on gifts will appear here." offers={activeOffers} busy={busy} actionLabel="Cancel offer" actionKey="cancel" onAction={withdrawOffer} />
                <OfferList title="Incoming offers" emptyTitle="No active incoming offers" emptyDetail="Offers for your gifts will appear here." offers={activeIncomingOffers} busy={busy} actionLabel="Accept" actionKey="accept" onAction={acceptIncomingOffer} onReject={rejectIncomingOffer} onRelease={releaseAcceptedOffer} incoming />
              </section>
            )}
          </>
        )}

        {!loading && <section className="mt-9">
          <div className="mb-3 flex items-center justify-between">
            <button type="button" aria-expanded={showAllHistory} disabled={history.length <= 4} onClick={() => setShowAllHistory((showing) => !showing)} className="font-semibold disabled:cursor-default">History</button>
            <span className="text-xs text-slate-500">{history.length} activities</span>
          </div>
          {history.length === 0 ? <EmptyState icon="🕘" title="No activity yet" detail="Completed actions and past offers will appear here." /> : (
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
              {visibleHistory.map((item, index) => <div key={item.id} className={`flex items-center gap-3 p-4 ${index < visibleHistory.length - 1 ? "border-b border-slate-100" : ""}`}>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-xl">{item.gift?.emoji || (item.kind === "OFFER" ? "💬" : "💎")}</div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{historyTitle(item)}</p>
                  <p className="mt-1 truncate text-xs text-slate-500">{item.gift?.name || "Gift"} · {new Date(item.createdAt).toLocaleString()}</p>
                </div>
                <div className="text-right">
                  {item.amountTon != null && <p className="text-sm font-semibold">{formatTon(item.amountTon)} TON</p>}
                  <p className="mt-1 text-[10px] uppercase text-slate-500">{item.status}</p>
                </div>
              </div>)}
            </div>
          )}
        </section>}

        {priceEditor && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/35 p-4 sm:items-center" onClick={() => !busy && setPriceEditor(null)}>
            <form role="dialog" aria-modal="true" aria-labelledby="price-editor-title" onSubmit={(event) => { event.preventDefault(); void saveListingPrice(); }} onClick={(event) => event.stopPropagation()} className="w-full max-w-[440px] rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl">
              <h2 id="price-editor-title" className="text-lg font-semibold">{priceEditor.editing ? "Edit listing price" : "List gift for sale"}</h2>
              <p className="mt-1 text-sm text-slate-500">{priceEditor.gift.name}</p>
              <label htmlFor="listing-price" className="mt-5 block text-xs text-slate-500">Price in TON</label>
              <input id="listing-price" inputMode="decimal" type="number" min="0.000000001" step="0.000000001" required value={priceInput} onChange={(event) => setPriceInput(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-slate-300" placeholder="e.g. 2.5" />
              <div className="mt-5 grid grid-cols-2 gap-3">
                <button type="button" disabled={Boolean(busy)} onClick={() => setPriceEditor(null)} className="rounded-xl bg-slate-100 py-3 text-sm disabled:opacity-50">Cancel</button>
                <button type="submit" disabled={Boolean(busy)} className="rounded-xl bg-blue-700 py-3 text-sm font-semibold text-white disabled:opacity-50">{busy ? "Saving…" : priceEditor.editing ? "Save price" : "List for sale"}</button>
              </div>
            </form>
          </div>
        )}

        <nav className="fixed bottom-0 left-1/2 z-40 w-full max-w-[480px] -translate-x-1/2 border-t border-slate-200 bg-white/95 px-4 py-3 shadow-[0_-8px_30px_rgba(21,87,213,0.08)] backdrop-blur-xl">
          <div className="grid grid-cols-4">
            <a href="/" className="flex flex-col items-center gap-1 text-slate-500">
              <HomeIcon />
              <span className="text-[10px]">Home</span>
            </a>
            <a href="/market" className="flex flex-col items-center gap-1 text-slate-500">
              <span>🛍️</span>
              <span className="text-[10px]">Market</span>
            </a>
            <a href="/cases" className="flex flex-col items-center gap-1 text-slate-500">
              <span>🎁</span>
              <span className="text-[10px]">Cases</span>
            </a>
            <a href="/profile" aria-current="page" className="flex flex-col items-center gap-1 text-blue-700">
              <TelegramAvatar size={22} />
              <span className="text-[10px]">Profile</span>
            </a>
          </div>
        </nav>
      </div>
    </main>
  );
}

function historyTitle(item: HistoryItem) {
  if (item.kind === "OFFER") {
    if (item.status === "ACCEPTED") return "Offer accepted · awaiting payment";
    if (item.status === "CANCELLED") return "Offer cancelled";
    if (item.status === "REJECTED") return "Offer declined";
  }
  if (item.event === "BUY") return "Gift purchased";
  return item.event.replaceAll("_", " ").toLowerCase();
}

function EmptyState({ icon, title, detail }: { icon: string; title: string; detail: string }) {
  return <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center"><div className="text-4xl">{icon}</div><p className="mt-3 text-sm font-medium">{title}</p><p className="mt-1 text-xs text-slate-500">{detail}</p></div>;
}

function OfferList({ title, emptyTitle, emptyDetail, offers, busy, actionLabel, actionKey, onAction, onReject, onRelease, incoming = false }: {
  title: string; emptyTitle: string; emptyDetail: string; offers: Offer[]; busy: string;
  actionLabel: string; actionKey: "cancel" | "accept"; onAction: (offer: Offer) => Promise<void>; incoming?: boolean;
  onReject?: (offer: Offer) => Promise<void>;
  onRelease?: (offer: Offer) => Promise<void>;
}) {
  return <div>
    <div className="mb-3 flex items-center justify-between"><h2 className="font-semibold">{title}</h2><span className="text-xs text-slate-500">{offers.length} offers</span></div>
    {offers.length === 0 ? <EmptyState icon={incoming ? "📥" : "📭"} title={emptyTitle} detail={emptyDetail} /> : offers.map((offer) => <article key={offer.id} className="mb-3 rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex items-center gap-3"><div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-slate-50 text-3xl">{offer.gift?.emoji || "🎁"}</div><div className="min-w-0 flex-1"><h3 className="truncate text-sm font-semibold">{offer.gift?.name || "Gift"}</h3><p className="mt-1 text-xs text-slate-500">{incoming ? (offer.buyer?.username ? `From @${offer.buyer.username}` : "Incoming offer") : "Your offer"}</p><p className="mt-1 font-semibold">{formatTon(offer.amountTon)} TON</p></div><span className="rounded-xl bg-slate-50 px-2 py-2 text-[10px] text-slate-600">{offer.status}</span></div>
      {offer.status === "PENDING" && <div className={incoming ? "mt-3 grid grid-cols-2 gap-2" : "mt-3"}>
        <button type="button" disabled={Boolean(busy)} onClick={() => void onAction(offer)} className={`w-full rounded-xl py-2 text-xs disabled:opacity-50 ${actionKey === "accept" ? "bg-blue-700 font-semibold text-white" : "bg-slate-100 text-slate-700"}`}>{busy === `${actionKey}:${offer.id}` ? "Please wait…" : actionLabel}</button>
        {incoming && onReject && <button type="button" disabled={Boolean(busy)} onClick={() => void onReject(offer)} className="w-full rounded-xl bg-slate-100 py-2 text-xs disabled:opacity-50">{busy === `reject:${offer.id}` ? "Please wait…" : "Decline"}</button>}
      </div>}
      {incoming && offer.status === "ACCEPTED" && onRelease && <div className="mt-3 rounded-xl bg-amber-50 p-3">
        <p className="text-xs leading-5 text-amber-900">This offer only reserves the gift in GIFTY. Payment and NFT transfer are not automated yet. Release it if the deal will not continue.</p>
        <button type="button" disabled={Boolean(busy)} onClick={() => void onRelease(offer)} className="mt-2 w-full rounded-xl bg-white py-2 text-xs font-medium text-slate-700 shadow-sm disabled:opacity-50">{busy === `release:${offer.id}` ? "Please wait…" : "Release reservation"}</button>
      </div>}
    </article>)}
  </div>;
}
