type OrbitNftTileProps = {
  name: string;
  color?: string | null;
  className?: string;
  compact?: boolean;
};

export default function OrbitNftTile({ name, color, className = '', compact = false }: OrbitNftTileProps) {
  return (
    <span
      className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-[22%] border border-white/25 shadow-inner ${className}`}
      style={{ backgroundColor: color || '#202329' }}
      title={`ORBIT NFT · ${name}`}
      aria-label={`ORBIT NFT · ${name}`}
    >
      <svg viewBox="0 0 48 48" aria-hidden="true" className={compact ? 'h-6 w-6' : 'h-10 w-10'}>
        <circle cx="24" cy="24" r="11" fill="none" stroke="white" strokeWidth="2.5" opacity=".96" />
        <ellipse cx="24" cy="24" rx="20" ry="7.5" fill="none" stroke="white" strokeWidth="2.5" transform="rotate(-28 24 24)" opacity=".96" />
        <circle cx="38" cy="13" r="3" fill="white" />
      </svg>
      {!compact && <span className="absolute inset-x-0 bottom-0 truncate bg-black/35 px-1 py-0.5 text-center text-[7px] font-extrabold leading-tight text-white">{name}</span>}
    </span>
  );
}
