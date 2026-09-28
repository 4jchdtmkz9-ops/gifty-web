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
