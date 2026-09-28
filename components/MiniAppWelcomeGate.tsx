'use client';

import Image from 'next/image';
import { useState } from 'react';

export default function MiniAppWelcomeGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const [hasStarted, setHasStarted] = useState(false);

  if (hasStarted) return children;

  return (
    <main className="fixed inset-0 z-[100] flex min-h-[100dvh] flex-col overflow-y-auto bg-white text-slate-950">
      <div className="relative mx-auto flex h-[65dvh] min-h-[360px] max-h-[680px] w-full shrink-0 items-center justify-center">
        <Image
          src="/orbit-welcome.jpg"
          alt="ORBIT digital collectibles"
          fill
          priority
          sizes="(max-width: 480px) 100vw, 480px"
          className="object-fill"
        />
      </div>

      <section className="mx-auto flex w-full max-w-[440px] flex-1 flex-col px-6 pb-[calc(20px+env(safe-area-inset-bottom))] pt-1">
        <div className="mb-5 text-center">
          <div className="mb-3 flex items-center justify-center gap-1.5" aria-hidden="true">
            <span className="h-1 w-7 rounded-full bg-blue-700" />
            <span className="h-1 w-4 rounded-full bg-yellow-400" />
            <span className="h-1 w-2 rounded-full bg-red-500" />
          </div>
          <h1 className="text-[25px] font-bold leading-tight tracking-[-0.04em] text-blue-950">
            Your next favorite gift is waiting.
          </h1>
          <p className="mx-auto mt-2 max-w-[330px] text-sm leading-5 text-slate-500">
            Browse unique collectibles, discover hidden gems, and trade with ease. Everything you want, all in one place.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setHasStarted(true)}
          className="mt-auto flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-blue-700 px-5 text-base font-semibold text-white shadow-[0_10px_24px_rgba(21,87,213,0.24)] transition active:scale-[0.99] hover:bg-blue-800"
        >
          Start
          <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="h-4 w-4">
            <path d="M4 10h12m-5-5 5 5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </section>
    </main>
  );
}
