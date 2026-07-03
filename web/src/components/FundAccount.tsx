'use client';
import { useState } from 'react';
import { fundTestnetAccount } from '@/lib/stellar';

/* ---------- Embedded Inline Icons ---------- */
function CoinsIcon({ className = '' }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="8" cy="8" r="6"></circle>
      <circle cx="18" cy="18" r="4"></circle>
      <path d="M12 18a6 6 0 0 0-6-6"></path>
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

export default function FundAccount({
  publicKey,
  onFunded,
}: {
  publicKey: string;
  onFunded: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fund = async () => {
    setLoading(true);
    setError('');
    try {
      await fundTestnetAccount(publicKey);
      onFunded();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Funding sequence rejected');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <button
        onClick={fund}
        disabled={loading}
        className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-50/70 text-orange-700 border border-orange-100/70 px-4 py-2.5 text-xs font-bold transition-all hover:bg-orange-50 disabled:opacity-50 active:scale-[0.98]"
      >
        {loading ? (
          <RefreshCwIcon className="h-4 w-4 animate-spin shrink-0" />
        ) : (
          <CoinsIcon className="h-4 w-4 shrink-0" />
        )}
        {loading ? 'Requesting Test Network Capital…' : 'Fund with Friendbot'}
      </button>

      {error && (
        <div className="rounded-xl bg-rose-50 border border-rose-100 px-3 py-2 max-w-xs">
          <p className="text-[11px] font-bold text-rose-600 leading-normal">{error}</p>
        </div>
      )}
    </div>
  );
}