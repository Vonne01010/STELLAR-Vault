'use client';
import { useState } from 'react';
import { buildAddUsdcTrustlineXDR } from '@/lib/trustline';
import { signAndSubmit } from '@/lib/sign';

type Status = 'idle' | 'working' | 'done' | 'error';

function LinkIcon({ className = '' }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
    </svg>
  );
}

function RefreshCwIcon({ className = '' }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polyline points="23 4 23 10 17 10"></polyline>
      <polyline points="1 20 1 14 7 14"></polyline>
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
    </svg>
  );
}

export default function AddTrustline({
  publicKey,
  onDone,
}: {
  publicKey: string;
  onDone: () => void;
}) {
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState('');

  const add = async () => {
    setStatus('working');
    setError('');
    try {
      const xdr = await buildAddUsdcTrustlineXDR(publicKey);
      await signAndSubmit(xdr, publicKey);
      setStatus('done');
      onDone();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to add trustline');
      setStatus('error');
    }
  };

  if (status === 'done') {
    return (
      <div className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 border border-emerald-100 px-3.5 py-2 text-xs font-bold text-emerald-700">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        USDC trustline established.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <button
        onClick={add}
        disabled={status === 'working'}
        className="inline-flex items-center justify-center gap-2 rounded-xl bg-white border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-700 shadow-sm transition-all hover:bg-slate-50 disabled:opacity-50 active:scale-[0.98]"
      >
        {status === 'working' ? (
          <RefreshCwIcon className="h-4 w-4 animate-spin text-[#6C5DD3]" />
        ) : (
          <LinkIcon className="h-3.5 w-3.5 text-slate-400" />
        )}
        {status === 'working' ? 'Linking Ledger Asset…' : 'Add USDC Trustline'}
      </button>

      {error && (
        <div className="rounded-xl bg-rose-50 border border-rose-100 px-3 py-2 max-w-xs">
          <p className="text-[11px] font-bold text-rose-600 leading-normal">{error}</p>
        </div>
      )}
    </div>
  );
}