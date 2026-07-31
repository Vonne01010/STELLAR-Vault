'use client';

function Spinner({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  );
}

export default function DepositPanel({
  phpRate,
  busy,
  loading,
  depositAmount,
  onDepositAmountChange,
  onDeposit,
}: {
  phpRate: number;
  busy: boolean;
  loading: boolean;
  depositAmount: string;
  onDepositAmountChange: (value: string) => void;
  onDeposit: () => void;
}) {
  const depositValue = (Number(depositAmount) || 0) * phpRate;

  return (
    <div className="rounded-2xl bg-white border border-slate-100 p-5 text-[#1A1A1A] space-y-4 animate-fadeIn">
      <span className="block text-[11px] uppercase tracking-wide text-slate-500 font-semibold">Deposit</span>

      <div className="space-y-1.5">
        <label htmlFor="deposit-amount" className="block text-[11px] uppercase tracking-wide text-slate-500 font-semibold">
          Amount
        </label>
        <div className="relative flex items-center">
          <input
            id="deposit-amount"
            type="number"
            value={depositAmount}
            onChange={(e) => onDepositAmountChange(e.target.value)}
            placeholder="0.00"
            disabled={busy}
            className="w-full rounded-xl bg-slate-50 border border-slate-100 pl-4 pr-20 py-3.5 text-2xl font-semibold tabular-nums text-slate-800 outline-none focus:border-[#A0F0F0] focus:bg-white disabled:opacity-50 transition-colors placeholder:text-slate-300"
          />
          <span className="absolute right-3.5 text-[10px] font-bold uppercase tracking-wide text-slate-500 bg-white border border-slate-200 rounded-full px-2 py-1">
            USDC
          </span>
        </div>
        <p className="text-right text-[11px] text-slate-400 font-medium px-1">
          ≈ ₱{depositValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
      </div>

      <button
        onClick={onDeposit}
        disabled={busy || loading || !depositAmount || Number(depositAmount) <= 0}
        className="w-full py-3.5 rounded-xl bg-linear-to-r from-[#FF9F1C] to-[#F37A00] text-white text-xs font-bold uppercase tracking-widest hover:opacity-95 transition-opacity disabled:opacity-40 flex items-center justify-center gap-2 shadow-sm shadow-orange-900/10"
      >
        {busy && <Spinner className="animate-spin h-3 w-3 text-white" />}
        <span>{busy ? 'Processing…' : 'Deposit USDC'}</span>
      </button>
    </div>
  );
}