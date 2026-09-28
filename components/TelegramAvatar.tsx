'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { getTelegramProfilePhoto } from '../lib/telegram';

export default function TelegramAvatar({ size = 28 }: { size?: number }) {
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoFailed, setPhotoFailed] = useState(false);

  useEffect(() => {
    setPhotoUrl(getTelegramProfilePhoto());
  }, []);

  const dimension = `${size}px`;

  return (
    <span
      aria-hidden="true"
      className="relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-blue-100 bg-blue-50 text-blue-700 shadow-sm"
      style={{ width: dimension, height: dimension }}
    >
      {photoUrl && !photoFailed ? (
        <Image
          src={photoUrl}
          alt=""
          width={size}
          height={size}
          unoptimized
          onError={() => setPhotoFailed(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        <svg viewBox="0 0 24 24" className="h-[62%] w-[62%]" fill="currentColor">
          <path d="M12 12a4.25 4.25 0 1 0 0-8.5 4.25 4.25 0 0 0 0 8.5Zm0 2.1c-4.45 0-8 2.34-8 5.25 0 .64.52 1.15 1.16 1.15h13.68c.64 0 1.16-.51 1.16-1.15 0-2.91-3.55-5.25-8-5.25Z" />
        </svg>
      )}
    </span>
  );
}
