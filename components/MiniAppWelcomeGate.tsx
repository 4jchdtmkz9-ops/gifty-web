'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import LanguageChoiceList from './LanguageChoiceList';
import { useOrbitLanguage, type OrbitLanguage } from './OrbitLanguageContext';

const STARTED_KEY = 'orbit-miniapp-started';
const LANGUAGE_KEY = 'orbit-language';

export default function MiniAppWelcomeGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const { setLanguage, t } = useOrbitLanguage();
  const router = useRouter();
  const [stage, setStage] = useState<'welcome' | 'language' | 'app'>('welcome');
  const [ready, setReady] = useState(false);
  const [pendingLanguage, setPendingLanguage] = useState<OrbitLanguage | null>(null);
  const [selecting, setSelecting] = useState(false);

  useEffect(() => {
    const search = new URLSearchParams(window.location.search);
    const telegramInitData = window.Telegram?.WebApp?.initDataUnsafe as { start_param?: string } | undefined;
    const telegramStartParam = search.get('tgWebAppStartParam')
      ?? telegramInitData?.start_param;
    const arenaCode = telegramStartParam?.match(/^arena_(.+)$/)?.[1];
    if (arenaCode) window.sessionStorage.setItem('orbit-pending-arena-room', arenaCode);

    const hasStarted = window.sessionStorage.getItem(STARTED_KEY) === '1';
    const hasLanguage = ['en', 'uk', 'ru'].includes(window.localStorage.getItem(LANGUAGE_KEY) ?? '');
    setStage(hasStarted || arenaCode ? (hasLanguage ? 'app' : 'language') : 'welcome');
    setReady(true);
  }, []);

  useEffect(() => {
    if (stage !== 'app') return;
    const arenaCode = window.sessionStorage.getItem('orbit-pending-arena-room');
    if (!arenaCode) return;
    window.sessionStorage.removeItem('orbit-pending-arena-room');
    const target = `/arena?room=${encodeURIComponent(arenaCode)}`;
    if (`${window.location.pathname}${window.location.search}` !== target) router.replace(target);
  }, [stage, router]);

  function startApp() {
    window.sessionStorage.setItem(STARTED_KEY, '1');
    setStage(window.localStorage.getItem(LANGUAGE_KEY) ? 'app' : 'language');
  }

  function chooseLanguage(nextLanguage: OrbitLanguage) {
    if (selecting) return;
    setPendingLanguage(nextLanguage);
    setSelecting(true);
    window.setTimeout(() => {
      setLanguage(nextLanguage);
      window.sessionStorage.setItem(STARTED_KEY, '1');
      setStage('app');
    }, 240);
  }

  if (!ready) return null;
  if (stage === 'app') return children;

  return (
    <main className="welcome-gate fixed inset-0 z-[100] flex min-h-[100dvh] flex-col overflow-hidden bg-[#f7faff] text-slate-950">
      {stage === 'welcome' && (
        <div className="welcome-art-frame relative mx-3 mt-3 h-[61dvh] min-h-[320px] max-h-[560px] shrink-0 overflow-hidden rounded-[30px] border border-blue-100/80 bg-white shadow-[0_18px_50px_rgba(21,87,213,0.12)]">
          <Image src="/orbit-welcome.jpg" alt="ORBIT digital collectibles" fill priority sizes="calc(100vw - 24px)" className="object-fill" />
        </div>
      )}

      <section className={`mx-auto flex w-full max-w-[440px] flex-1 flex-col px-6 pb-[calc(16px+env(safe-area-inset-bottom))] ${stage === 'language' ? 'justify-center' : 'pt-4'}`}>
        <div className="mb-4 text-center">
          <div className="mb-2.5 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white px-3 py-1.5 shadow-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-700" />
            <span className="text-[9px] font-bold tracking-[0.2em] text-blue-700">{stage === 'welcome' ? t('WELCOME TO ORBIT') : 'ORBIT'}</span>
            <span className="h-1.5 w-1.5 rounded-full bg-yellow-400" />
          </div>
          {stage === 'welcome' ? (
            <>
              <h1 className="text-[24px] font-bold leading-tight tracking-[-0.04em] text-blue-950">{t('Your next favorite gift is waiting.')}</h1>
              <p className="mx-auto mt-2 max-w-[330px] text-[13px] leading-[19px] text-slate-500">{t('Browse unique collectibles, discover hidden gems, and trade with ease. Everything you want, all in one place.')}</p>
            </>
          ) : (
            <>
              <h1 className="text-[24px] font-bold leading-tight tracking-[-0.04em] text-blue-950">{t('Choose your language')}</h1>
              <p className="mx-auto mt-2 max-w-[330px] text-[13px] leading-[19px] text-slate-500">{t('Your language is saved on this device.')}</p>
            </>
          )}
        </div>

        {stage === 'welcome' ? (
          <button
            type="button"
            onClick={startApp}
            className="mt-auto flex min-h-14 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-blue-700 to-blue-600 px-5 text-base font-semibold text-white shadow-[0_10px_24px_rgba(21,87,213,0.24)] transition active:scale-[0.99] hover:from-blue-800 hover:to-blue-700"
          >
            {t('Start')}
            <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="h-4 w-4">
              <path d="M4 10h12m-5-5 5 5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        ) : (
          <div className={`mt-5 transition duration-200 ${selecting ? 'scale-[0.98] opacity-70' : 'opacity-100'}`}>
            <LanguageChoiceList selected={pendingLanguage} onSelect={chooseLanguage} />
          </div>
        )}
      </section>
    </main>
  );
}
