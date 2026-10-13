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

        <section aria-label={t('Available cases')} className="space-y-4">
          {/* FREE Case — hero card */}
          <Link
            href={`/cases/${freeCase.id}`}
            className="group block overflow-hidden rounded-[28px] border border-emerald-200/70 bg-white shadow-[0_12px_32px_rgba(16,185,129,0.12)] transition active:scale-[0.98]"
          >
            <div className="relative flex h-52 items-center justify-center overflow-hidden bg-gradient-to-br from-emerald-50 via-white to-blue-50">
              <Image src={freeCase.image} alt="FREE Case" fill sizes="(max-width: 480px) 100vw, 448px" className="object-contain p-3 transition duration-300 group-hover:scale-105" />
              <span className="absolute left-3 top-3 rounded-full bg-emerald-600 px-3 py-1.5 text-[11px] font-bold text-white shadow-[0_4px_10px_rgba(16,185,129,0.35)]">🎁 FREE</span>
            </div>
            <div className="flex items-center justify-between gap-3 border-t border-slate-100 p-4">
              <div className="min-w-0">
                <h2 className="truncate text-base font-bold text-blue-950">{freeCase.name}</h2>
                <p className="mt-0.5 truncate text-xs text-slate-500">{t('Free · every 24 hours')}</p>
              </div>
              <span className="inline-flex shrink-0 items-center gap-1.5 rounded-2xl bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white shadow-[0_6px_14px_rgba(16,185,129,0.3)]">
                {t('Open case')} <span aria-hidden="true">→</span>
              </span>
            </div>
          </Link>

          {/* Cryptan Case — standard card */}
          <Link
            href={`/cases/${cryptanCase.id}`}
            className="group block overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_10px_28px_rgba(21,87,213,0.08)] transition active:scale-[0.98]"
          >
            <div className="relative flex h-44 items-center justify-center overflow-hidden bg-gradient-to-br from-blue-50 via-white to-yellow-50">
              <Image src={cryptanCase.image} alt="Cryptan Case" fill sizes="(max-width: 480px) 100vw, 448px" className="object-contain p-3 transition duration-300 group-hover:scale-105" />
              <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1.5 text-[11px] font-bold text-blue-800 shadow-md backdrop-blur">
                <GramIcon size={13} />{cryptanCase.price}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3 border-t border-slate-100 p-4">
              <div className="min-w-0">
                <h2 className="truncate text-base font-bold text-blue-950">{cryptanCase.name}</h2>
                <p className="mt-0.5 truncate text-xs text-slate-500">{t('Crypto gifts · 5 possible NFTs')}</p>
              </div>
              <span className="inline-flex shrink-0 items-center gap-1.5 rounded-2xl bg-blue-700 px-4 py-2.5 text-xs font-semibold text-white shadow-[0_6px_14px_rgba(21,87,213,0.3)]">
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
