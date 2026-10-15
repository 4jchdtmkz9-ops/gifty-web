type StarIconProps = {
  size?: number;
  className?: string;
};

export default function StarIcon({ size = 18, className = '' }: StarIconProps) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" className={`inline-block shrink-0 align-[-0.16em] ${className}`}>
      <path
        d="M12 1.8 14.9 8.6 22 9.3 16.7 14.2 18.2 21.2 12 17.4 5.8 21.2 7.3 14.2 2 9.3 9.1 8.6 12 1.8Z"
        fill="#F5A623"
        stroke="#D98A06"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  );
}
