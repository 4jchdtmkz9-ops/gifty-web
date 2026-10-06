'use client';

import { Lottie, type LottieProps } from 'lottie-react';
import { useEffect, useState, type ReactNode } from 'react';

type TelegramStickerAnimation = LottieProps['src'];

export default function TelegramTgsSticker({
  size = 23,
  src = '/stickers/pvp-controller.json',
  className = 'nav-sticker-art nav-sticker-pvp',
  autoplay = true,
  loop = true,
  fallback,
}: {
  size?: number;
  src?: string;
  className?: string;
  autoplay?: boolean;
  loop?: boolean;
  fallback: ReactNode;
}) {
  const [animation, setAnimation] = useState<TelegramStickerAnimation | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setAnimation(null);
    fetch(src, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error('Telegram sticker could not be loaded');
        return response.json();
      })
      .then((data: TelegramStickerAnimation) => setAnimation(data))
      .catch((error: unknown) => {
        if (error instanceof Error && error.name !== 'AbortError') {
          console.error('Could not load the Telegram sticker:', error);
        }
      });

    return () => controller.abort();
  }, [src]);

  return (
    <span
      aria-hidden="true"
      className={className}
      style={{ width: size, height: size }}
    >
      {animation ? <Lottie src={animation} loop={loop} autoplay={autoplay} className="h-full w-full" /> : fallback}
    </span>
  );
}
