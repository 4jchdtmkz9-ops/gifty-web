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