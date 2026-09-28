export function getTelegramInitData(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const webApp = window.Telegram?.WebApp;

  if (!webApp) {
    return null;
  }

  return webApp.initData || null;
}

export async function waitForTelegramInitData(timeoutMs = 5000): Promise<string | null> {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const initData = getTelegramInitData();
    if (initData) return initData;
    await new Promise((resolve) => window.setTimeout(resolve, 100));
  }

  return getTelegramInitData();
}

export function getTelegramProfilePhoto(): string | null {
  if (typeof window === 'undefined') return null;

  const user = (window.Telegram?.WebApp?.initDataUnsafe as {
    user?: { photo_url?: unknown };
  } | null)?.user;
  const photoUrl = user?.photo_url;

  return typeof photoUrl === 'string' && /^https?:\/\//i.test(photoUrl)
    ? photoUrl
    : null;
}
