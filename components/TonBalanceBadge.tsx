'use client';

import { useEffect, useState } from 'react';
import { useTonAddress } from '@tonconnect/ui-react';
import { getTonBalance } from '../lib/api';
import { formatTonBalance } from '../lib/formatTon';

export default function TonBalanceBadge() {
  const address = useTonAddress();
  const [balance, setBalance] = useState('0');

  useEffect(() => {
    let active = true;

    if (!address) {
      setBalance('0');
      return () => {
        active = false;
      };
    }

    getTonBalance(address)
      .then((data) => {
        if (active) setBalance(data.balanceTon);
      })
      .catch((error) => {
        console.error('TON balance error:', error);
        if (active) setBalance('0');
      });

    return () => {
      active = false;
    };
  }, [address]);

  return (
    <div className="inline-flex shrink-0 items-center gap-2 rounded-full bg-[#14283f] px-4 py-2.5 shadow-[0_4px_12px_rgba(15,35,58,0.2)]" aria-label={`${formatTonBalance(balance)} GRAM balance`}>
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 text-white" fill="currentColor">
        <path d="M12 1.8 22.2 12 12 22.2 1.8 12 12 1.8Zm0 4.2-1.15 4.85L6 12l4.85 1.15L12 18l1.15-4.85L18 12l-4.85-1.15L12 6Z" />
      </svg>
      <span className="text-base font-bold tabular-nums text-white">{formatTonBalance(balance)} GRAM</span>
    </div>
  );
}
