'use client';

import { useEffect, useState } from 'react';
import { fetchStarsRate, formatStars, gramToStars } from '../lib/currency';
import GramIcon from './GramIcon';
import StarIcon from './StarIcon';

type Props = {
  gram: string | number;
  gramSize?: number;
  className?: string;
};

/** One-row price in both currencies: GRAM · Stars. Spending always settles from the GRAM balance. */
export default function DualPrice({ gram, gramSize = 12, className = '' }: Props) {
  const [, setTick] = useState(0);
  useEffect(() => {
    void fetchStarsRate().then(() => setTick((tick) => tick + 1));
  }, []);
  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      <span className="inline-flex items-center gap-1 font-bold tabular-nums">
        <GramIcon size={gramSize} className="text-blue-700" />{gram}
      </span>
      <span aria-hidden="true" className="text-slate-300">·</span>
      <span className="inline-flex items-center gap-1 font-bold tabular-nums text-amber-600">
        <StarIcon size={gramSize} />{formatStars(gramToStars(gram))}
      </span>
    </span>
  );
}
