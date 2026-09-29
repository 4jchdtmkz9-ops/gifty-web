'use client';

import { useEffect, useState } from 'react';
import { useTonAddress } from '@tonconnect/ui-react';
import { getTonBalance } from '../lib/api';
import { formatTonBalance } from '../lib/formatTon';
import GramIcon from './GramIcon';

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
      <GramIcon size={22} className="text-white" cutoutColor="#14283f" />
      <span className="text-base font-bold tabular-nums text-white">{formatTonBalance(balance)} GRAM</span>
    </div>
  );
}
