import { getTelegramInitData } from './telegram';

const API_URL = 'https://gifty-api-75hj.onrender.com';

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

export async function createTransaction(data: {
  type: string;
  amountTon: string;
  giftId?: string;
  buyerId?: string;
}) {
  const response = await fetch(`${API_URL}/transactions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
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
    throw new Error('Failed to create offer');
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
    throw new Error('Failed to fetch offers');
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
    throw new Error('Failed to cancel offer');
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
    throw new Error('Failed to accept offer');
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
    throw new Error('Failed to fetch incoming offers');
  }

  return response.json();
}