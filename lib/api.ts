import { getTelegramInitData } from './telegram';

const API_URL = 'http://localhost:3001';

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