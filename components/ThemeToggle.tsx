'use client';

import { Lottie, type LottieHandle, type LottieProps } from 'lottie-react';
import { useEffect, useRef, useState } from 'react';

type Theme = 'light' | 'dark';
type StickerData = LottieProps['src'];

const MOON_FRAME = 60;
const SUN_FRAME = 239;
const MIDPOINT_FRAME = 150;

export default function ThemeToggle({
  theme,
  toggleTheme,
  label,
}: {
  theme: Theme;
  toggleTheme: () => void;
  label: string;
}) {
  const [animation, setAnimation] = useState<StickerData | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const lottieRef = useRef<LottieHandle>(null);
  const themeRef = useRef(theme);
  const toggleRef = useRef(toggleTheme);
  const transitionRef = useRef<{ from: Theme; switched: boolean } | null>(null);

  themeRef.current = theme;
  toggleRef.current = toggleTheme;

  useEffect(() => {
    const controller = new AbortController();
    fetch('/stickers/theme-sun-moon.json', { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error('Theme sticker could not be loaded');
        return response.json();
      })
      .then((data: StickerData) => setAnimation(data))
      .catch((error: unknown) => {
        if (error instanceof Error && error.name !== 'AbortError') {
          console.error('Could not load the theme sticker:', error);
        }
      });
    return () => controller.abort();
  }, []);

  const switchAtMidpoint = () => {
    const transition = transitionRef.current;
    if (!transition || transition.switched) return;
    transition.switched = true;
    toggleRef.current();
  };

  const handleClick = () => {
    const player = lottieRef.current;
    if (!player || !animation) {
      toggleTheme();
      return;
    }
    if (isAnimating) return;

    const from = themeRef.current;
    transitionRef.current = { from, switched: false };
    setIsAnimating(true);
    player.playSegments(from === 'dark' ? [MOON_FRAME, SUN_FRAME] : [SUN_FRAME, MOON_FRAME]);
  };

  const handleFrame = ({ currentFrame }: { currentFrame: number }) => {
    const transition = transitionRef.current;
    if (!transition || transition.switched) return;
    if (
      (transition.from === 'dark' && currentFrame >= MIDPOINT_FRAME) ||
      (transition.from === 'light' && currentFrame <= MIDPOINT_FRAME)
    ) {
      switchAtMidpoint();
    }
  };

  const handleComplete = () => {
    switchAtMidpoint();
    const to = transitionRef.current?.from === 'dark' ? SUN_FRAME : MOON_FRAME;
    transitionRef.current = null;
    setIsAnimating(false);
    if (to !== undefined) lottieRef.current?.seek(to);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isAnimating}
      aria-label={label}
      title={label}
      className="flex min-w-[42px] flex-col items-center justify-center gap-1 rounded-full px-1.5 py-1.5 text-slate-500 transition-colors hover:bg-white/60 disabled:cursor-default"
    >
      <span className="flex h-[25px] w-[25px] items-center justify-center" aria-hidden="true">
        {animation ? (
          <Lottie
            src={animation}
            lottieRef={lottieRef}
            autoplay={false}
            loop={false}
            segment={[MOON_FRAME, SUN_FRAME]}
            subscriptions={{
              ready: () => lottieRef.current?.seek(themeRef.current === 'dark' ? MOON_FRAME : SUN_FRAME),
              frame: handleFrame,
              complete: handleComplete,
            }}
            className="h-full w-full"
          />
        ) : (
          <svg viewBox="0 0 24 24" fill="none" className="h-[22px] w-[22px]">
            {theme === 'dark' ? (
              <path d="M20.2 15.4A8.4 8.4 0 0 1 8.6 3.8a8.5 8.5 0 1 0 11.6 11.6Z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
            ) : (
              <><circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.7" /><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" /></>
            )}
          </svg>
        )}
      </span>
      <span className="text-[10px] font-medium leading-none">{label}</span>
    </button>
  );
}
