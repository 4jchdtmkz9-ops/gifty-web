'use client';

import { TonConnectUIProvider } from '@tonconnect/ui-react';
import { THEME } from '@tonconnect/ui';

const TON_CONNECT_MANIFEST_URL =
  'https://gifty-web-iota.vercel.app/tonconnect-manifest.json';

export default function Providers({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <TonConnectUIProvider manifestUrl={TON_CONNECT_MANIFEST_URL} uiPreferences={{ theme: THEME.LIGHT, borderRadius: 'm' }}>
      {children}
    </TonConnectUIProvider>
  );
}
