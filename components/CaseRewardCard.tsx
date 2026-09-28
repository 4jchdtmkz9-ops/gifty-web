'use client';

import { useState } from 'react';
import type { CaseReward } from '../lib/caseData';

export default function CaseRewardCard({
  reward,
  compact = false,
}: {
  reward: CaseReward;
  compact?: boolean;
}) {
  const [imageFailed, setImageFailed] = useState(false);

  const card = (
    <>
      <div className={`relative flex items-center justify-center overflow-hidden bg-gradient-to-br from-blue-50 via-white to-yellow-50 ${compact ? 'h-[112px]' : 'aspect-square'}`}>
        <span className="text-5xl" aria-hidden="true">{reward.emoji}</span>
        {!imageFailed && (
          // Public Telegram collectible preview image.
          <img
            src={reward.image}
            alt={`${reward.name} ${reward.number}`}
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={() => setImageFailed(true)}
            className="absolute inset-0 h-full w-full object-contain p-2"
          />
        )}
        <span className="absolute right-2 top-2 rounded-full bg-white/95 px-2 py-1 text-[10px] font-bold text-blue-800 shadow-sm backdrop-blur">
          {reward.price}
        </span>
      </div>
      <div className="p-2.5">
        <p className="truncate text-xs font-semibold text-slate-800">{reward.name}</p>
        <div className="mt-1 flex items-center justify-between gap-1 text-[10px] text-slate-500">
          <span className="truncate">{reward.number}</span>
          <span className="shrink-0">{reward.chance}</span>
        </div>
      </div>
    </>
  );

  const className = `relative block shrink-0 overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-[0_5px_16px_rgba(21,87,213,0.07)] ${compact ? 'w-[112px]' : 'w-full'}`;

  return compact ? (
    <div className={className}>{card}</div>
  ) : (
    <a href={reward.telegramUrl} target="_blank" rel="noreferrer" className={className}>
      {card}
    </a>
  );
}
