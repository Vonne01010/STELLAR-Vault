'use client';

import QRCodeDisplay from '@/components/shared/QRCodeDisplay';

/** Builds a `stellar:` payment URI so scanning apps can prefill destination + amount. */
function buildPaymentUri(address: string, amount?: string): string {
  if (!amount || Number(amount) <= 0) return address;
  return `stellar:${address}?amount=${encodeURIComponent(amount)}`;
}

function QrCodeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4h6v6H4V4zm10 0h6v6h-6V4zM4 14h6v6H4v-6zm10 3h3m-3 3h6v-6h-3" />
    </svg>
  );
}

function CopyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 15V5a2 2 0 012-2h10" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

export default function ReceivePanel({
  publicKey,
  receiveMode,
  onReceiveModeChange,
  copied,
  onCopyAddress,
  receiveRequestAmount,
  onReceiveRequestAmountChange,
  phpRate,
}: {
  publicKey: string;
  receiveMode: 'address' | 'qr';
  onReceiveModeChange: (mode: 'address' | 'qr') => void;
  copied: boolean;
  onCopyAddress: () => void;
  receiveRequestAmount: string;
  onReceiveRequestAmountChange: (value: string) => void;
  /** PHP-per-USDC rate, used to show a live peso equivalent under the request-amount field. */
  phpRate?: number;
}) {
  const requestValue = Number(receiveRequestAmount) || 0;
  const phpEquivalent = phpRate ? requestValue * phpRate : null;

  if (!publicKey) {
    return (
      <div className="rounded-2xl bg-white border border-slate-100 p-5 text-[#1A1A1A] animate-fadeIn">
        <p className="p-4 bg-slate-50 text-[11px] text-slate-400 font-medium text-center rounded-xl">
          Verify parameters to initialize transfer.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white border border-slate-100 p-5 text-[#1A1A1A] space-y-4 animate-fadeIn">
      <div className="flex items-center justify-between">
        <span className="block text-[11px] uppercase tracking-wide text-slate-500 font-semibold">Receive</span>
        <div className="flex shrink-0 p-1 bg-slate-50 border border-slate-100 rounded-lg">
          <button
            type="button"
            aria-label="Show address"
            aria-pressed={receiveMode === 'address'}
            onClick={() => onReceiveModeChange('address')}
            className={`p-1.5 rounded-md transition-all ${receiveMode === 'address' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-500'}`}
          >
            <CopyIcon className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            aria-label="Show QR code"
            aria-pressed={receiveMode === 'qr'}
            onClick={() => onReceiveModeChange('qr')}
            className={`p-1.5 rounded-md transition-all ${receiveMode === 'qr' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-500'}`}
          >
            <QrCodeIcon className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {receiveMode === 'address' ? (
        <div className="space-y-2 animate-fadeIn">
          <p className="break-all rounded-xl border border-slate-100 bg-slate-50 p-3.5 text-[11px] text-slate-600 font-medium leading-relaxed font-mono">{publicKey}</p>
          <button
            onClick={onCopyAddress}
            className="w-full py-3 rounded-xl bg-[#E0FBFB] text-slate-800 text-[11px] font-bold uppercase tracking-wide flex items-center justify-center gap-1.5 transition-colors hover:bg-[#cff5f5]"
          >
            {copied ? <CheckIcon className="w-3.5 h-3.5" /> : <CopyIcon className="w-3.5 h-3.5" />}
            {copied ? 'Copied Securely' : 'Copy Address'}
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center py-2 space-y-3 animate-fadeIn">
          <QRCodeDisplay value={buildPaymentUri(publicKey, receiveRequestAmount)} size={168} />

          <div className="w-full space-y-1">
            <label htmlFor="receive-request-amount" className="block text-[11px] uppercase tracking-wide text-slate-500 font-semibold">
              Request Amount (optional)
            </label>
            <div className="relative flex items-center">
              <input
                id="receive-request-amount"
                type="number"
                value={receiveRequestAmount}
                onChange={(e) => onReceiveRequestAmountChange(e.target.value)}
                placeholder="0.00"
                className="w-full rounded-xl bg-slate-50 border border-slate-100 pl-4 pr-20 py-3 text-xl font-semibold tabular-nums text-slate-800 outline-none focus:border-[#A0F0F0] transition-colors placeholder:text-slate-300"
              />
              <span className="absolute right-3.5 text-[10px] font-bold uppercase tracking-wide text-slate-500 bg-white border border-slate-200 rounded-full px-2 py-1">
                USDC
              </span>
            </div>
            {phpEquivalent !== null && requestValue > 0 && (
              <p className="text-[11px] text-slate-400 font-medium pl-1">
                ≈ ₱{phpEquivalent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            )}
          </div>

          <span className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold text-center">
            {requestValue > 0
              ? `Requesting ${requestValue.toLocaleString(undefined, { minimumFractionDigits: 2 })} USDC`
              : 'Scan to send to this wallet'}
          </span>
        </div>
      )}
    </div>
  );
}