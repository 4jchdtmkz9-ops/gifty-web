import TelegramTgsSticker from './TelegramTgsSticker';

export default function NavStickerIcon({ kind, size = 23 }: { kind: 'gift' | 'pvp'; size?: number }) {
  if (kind === 'gift') {
    return (
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true" className="nav-sticker-art nav-sticker-gift">
        <path d="M5 13h22v15H5z" fill="#2B91F4" />
        <path d="M3.5 9.5h25v5h-25z" fill="#55B4FF" />
        <path d="M14 9.5h4V28h-4z" fill="#fff" />
        <path d="M16 9.4C8.3 9.4 7.1 7.6 7.7 5.7c.7-2.2 4.1-2 8.3 3.7Zm0 0c7.7 0 8.9-1.8 8.3-3.7-.7-2.2-4.1-2-8.3 3.7Z" stroke="#F4BF28" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M5 14.5h22" stroke="#fff" strokeWidth="1.5" opacity=".85" />
      </svg>
    );
  }
  return <TelegramTgsSticker size={size} fallback={
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <path d="M9 9.5h14c3.4 0 5.2 2.2 6.1 5.2l2 7.1c.8 2.9-2.2 5-4.6 3.1l-4.2-3.4H9.7l-4.2 3.4c-2.4 1.9-5.4-.2-4.6-3.1l2-7.1C3.8 11.7 5.6 9.5 9 9.5Z" fill="#2B91F4" stroke="#1557D5" strokeWidth="1.5" />
      <path d="M10 14v7m-3.5-3.5h7" stroke="#fff" strokeWidth="2.3" strokeLinecap="round" />
      <circle cx="21.5" cy="15.5" r="1.7" fill="#F4BF28" />
      <circle cx="25" cy="19" r="1.7" fill="#fff" />
      <path d="M7 10.5c1.2-1 2.2-1.4 3.7-1.4h10.6c1.5 0 2.5.4 3.7 1.4" stroke="#fff" strokeWidth="1.3" strokeLinecap="round" opacity=".8" />
    </svg>
  } />;
}
