'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import LanguageChoiceList from './LanguageChoiceList';
import TelegramTgsSticker from './TelegramTgsSticker';
import { useOrbitLanguage, type OrbitLanguage } from './OrbitLanguageContext';

const STARTED_KEY = 'orbit-miniapp-started';
const LANGUAGE_KEY = 'orbit-language';
const WELCOME_SPLASH_MS = 1900;

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
    const giveawayReferralCode = telegramStartParam?.match(/^nft_([a-zA-Z0-9_-]+)$/)?.[1];
    if (arenaCode) window.sessionStorage.setItem('orbit-pending-arena-room', arenaCode);
    if (giveawayReferralCode) window.sessionStorage.setItem('orbit-nft-referral-code', giveawayReferralCode);

    const hasStarted = window.sessionStorage.getItem(STARTED_KEY) === '1';
    const hasLanguage = ['en', 'uk', 'ru'].includes(window.localStorage.getItem(LANGUAGE_KEY) ?? '');
    setStage(hasStarted || arenaCode || giveawayReferralCode ? (hasLanguage ? 'app' : 'language') : 'welcome');
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

  // Splash: no button — the loader runs back and forth, then the app opens itself.
  useEffect(() => {
    if (!ready || stage !== 'welcome') return;
    const timer = window.setTimeout(() => startApp(), WELCOME_SPLASH_MS);
    return () => window.clearTimeout(timer);
  }, [ready, stage]);

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

  if (stage === 'welcome') {
    return (
      <main className="welcome-gate fixed inset-0 z-[100] flex min-h-[100dvh] flex-col overflow-hidden text-white" style={{ background: 'radial-gradient(circle at 50% 32%, #3d3d42 0%, #232326 46%, #101012 100%)' }}>
        <div className="flex flex-1 items-center justify-center px-8 pt-[8dvh]">
          <TelegramTgsSticker src="/stickers/welcome-fire.json" size={208} className="h-[208px] w-[208px] drop-shadow-[0_18px_45px_rgba(0,0,0,0.55)]" autoplay loop fallback={<span className="text-7xl">🔥</span>} />
        </div>
        <div className="flex justify-center px-10 pb-[calc(56px+env(safe-area-inset-bottom))]">
          <div className="relative h-1 w-full max-w-[280px] overflow-hidden rounded-full bg-white/15">
            <span className="absolute top-0 h-1 w-6 rounded-full bg-white" style={{ animation: 'welcome-loader-slide 1.1s ease-in-out infinite alternate' }} />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="welcome-gate fixed inset-0 z-[100] flex min-h-[100dvh] flex-col overflow-hidden bg-[#f7faff] text-slate-950">
      <section className="mx-auto flex w-full max-w-[440px] flex-1 flex-col justify-center px-6 pb-[calc(16px+env(safe-area-inset-bottom))]">
        <div className="mb-4 text-center">
          <div className="mb-2.5 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white px-3 py-1.5 shadow-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-700" />
            <span className="text-[9px] font-bold tracking-[0.2em] text-blue-700">ORBIT</span>
            <span className="h-1.5 w-1.5 rounded-full bg-yellow-400" />
          </div>
          <h1 className="text-[24px] font-bold leading-tight tracking-[-0.04em] text-blue-950">{t('Choose your language')}</h1>
          <p className="mx-auto mt-2 max-w-[330px] text-[13px] leading-[19px] text-slate-500">{t('Your language is saved on this device.')}</p>
        </div>

        <div className={`mt-5 transition duration-200 ${selecting ? 'scale-[0.98] opacity-70' : 'opacity-100'}`}>
          <LanguageChoiceList selected={pendingLanguage} onSelect={chooseLanguage} />
        </div>
      </section>
    </main>
  );
}
