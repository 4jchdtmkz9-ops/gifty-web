export type DemoBackdrop = {
  id: string;
  name: string;
  color: string;
  emoji: string;
  obtainedAt: number;
  packId?: DemoBackdropPackId;
  priceTon?: string;
};

export type DemoBackdropPackId = 'sweeties' | 'orbit-dog' | 'durov';

export function getDemoBackdropSticker(packId?: string) {
  if (packId === 'orbit-dog') return '/stickers/orbit-dog.json';
  if (packId === 'durov') return '/stickers/orbit-durov.json';
  return '/stickers/orbit-backdrop-gift.json';
}

export const demoBackdrops = [
  { name: 'Celtic Blue', color: '#2877bb' },
  { name: 'Cappuccino', color: '#b28a6b' },
  { name: 'Pine Green', color: '#27634a' },
  { name: 'Raspberry', color: '#d82f68' },
  { name: 'Persimmon', color: '#e8783f' },
  { name: 'Mystic Pearl', color: '#b05670' },
  { name: 'Platinum', color: '#d5d9df' },
  { name: 'Rosewood', color: '#70404e' },
  { name: 'Pure Gold', color: '#e5b83e' },
  { name: 'Black', color: '#17191d' },
  { name: 'Onyx Black', color: '#202329' },
  { name: 'Midnight Blue', color: '#172c55' },
] as const;

export const DEMO_BACKDROP_STORAGE_KEY = 'orbit-demo-backdrops-v1';
export const DEMO_BACKDROP_UPDATE_EVENT = 'orbit-demo-backdrops-updated';

export function readDemoBackdrops(): DemoBackdrop[] {
  if (typeof window === 'undefined') return [];
  try {
    const data: unknown = JSON.parse(window.localStorage.getItem(DEMO_BACKDROP_STORAGE_KEY) ?? '[]');
    if (!Array.isArray(data)) return [];
    return data.filter((item): item is DemoBackdrop =>
      item && typeof item.id === 'string' && typeof item.name === 'string'
      && typeof item.color === 'string' && typeof item.emoji === 'string'
      && typeof item.obtainedAt === 'number',
    );
  } catch {
    return [];
  }
}

export function saveDemoBackdrops(items: DemoBackdrop[]) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(DEMO_BACKDROP_STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event(DEMO_BACKDROP_UPDATE_EVENT));
}
