'use client';

import Image from 'next/image';
import Link from 'next/link';
import BottomNav from '../../components/BottomNav';
import TonBalanceBadge from '../../components/TonBalanceBadge';
import GramIcon from '../../components/GramIcon';
import OrbitWordmark from '../../components/OrbitWordmark';
import { cryptanCase, freeCase } from '../../lib/caseData';
import { useOrbitLanguage } from '../../components/OrbitLanguageContext';

export default function CasesPage() {
  const { t } = useOrbitLanguage();
  return (
    <main className="min-h-screen bg-[#f5f8ff] text-slate-900">
      <div className="mx-auto min-h-screen max-w-[480px] px-4 pb-28">
        <header className="flex items-start justify-between gap-3 py-5">
          <div className="min-w-0">
            <OrbitWordmark />
            <h1 className="mt-0.5 text-2xl font-bold tracking-tight text-blue-950">{t('Cases')}</h1>
            <p className="mt-1 text-xs text-slate-500">{t('Pick a case and see what\'s inside.')}</p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-2"><TonBalanceBadge /></div>
        </header>

        <section aria-label={t('Available cases')} className="grid grid-cols-2 gap-3">
          {/* FREE Case — first */}
          <Link
            href={`/cases/${freeCase.id}`}
            className="group overflow-hidden rounded-[24px] border border-emerald-200 bg-white shadow-[0_8px_24px_rgba(16,185,129,0.1)] transition active:scale-[0.98]"
          >
            <div className="case-art-stage relative flex h-36 items-center justify-center overflow-hidden bg-white">
              <Image src={freeCase.image} alt="FREE Case" fill sizes="(max-width: 480px) 50vw, 220px" className="object-contain p-2 transition duration-300 group-hover:scale-105" />
              <span className="absolute right-2 top-2 rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-700 shadow-sm">🎁 FREE</span>
            </div>
            <div className="p-3">
              <h2 className="truncate text-sm font-bold text-blue-950">{freeCase.name}</h2>
              <p className="mt-1 truncate text-[10px] text-slate-500">{t('Free · every 24 hours')}</p>
              <span className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                {t('Open case')} <span aria-hidden="true">→</span>
              </span>
            </div>
          </Link>

          {/* Cryptan Case — second */}
          <Link
            href={`/cases/${cryptanCase.id}`}
            className="group overflow-hidden rounded-[24px] border border-blue-100 bg-white shadow-[0_8px_24px_rgba(21,87,213,0.08)] transition active:scale-[0.98]"
          >
            <div className="case-art-stage relative flex h-36 items-center justify-center overflow-hidden bg-white">
              <Image src={cryptanCase.image} alt="Кейс Криптан" fill sizes="(max-width: 480px) 50vw, 220px" className="object-contain p-2 transition duration-300 group-hover:scale-105" />
              <span className="absolute right-2 top-2 rounded-full bg-white/95 px-2 py-1 text-[10px] font-bold text-blue-800 shadow-sm"><GramIcon size={12} className="mr-0.5" />{cryptanCase.price}</span>
            </div>
            <div className="p-3">
              <h2 className="truncate text-sm font-bold text-blue-950">{cryptanCase.name}</h2>
              <p className="mt-1 truncate text-[10px] text-slate-500">{t('Crypto gifts · 5 possible NFTs')}</p>
              <span className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700">
                {t('View case')} <span aria-hidden="true">→</span>
              </span>
            </div>
          </Link>
        </section>

        <BottomNav active="cases" />
      </div>
    </main>
  );
}
