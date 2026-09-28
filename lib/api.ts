import { getTelegramInitData } from './telegram';

const API_URL = 'https://gifty-api-75hj.onrender.com';

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
    throw new Error('Failed to fetch gifts');
  }

  return response.json();
}

export async function getMarketplaceNfts(offset = 0, search = '') {
  const params = new URLSearchParams({ offset: String(offset) });
  if (search.trim()) params.set('search', search.trim());

  const response = await fetch(`${API_URL}/market/nfts?${params.toString()}`);
  if (!response.ok) {
    throw new Error(await responseError(response, 'Failed to fetch marketplace NFTs'));
  }

  return response.json() as Promise<{
    items: Array<{
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
    }>;
    totalCount: number;
  }>;
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
