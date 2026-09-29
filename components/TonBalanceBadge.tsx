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
    <div className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-2 shadow-sm" aria-label={`${formatTonBalance(balance)} TON balance`}>
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 text-blue-600" fill="currentColor">
        <path d="M12 2.2 2.7 7.55v8.9L12 21.8l9.3-5.35v-8.9L12 2.2Zm0 2.3 6.9 4-6.9 4-6.9-4 6.9-4Zm-7.1 6 5.95 3.45v5.3L4.9 15.8v-5.3Zm14.2 0v5.3l-5.95 3.45v-5.3l5.95-3.45Z" />
      </svg>
      <span className="text-xs font-semibold tabular-nums text-slate-800">{formatTonBalance(balance)}</span>
      <span className="text-[10px] font-bold text-blue-700">TON</span>
    </div>
  );
}
