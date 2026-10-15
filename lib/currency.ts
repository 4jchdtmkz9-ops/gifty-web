import { getStarsRate, type StarsRate } from './api';

export type PayCurrency = 'GRAM' | 'STARS';

const FALLBACK_RATE: StarsRate = { gramPerStar: '0.01', starsPerGram: 100, minStars: 10, maxStars: 1_000_000, presets: [100, 500, 1000, 5000] };

let cachedRate: StarsRate | null = null;
let inflight: Promise<StarsRate> | null = null;

export function getCachedStarsRate(): StarsRate {
  return cachedRate ?? FALLBACK_RATE;
}

export function fetchStarsRate(): Promise<StarsRate> {
  if (cachedRate) return Promise.resolve(cachedRate);
  if (!inflight) {
    inflight = getStarsRate()
      .then((rate) => {
        cachedRate = rate;
        return rate;
      })
      .catch(() => FALLBACK_RATE)
      .finally(() => {
        inflight = null;
      });
  }
  return inflight;
}

/** Whole Stars needed to cover a GRAM amount (rounds up so the user never underpays). */
export function gramToStars(gram: string | number, rate?: StarsRate): number {
  const perGram = rate?.starsPerGram ?? getCachedStarsRate().starsPerGram;
  const value = Number(gram);
  if (!Number.isFinite(value) || value <= 0) return 0;
  return Math.ceil(value * perGram - 1e-9);
}

/** GRAM credited for a Stars amount, trimmed of trailing zeros. */
export function starsToGram(stars: number, rate?: StarsRate): string {
  const gramPerStar = Number(rate?.gramPerStar ?? getCachedStarsRate().gramPerStar);
  if (!Number.isFinite(gramPerStar) || gramPerStar <= 0 || !Number.isFinite(stars) || stars <= 0) return '0';
  return String(Number((stars * gramPerStar).toFixed(9))).replace(/\.?0+$/, '') || '0';
}

export function formatStars(stars: string | number): string {
  const value = Math.round(Number(stars));
  if (!Number.isFinite(value)) return '0';
  return value.toLocaleString('en-US');
}
