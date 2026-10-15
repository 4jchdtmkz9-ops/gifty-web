'use client';

import type { PayCurrency } from '../lib/currency';
import GramIcon from './GramIcon';
import StarIcon from './StarIcon';

type Props = {
  value: PayCurrency;
  onChange: (currency: PayCurrency) => void;
  small?: boolean;
};

export default function CurrencyToggle({ value, onChange, small = false }: Props) {
  const options: Array<{ id: PayCurrency; label: string; icon: React.ReactNode }> = [
    { id: 'GRAM', label: 'GRAM', icon: <GramIcon size={small ? 13 : 15} /> },
    { id: 'STARS', label: 'Stars', icon: <StarIcon size={small ? 13 : 15} /> },
  ];
  return (
    <div role="group" aria-label="Payment currency" className={`grid shrink-0 grid-cols-2 gap-0.5 rounded-xl bg-slate-100 p-0.5 ${small ? '' : 'min-w-[148px]'}`}>
      {options.map((option) => {
        const active = value === option.id;
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange(option.id)}
            aria-pressed={active}
            className={`inline-flex items-center justify-center gap-1 rounded-[10px] font-bold transition ${small ? 'px-2 py-1.5 text-[10px]' : 'px-3 py-2 text-xs'} ${active ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}
          >
            {option.icon}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
