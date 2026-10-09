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
  sellDemoBackdrop as sellDemoBackdropApi,
  syncDemoBackdropInventory as syncDemoBackdropInventoryApi,
  transferDemoBackdrop as transferDemoBackdropApi,
  unlistGift,
  syncTelegramProfile,
  type CurrentUser,
} from "../../lib/api";
import TelegramAvatar from "../../components/TelegramAvatar";
import GramIcon from "../../components/GramIcon";
import HomeIcon from "../../components/HomeIcon";
import BottomNav from "../../components/BottomNav";
import OrbitWordmark from "../../components/OrbitWordmark";
import { waitForTelegramInitData } from "../../lib/telegram";
import { useIsConnectionRestored, useTonAddress } from "@tonconnect/ui-react";
import { useOrbitLanguage, type OrbitLanguage } from "../../components/OrbitLanguageContext";
import LanguageChoiceList from "../../components/LanguageChoiceList";
import ThemeToggle from "../../components/ThemeToggle";
import { useOrbitTheme } from "../../components/OrbitThemeContext";
import TelegramTgsSticker from "../../components/TelegramTgsSticker";
import { DEMO_BACKDROP_UPDATE_EVENT, getDemoBackdropSticker, readDemoBackdrops, saveDemoBackdrops, type DemoBackdrop } from "../../lib/demoBackdrops";

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
  kind: "TRANSACTION" | "OFFER" | "BALANCE";
  event: string;
  status: string;
  amountTon?: string | number | null;
  createdAt: string;
  gift?: Gift | null;
  txHash?: string | null;
};

type Tab = "owned" | "listed" | "offers";

function formatTon(amount: string | number) {
  const value = Number(amount);
  return Number.isFinite(value) ? value.toLocaleString(undefined, { maximumFractionDigits: 9 }) : amount;
}

export default function ProfilePage() {
  const { language, setLanguage, t } = useOrbitLanguage();
  const { theme, toggleTheme } = useOrbitTheme();
  const walletAddress = useTonAddress();
  const connectionRestored = useIsConnectionRestored();
  const [tab, setTab] = useState<Tab>("owned");
  const [account, setAccount] = useState<CurrentUser | null>(null);
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
  const [languageOpen, setLanguageOpen] = useState(false);
  const [pendingLanguage, setPendingLanguage] = useState<OrbitLanguage | null>(null);
  const [languageChanging, setLanguageChanging] = useState(false);
  const [demoBackdropInventory, setDemoBackdropInventory] = useState<DemoBackdrop[]>([]);
  const [demoSaleNotice, setDemoSaleNotice] = useState("");
  const [demoTransferEditor, setDemoTransferEditor] = useState<DemoBackdrop | null>(null);
  const [demoTransferUsername, setDemoTransferUsername] = useState("");
  const [demoTransferNotice, setDemoTransferNotice] = useState("");

  useEffect(() => {
    let active = true;
    const syncDemoInventory = () => setDemoBackdropInventory(readDemoBackdrops());
    syncDemoInventory();
    void syncDemoBackdropInventoryApi(readDemoBackdrops()).then((items) => {
      if (!active) return;
      saveDemoBackdrops(items);
      setDemoBackdropInventory(items);
    }).catch((cause: unknown) => {
      if (active) console.warn("Could not sync ORBIT demo backdrops:", cause);
    });
    window.addEventListener(DEMO_BACKDROP_UPDATE_EVENT, syncDemoInventory);
    window.addEventListener("storage", syncDemoInventory);
    return () => {
      active = false;
      window.removeEventListener(DEMO_BACKDROP_UPDATE_EVENT, syncDemoInventory);
      window.removeEventListener("storage", syncDemoInventory);
    };
  }, []);

  const refresh = useCallback(async (options?: { silent?: boolean }) => {
    if (!connectionRestored) return;

    if (!await waitForTelegramInitData()) {
      setError(t("Open your profile inside the ORBIT Telegram bot to load your account."));
      setLoading(false);
      return;
    }

    if (!options?.silent) setLoading(true);
    setError("");
    try {
      const currentAccount = await syncTelegramProfile(walletAddress || undefined);
      setAccount(currentAccount);
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
      setError(cause instanceof Error ? cause.message : t("Could not load profile"));
    } finally {
      setLoading(false);
    }
  }, [connectionRestored, walletAddress, t]);

  async function refreshHistoryQuietly() {
    try {
      setHistory(await getProfileHistory());
    } catch (cause) {
      console.error("Could not refresh profile history:", cause);
    }
  }

  useEffect(() => {
    if (connectionRestored) void refresh();
  }, [refresh]);

  async function runAction(key: string, action: () => Promise<void>) {
    setBusy(key);
    setError("");
    try {
      await action();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t("Could not perform action"));
    } finally {
      setBusy("");
    }
  }

  function openPriceEditor(gift: Gift, editing: boolean) {
    setPriceInput(editing ? String(gift.priceTon) : "");
    setPriceEditor({ gift, editing });
  }

  function chooseLanguage(nextLanguage: OrbitLanguage) {
    if (languageChanging) return;
    setPendingLanguage(nextLanguage);
    setLanguageChanging(true);
    window.setTimeout(() => {
      setLanguage(nextLanguage);
      setLanguageOpen(false);
      setPendingLanguage(null);
      setLanguageChanging(false);
    }, 220);
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

  async function sellDemoBackdrop(backdrop: DemoBackdrop) {
    await runAction(`demo-sell:${backdrop.id}`, async () => {
      const result = await sellDemoBackdropApi(backdrop.id);
      const remaining = demoBackdropInventory.filter((item) => item.id !== backdrop.id);
      saveDemoBackdrops(remaining);
      setDemoBackdropInventory(remaining);
      setDemoSaleNotice(t("Quick sale complete · {amount} GRAM added").replace("{amount}", result.creditedGram));
      void refreshHistoryQuietly();
      window.setTimeout(() => setDemoSaleNotice(""), 4000);
    });
  }

  async function transferDemoBackdrop() {
    if (!demoTransferEditor) return;
    const backdrop = demoTransferEditor;
    const username = demoTransferUsername.trim().replace(/^@/, "");
    if (!username) return;
    await runAction(`demo-transfer:${backdrop.id}`, async () => {
      await transferDemoBackdropApi(backdrop.id, username);
      const remaining = demoBackdropInventory.filter((item) => item.id !== backdrop.id);
      saveDemoBackdrops(remaining);
      setDemoBackdropInventory(remaining);
      setDemoTransferEditor(null);
      setDemoTransferUsername("");
      setDemoTransferNotice(t("ORBIT NFT transferred to @{username}").replace("{username}", username));
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
    { id: "owned", label: t("Owned"), count: owned.length },
    { id: "listed", label: t("Listed"), count: listed.length },
    { id: "offers", label: t("Offers"), count: activeOffers.length + activeIncomingOffers.length },
  ];

  return (
    <main className="min-h-screen bg-[#f5f8ff] text-slate-900">
      <div className="mx-auto min-h-screen max-w-[480px] px-4 pb-28">
        <header className="flex items-center justify-between py-5">
          <div>
            <OrbitWordmark />
            <h1 className="text-2xl font-bold">{t("Profile")}</h1>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setLanguageOpen(true)} aria-label={t("Language")} title={t("Language")} className="flex h-10 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 text-xs font-bold text-blue-700 shadow-sm">
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-4 w-4"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.7"/><path d="M3.5 12h17M12 3c2.3 2.4 3.4 5.4 3.4 9s-1.1 6.6-3.4 9c-2.3-2.4-3.4-5.4-3.4-9S9.7 5.4 12 3Z" stroke="currentColor" strokeWidth="1.5"/></svg>
              {language.toUpperCase()}
            </button>
            <ThemeToggle theme={theme} toggleTheme={toggleTheme} label={t(theme === "dark" ? "Light" : "Dark")} />
            <button type="button" onClick={() => void refresh()} disabled={loading || Boolean(busy)} aria-label={t("Refresh profile")} title={t("Refresh profile")} className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-lg text-blue-700 shadow-sm disabled:opacity-50">↻</button>
          </div>
        </header>

        <section className="rounded-3xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-4">
            <TelegramAvatar size={64} />
            <div>
              <h2 className="font-semibold">
                {[account?.firstName, account?.lastName].filter(Boolean).join(" ") || (account?.username ? `@${account.username}` : t("Telegram user"))}
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                {account?.username ? `@${account.username} · ` : ""}{t("Telegram account")}
              </p>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl bg-slate-50 px-4 py-3">
            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-700"><GramIcon size={13} className="mr-1 text-blue-700" />{t("GRAM wallet")}</p>
              <p className="mt-1 truncate text-[11px] text-slate-500">
                {account?.wallets[0]?.address
                  ? `${account.wallets[0].address.slice(0, 7)}…${account.wallets[0].address.slice(-5)}`
                  : t("No wallet connected")}
              </p>
            </div>
            <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold ${account?.wallets[0]?.isConnected ? "bg-green-100 text-green-700" : "bg-slate-200 text-slate-500"}`}>
              {t(account?.wallets[0]?.isConnected ? "Connected" : "Not connected")}
            </span>
          </div>
        </section>

        <div className="profile-tabs mt-5 grid grid-cols-3 gap-1 rounded-2xl p-1.5" role="tablist">
          {tabs.map((item) => (
            <button key={item.id} type="button" role="tab" aria-selected={tab === item.id} onClick={() => setTab(item.id)} className={`flex h-[54px] w-full min-w-0 items-center justify-center gap-1.5 rounded-xl px-1.5 text-[11px] font-semibold leading-none transition-colors ${tab === item.id ? "bg-blue-700 text-white shadow-sm" : "text-slate-500 hover:bg-slate-50"}`}>
              <span className="min-w-0 truncate">{item.label}</span>
              <span className={`shrink-0 rounded-full px-1.5 py-1 text-[10px] leading-none tabular-nums ${tab === item.id ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"}`}>{item.count}</span>
            </button>
          ))}
        </div>

        {error && <div role="alert" className="mt-4 rounded-2xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-700"><p>{error}</p><button type="button" onClick={() => void refresh()} className="mt-3 rounded-lg bg-slate-100 px-3 py-2 text-xs text-slate-900">{t("Try again")}</button></div>}
        {loading ? <p className="mt-8 text-center text-sm text-slate-500">{t("Loading profile…")}</p> : (
          <>
            {tab === "owned" && (
              <section className="mt-5">
                <div className="mb-5">
                  <div className="mb-3 flex items-center justify-between"><h2 className="font-semibold">{t("ORBIT NFTs")}</h2><span className="text-xs text-slate-500">{demoBackdropInventory.length} {t("items")}</span></div>
                  {demoSaleNotice && <p role="status" className="mb-3 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800">{demoSaleNotice}</p>}
                  {demoTransferNotice && <p role="status" className="mb-3 rounded-xl bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-800">{demoTransferNotice}</p>}
                  {demoBackdropInventory.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-5 text-center text-xs text-slate-400">{t("Backdrop drops you win will appear here.")}</div> : (
                    <div className="grid grid-cols-2 gap-3">
                      {demoBackdropInventory.map((backdrop) => <article key={backdrop.id} className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
                        <div className="relative flex h-28 items-center justify-center" style={{ backgroundColor: backdrop.color }}><TelegramTgsSticker src={getDemoBackdropSticker(backdrop.packId)} size={102} className="h-[102px] w-[102px]" autoplay={false} fallback={<span />}/><span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-slate-950/75 px-2 py-1 text-[10px] font-bold tabular-nums text-white">{backdrop.priceTon ?? '0.30'}<GramIcon size={12} className="text-white" /></span></div>
                        <div className="p-3"><h3 className="truncate text-sm font-semibold">{backdrop.name}</h3><p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-blue-600">{t("ORBIT collectible")}</p>
                          <div className="mt-3 grid grid-cols-2 gap-2"><button type="button" disabled={Boolean(busy)} onClick={() => void sellDemoBackdrop(backdrop)} className="rounded-xl bg-blue-700 py-2 text-xs font-semibold text-white disabled:opacity-50">{backdrop.name === 'Black' ? t("Quick sale") : `${t("Sell")} · ${backdrop.priceTon ?? '0.15'} GRAM`}</button><button type="button" disabled={Boolean(busy)} onClick={() => { setDemoTransferEditor(backdrop); setDemoTransferUsername(""); }} className="rounded-xl bg-slate-100 py-2 text-xs font-semibold text-slate-700 disabled:opacity-50">{t("Transfer")}</button></div>
                        </div>
                      </article>)}
                    </div>
                  )}
                </div>
              </section>
            )}

            {tab === "listed" && (
              <section className="mt-5">
                <div className="mb-3 flex items-center justify-between"><h2 className="font-semibold">{t("Listed for sale")}</h2><span className="text-xs text-slate-500">{listed.length} {t("items")}</span></div>
                {listed.length === 0 ? <EmptyState icon="🏷️" title={t("No active listings")} detail={t("Gifts you list for sale will appear here.")} /> : listed.map((gift) => <article key={gift.id} className="mb-3 grid grid-cols-[64px_minmax(0,1fr)] gap-3 rounded-2xl border border-slate-200 bg-white p-3">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50 text-3xl">{gift.emoji || "🎁"}</div>
                  <div className="min-w-0 self-center"><h3 className="truncate text-sm font-semibold">{gift.name}</h3><p className="mt-1 truncate text-xs text-slate-500">{gift.collection}</p><p className="mt-2 text-sm font-semibold"><GramIcon size={14} className="mr-1 text-blue-700" />{formatTon(gift.priceTon)} GRAM</p>{gift.status === "RESERVED" && <p className="mt-1 text-[11px] text-amber-700">{t("Reserved for an accepted offer")}</p>}</div>
                  <div className="col-span-2 grid grid-cols-2 gap-2"><button type="button" disabled={Boolean(busy) || gift.status === "RESERVED"} onClick={() => openPriceEditor(gift, true)} className="flex h-10 w-full items-center justify-center rounded-xl bg-slate-100 px-2 text-xs font-semibold disabled:opacity-50">{t("Edit")}</button><button type="button" disabled={Boolean(busy) || gift.status === "RESERVED"} onClick={() => void removeListing(gift)} className="flex h-10 w-full items-center justify-center rounded-xl bg-slate-50 px-2 text-xs font-semibold text-slate-600 disabled:opacity-50">{busy === `unlist:${gift.id}` ? "…" : t("Unlist")}</button></div>
                </article>)}
              </section>
            )}

            {tab === "offers" && (
              <section className="mt-5 space-y-8">
                <OfferList title={t("My offers")} emptyTitle={t("No active offers")} emptyDetail={t("Offers you make on gifts will appear here.")} offers={activeOffers} busy={busy} actionLabel={t("Cancel offer")} actionKey="cancel" onAction={withdrawOffer} />
                <OfferList title={t("Incoming offers")} emptyTitle={t("No active incoming offers")} emptyDetail={t("Offers for your gifts will appear here.")} offers={activeIncomingOffers} busy={busy} actionLabel={t("Accept")} actionKey="accept" onAction={acceptIncomingOffer} onReject={rejectIncomingOffer} onRelease={releaseAcceptedOffer} incoming />
              </section>
            )}
          </>
        )}

        {!loading && <section className="mt-9">
          <div className="mb-3 flex items-center justify-between">
            <button type="button" aria-expanded={showAllHistory} disabled={history.length <= 4} onClick={() => setShowAllHistory((showing) => !showing)} className="font-semibold disabled:cursor-default">{t("History")}</button>
            <span className="text-xs text-slate-500">{history.length} {t("activities")}</span>
          </div>
          {history.length === 0 ? <EmptyState icon="🕘" title={t("No activity yet")} detail={t("Completed actions and past offers will appear here.")} /> : (
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
              {visibleHistory.map((item, index) => <div key={item.id} className={`flex items-center gap-3 p-4 ${index < visibleHistory.length - 1 ? "border-b border-slate-100" : ""}`}>
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xl ${item.kind === "BALANCE" ? Number(item.amountTon ?? 0) > 0 ? "bg-emerald-50 text-emerald-600" : "bg-blue-50 text-blue-700" : "bg-slate-50"}`}>{item.kind === "BALANCE" ? Number(item.amountTon ?? 0) < 0 ? "↓" : "↑" : item.gift?.emoji || (item.kind === "OFFER" ? "💬" : "💎")}</div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{historyTitle(item, t)}</p>
                  <p className="mt-1 truncate text-xs text-slate-500">{item.kind === "BALANCE" ? item.txHash ? `TX ${item.txHash.slice(0, 12)}…` : item.event.startsWith("PVP_") || item.event === "LUCKY_SETTLEMENT" ? t("Game balance settlement") : item.event.startsWith("ORBIT_NFT_PURCHASE_") ? t("ORBIT NFT pack purchase") : t(item.event === "DEPOSIT" ? "ORBIT balance deposit" : "ORBIT balance withdrawal") : item.gift?.name || t("Gift")} · {new Date(item.createdAt).toLocaleString(language)}</p>
                </div>
                <div className="text-right">
                  {item.amountTon != null && <p className={`text-sm font-semibold ${Number(item.amountTon) > 0 ? "text-emerald-700" : ""}`}>{Number(item.amountTon) > 0 ? "+" : Number(item.amountTon) < 0 ? "−" : ""}<GramIcon size={14} className="mx-1 text-blue-700" />{formatTon(Math.abs(Number(item.amountTon)))} GRAM</p>}
                  <p className="mt-1 text-[10px] uppercase text-slate-500">{offerStatusLabel(item.status, t)}</p>
                </div>
              </div>)}
            </div>
          )}
        </section>}

        {priceEditor && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/35 p-4 sm:items-center" onClick={() => !busy && setPriceEditor(null)}>
            <form role="dialog" aria-modal="true" aria-labelledby="price-editor-title" onSubmit={(event) => { event.preventDefault(); void saveListingPrice(); }} onClick={(event) => event.stopPropagation()} className="w-full max-w-[440px] rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl">
              <h2 id="price-editor-title" className="text-lg font-semibold">{t(priceEditor.editing ? "Edit listing price" : "List gift for sale")}</h2>
              <p className="mt-1 text-sm text-slate-500">{priceEditor.gift.name}</p>
              <label htmlFor="listing-price" className="mt-5 block text-xs text-slate-500"><GramIcon size={13} className="mr-1 text-blue-700" />{t("Price in GRAM")}</label>
              <input id="listing-price" inputMode="decimal" type="number" min="0.000000001" step="0.000000001" required value={priceInput} onChange={(event) => setPriceInput(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-slate-300" placeholder={t("Example: 2.5")} />
              <div className="mt-5 grid grid-cols-2 gap-3">
                <button type="button" disabled={Boolean(busy)} onClick={() => setPriceEditor(null)} className="rounded-xl bg-slate-100 py-3 text-sm disabled:opacity-50">{t("Cancel")}</button>
                <button type="submit" disabled={Boolean(busy)} className="rounded-xl bg-blue-700 py-3 text-sm font-semibold text-white disabled:opacity-50">{busy ? t("Saving…") : t(priceEditor.editing ? "Save price" : "List for sale")}</button>
              </div>
            </form>
          </div>
        )}
        {demoTransferEditor && (
          <div className="fixed inset-0 z-[90] flex items-end justify-center bg-slate-950/40 p-4 sm:items-center" onClick={() => !busy && setDemoTransferEditor(null)}>
            <form role="dialog" aria-modal="true" aria-labelledby="demo-transfer-title" onSubmit={(event) => { event.preventDefault(); void transferDemoBackdrop(); }} onClick={(event) => event.stopPropagation()} className="w-full max-w-[440px] rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl">
              <h2 id="demo-transfer-title" className="text-lg font-semibold">{t("Transfer ORBIT NFT")}</h2>
              <p className="mt-1 text-sm text-slate-500">{demoTransferEditor.name}</p>
              <p className="mt-3 text-xs leading-5 text-slate-500">{t("This collectible transfers inside ORBIT to another user.")}</p>
              <label htmlFor="demo-transfer-username" className="mt-4 block text-xs font-medium text-slate-600">{t("Recipient username")}</label>
              <input id="demo-transfer-username" autoComplete="off" autoCapitalize="none" spellCheck={false} value={demoTransferUsername} onChange={(event) => setDemoTransferUsername(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-blue-400" placeholder="@username" />
              <div className="mt-5 grid grid-cols-2 gap-3">
                <button type="button" disabled={Boolean(busy)} onClick={() => setDemoTransferEditor(null)} className="rounded-xl bg-slate-100 py-3 text-sm disabled:opacity-50">{t("Cancel")}</button>
                <button type="submit" disabled={Boolean(busy) || !demoTransferUsername.trim()} className="rounded-xl bg-blue-700 py-3 text-sm font-semibold text-white disabled:opacity-50">{busy === `demo-transfer:${demoTransferEditor.id}` ? t("Please wait…") : t("Transfer")}</button>
              </div>
            </form>
          </div>
        )}
        <BottomNav active="profile" />
      </div>
      {languageOpen && (
        <div className="fixed inset-0 z-[120] flex items-end justify-center bg-slate-950/45 px-4 pb-[calc(12px+env(safe-area-inset-bottom))] backdrop-blur-sm sm:items-center" onClick={() => !languageChanging && setLanguageOpen(false)}>
          <section role="dialog" aria-modal="true" aria-labelledby="language-dialog-title" onClick={(event) => event.stopPropagation()} className="language-picker-dialog w-full max-w-[440px] rounded-[28px] border border-slate-200 bg-white p-5 shadow-2xl">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div><p className="text-[10px] font-bold tracking-[0.18em] text-blue-700">ORBIT</p><h2 id="language-dialog-title" className="mt-1 text-lg font-bold">{t("Choose your language")}</h2><p className="mt-1 text-xs text-slate-500">{t("Your language is saved on this device.")}</p></div>
              <button type="button" disabled={languageChanging} aria-label={t("Close")} onClick={() => setLanguageOpen(false)} className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600 disabled:opacity-50">×</button>
            </div>
            <LanguageChoiceList selected={pendingLanguage ?? language} current={language} onSelect={chooseLanguage} compact />
          </section>
        </div>
      )}
    </main>
  );
}

function historyTitle(item: HistoryItem, t: (key: string) => string) {
  if (item.event.startsWith("ORBIT_NFT_PURCHASE_")) return t("ORBIT NFT pack purchase");
  if (item.event === "PVP_STAKE") return t("Arena stake");
  if (item.event === "PVP_PAYOUT") return t("Arena win");
  if (item.event === "PVP_REFUND") return t("Arena refund");
  if (item.event === "LUCKY_SETTLEMENT") return t("Lucky settlement");
  if (item.event === "DEPOSIT") return t("Deposit received");
  if (item.event === "WITHDRAWAL") return t("Wallet withdrawal");
  if (item.kind === "OFFER") {
    if (item.status === "ACCEPTED") return t("Offer accepted · awaiting payment");
    if (item.status === "CANCELLED") return t("Offer cancelled");
    if (item.status === "REJECTED") return t("Offer declined");
  }
  if (item.event === "BUY") return t("Gift purchased");
  const eventLabels: Record<string, string> = { PENDING: "Pending", ACCEPTED: "Accepted", CANCELLED: "Cancelled", REJECTED: "Rejected", BUY: "Gift purchased", SELL: "Gift listed for sale", LIST: "Gift listed for sale", UNLIST: "Listing removed" };
  return t(eventLabels[item.event] ?? item.event.replaceAll("_", " ").toLowerCase());
}

function offerStatusLabel(status: string, t: (key: string) => string) {
  const labels: Record<string, string> = {
    PENDING: "Pending",
    ACCEPTED: "Accepted",
    CANCELLED: "Cancelled",
    REJECTED: "Rejected",
    CONFIRMED: "Confirmed",
    PROCESSING: "Processing…",
    BROADCASTING: "Sending…",
    SUBMITTED: "Sent",
    FAILED: "Failed",
  };
  return t(labels[status] ?? status);
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
  const { t } = useOrbitLanguage();
  return <div>
    <div className="mb-3 flex items-center justify-between"><h2 className="font-semibold">{title}</h2><span className="text-xs text-slate-500">{offers.length} {t("offers")}</span></div>
    {offers.length === 0 ? <EmptyState icon={incoming ? "📥" : "📭"} title={emptyTitle} detail={emptyDetail} /> : offers.map((offer) => <article key={offer.id} className="mb-3 rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex items-center gap-3"><div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-slate-50 text-3xl">{offer.gift?.emoji || "🎁"}</div><div className="min-w-0 flex-1"><h3 className="truncate text-sm font-semibold">{offer.gift?.name || t("Gift")}</h3><p className="mt-1 text-xs text-slate-500">{incoming ? (offer.buyer?.username ? t("From @{username}").replace("{username}", offer.buyer.username) : t("Incoming offer")) : t("Your offer")}</p><p className="mt-1 font-semibold"><GramIcon size={14} className="mr-1 text-blue-700" />{formatTon(offer.amountTon)} GRAM</p></div><span className="rounded-xl bg-slate-50 px-2 py-2 text-[10px] text-slate-600">{offerStatusLabel(offer.status, t)}</span></div>
      {offer.status === "PENDING" && <div className={incoming ? "mt-3 grid grid-cols-2 gap-2" : "mt-3"}>
        <button type="button" disabled={Boolean(busy)} onClick={() => void onAction(offer)} className={`w-full rounded-xl py-2 text-xs disabled:opacity-50 ${actionKey === "accept" ? "bg-blue-700 font-semibold text-white" : "bg-slate-100 text-slate-700"}`}>{busy === `${actionKey}:${offer.id}` ? t("Please wait…") : actionLabel}</button>
        {incoming && onReject && <button type="button" disabled={Boolean(busy)} onClick={() => void onReject(offer)} className="w-full rounded-xl bg-slate-100 py-2 text-xs disabled:opacity-50">{busy === `reject:${offer.id}` ? t("Please wait…") : t("Decline")}</button>}
      </div>}
      {incoming && offer.status === "ACCEPTED" && onRelease && <div className="mt-3 rounded-xl bg-amber-50 p-3">
        <p className="text-xs leading-5 text-amber-900">{t("This offer only reserves the gift in ORBIT. Payment and NFT transfer are not automated yet. Release it if the deal will not continue.")}</p>
        <button type="button" disabled={Boolean(busy)} onClick={() => void onRelease(offer)} className="mt-2 w-full rounded-xl bg-white py-2 text-xs font-medium text-slate-700 shadow-sm disabled:opacity-50">{busy === `release:${offer.id}` ? t("Please wait…") : t("Release reservation")}</button>
      </div>}
    </article>)}
  </div>;
}
