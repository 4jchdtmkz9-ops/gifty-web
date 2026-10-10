export type CaseReward = {
  id: string;
  name: string;
  price: string;
  emoji: string;
  image: string;
};

export const cryptanRewards: CaseReward[] = [
  {
    id: 'bigyear-26647',
    name: 'Big Year',
    price: '5.5',
    emoji: '🧧',
    image: 'https://nft.fragment.com/gift/bigyear-26647.webp',
  },
  {
    id: 'whipcupcake-180322',
    name: 'Whip Cupcake',
    price: '9',
    emoji: '🧁',
    image: 'https://nft.fragment.com/gift/whipcupcake-180322.webp',
  },
  {
    id: 'inputkey-11258',
    name: 'Input Key',
    price: '18',
    emoji: '🔑',
    image: 'https://nft.fragment.com/gift/inputkey-11258.webp',
  },
  {
    id: 'surgeboard-22018',
    name: 'Surge Board',
    price: '60',
    emoji: '🏄',
    image: 'https://nft.fragment.com/gift/surgeboard-22018.webp',
  },
  {
    id: 'nailbracelet-3267',
    name: 'Nail Bracelet',
    price: '250',
    emoji: '📿',
    image: 'https://nft.fragment.com/gift/nailbracelet-3267.webp',
  },
];

export const cryptanCase = {
  id: 'cryptan',
  name: 'Криптан',
  price: '30 GRAM',
  image: '/cases/cryptan.png',
};
