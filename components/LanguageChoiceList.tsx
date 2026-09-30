'use client';

import { orbitLanguages, useOrbitLanguage, type OrbitLanguage } from './OrbitLanguageContext';

export default function LanguageChoiceList({
  selected,
  current,
  onSelect,
  compact = false,
}: {
  selected: OrbitLanguage | null;
  current?: OrbitLanguage;
  onSelect: (language: OrbitLanguage) => void;
  compact?: boolean;
}) {
  const { t } = useOrbitLanguage();
  const flags: Record<OrbitLanguage, string> = { uk: '🇺🇦', ru: '🇷🇺', en: '🇬🇧' };

  return (
    <div className={compact ? 'grid grid-cols-3 gap-2' : 'space-y-2.5'} role="radiogroup" aria-label={t('Choose your language')}>
      {orbitLanguages.map((item) => {
        const active = (selected ?? current) === item.id;
        return (
          <button
            key={item.id}
            type="button"
            role="radio"
            aria-checked={active}
            data-selected={active ? 'true' : 'false'}
            onClick={() => onSelect(item.id)}
            className={`language-choice-option group flex w-full items-center transition-all duration-200 active:scale-[0.98] ${compact
              ? `min-h-[88px] flex-col justify-center gap-1 rounded-2xl border px-2 py-3 text-center ${active ? 'border-blue-500 bg-blue-50 shadow-[0_6px_18px_rgba(21,87,213,0.12)]' : 'border-slate-200 bg-white hover:border-blue-200'}`
              : `min-h-[68px] gap-3 rounded-2xl border px-4 py-3 text-left ${active ? 'border-blue-500 bg-blue-50 shadow-[0_6px_18px_rgba(21,87,213,0.12)]' : 'border-slate-200 bg-white hover:border-blue-200'}`}`}
          >
            <span className={compact ? 'text-xl leading-none' : 'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-xl'} aria-hidden="true">{flags[item.id]}</span>
            <span className={compact ? 'text-xs font-semibold text-slate-800' : 'min-w-0 flex-1'}>
              {!compact && <span className="block text-sm font-semibold text-slate-800">{item.nativeName}</span>}
              {compact ? item.code : <span className="mt-0.5 block text-xs text-slate-500">{item.englishName}</span>}
            </span>
            {!compact && (
              <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-all ${active ? 'scale-100 border-blue-700 bg-blue-700 text-white' : 'scale-90 border-slate-300 text-transparent'}`} aria-hidden="true">
                {active ? '✓' : current === item.id ? '✓' : ''}
              </span>
            )}
            {compact && <span className="text-[10px] font-medium text-slate-500">{item.nativeName}</span>}
          </button>
        );
      })}
    </div>
  );
}
