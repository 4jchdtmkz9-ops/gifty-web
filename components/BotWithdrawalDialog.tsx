'use client';

import { useEffect, useState } from 'react';
import { useTonAddress } from '@tonconnect/ui-react';
import { createBotWithdrawal, getBotWithdrawalStatus, syncTelegramProfile, type BotWithdrawal } from '../lib/api';
import GramIcon from './GramIcon';
import { useOrbitLanguage } from './OrbitLanguageContext';

type Props = { open: boolean; configured: boolean; onClose: () => void; onUpdated: () => void };
const active = new Set(['PENDING', 'PROCESSING', 'BROADCASTING', 'SUBMITTED']);

export default function BotWithdrawalDialog({ open, configured, onClose, onUpdated }: Props) {
  const { t } = useOrbitLanguage();
  const address = useTonAddress();
  const [amount, setAmount] = useState('');
  const [withdrawal, setWithdrawal] = useState<BotWithdrawal | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open || !withdrawal || !active.has(withdrawal.status)) return;
    let stopped = false;
    const refresh = async () => {
      try {
        const status = await getBotWithdrawalStatus(withdrawal.id);
        if (stopped) return;
        setWithdrawal(status);
        if (!active.has(status.status)) onUpdated();
      } catch (cause) {
        if (!stopped) setError(cause instanceof Error ? cause.message : t('Could not check withdrawal'));
      }
    };
    void refresh();
    const timer = window.setInterval(() => void refresh(), 3500);
    return () => { stopped = true; window.clearInterval(timer); };
  }, [onUpdated, open, t, withdrawal]);

  useEffect(() => {
    if (!open) { setAmount(''); setWithdrawal(null); setSubmitting(false); setError(''); }
  }, [open]);

  if (!open) return null;

  const submit = async () => {
    setError('');
    if (!configured) { setError(t('Withdrawals are not configured yet.')); return; }
    if (!address) { setError(t('Connect your TON wallet before withdrawing.')); return; }
    if (!/^\d+(\.\d{1,9})?$/.test(amount) || Number(amount) < 0.01) { setError(t('Minimum withdrawal is 0.01 GRAM')); return; }
    setSubmitting(true);
    try {
      await syncTelegramProfile(address);
      setWithdrawal(await createBotWithdrawal(amount));
      setAmount('');
      onUpdated();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t('Could not create withdrawal'));
    } finally { setSubmitting(false); }
  };

  const completed = withdrawal?.status === 'CONFIRMED';
  const failed = withdrawal?.status === 'FAILED';
  const waiting = !!withdrawal && active.has(withdrawal.status);
  const statusCopy = waiting ? t('Withdrawal is being processed. Your balance is reserved until it finishes.') : completed ? t('Withdrawal sent successfully.') : failed ? (withdrawal.failureReason || t('Withdrawal failed. The amount was returned to your balance.')) : '';

  return <div className="fixed inset-0 z-[80] flex items-end justify-center bg-slate-950/55 p-3 sm:items-center" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section role="dialog" aria-modal="true" aria-labelledby="bot-withdraw-title" className="bot-deposit-dialog w-full max-w-[380px] rounded-[28px] border border-blue-100 bg-white p-5 shadow-2xl">
      <div className="flex items-start justify-between gap-4">
        <div><p className="text-[9px] font-extrabold uppercase tracking-[.16em] text-blue-600">ORBIT WALLET</p><h2 id="bot-withdraw-title" className="mt-1 text-xl font-extrabold text-blue-950">{t('Withdraw')}</h2></div>
        <button type="button" onClick={onClose} aria-label={t('Close')} className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-lg text-slate-500">×</button>
      </div>

      {!configured ? <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm leading-relaxed text-amber-900">{t('Withdrawals are not configured yet.')}</div> : withdrawal ? <div className={`mt-4 rounded-2xl border p-4 text-center ${completed ? 'border-emerald-200 bg-emerald-50' : failed ? 'border-red-200 bg-red-50' : 'border-blue-100 bg-blue-50'}`}>
        <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-white text-lg text-blue-700">{completed ? '✓' : failed ? '!' : <span className="h-4 w-4 animate-spin rounded-full border-2 border-blue-200 border-t-blue-700" />}</span>
        <p className="mt-2 text-sm font-bold text-blue-950">{completed ? t('Withdrawal complete') : failed ? t('Withdrawal failed') : t('Withdrawal in progress')}</p>
        <p className="mt-1 text-xs leading-relaxed text-slate-600">{statusCopy}</p>
        {withdrawal.txHash && <p className="mt-2 break-all text-[10px] text-slate-500">{withdrawal.txHash}</p>}
      </div> : <>
        <label htmlFor="withdraw-amount" className="mt-4 block text-xs font-bold text-slate-700">{t('Withdrawal amount')}</label>
        <div className="mt-1.5 flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 focus-within:border-blue-400">
          <GramIcon size={18} className="shrink-0 text-blue-600" />
          <input id="withdraw-amount" type="number" inputMode="decimal" min="0.01" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="0.01" disabled={submitting} className="min-w-0 flex-1 bg-transparent text-lg font-bold tabular-nums text-slate-900 outline-none" />
          <span className="text-xs font-bold text-slate-500">GRAM</span>
        </div>
        <p className="mt-1.5 text-[10px] text-slate-500">{t('Minimum withdrawal is 0.01 GRAM. Funds go to your connected wallet.')}</p>
        <p className="mt-2 truncate text-[10px] text-slate-500">{address ? `${t('To connected wallet')}: ${address}` : t('Connect your TON wallet before withdrawing.')}</p>
      </>}

      {error && <p role="alert" className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-xs font-medium text-red-700">{error}</p>}
      <div className="mt-4 flex gap-2">
        <button type="button" onClick={onClose} className="flex-1 rounded-2xl bg-slate-100 py-3 text-sm font-bold text-slate-600">{t('Close')}</button>
        {!withdrawal && configured && <button type="button" onClick={() => void submit()} disabled={submitting} className="flex-[1.5] rounded-2xl bg-blue-700 py-3 text-sm font-bold text-white shadow-[0_7px_18px_rgba(21,87,213,.2)] disabled:opacity-50">{submitting ? t('Processing…') : t('Withdraw')}</button>}
        {withdrawal && !waiting && <button type="button" onClick={onClose} className="flex-[1.5] rounded-2xl bg-blue-700 py-3 text-sm font-bold text-white">{t('Done')}</button>}
      </div>
    </section>
  </div>;
}
