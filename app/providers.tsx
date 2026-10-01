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
    let locked = false;
    let savedScrollY = 0;
    let priorBodyStyles: { position: string; top: string; width: string; overflow: string } | null = null;
    let priorRootOverflow = '';

    const freezePage = () => {
      if (locked) return;
      locked = true;
      savedScrollY = window.scrollY;
      priorBodyStyles = {
        position: document.body.style.position,
        top: document.body.style.top,
        width: document.body.style.width,
        overflow: document.body.style.overflow,
      };
      priorRootOverflow = document.documentElement.style.overflow;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${savedScrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    };

    const unfreezePage = () => {
      if (!locked || !priorBodyStyles) return;
      document.body.style.position = priorBodyStyles.position;
      document.body.style.top = priorBodyStyles.top;
      document.body.style.width = priorBodyStyles.width;
      document.body.style.overflow = priorBodyStyles.overflow;
      document.documentElement.style.overflow = priorRootOverflow;
      locked = false;
      priorBodyStyles = null;
      window.scrollTo(0, savedScrollY);
    };

    const isStaticNumericInput = (target: EventTarget | null) =>
      target instanceof HTMLInputElement && target.hasAttribute('data-static-keyboard');
    const onFocusIn = (event: FocusEvent) => {
      if (isStaticNumericInput(event.target)) freezePage();
    };
    const onFocusOut = () => {
      window.setTimeout(() => {
        if (!isStaticNumericInput(document.activeElement)) unfreezePage();
      }, 80);
    };

    document.addEventListener('focusin', onFocusIn);
    document.addEventListener('focusout', onFocusOut);
    return () => {
      document.removeEventListener('focusin', onFocusIn);
      document.removeEventListener('focusout', onFocusOut);
      unfreezePage();
    };
  }, []);

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
