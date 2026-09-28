export default function HomeIcon({ size = 19 }: { size?: number }) {
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
        d="m3.25 10.6 8.75-7.1 8.75 7.1M5.5 9.1v10.1c0 .8.65 1.45 1.45 1.45h10.1c.8 0 1.45-.65 1.45-1.45V9.1M9.15 20.65v-6.2h5.7v6.2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="16.2" cy="12.15" r="1.15" fill="#f4bf28" />
    </svg>
  );
}
