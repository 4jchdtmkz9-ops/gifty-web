import { getTelegramInitData } from './telegram';

const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'https://gifty-api-75hj.onrender.com').replace(/\/+$/, '');

export type PvpPlayer = { id: string; telegramId?: string; username: string | null; firstName: string | null; photoUrl?: string | null };
export type PvpRoom = {
  id: string; code: string; stakeGram: string; status: 'WAITING' | 'COUNTDOWN' | 'COMPLETED' | 'CANCELLED'; creatorId: string;
  isPublic?: boolean; countdownEndsAt?: string | null;
  winnerId: string | null; participants: Array<{ id: string; userId: string; stakeGram: string; user: PvpPlayer }>;
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
  return response.json() as Promise<T>;
}

export async function searchPvpUsers(query: string, initData: string) {
  return pvpRequest<PvpPlayer[]>(`users/search?q=${encodeURIComponent(query)}`, initData);
}
export async function createPvpRoom(stakeGram: string, inviteeIds: string[], initData: string) {
  return pvpRequest<PvpRoom>('rooms', initData, { stakeGram, inviteeIds });
}
export async function joinPublicArena(stakeGram: string, initData: string) {
  return pvpRequest<PvpRoom>('public-join', initData, { stakeGram });
}
export async function getPublicArenaRooms(initData: string) {
  return pvpRequest<PvpRoom[]>('public-rooms', initData);
}
export async function getPvpRoom(code: string, initData: string) {
  return pvpRequest<PvpRoom>(`rooms?code=${encodeURIComponent(code)}`, initData);
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
