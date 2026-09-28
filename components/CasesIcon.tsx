export default function CasesIcon({ size = 21 }: { size?: number }) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" className="shrink-0">
      <path d="M4 10h16v10H4zM3 7h18v3H3zM12 7v13" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M12 7c-2.7 0-4.3-1-4.3-2.35a1.7 1.7 0 0 1 1.7-1.7c1.5 0 2.6 2.2 2.6 4.05Zm0 0c2.7 0 4.3-1 4.3-2.35a1.7 1.7 0 0 0-1.7-1.7C13.1 2.95 12 5.15 12 7Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <circle cx="12" cy="12.6" r="0.8" fill="#f4bf28" />
    </svg>
  );
}
