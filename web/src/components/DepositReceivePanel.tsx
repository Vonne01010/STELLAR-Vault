'use client';

import QRCodeDisplay from './QRCodeDisplay';
import type { Panel } from './dashboardTypes';

const STELLAR_ADDRESS_RE = /^G[A-Z2-7]{55}$/;

/** Builds a `stellar:` payment URI so scanning apps can prefill destination + amount. */
function buildPaymentUri(address: string, amount?: string): string {
  if (!amount || Number(amount) <= 0) return address;
  return `stellar:${address}?amount=${encodeURIComponent(amount)}`;
}

export default function DepositReceivePanel({
  panel,
  setPanel,
  publicKey,
  phpRate,
  busy,
  loading,
  depositAmount,
  onDepositAmountChange,
  onDeposit,
  receiveMode,
  onReceiveModeChange,
  copied,
  onCopyAddress,
  receiveRequestAmount,
  onReceiveRequestAmountChange,
}: {
  panel: Panel;
  setPanel: (panel: Panel) => void;
  publicKey: string;
  phpRate: number;
  busy: boolean;
  loading: boolean;
  depositAmount: string;
  onDepositAmountChange: (value: string) => void;
  onDeposit: () => void;
  receiveMode: 'address' | 'qr';
  onReceiveModeChange: (mode: 'address' | 'qr') => void;
  copied: boolean;
  onCopyAddress: () => void;
  receiveRequestAmount: string;
  onReceiveRequestAmountChange: (value: string) => void;
}) {
  return (
    <div className="rounded-2xl bg-white border border-slate-100 p-5 text-[#1A1A1A] space-y-4 animate-fadeIn">
      <div className="grid grid-cols-2 p-0.5 bg-slate-50 border border-slate-100 rounded-xl">
        <button
          type="button"
          onClick={() => setPanel('deposit')}
          className={`py-1.5 text-[10px] uppercase tracking-wider rounded-lg transition-all ${panel === 'deposit' ? 'bg-[#E0FBFB] text-slate-800' : 'text-slate-400 font-light'}`}
        >
          Deposit
        </button>
        <button
          type="button"
          onClick={() => { setPanel('receive'); onReceiveModeChange('address'); }}
          className={`py-1.5 text-[10px] uppercase tracking-wider rounded-lg transition-all ${panel === 'receive' ? 'bg-[#E0FBFB] text-slate-800' : 'text-slate-400 font-light'}`}
        >
          Receive
        </button>
      </div>

      {panel === 'deposit' && (
        <div className="space-y-3 animate-fadeIn">
          <div className="space-y-1">
            <label className="block text-[10px] uppercase tracking-wider text-slate-400 font-light">Amount</label>
            <div className="relative flex items-center">
              <input
                type="number"
                value={depositAmount}
                onChange={(e) => onDepositAmountChange(e.target.value)}
                placeholder="0.00"
                disabled={busy}
                className="w-full rounded-xl bg-slate-50 border border-slate-100 pl-4 pr-16 py-2.5 text-xs text-slate-800 outline-none focus:border-[#A0F0F0] disabled:opacity-50 transition-colors"
              />
              <span className="absolute right-4 text-[10px] text-slate-400">USDC</span>
            </div>
          </div>

          <div className="bg-slate-50/50 px-3 py-2 flex justify-between items-center text-[10px]">
            <span className="uppercase text-slate-400 font-light tracking-wider">Value</span>
            <span className="text-slate-500">
              ₱{((Number(depositAmount) || 0) * phpRate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          <button
            onClick={onDeposit}
            disabled={busy || loading || !depositAmount || Number(depositAmount) <= 0}
            className="w-full py-3 rounded-xl bg-linear-to-r from-[#FF9F1C] to-[#F37A00] text-white text-[10px] uppercase tracking-widest hover:opacity-95 transition-opacity disabled:opacity-40 flex items-center justify-center gap-2"
          >
            {busy && (
              <svg className="animate-spin h-3 w-3 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            )}
            <span>{busy ? 'Processing...' : 'Deposit'}</span>
          </button>
        </div>
      )}

      {panel === 'receive' && publicKey && (
        <div className="space-y-3 animate-fadeIn">
          <div className="grid grid-cols-2 p-0.5 bg-slate-50 border border-slate-100 rounded-lg">
            <button
              onClick={() => onReceiveModeChange('address')}
              className={`py-1 text-[9px] uppercase tracking-wider rounded-md transition-all ${receiveMode === 'address' ? 'bg-[#E0FBFB] text-slate-800' : 'text-slate-400 font-light'}`}
            >
              My Address
            </button>
            <button
              onClick={() => onReceiveModeChange('qr')}
              className={`py-1 text-[9px] uppercase tracking-wider rounded-md transition-all ${receiveMode === 'qr' ? 'bg-[#E0FBFB] text-slate-800' : 'text-slate-400 font-light'}`}
            >
              QR Code
            </button>
          </div>

          {receiveMode === 'address' ? (
            <div className="space-y-2 animate-fadeIn">
              <p className="break-all rounded-xl border border-slate-100 bg-slate-50 p-3 text-[11px] text-slate-500 leading-relaxed font-mono">{publicKey}</p>
              <button
                onClick={onCopyAddress}
                className="w-full py-2.5 rounded-xl bg-[#E0FBFB] text-slate-800 text-[10px] uppercase tracking-wider font-light"
              >
                {copied ? 'Copied Securely' : 'Copy Key'}
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-2 space-y-3 animate-fadeIn">
              <QRCodeDisplay value={buildPaymentUri(publicKey, receiveRequestAmount)} size={176} />

              <div className="w-full space-y-1">
                <label className="block text-[10px] uppercase tracking-wider text-slate-400 font-light">
                  Request Amount (optional)
                </label>
                <div className="relative flex items-center">
                  <input
                    type="number"
                    value={receiveRequestAmount}
                    onChange={(e) => onReceiveRequestAmountChange(e.target.value)}
                    placeholder="0.00"
                    className="w-full rounded-xl bg-slate-50 border border-slate-100 pl-4 pr-14 py-2.5 text-xs text-slate-800 outline-none focus:border-[#A0F0F0] transition-colors"
                  />
                  <span className="absolute right-4 text-[10px] text-slate-400">USDC</span>
                </div>
              </div>

              <span className="text-[9px] uppercase tracking-widest text-slate-400 font-light text-center">
                {receiveRequestAmount && Number(receiveRequestAmount) > 0
                  ? `Requesting ${Number(receiveRequestAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })} USDC`
                  : 'Scan to send to this wallet'}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
