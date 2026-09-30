export default function ArenaIcon({ size = 24, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M12 3.2 14.25 8l5.2.7-3.78 3.62.92 5.13L12 15l-4.6 2.45.9-5.13L4.55 8.7 9.75 8 12 3.2Z" stroke="currentColor" strokeWidth="1.65" strokeLinejoin="round" />
      <path d="M6 20.2 3.2 21l.8-2.8M18 20.2l2.8.8-.8-2.8" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="11.1" r="9.1" stroke="currentColor" strokeWidth="1.3" opacity=".55" />
    </svg>
  );
}
