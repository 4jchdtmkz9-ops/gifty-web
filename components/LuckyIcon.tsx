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
      <path
        d="M12 12c-1.2-2.1-4.9-5.7-7.1-3.5-2.2 2.2 1.4 5.9 3.5 7.1-2.1 1.2-5.7 4.9-3.5 7.1 2.2 2.2 5.9-1.4 7.1-3.5 1.2 2.1 4.9 5.7 7.1 3.5 2.2-2.2-1.4-5.9-3.5-7.1 2.1-1.2 5.7-4.9 3.5-7.1-2.2-2.2-5.9 1.4-7.1 3.5Z"
        transform="translate(0 -2) scale(1 0.88)"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="1.3" fill="#f4bf28" />
    </svg>
  );
}
