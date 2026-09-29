'use client';

import Image from 'next/image';
import Link from 'next/link';
import BottomNav from '../../components/BottomNav';
import TonBalanceBadge from '../../components/TonBalanceBadge';
import GramIcon from '../../components/GramIcon';
import { cryptanCase } from '../../lib/caseData';

export default function CasesPage() {
  return (
    <main className="min-h-screen bg-[#f5f8ff] text-slate-900">
      <div className="mx-auto min-h-screen max-w-[480px] px-4 pb-28">
        <header className="py-5">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[10px] font-bold tracking-[0.2em] text-blue-700">ORBIT</p>
            <TonBalanceBadge />
          </div>
          <div className="mt-1 flex items-end justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-blue-950">Cases</h1>
              <p className="mt-1 text-xs text-slate-500">Pick a case and see what’s inside.</p>
            </div>
            <span className="rounded-full border border-yellow-200 bg-yellow-50 px-2.5 py-1 text-[10px] font-semibold text-yellow-800">DEMO</span>
          </div>
        </header>

        <section aria-label="Available cases" className="grid grid-cols-2 gap-3">
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
              <p className="mt-1 truncate text-[10px] text-slate-500">Crypto gifts · 5 possible NFTs</p>
              <span className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700">
                View case <span aria-hidden="true">→</span>
              </span>
            </div>
          </Link>

          <div className="flex min-h-[220px] flex-col items-center justify-center rounded-[24px] border border-dashed border-blue-200 bg-white/60 px-3 text-center">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-xl text-blue-600" aria-hidden="true">+</span>
            <p className="mt-3 text-xs font-semibold text-slate-600">More cases soon</p>
            <p className="mt-1 text-[10px] leading-4 text-slate-400">New collectible drops are on the way.</p>
          </div>
        </section>

        <BottomNav active="cases" />
      </div>
    </main>
  );
}
