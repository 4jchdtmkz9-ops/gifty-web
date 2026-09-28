
"use client";

import { useEffect, useState } from "react";
import {
  acceptOffer,
  cancelOffer,
  getIncomingOffers,
  getOffers,
  getOwnedGifts,
  sellGift,
} from "../../lib/api";


const listedNFTs = [
  {
    id: 3,
    name: "Golden Bear",
    collection: "Rare Gifts",
    price: "42 TON",
    emoji: "🐻",
  },
];

export default function ProfilePage() {

const [tab, setTab] = useState("owned");
const [offers, setOffers] = useState<any[]>([]);
const [incomingOffers, setIncomingOffers] = useState<any[]>([]);
const [ownedNFTs, setOwnedNFTs] = useState<any[]>([]);
  useEffect(() => {
  getOwnedGifts()
    .then((data) => {
      console.log("GIFTY owned gifts:", data);
      setOwnedNFTs(data);
    })
    .catch((error) => {
      console.error("GIFTY owned gifts error:", error);
    });

  getOffers()
    .then((data) => {
      // ...
    });

  getIncomingOffers()
    .then((data) => {
      // ...
    });
}, []);

  return (
    <main className="min-h-screen bg-[#0b0b0f] text-white">
      <div className="mx-auto min-h-screen max-w-[480px] px-4 pb-28">

        {/* Header */}
        <header className="py-5">
          <p className="text-sm text-white/40">GIFTY</p>
          <h1 className="text-2xl font-bold">Profile</h1>
        </header>

        {/* Profile card */}
        <section className="rounded-3xl border border-white/10 bg-[#15151c] p-5">
          <div className="flex items-center gap-4">

            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#555579] to-[#22222f] text-3xl">
              👤
            </div>

            <div className="flex-1">
              <h2 className="font-semibold">GIFTY User</h2>

              <p className="mt-1 text-xs text-white/30">
                Wallet not connected
              </p>
            </div>

            <button className="rounded-xl bg-white px-3 py-2 text-xs font-semibold text-black">
              Connect
            </button>

          </div>

          <div className="mt-5 grid grid-cols-3 gap-2">

            <div className="rounded-2xl bg-white/5 p-3 text-center">
              <p className="text-lg font-bold">{ownedNFTs.length}</p>
              <p className="text-[10px] text-white/30">Owned</p>
            </div>

            <div className="rounded-2xl bg-white/5 p-3 text-center">
              <p className="text-lg font-bold">{listedNFTs.length}</p>
              <p className="text-[10px] text-white/30">Listed</p>
            </div>

            <div className="rounded-2xl bg-white/5 p-3 text-center">
              <p className="text-lg font-bold">{offers.length}</p>
              <p className="text-[10px] text-white/30">Offers</p>
            </div>

          </div>
        </section>

        {/* Tabs */}
        <div className="mt-6 grid grid-cols-3 rounded-2xl bg-white/5 p-1">

          <button
            type="button"
            onClick={() => setTab("owned")}
            className={`rounded-xl py-3 text-xs font-medium ${
              tab === "owned"
                ? "bg-white text-black"
                : "text-white/40"
            }`}
          >
            Owned
          </button>

          <button
            type="button"
            onClick={() => setTab("listed")}
            className={`rounded-xl py-3 text-xs font-medium ${
              tab === "listed"
                ? "bg-white text-black"
                : "text-white/40"
            }`}
          >
            Listed
          </button>

          <button
            type="button"
            onClick={() => setTab("offers")}
            className={`rounded-xl py-3 text-xs font-medium ${
              tab === "offers"
                ? "bg-white text-black"
                : "text-white/40"
            }`}
          >
            Offers
          </button>

        </div>

        {/* Owned */}
        {tab === "owned" && (
          <section className="mt-5">

            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold">My NFTs</h2>

              <span className="text-xs text-white/30">
                {ownedNFTs.length} items
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">

              {ownedNFTs.map((nft) => (
                <div
                  key={nft.id}
                  className="overflow-hidden rounded-3xl border border-white/10 bg-[#15151c]"
                >
                 

                  <div className="flex h-36 items-center justify-center bg-gradient-to-br from-[#292943] to-[#101016] text-6xl">
                    {nft.emoji}
                  </div>

                  <div className="p-3">

                    <h3 className="truncate text-sm font-semibold">
                      {nft.name}
                    </h3>

                    <p className="mt-1 truncate text-xs text-white/30">
                      {nft.collection}
                    </p>

                    <button
  type="button"
  onClick={async () => {
    const price = window.prompt(
      "Enter selling price in TON",
      String(nft.priceTon ?? ""),
    );

    if (!price) return;

    try {
      await sellGift(nft.id, price);

      setOwnedNFTs((currentNFTs) =>
        currentNFTs.filter(
          (currentNft) => currentNft.id !== nft.id,
        ),
      );

      alert("Gift listed for sale");
    } catch (error) {
      console.error("Sell gift error:", error);
      alert("Failed to list gift");
    }
  }}
  className="mt-3 w-full rounded-xl bg-white py-2 text-xs font-semibold text-black"
>
  Sell
</button>

                  </div>
                </div>
              ))}

            </div>
          </section>
        )}

        {/* Listed */}
        {tab === "listed" && (
          <section className="mt-5">

            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold">Listed for sale</h2>

              <span className="text-xs text-white/30">
                {listedNFTs.length} items
              </span>
            </div>

            {listedNFTs.map((nft) => (
              <div
                key={nft.id}
                className="mb-3 flex items-center gap-3 rounded-2xl border border-white/10 bg-[#15151c] p-3"
              >

                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5 text-3xl">
                  {nft.emoji}
                </div>

                <div className="flex-1">

                  <h3 className="text-sm font-semibold">
                    {nft.name}
                  </h3>

                  <p className="mt-1 text-xs text-white/30">
                    {nft.collection}
                  </p>

                  <p className="mt-2 text-sm font-semibold">
                    {nft.price}
                  </p>

                </div>

                <button
                  type="button"
                  className="rounded-xl bg-white/10 px-3 py-2 text-xs"
                >
                  Edit
                </button>

              </div>
            ))}

          </section>
        )}

        {/* Offers */}
        {tab === "offers" && (
          <section className="mt-5">

            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold">My offers</h2>

              <span className="text-xs text-white/30">
                {offers.length} offers
              </span>
            </div>

            {offers.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-[#15151c] p-6 text-center">

                <div className="text-4xl">
                  📭
                </div>

                <p className="mt-3 text-sm font-medium">
                  No offers yet
                </p>

                <p className="mt-1 text-xs text-white/30">
                  Your offers will appear here
                </p>

              </div>
            ) : (
              offers.map((offer) => (
                <div
                  key={offer.id}
                  className="mb-3 rounded-2xl border border-white/10 bg-[#15151c] p-4"
                >

                  <div className="flex items-center gap-3">

                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 text-3xl">
                      {offer.gift?.emoji ?? "🎁"}
                    </div>

                    <div className="flex-1">

                      <h3 className="text-sm font-semibold">
                        {offer.gift?.name ?? "Gift"}
                      </h3>

                      <p className="mt-1 text-xs text-white/30">
                        Your offer
                      </p>

                      <p className="mt-1 font-semibold">
                        {offer.amountTon} TON
                      </p>

                    </div>

                    <span className="rounded-xl bg-white/5 px-3 py-2 text-[10px] text-white/50">
                      {offer.status}
                    </span>

                  </div>

{offer.status === "PENDING" && (
  <button
    type="button"
    onClick={async () => {
      try {
        await cancelOffer(offer.id);

        setOffers((currentOffers) =>
          currentOffers.map((currentOffer) =>
            currentOffer.id === offer.id
              ? {
                  ...currentOffer,
                  status: "CANCELLED",
                }
              : currentOffer,
          ),
        );
      } catch (error) {
        console.error("Cancel offer error:", error);
        alert("Failed to cancel offer");
      }
    }}
    className="mt-3 w-full rounded-xl bg-white/10 py-2 text-xs"
  >
    Cancel offer
  </button>
)}

                </div>
              ))
            )}

          </section>
        )}

        {/* Incoming offers */}
{tab === "offers" && (
  <section className="mt-8">
    <div className="mb-3 flex items-center justify-between">
      <h2 className="font-semibold">Incoming offers</h2>

      <span className="text-xs text-white/30">
        {incomingOffers.length} offers
      </span>
    </div>

    {incomingOffers.length === 0 ? (
      <div className="rounded-2xl border border-white/10 bg-[#15151c] p-6 text-center">
        <div className="text-4xl">
          📥
        </div>

        <p className="mt-3 text-sm font-medium">
          No incoming offers
        </p>

        <p className="mt-1 text-xs text-white/30">
          Offers for your NFTs will appear here
        </p>
      </div>
    ) : (
      incomingOffers.map((offer) => (
        <div
          key={offer.id}
          className="mb-3 rounded-2xl border border-white/10 bg-[#15151c] p-4"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 text-3xl">
              {offer.gift?.emoji ?? "🎁"}
            </div>

            <div className="flex-1">
              <h3 className="text-sm font-semibold">
                {offer.gift?.name ?? "Gift"}
              </h3>

              <p className="mt-1 text-xs text-white/30">
                Incoming offer
              </p>

              <p className="mt-1 font-semibold">
                {offer.amountTon} TON
              </p>

              {offer.buyer?.username && (
                <p className="mt-1 text-xs text-white/30">
                  From @{offer.buyer.username}
                </p>
              )}
            </div>

            <span className="rounded-xl bg-white/5 px-3 py-2 text-[10px] text-white/50">
              {offer.status}
            </span>
          </div>

          {offer.status === "PENDING" && (
            <button
              type="button"
              onClick={async () => {
                try {
                  await acceptOffer(offer.id);

                  setIncomingOffers((currentOffers) =>
                    currentOffers.map((currentOffer) =>
                      currentOffer.id === offer.id
                        ? {
                            ...currentOffer,
                            status: "ACCEPTED",
                          }
                        : currentOffer,
                    ),
                  );
                } catch (error) {
                  console.error("Accept offer error:", error);
                  alert("Failed to accept offer");
                }
              }}
              className="mt-3 w-full rounded-xl bg-white py-2 text-xs font-semibold text-black"
            >
              Accept offer
            </button>
          )}
        </div>
      ))
    )}
  </section>
)}
        {/* Transaction history */}
        <section className="mt-8">

          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">Recent activity</h2>

            <button
              type="button"
              className="text-xs text-white/30"
            >
              View all
            </button>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#15151c]">

            <div className="flex items-center gap-3 border-b border-white/5 p-4">

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5">
                🛒
              </div>

              <div className="flex-1">

                <p className="text-sm font-medium">
                  Purchased NFT
                </p>

                <p className="text-xs text-white/30">
                  Diamond Ring
                </p>

              </div>

              <span className="text-sm font-semibold">
                -24.5 TON
              </span>

            </div>

            <div className="flex items-center gap-3 p-4">

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5">
                💰
              </div>

              <div className="flex-1">

                <p className="text-sm font-medium">
                  NFT sold
                </p>

                <p className="text-xs text-white/30">
                  Golden Bear
                </p>

              </div>

              <span className="text-sm font-semibold">
                +42 TON
              </span>

            </div>

          </div>
        </section>

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
              className="flex flex-col items-center gap-1 text-white/40"
            >
              <span>🛍️</span>
              <span className="text-[10px]">Market</span>
            </a>

            <a
              href="/cases"
              className="flex flex-col items-center gap-1 text-white/40"
            >
              <span>🎁</span>
              <span className="text-[10px]">Cases</span>
            </a>

            <a
              href="/profile"
              className="flex flex-col items-center gap-1 text-white"
            >
              <span>👤</span>
              <span className="text-[10px]">Profile</span>
            </a>

          </div>

        </nav>

      </div>
    </main>
  );
}
