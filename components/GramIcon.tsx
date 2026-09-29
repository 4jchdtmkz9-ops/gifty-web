type GramIconProps = {
  size?: number;
  className?: string;
  cutoutColor?: string;
};

export default function GramIcon({ size = 18, className = '', cutoutColor = 'white' }: GramIconProps) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" className={`inline-block shrink-0 align-[-0.16em] ${className}`}>
      <path d="M5.2 3.4h13.6l4.4 6.1L12 20.6 0.8 9.5l4.4-6.1Z" fill="currentColor" />
      <path d="m5.2 3.8 2.1 5.4L12 4l4.7 5.2 2.1-5.4M1.4 9.5h21.2M7.3 9.2 12 19.7l4.7-10.5" stroke={cutoutColor} strokeWidth="1.15" strokeLinejoin="round" />
      <path d="m12 7.2.85 2.95 2.95.85-2.95.85L12 14.8l-.85-2.95-2.95-.85 2.95-.85L12 7.2Z" fill={cutoutColor} />
    </svg>
  );
}
