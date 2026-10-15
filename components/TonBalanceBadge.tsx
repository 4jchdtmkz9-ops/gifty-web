'use client';

import { useEffect, useState } from 'react';
import { getBotBalance } from '../lib/api';
import { formatTonBalance } from '../lib/formatTon';
import GramIcon from './GramIcon';
import StarIcon from './StarIcon';
import { useOrbitLanguage } from './OrbitLanguageContext';

export default function TonBalanceBadge() {
  const { t } = useOrbitLanguage();
  const [balance, setBalance] = useState('0');
  const [stars, setStars] = useState(0);

  useEffect(() => {
    let active = true;
    const refresh = () => getBotBalance()
      .then((data) => { if (active) { setBalance(data.balanceGram); setStars(data.balanceStars ?? 0); } })
      .catch((error) => { console.error('ORBIT balance error:', error); });
    void refresh();
    window.addEventListener('orbit-balance-updated', refresh);
    const interval = window.setInterval(() => void refresh(), 15_000);
    return () => {
      active = false;
      window.removeEventListener('orbit-balance-updated', refresh);
      window.clearInterval(interval);
    };
  }, []);

  return (
    <div className="inline-flex shrink-0 items-center gap-2 rounded-full bg-[#14283f] px-4 py-2.5 shadow-[0_4px_12px_rgba(15,35,58,0.2)]" aria-label={`${formatTonBalance(balance)} ${t('GRAM balance')}`}>
      <GramIcon size={22} />
      <span className="text-base font-bold tabular-nums text-white">{formatTonBalance(balance)} GRAM</span>
      <span aria-hidden="true" className="h-4 w-px bg-white/20" />
      <StarIcon size={18} />
      <span className="text-base font-bold tabular-nums text-amber-300">{stars.toLocaleString('en-US')}</span>
    </div>
  );
}
