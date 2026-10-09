import { getTelegramInitData } from './telegram';
import type { DemoBackdrop, DemoBackdropPackId } from './demoBackdrops';

const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'https://gifty-api-75hj.onrender.com').replace(/\/+$/, '');

export type PvpPlayer = { id: string; telegramId?: string; username: string | null; firstName: string | null; photoUrl?: string | null };
export type PvpRoom = {
  id: string; code: string; stakeGram: string; status: 'WAITING' | 'COUNTDOWN' | 'COMPLETED' | 'CANCELLED'; creatorId: string;
  isPublic?: boolean; arenaMode?: 'CLASSIC' | 'WHEEL'; countdownEndsAt?: string | null; completedAt?: string | null;
  winnerId: string | null; participants: Array<{ id: string; userId: string; stakeGram: string; cashStakeGram?: string; user: PvpPlayer; gifts?: Array<{ id: string; valueGram: string; gift: { id: string; name: string; imageUrl?: string | null; backdropName?: string | null; backdropColor?: string | null; emoji?: string | null; collection?: string; priceTon: string | number } }> }>;
  invitations: Array<{ id: string; status: string; recipient: PvpPlayer }>;
  creator: PvpPlayer; winner: PvpPlayer | null;
  notificationStats?: { sent: number; failed: number };
  viewerIsCreator?: boolean;
  viewerIsParticipant?: boolean;
  viewerStakeGram?: string | null;
};

async function pvpRequest<T>(path: string, initData: string, body?: Record<string, unknown>): Promise<T> {
  const response = await fetch(`${API_URL}/pvp/${path}`, {
    method: body ? 'POST' : 'GET',
    headers: body ? { 'Content-Type': 'application/json', 'X-Telegram-Init-Data': initData } : { 'X-Telegram-Init-Data': initData },
    body: body ? JSON.stringify({ ...body, initData }) : undefined,
    cache: 'no-store',
  });
  if (!response.ok) throw new Error(await responseError(response, 'Arena request failed'));
  const result = await response.json() as T;
  if (body && typeof window !== 'undefined') window.dispatchEvent(new Event('orbit-balance-updated'));
  return result;
}

export async function searchPvpUsers(query: string, initData: string) {
  return pvpRequest<PvpPlayer[]>(`users/search?q=${encodeURIComponent(query)}`, initData);
}
export async function createPvpRoom(stakeGram: string, inviteeIds: string[], initData: string, arenaMode: 'CLASSIC' | 'WHEEL' = 'CLASSIC') {
  return pvpRequest<PvpRoom>('rooms', initData, { stakeGram, inviteeIds, arenaMode });
}
export async function joinPublicArena(stakeGram: string, initData: string, arenaMode: 'CLASSIC' | 'WHEEL' = 'CLASSIC') {
  return pvpRequest<PvpRoom>('public-join', initData, { stakeGram, arenaMode });
}
export async function joinPublicArenaWithGifts(giftIds: string[], initData: string, arenaMode: 'CLASSIC' | 'WHEEL' = 'CLASSIC') {
  return pvpRequest<PvpRoom>('public-join-gift', initData, { giftIds, arenaMode });
}
export async function getPublicArenaRooms(initData: string, arenaMode: 'CLASSIC' | 'WHEEL' = 'CLASSIC') {
  return pvpRequest<PvpRoom[]>(`public-rooms?mode=${arenaMode}`, initData);
}
export async function getPvpRoom(code: string, initData: string) {
  return pvpRequest<PvpRoom>(`rooms?code=${encodeURIComponent(code)}`, initData);
}
export async function getPvpShareLink(code: string, initData: string) {
  return pvpRequest<{ url: string }>(`share-link?code=${encodeURIComponent(code)}`, initData);
}
export async function joinPvpRoom(code: string, initData: string) {
  return pvpRequest<PvpRoom>('rooms/join', initData, { code });
}
export async function startPvpRound(code: string, initData: string) {
  return pvpRequest<PvpRoom>('rooms/start', initData, { code });
}
export async function getMyPvpRooms(initData: string) {
  return pvpRequest<PvpRoom[]>('rooms/mine', initData);
}
export type PvpInvitation = { id: string; sender: PvpPlayer; room: { code: string; stakeGram: string; createdAt: string; _count: { participants: number } } };
export async function getPvpInvitations(initData: string) {
  return pvpRequest<PvpInvitation[]>('invitations', initData);
}
export async function answerPvpInvitation(invitationId: string, accept: boolean, initData: string) {
  return pvpRequest<PvpRoom>('invitations/answer', initData, { invitationId, accept });
}
export async function stakePvpGifts(code: string, giftIds: string[], initData: string) {
  return pvpRequest<PvpRoom>('stake-gifts', initData, { code, giftIds });
}

async function responseError(response: Response, fallback: string) {
  const text = await response.text();
  try {
    const payload = JSON.parse(text) as { message?: string | string[] };
    if (payload.message) {
      return Array.isArray(payload.message) ? payload.message.join(', ') : payload.message;
    }
  } catch {
    // Use the response body as-is when it is not JSON.
  }
  return text || fallback;
}

export async function authenticateTelegram() {
  const initData = getTelegramInitData();

  if (!initData) {
    return null;
  }

  const response = await fetch(`${API_URL}/users/telegram-auth`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ initData }),
  });

  if (!response.ok) {
    throw new Error('Telegram authentication failed');
  }

  return response.json();
}

export type CurrentUser = {
  id: string;
  telegramId: string;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  photoUrl: string | null;
  wallets: Array<{
    id: string;
    address: string;
    network: string;
    isConnected: boolean;
  }>;
};

export async function syncTelegramProfile(address?: string) {
  const initData = getTelegramInitData();
  if (!initData) throw new Error('Telegram initData is missing');

  const response = await fetch(`${API_URL}/users/me`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ initData, address }),
  });

  if (!response.ok) {
    throw new Error(await responseError(response, 'Failed to load Telegram profile'));
  }

  return response.json() as Promise<CurrentUser>;
}

export async function connectWallet(
  address: string,
  network = 'TON',
) {
  const initData = getTelegramInitData();

  if (!initData) {
    throw new Error('Telegram initData is missing');
  }

  const response = await fetch(`${API_URL}/users/wallet`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      initData,
      address,
      network,
    }),
  });

  if (!response.ok) {
    throw new Error('Wallet connection failed');
  }

  return response.json();
}

export async function disconnectWallet() {
  const initData = getTelegramInitData();
  if (!initData) throw new Error('Telegram initData is missing');

  const response = await fetch(`${API_URL}/users/wallet/disconnect`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ initData }),
  });

  if (!response.ok) {
    throw new Error(await responseError(response, 'Wallet disconnection failed'));
  }

  return response.json() as Promise<{ disconnected: boolean }>;
}

export async function getTonBalance(address: string) {
  const response = await fetch(
    `${API_URL}/ton/balance?address=${encodeURIComponent(address)}`,
  );

  if (!response.ok) {
    throw new Error('Failed to fetch TON balance');
  }

  return response.json();
}

export type BotBalance = { balanceGram: string; depositConfigured: boolean; withdrawalConfigured: boolean };

export type GameSettlement = {
  reward: { id: string; name: string; valueGram: string; kind?: 'gram' | 'nft'; chance?: number };
  balanceGram: string;
};

async function gameRequest(path: string, requestId: string): Promise<GameSettlement> {
  const initData = getTelegramInitData();
  if (!initData) throw new Error('Open ORBIT inside Telegram to play');
  const response = await fetch(`${API_URL}/games/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ initData, requestId }),
    cache: 'no-store',
  });
  if (!response.ok) throw new Error(await responseError(response, 'Could not settle game'));
  const result = await response.json() as GameSettlement;
  if (typeof window !== 'undefined') window.dispatchEvent(new Event('orbit-balance-updated'));
  return result;
}

export function spinLuckyForBalance(requestId: string) {
  return gameRequest('lucky/spin', requestId);
}

export type BotDepositIntent = {
  id: string;
  amountTon: string;
  address: string;
  comment: string;
  payload: string;
  expiresAt: string;
};
export type BotDepositStatus = {
  id: string;
  status: 'PENDING' | 'CONFIRMED' | 'MISMATCHED' | 'EXPIRED';
  requestedTon: string;
  receivedTon: string | null;
  txHash: string | null;
  expiresAt: string;
};
export type BotWithdrawal = { id: string; amountTon: string; destination: string; status: 'PENDING' | 'PROCESSING' | 'BROADCASTING' | 'SUBMITTED' | 'CONFIRMED' | 'FAILED'; failureReason?: string | null; txHash?: string | null; createdAt: string; confirmedAt?: string | null };

export async function getBotBalance() {
  const initData = getTelegramInitData();
  if (!initData) throw new Error('Telegram initData is missing');
  const response = await fetch(`${API_URL}/users/balance`, { headers: { 'X-Telegram-Init-Data': initData }, cache: 'no-store' });
  if (!response.ok) throw new Error(await responseError(response, 'Failed to fetch ORBIT balance'));
  return response.json() as Promise<BotBalance>;
}

export async function createBotDepositIntent(amountTon: string, walletAddress: string) {
  const initData = getTelegramInitData();
  if (!initData) throw new Error('Telegram initData is missing');
  const response = await fetch(`${API_URL}/users/deposit-intents`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ initData, amountTon, walletAddress }),
  });
  if (!response.ok) throw new Error(await responseError(response, 'Failed to create deposit'));
  return response.json() as Promise<BotDepositIntent>;
}

export async function getBotDepositStatus(depositId: string) {
  const initData = getTelegramInitData();
  if (!initData) throw new Error('Telegram initData is missing');
  const response = await fetch(`${API_URL}/users/deposits/${encodeURIComponent(depositId)}`, {
    headers: { 'X-Telegram-Init-Data': initData },
    cache: 'no-store',
  });
  if (!response.ok) throw new Error(await responseError(response, 'Failed to check deposit'));
  return response.json() as Promise<BotDepositStatus>;
}

export async function createBotWithdrawal(amountGram: string) {
  const initData = getTelegramInitData();
  if (!initData) throw new Error('Telegram initData is missing');
  const response = await fetch(`${API_URL}/users/withdrawals`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ initData, amountGram }),
  });
  if (!response.ok) throw new Error(await responseError(response, 'Failed to create withdrawal'));
  return response.json() as Promise<BotWithdrawal>;
}

export async function getBotWithdrawalStatus(id: string) {
  const initData = getTelegramInitData();
  if (!initData) throw new Error('Telegram initData is missing');
  const response = await fetch(`${API_URL}/users/withdrawals/${encodeURIComponent(id)}`, { headers: { 'X-Telegram-Init-Data': initData }, cache: 'no-store' });
  if (!response.ok) throw new Error(await responseError(response, 'Failed to check withdrawal'));
  return response.json() as Promise<BotWithdrawal>;
}

export async function getGifts() {
  const response = await fetch(`${API_URL}/gifts`);

  if (!response.ok) {
    throw new Error(await responseError(response, 'Failed to fetch gifts'));
  }

  return response.json() as Promise<Array<{
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
  }>>;
}

export async function getOwnedGifts() {
  const initData = getTelegramInitData();

  if (!initData) {
    throw new Error('Telegram initData is missing');
  }

  const response = await fetch(
    `${API_URL}/gifts/owned?initData=${encodeURIComponent(initData)}`,
  );

  if (!response.ok) {
    throw new Error(await responseError(response, 'Failed to fetch owned gifts'));
  }

  return response.json();
}
export async function getListedGifts() {
  const initData = getTelegramInitData();
  if (!initData) throw new Error('Telegram initData is missing');

  const response = await fetch(
    `${API_URL}/gifts/listed?initData=${encodeURIComponent(initData)}`,
  );
  if (!response.ok) throw new Error(await responseError(response, 'Failed to fetch listed gifts'));
  return response.json();
}

export async function unlistGift(giftId: string) {
  const initData = getTelegramInitData();
  if (!initData) throw new Error('Telegram initData is missing');

  const response = await fetch(`${API_URL}/gifts/unlist`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ giftId, initData }),
  });
  if (!response.ok) throw new Error(await responseError(response, 'Failed to remove listing'));
  return response.json();
}
export async function sellGift(
  giftId: string,
  priceTon: string,
) {
  const initData = getTelegramInitData();

  if (!initData) {
    throw new Error('Telegram initData is missing');
  }

  const response = await fetch(`${API_URL}/gifts/sell`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      giftId,
      priceTon,
      initData,
    }),
  });

if (!response.ok) {
  const message = await responseError(response, 'Failed to list gift');
  throw new Error(`Sell failed (${response.status}): ${message}`);
}

  return response.json();
}

async function demoBackdropRequest<T>(path: string, body: Record<string, unknown>) {
  const initData = getTelegramInitData();
  if (!initData) throw new Error('Open ORBIT inside Telegram to manage ORBIT NFTs');
  const response = await fetch(`${API_URL}/orbit-nft/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...body, initData }),
    cache: 'no-store',
  });
  if (!response.ok) throw new Error(await responseError(response, 'ORBIT NFT action failed'));
  if (typeof window !== 'undefined') window.dispatchEvent(new Event('orbit-balance-updated'));
  return response.json() as Promise<T>;
}

export function syncDemoBackdropInventory(items: DemoBackdrop[]) {
  return demoBackdropRequest<DemoBackdrop[]>('sync', { items: items.map(({ id, name, packId }) => ({ id, name, packId: packId ?? 'sweeties' })) });
}

export async function getDemoBackdropSupply() {
  const response = await fetch(`${API_URL}/orbit-nft/supply`, { cache: 'no-store' });
  if (!response.ok) throw new Error(await responseError(response, 'Could not load pack supply'));
  return response.json() as Promise<Record<DemoBackdropPackId, { limit: number; sold: number; remaining: number }>>;
}

export function purchaseDemoBackdropPack(packId: DemoBackdropPackId) {
  return demoBackdropRequest<{ item: DemoBackdrop; supply: { limit: number; sold: number; remaining: number }; balanceGram: string }>('purchase', { packId, requestId: crypto.randomUUID() });
}

export function transferDemoBackdrop(itemId: string, recipientUsername: string) {
  return demoBackdropRequest<{ transferred: boolean }>('transfer', { itemId, recipientUsername });
}

export function sellDemoBackdrop(itemId: string) {
  return demoBackdropRequest<{ sold: boolean; creditedGram: string; balanceGram: string; name: string }>('sell', { itemId });
}

export async function createTransaction(data: {
  type: string;
  amountTon: string;
  giftId?: string;
}) {
  const initData = getTelegramInitData();

  if (!initData) {
    throw new Error('Telegram initData is missing');
  }

  const response = await fetch(`${API_URL}/transactions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ...data,
      initData,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Transaction API error:', errorText);
    throw new Error('Failed to create transaction');
  }

  return response.json();
}

export async function createOffer(data: {
  amountTon: string;
  giftId: string;
  sellerId?: string;
  expiresAt?: string;
}) {
  const initData = getTelegramInitData();

  if (!initData) {
    throw new Error('Telegram initData is missing');
  }

  const response = await fetch(`${API_URL}/offers`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ...data,
      initData,
    }),
  });

  if (!response.ok) {
    throw new Error(await responseError(response, 'Failed to create offer'));
  }

  return response.json();
}

export async function getOffers() {
  const initData = getTelegramInitData();

  if (!initData) {
    throw new Error('Telegram initData is missing');
  }

  const response = await fetch(
    `${API_URL}/offers?initData=${encodeURIComponent(initData)}`,
  );

  if (!response.ok) {
    throw new Error(await responseError(response, 'Failed to fetch offers'));
  }

  return response.json();
}

export async function cancelOffer(offerId: string) {
  const initData = getTelegramInitData();

  if (!initData) {
    throw new Error('Telegram initData is missing');
  }

  const response = await fetch(`${API_URL}/offers/cancel`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      offerId,
      initData,
    }),
  });

  if (!response.ok) {
    throw new Error(await responseError(response, 'Failed to cancel offer'));
  }

  return response.json();
}
export async function acceptOffer(offerId: string) {
  const initData = getTelegramInitData();

  if (!initData) {
    throw new Error('Telegram initData is missing');
  }

  const response = await fetch(`${API_URL}/offers/accept`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      offerId,
      initData,
    }),
  });

  if (!response.ok) {
    throw new Error(await responseError(response, 'Failed to accept offer'));
  }

  return response.json();
}

export async function rejectOffer(offerId: string) {
  const initData = getTelegramInitData();
  if (!initData) throw new Error('Telegram initData is missing');

  const response = await fetch(`${API_URL}/offers/reject`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ offerId, initData }),
  });
  if (!response.ok) throw new Error(await responseError(response, 'Failed to reject offer'));
  return response.json();
}

export async function releaseOfferAcceptance(offerId: string) {
  const initData = getTelegramInitData();
  if (!initData) throw new Error('Telegram initData is missing');

  const response = await fetch(`${API_URL}/offers/release-accepted`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ offerId, initData }),
  });
  if (!response.ok) {
    throw new Error(await responseError(response, 'Failed to release accepted offer'));
  }
  return response.json();
}

export async function getIncomingOffers() {
  const initData = getTelegramInitData();

  if (!initData) {
    throw new Error('Telegram initData is missing');
  }

  const response = await fetch(
    `${API_URL}/offers/incoming?initData=${encodeURIComponent(initData)}`,
  );

  if (!response.ok) {
    throw new Error(await responseError(response, 'Failed to fetch incoming offers'));
  }

  return response.json();
}

export async function getProfileHistory() {
  const initData = getTelegramInitData();
  if (!initData) throw new Error('Telegram initData is missing');

  const response = await fetch(
    `${API_URL}/profile/history?initData=${encodeURIComponent(initData)}`,
  );
  if (!response.ok) {
    throw new Error(await responseError(response, 'Failed to fetch profile history'));
  }
  return response.json();
}
