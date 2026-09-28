'use client';

import { useEffect, useState } from 'react';
import { TonConnectUIProvider, useIsConnectionRestored, useTonAddress } from '@tonconnect/ui-react';
import { THEME } from '@tonconnect/ui';
import { syncTelegramProfile } from '../lib/api';
import { getTelegramInitData } from '../lib/telegram';
import MiniAppWelcomeGate from '../components/MiniAppWelcomeGate';
import { OrbitThemeContext, type OrbitTheme } from '../components/OrbitThemeContext';

function WalletDatabaseSync() {
  const connectionRestored = useIsConnectionRestored();
  const walletAddress = useTonAddress();

  useEffect(() => {
    if (!connectionRestored) return;

    let cancelled = false;
    const syncAfterTelegramLoads = async () => {
      for (let attempt = 0; attempt < 20 && !getTelegramInitData(); attempt++) {
        await new Promise((resolve) => setTimeout(resolve, 150));
      }
      if (cancelled || !getTelegramInitData()) return;

      try {
        await syncTelegramProfile(walletAddress || undefined);
      } catch (error) {
        if (!cancelled) console.error('Could not sync Telegram profile and wallet:', error);
      }
    };

    void syncAfterTelegramLoads();
    return () => {
      cancelled = true;
    };
  }, [connectionRestored, walletAddress]);

  return null;
}

const TON_CONNECT_MANIFEST_URL =
  'https://gifty-web-iota.vercel.app/tonconnect-manifest.json';

export default function Providers({
  children,
}: {
  children: React.ReactNode;
}) {
  const [theme, setTheme] = useState<OrbitTheme>('dark');
  const [themeReady, setThemeReady] = useState(false);

  useEffect(() => {
    const storedTheme = window.localStorage.getItem('orbit-theme');
    if (storedTheme === 'dark' || storedTheme === 'light') setTheme(storedTheme);
    setThemeReady(true);
  }, []);

  useEffect(() => {
    if (!themeReady) return;
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem('orbit-theme', theme);
    const webApp = window.Telegram?.WebApp;
    if (theme === 'dark') {
      webApp?.setHeaderColor?.('#0b1220');
      webApp?.setBackgroundColor?.('#0b1220');
    } else {
      webApp?.setHeaderColor?.('#f5f8ff');
      webApp?.setBackgroundColor?.('#f5f8ff');
    }
  }, [theme, themeReady]);

  const toggleTheme = () => setTheme((current) => current === 'dark' ? 'light' : 'dark');

  return (
    <OrbitThemeContext.Provider value={{ theme, toggleTheme }}>
      <TonConnectUIProvider manifestUrl={TON_CONNECT_MANIFEST_URL} uiPreferences={{ theme: theme === 'dark' ? THEME.DARK : THEME.LIGHT, borderRadius: 'm' }}>
        <WalletDatabaseSync />
        <MiniAppWelcomeGate>{children}</MiniAppWelcomeGate>
      </TonConnectUIProvider>
    </OrbitThemeContext.Provider>
  );
}
