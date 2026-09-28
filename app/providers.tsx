'use client';

import { useEffect } from 'react';
import { TonConnectUIProvider, useIsConnectionRestored, useTonAddress } from '@tonconnect/ui-react';
import { THEME } from '@tonconnect/ui';
import { syncTelegramProfile } from '../lib/api';
import { getTelegramInitData } from '../lib/telegram';
import MiniAppWelcomeGate from '../components/MiniAppWelcomeGate';

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
  return (
    <TonConnectUIProvider manifestUrl={TON_CONNECT_MANIFEST_URL} uiPreferences={{ theme: THEME.LIGHT, borderRadius: 'm' }}>
      <WalletDatabaseSync />
      <MiniAppWelcomeGate>{children}</MiniAppWelcomeGate>
    </TonConnectUIProvider>
  );
}
