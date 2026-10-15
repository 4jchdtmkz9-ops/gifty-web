'use client';

import { useEffect, useState } from 'react';
import { useTonAddress, useTonConnectUI } from '@tonconnect/ui-react';
import {
  createBotDepositIntent,
  createStarsInvoice,
  getBotDepositStatus,
  getStarsDepositStatus,
  syncTelegramProfile,
  type BotDepositIntent,
} from '../lib/api';
import { fetchStarsRate, formatStars, getCachedStarsRate, type PayCurrency } from '../lib/currency';
import CurrencyToggle from './CurrencyToggle';
import GramIcon from './GramIcon';
import StarIcon from './StarIcon';
import { useOrbitLanguage } from './OrbitLanguageContext';

type Props = { open: boolean; configured: boolean; onClose: () => void; onConfirmed: () => void };
type Phase = 'editing' | 'sending' | 'waiting' | 'confirmed';

function toNano(value: string) {
  const [whole, fraction = ''] = value.split('.');
  return (BigInt(whole || '0') * BigInt(1_000_000_000) + BigInt((fraction + '000000000').slice(0, 9))).toString();
}

export default function BotDepositDialog({ open, configured, onClose, onConfirmed }: Props) {
  const { t } = useOrbitLanguage();
  const address = useTonAddress();
  const [tonConnectUi] = useTonConnectUI();
  const [method, setMethod] = useState<PayCurrency>('GRAM');
  const [amount, setAmount] = useState('');
  const [starsAmount, setStarsAmount] = useState('');
  const [deposit, setDeposit] = useState<BotDepositIntent | null>(null);
  const [starsDepositId, setStarsDepositId] = useState<string | null>(null);
  const [receivedAmount, setReceivedAmount] = useState<string | null>(null);
  const [rateTick, setRateTick] = useState(0);
  const [phase, setPhase] = useState<Phase>('editing');
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) void fetchStarsRate().then(() => setRateTick((tick) => tick + 1));
  }, [open ]);
  void rateTick;

  useEffect(() => {
    if (!open || phase !== 'waiting' || !deposit) return;
    let stopped = false;
    const refresh = async () => {
      try {
        const status = await getBotDepositStatus(deposit.id);
        if (stopped) return;
        if (status.status === 'CONFIRMED') {
          setReceivedAmount(status.receivedTon ?? deposit.amountTon);
          setPhase('confirmed');
          onConfirmed();
        } else if (status.status === 'EXPIRED') {
          setDeposit(null);
          setPhase('editing');
          setError(t('Deposit request expired. Please try again.'));
        }
      } catch (cause) {
        if (!stopped) setError(cause instanceof Error ? cause.message : t('Could not check deposit'));
      }
    };
    void refresh();
    const timer = window.setInterval(() => void refresh(), 5_000);
    return () => { stopped = true; window.clearInterval(timer); };
  }, [deposit, onConfirmed, open, phase, t]);

  useEffect(() => {
    if (!open || phase !== 'waiting' || !starsDepositId) return;
    let stopped = false;
    const refresh = async () => {
      try {
        const status = await getStarsDepositStatus(starsDepositId);
        if (stopped) return;
        if (status.status === 'CONFIRMED') {
          setReceivedAmount(`${status.starAmount}`);
          setPhase('confirmed');
          onConfirmed();
        } else if (status.status === 'EXPIRED') {
          setStarsDepositId(null);
          setPhase('editing');
          setError(t('Deposit request expired. Please try again.'));
        }
      } catch (cause) {
        if (!stopped) setError(cause instanceof Error ? cause.message : t('Could not check deposit'));
      }
    };
    void refresh();
    const timer = window.setInterval(() => void refresh(), 3_000);
    return () => { stopped = true; window.clearInterval(timer); };
  }, [starsDepositId, onConfirmed, open, phase, t]);

  useEffect(() => {
    if (!open) {
      setAmount('');
      setStarsAmount('');
      setDeposit(null);
      setStarsDepositId(null);
      setReceivedAmount(null);
      setPhase('editing');
      setError('');
      setMethod('GRAM');
    }
  }, [open ]);

  if (!open) return null;

  const startTonDeposit = async () => {
    setError('');
    if (!address) {
      await tonConnectUi.openModal();
      return;
    }
    if (!/^\d+(\.\d{1,9})?$/.test(amount) || Number(amount) < 0.1) {
      setError(t('Minimum deposit is 0.1 TON'));
      return;
    }
    setPhase('sending');
    try {
      await syncTelegramProfile(address);
      const invoice = await createBotDepositIntent(amount, address);
      setDeposit(invoice);
      await tonConnectUi.sendTransaction({
        validUntil: Math.floor(Date.now() / 1000) + 300,
        network: '-239',
        messages: [{ address: invoice.address, amount: toNano(invoice.amountTon), payload: invoice.payload }],
      });
      setPhase('waiting');
    } catch (cause) {
      setPhase('editing');
      setError(cause instanceof Error ? cause.message : t('Deposit was cancelled'));
    }
  };

  const startStarsDeposit = async () => {
    setError('');
    const rate = getCachedStarsRate();
    const stars = Math.floor(Number(starsAmount));
    if (!Number.isFinite(stars) || stars < rate.minStars || stars > rate.maxStars) {
      setError(t('Stars deposit must be between {min} and {max} Stars').replace('{min}', formatStars(rate.minStars)).replace('{max}', formatStars(rate.maxStars)));
      return;
    }
    setPhase('sending');
    try {
      const invoice = await createStarsInvoice(stars);
      setStarsDepositId(invoice.depositId);
      const webApp = window.Telegram?.WebApp;
      if (webApp?.openInvoice) {
        webApp.openInvoice(invoice.invoiceLink, (status) => {
          if (status === 'paid' || status === 'pending') {
            setPhase('waiting');
          } else if (status === 'failed') {
            setStarsDepositId(null);
            setPhase('editing');
            setError(t('Stars payment failed. Please try again.'));
          } else {
            setStarsDepositId(null);
            setPhase('editing');
          }
        });
      } else if (webApp?.openTelegramLink) {
        webApp.openTelegramLink(invoice.invoiceLink);
        setPhase('waiting');
      } else {
        window.open(invoice.invoiceLink, '_blank', 'noopener');
        setPhase('waiting');
      }
    } catch (cause) {
      setPhase('editing');
      setStarsDepositId(null);
      setError(cause instanceof Error ? cause.message : t('Could not create Stars invoice'));
    }
  };

  const rate = getCachedStarsRate();
  const confirmedIsStars = method === 'STARS';

  return <div className="fixed inset-0 z-[80] flex items-end justify-center bg-slate-950/55 p-3 sm:items-center" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section role="dialog" aria-modal="true" aria-labelledby="bot-deposit-title" className="bot-deposit-dialog w-full max-w-[380px] rounded-[28px] border border-blue-100 bg-white p-5 shadow-2xl">
      <div className="flex items-start justify-between gap-4">
        <div><p className="text-[9px] font-extrabold uppercase tracking-[.16em] text-blue-600">ORBIT WALLET</p><h2 id="bot-deposit-title" className="mt-1 text-xl font-extrabold text-blue-950">{t('Deposit')}</h2></div>
        <button type="button" onClick={onClose} aria-label={t('Close')} className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-lg text-slate-500">×</button>
      </div>

      {phase !== 'confirmed' && phase !== 'waiting' && (
        <div className="mt-4">
          <CurrencyToggle value={method} onChange={setMethod} />
        </div>
      )}

      {!configured && method === 'GRAM' ? <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm leading-relaxed text-amber-900">{t('Deposits are being set up. The ORBIT wallet address will be added before deposits are enabled.')}</div> : phase === 'confirmed' ? <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-center"><span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-emerald-100 text-xl text-emerald-700">✓</span><p className="mt-2 text-sm font-bold text-emerald-900">{t('Deposit received')}</p><p className="mt-1 text-xs text-emerald-800">{confirmedIsStars ? <StarIcon size={13} className="mr-1" /> : <GramIcon size={13} className="mr-1 text-blue-600" />}{receivedAmount ?? ''} {confirmedIsStars ? t('Stars') : 'GRAM'} · {t('Balance updated')}</p></div> : phase === 'waiting' ? <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-center"><span className="mx-auto flex h-9 w-9 animate-pulse items-center justify-center rounded-full bg-blue-100">{confirmedIsStars ? <StarIcon size={18} /> : <GramIcon size={18} />}</span><p className="mt-2 text-sm font-bold text-blue-950">{t('Waiting for payment confirmation')}</p><p className="mt-1 text-xs leading-relaxed text-slate-500">{t('Your balance will update automatically after the payment is confirmed.')}</p></div> : method === 'STARS' ? <>
        <label htmlFor="stars-deposit-amount" className="mt-4 block text-xs font-bold text-slate-700">{t('Stars amount')}</label>
        <div className="mt-1.5 flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 focus-within:border-amber-400">
          <StarIcon size={18} className="shrink-0" />
          <input id="stars-deposit-amount" type="number" inputMode="numeric" min={rate.minStars} step="1" value={starsAmount} onChange={(event) => setStarsAmount(event.target.value)} placeholder="500" disabled={phase === 'sending'} className="min-w-0 flex-1 bg-transparent text-lg font-bold tabular-nums text-slate-900 outline-none" />
          <span className="text-xs font-bold text-slate-500"><StarIcon size={13} /></span>
        </div>
        <div className="mt-2 grid grid-cols-4 gap-1.5">
          {rate.presets.map((preset) => (
            <button key={preset} type="button" onClick={() => setStarsAmount(String(preset))} className="rounded-xl border border-amber-200 bg-amber-50/70 px-1 py-2 text-[11px] font-extrabold tabular-nums text-amber-800 transition active:scale-[.97]">
              {formatStars(preset)} <StarIcon size={12} />
            </button>
          ))}
        </div>
        <p className="mt-2 text-[11px] font-semibold text-slate-600">→ {t('Stars balance')} · {t('Usable for Arena stakes')}</p>
        <p className="mt-1 text-[10px] leading-4 text-slate-500">{t('Pay with Telegram Stars. Stars land on your separate Stars balance.')} 1 <StarIcon size={11} /> = {rate.gramPerStar} {t('GRAM')}</p>
      </> : <>
        <label htmlFor="deposit-amount" className="mt-4 block text-xs font-bold text-slate-700">{t('Deposit amount')}</label>
        <div className="mt-1.5 flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 focus-within:border-blue-400">
          <GramIcon size={18} className="shrink-0 text-blue-600" />
          <input id="deposit-amount" type="number" inputMode="decimal" min="0.1" step="0.001" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="0.1" disabled={phase === 'sending'} className="min-w-0 flex-1 bg-transparent text-lg font-bold tabular-nums text-slate-900 outline-none" />
          <span className="text-xs font-bold text-slate-500">TON</span>
        </div>
        <p className="mt-1.5 text-[10px] text-slate-500">{t('Minimum deposit is 0.1 TON. TON is credited 1:1 to your ORBIT balance.')}</p>
        {!address && <p className="mt-2 text-[11px] font-medium text-amber-700">{t('Connect your TON wallet to deposit.')}</p>}
      </>}

      {error && <p role="alert" className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-xs font-medium text-red-700">{error}</p>}
      <div className="mt-4 flex gap-2">
        <button type="button" onClick={onClose} className="flex-1 rounded-2xl bg-slate-100 py-3 text-sm font-bold text-slate-600">{t('Close')}</button>
        {configured && method === 'GRAM' && phase !== 'confirmed' && <button type="button" onClick={() => void startTonDeposit()} disabled={phase === 'sending' || phase === 'waiting'} className="flex-[1.5] rounded-2xl bg-blue-700 py-3 text-sm font-bold text-white shadow-[0_7px_18px_rgba(21,87,213,.2)] disabled:opacity-50">{phase === 'sending' ? t('Opening wallet…') : address ? t('Deposit') : t('Connect wallet')}</button>}
        {method === 'STARS' && phase !== 'confirmed' && phase !== 'waiting' && <button type="button" onClick={() => void startStarsDeposit()} disabled={phase === 'sending'} className="flex-[1.5] rounded-2xl bg-amber-500 py-3 text-sm font-bold text-white shadow-[0_7px_18px_rgba(245,166,35,.35)] disabled:opacity-50">{phase === 'sending' ? t('Creating invoice…') : <><StarIcon size={15} className="mr-1" />{t('Pay with Stars')}</>}</button>}
        {phase === 'confirmed' && <button type="button" onClick={onClose} className="flex-[1.5] rounded-2xl bg-blue-700 py-3 text-sm font-bold text-white">{t('Done')}</button>}
      </div>
    </section>
  </div>;
}
