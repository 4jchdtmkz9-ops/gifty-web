export type CaseReward = {
  id: string;
  name: string;
  number: string;
  price: string;
  chanceValue: number;
  emoji: string;
  image: string;
};

export const cryptanRewards: CaseReward[] = [
  {
    id: 'bigyear-26647',
    name: 'Big Year',
    number: '#26647',
    price: '5.5 TON',
    chanceValue: 50,
    emoji: '🧧',
    image: 'https://nft.fragment.com/gift/bigyear-26647.webp',
  },
  {
    id: 'whipcupcake-180322',
    name: 'Whip Cupcake',
    number: '#180322',
    price: '9 TON',
    chanceValue: 47.49999,
    emoji: '🧁',
    image: 'https://nft.fragment.com/gift/whipcupcake-180322.webp',
  },
  {
    id: 'inputkey-11258',
    name: 'Input Key',
    number: '#11258',
    price: '18 TON',
    chanceValue: 2,
    emoji: '🔑',
    image: 'https://nft.fragment.com/gift/inputkey-11258.webp',
  },
  {
    id: 'surgeboard-22018',
    name: 'Surge Board',
    number: '#22018',
    price: '60 TON',
    chanceValue: 0.5,
    emoji: '🏄',
    image: 'https://nft.fragment.com/gift/surgeboard-22018.webp',
  },
  {
    id: 'nailbracelet-3267',
    name: 'Nail Bracelet',
    number: '#3267',
    price: '250 TON',
    chanceValue: 0.00001,
    emoji: '📿',
    image: 'https://nft.fragment.com/gift/nailbracelet-3267.webp',
  },
];

export const cryptanCase = {
  id: 'cryptan',
  name: 'Криптан',
  price: '30 TON',
  image: '/cases/cryptan.png',
};
