'use client';
import { useMemo, useState } from 'react';
import type { WalletState } from '@/hooks/useWallet';

/* ---------- Embedded Inline Icons ---------- */
function CopyIcon({ className = '' }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
    </svg>
  );
}

function CheckIcon({ className = '' }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polyline points="20 6 9 17 4 12"></polyline>
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

function WalletIcon({ className = '' }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M21 12V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2h-3"></path>
      <path d="M16 12h.01"></path>
    </svg>
  );
}

function PowerIcon({ className = '' }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path>
      <line x1="12" y1="2" x2="12" y2="12"></line>
    </svg>
  );
}

export default function ConnectWallet(wallet: WalletState) {
  const [copied, setCopied] = useState(false);
  const { publicKey, connecting, error, connect, disconnect, ready, status, network, provider } = wallet;

  const copy = async () => {
    if (!publicKey) return;
    try {
      await navigator.clipboard.writeText(publicKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore silently
    }
  };

  const buttonLabel = useMemo(() => {
    if (connecting) return 'Connecting...';
    if (ready) return 'Wallet Connected';
    if (error) return 'Retry Connection';
    return 'Connect Wallet';
  }, [connecting, ready, error]);

  if (publicKey) {
    return (
      <div className="flex flex-col items-end gap-2.5">
        <button
          onClick={copy}
          title="Copy full address"
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 shadow-sm border border-violet-100/70 text-xs font-mono font-bold text-slate-700 transition-all active:scale-[0.98]"
        >
          {copied ? (
            <CheckIcon className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
          ) : (
            <CopyIcon className="h-3.5 w-3.5 text-slate-400 shrink-0" />
          )}
          {copied ? 'Copied Full Key' : `${publicKey.slice(0, 6)}…${publicKey.slice(-6)}`}
        </button>
        
        <div className="flex items-center gap-3 text-xs">
          <span className="rounded-full bg-emerald-50 border border-emerald-100 px-2.5 py-1 font-bold uppercase tracking-wider text-emerald-700 text-[10px]">
            {status}
          </span>
          <button 
            onClick={() => void disconnect()} 
            className="flex items-center gap-1 font-bold text-rose-600 hover:text-rose-700 transition-colors"
          >
            <PowerIcon className="h-3 w-3" />
            Disconnect
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="text-right space-y-2">
      <button
        onClick={() => void connect()}
        disabled={connecting}
        className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#6C5DD3] px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-900/10 hover:bg-[#5B4FBF] transition-all disabled:opacity-50 active:scale-[0.98]"
      >
        {connecting ? (
          <RefreshCwIcon className="h-4 w-4 animate-spin shrink-0" />
        ) : (
          <WalletIcon className="h-4 w-4 shrink-0" />
        )}
        {buttonLabel}
      </button>

      <div className="text-[11px] font-semibold text-slate-400 space-y-0.5">
        <p>
          {connecting ? 'Opening Freighter secure tunnel…' : `Network: ${network === 'testnet' ? 'Testnet' : network}`}
        </p>
        {provider !== 'unknown' && !publicKey && (
          <p className="text-[10px] opacity-80">Secure Provider: {provider}</p>
        )}
      </div>

      {error && (
        <div className="mt-2 inline-block max-w-xs rounded-xl bg-rose-50 border border-rose-100 px-3 py-2 text-left">
          <p className="text-[11px] font-bold text-rose-600 leading-normal">{error}</p>
        </div>
      )}
    </div>
  );
}