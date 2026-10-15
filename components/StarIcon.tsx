type StarIconProps = {
  size?: number;
  className?: string;
};

/** Gold star matching the attached icon: light top-left highlight, deep orange bottom. */
export default function StarIcon({ size = 18, className = '' }: StarIconProps) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" className={`inline-block shrink-0 align-[-0.16em] ${className}`}>
      <defs>
        <linearGradient id="orbit-star-gold" x1="0.2" y1="0" x2="0.8" y2="1">
          <stop offset="0" stopColor="#FFE589" />
          <stop offset="0.45" stopColor="#FFC53D" />
          <stop offset="1" stopColor="#F08C00" />
        </linearGradient>
      </defs>
      <path
        d="M12 1.9c.4 0 .8.3.9.7l2.5 5.6 6.1.6c.5 0 .9.4 1 .9 0 .5-.2.9-.6 1.2l-4.5 4.1 1.2 6c.1.5-.1 1-.6 1.2-.4.2-1 .2-1.4-.1L12 18.2l-4.6 2.9c-.4.3-1 .3-1.4.1-.5-.2-.7-.7-.6-1.2l1.2-6L2.1 9.9c-.4-.3-.6-.7-.6-1.2.1-.5.5-.9 1-.9l6.1-.6 2.5-5.6c.1-.4.5-.7.9-.7Z"
        fill="url(#orbit-star-gold)"
        stroke="#C56E00"
        strokeWidth="1.1"
        strokeLinejoin="round"
      />
    </svg>
  );
}
