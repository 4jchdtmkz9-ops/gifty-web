type StarIconProps = {
  size?: number;
  className?: string;
};

export default function StarIcon({ size = 18, className = '' }: StarIconProps) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" className={`inline-block shrink-0 align-[-0.16em] ${className}`}>
      <defs>
        <linearGradient id="orbit-star-gold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFD84D" />
          <stop offset="0.55" stopColor="#F5A623" />
          <stop offset="1" stopColor="#E08A00" />
        </linearGradient>
      </defs>
      <path
        d="M12 1.8 14.9 8.6 22 9.3 16.7 14.2 18.2 21.2 12 17.4 5.8 21.2 7.3 14.2 2 9.3 9.1 8.6 12 1.8Z"
        fill="url(#orbit-star-gold)"
        stroke="#B96A00"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  );
}
