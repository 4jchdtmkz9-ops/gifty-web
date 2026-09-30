'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { TonConnectUIProvider, useIsConnectionRestored, useTonAddress } from '@tonconnect/ui-react';
import { THEME } from '@tonconnect/ui';
import { disconnectWallet, syncTelegramProfile } from '../lib/api';
import { waitForTelegramInitData } from '../lib/telegram';
import MiniAppWelcomeGate from '../components/MiniAppWelcomeGate';
import { OrbitThemeContext, type OrbitTheme } from '../components/OrbitThemeContext';
import { OrbitLanguageContext, type OrbitLanguage, translate } from '../components/OrbitLanguageContext';

function WalletDatabaseSync() {
  const connectionRestored = useIsConnectionRestored();
  const walletAddress = useTonAddress();
  const previousWalletAddress = useRef('');

  useEffect(() => {
    if (!connectionRestored) return;

    let cancelled = false;
    const syncAfterTelegramLoads = async () => {
      const initData = await waitForTelegramInitData();
      if (cancelled || !initData) return;

      try {
        if (!walletAddress && previousWalletAddress.current) {
          previousWalletAddress.current = '';
          await disconnectWallet();
          return;
        }
        if (walletAddress) previousWalletAddress.current = walletAddress;
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
  const [language, setLanguageState] = useState<OrbitLanguage>('en');
  const [languageReady, setLanguageReady] = useState(false);

  useEffect(() => {
    const storedTheme = window.localStorage.getItem('orbit-theme');
    if (storedTheme === 'dark' || storedTheme === 'light') setTheme(storedTheme);
    setThemeReady(true);

    const storedLanguage = window.localStorage.getItem('orbit-language');
    if (storedLanguage === 'en' || storedLanguage === 'uk' || storedLanguage === 'ru') {
      setLanguageState(storedLanguage);
    }
    setLanguageReady(true);
  }, []);

  useEffect(() => {
    if (!languageReady) return;
    document.documentElement.lang = language;
  }, [language, languageReady]);

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
  const setLanguage = useCallback((nextLanguage: OrbitLanguage) => {
    setLanguageState(nextLanguage);
    window.localStorage.setItem('orbit-language', nextLanguage);
    document.documentElement.lang = nextLanguage;
  }, []);
  const t = useCallback((key: string) => translate(language, key), [language]);
  const languageContext = useMemo(() => ({ language, setLanguage, t }), [language, setLanguage, t]);

  return (
    <OrbitThemeContext.Provider value={{ theme, toggleTheme }}>
      <OrbitLanguageContext.Provider value={languageContext}>
        <MiniAppWelcomeGate>
          <TonConnectUIProvider manifestUrl={TON_CONNECT_MANIFEST_URL} language={language === 'uk' ? 'en' : language} uiPreferences={{ theme: theme === 'dark' ? THEME.DARK : THEME.LIGHT, borderRadius: 'm' }}>
            <WalletDatabaseSync />
            {children}
          </TonConnectUIProvider>
        </MiniAppWelcomeGate>
      </OrbitLanguageContext.Provider>
    </OrbitThemeContext.Provider>
  );
}
