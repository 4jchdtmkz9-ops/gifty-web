type GramIconProps = {
  size?: number;
  className?: string;
};

export default function GramIcon({ size = 18, className = '' }: GramIconProps) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 250 250" className={`inline-block shrink-0 align-[-0.16em] ${className}`}>
      <circle cx="125" cy="125" r="125" fill="#229FE3" />
      <path d="m50 119 22-39c5-9 14-14 24-14h58c10 0 19 5 24 14l22 39-75 74-75-74Z" fill="white" />
      <path d="m145 85 8 24 24 8-24 8-8 24-8-24-24-8 24-8 8-24Z" fill="#229FE3" />
    </svg>
  );
}
