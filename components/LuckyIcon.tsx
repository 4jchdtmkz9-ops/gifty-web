export default function LuckyIcon({ size = 22 }: { size?: number }) {
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className="shrink-0"
    >
      <rect x="3.25" y="3.25" width="11.5" height="11.5" rx="3" stroke="currentColor" strokeWidth="1.8" />
      <rect x="9.25" y="9.25" width="11.5" height="11.5" rx="3" fill="white" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="6.75" cy="6.75" r="1.15" fill="#2563eb" />
      <circle cx="12.5" cy="12.5" r="1.15" fill="#f4bf28" />
      <circle cx="17.25" cy="17.25" r="1.15" fill="#ef4444" />
    </svg>
  );
}
