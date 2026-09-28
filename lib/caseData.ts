export type CaseReward = {
  id: string;
  name: string;
  number: string;
  price: string;
  priceValue: number;
  chance: string;
  chanceValue: number;
  emoji: string;
  image: string;
  telegramUrl: string;
};

export const cryptanRewards: CaseReward[] = [
  {
    id: 'bigyear-26647',
    name: 'Big Year',
    number: '#26647',
    price: '5.5 TON',
    priceValue: 5.5,
    chance: '50%',
    chanceValue: 50,
    emoji: '🧧',
    image: 'https://nft.fragment.com/gift/bigyear-26647.webp',
    telegramUrl: 'https://t.me/nft/BigYear-26647',
  },
  {
    id: 'whipcupcake-180322',
    name: 'Whip Cupcake',
    number: '#180322',
    price: '9 TON',
    priceValue: 9,
    chance: '47.49999%',
    chanceValue: 47.49999,
    emoji: '🧁',
    image: 'https://nft.fragment.com/gift/whipcupcake-180322.webp',
    telegramUrl: 'https://t.me/nft/WhipCupcake-180322',
  },
  {
    id: 'inputkey-11258',
    name: 'Input Key',
    number: '#11258',
    price: '18 TON',
    priceValue: 18,
    chance: '2%',
    chanceValue: 2,
    emoji: '🔑',
    image: 'https://nft.fragment.com/gift/inputkey-11258.webp',
    telegramUrl: 'https://t.me/nft/InputKey-11258',
  },
  {
    id: 'surgeboard-22018',
    name: 'Surge Board',
    number: '#22018',
    price: '60 TON',
    priceValue: 60,
    chance: '0.5%',
    chanceValue: 0.5,
    emoji: '🏄',
    image: 'https://nft.fragment.com/gift/surgeboard-22018.webp',
    telegramUrl: 'https://t.me/nft/SurgeBoard-22018',
  },
  {
    id: 'nailbracelet-3267',
    name: 'Nail Bracelet',
    number: '#3267',
    price: '250 TON',
    priceValue: 250,
    chance: '0.00001%',
    chanceValue: 0.00001,
    emoji: '📿',
    image: 'https://nft.fragment.com/gift/nailbracelet-3267.webp',
    telegramUrl: 'https://t.me/nft/NailBracelet-3267',
  },
];

export const cryptanCase = {
  id: 'cryptan',
  name: 'Криптан',
  price: '30 TON',
  priceValue: 30,
  image: '/cases/cryptan.png',
};
