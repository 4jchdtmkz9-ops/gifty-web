'use client';

type Theme = 'light' | 'dark';

export default function ThemeToggle({
  theme,
  toggleTheme,
  label,
}: {
  theme: Theme;
  toggleTheme: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={label}
      title={label}
      className="flex h-10 min-w-[42px] flex-col items-center justify-center gap-0.5 rounded-xl border border-slate-200 bg-white px-1.5 text-blue-700 shadow-sm transition-colors hover:bg-slate-50"
    >
      {theme === 'dark' ? (
        <svg viewBox="0 0 24 24" fill="none" className="h-[20px] w-[20px]" aria-hidden="true">
          <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.7" />
          <path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" fill="none" className="h-[20px] w-[20px]" aria-hidden="true">
          <path d="M20.2 15.4A8.4 8.4 0 0 1 8.6 3.8a8.5 8.5 0 1 0 11.6 11.6Z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
      <span className="text-[9px] font-medium leading-none">{label}</span>
    </button>
  );
}
