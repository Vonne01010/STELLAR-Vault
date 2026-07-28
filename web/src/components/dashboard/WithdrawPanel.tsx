'use client';

export default function WithdrawPanel({
  withdrawAmount,
  onWithdrawAmountChange,
  busy,
  usdcBalance,
  phpRate,
}: {
  withdrawAmount: string;
  onWithdrawAmountChange: (value: string) => void;
  busy: boolean;
  usdcBalance: number;
  phpRate: number;
}) {
  return (
    <div className="rounded-2xl bg-white border border-slate-100 p-5 text-[#1A1A1A] space-y-4 animate-fadeIn">
      <div className="space-y-1.5">
        <div className="flex justify-between items-baseline">
          <label className="block text-[11px] uppercase tracking-wide text-slate-500 font-semibold">Withdraw</label>
          <span className="text-[10px] text-slate-400 font-medium">Balance: {usdcBalance.toFixed(2)}</span>
        </div>
        <div className="relative flex items-center">
          <input
            type="number"
            value={withdrawAmount}
            onChange={(e) => onWithdrawAmountChange(e.target.value)}
            placeholder="0.00"
            disabled={busy}
            className="w-full rounded-xl bg-slate-50 border border-slate-100 pl-4 pr-24 py-3.5 text-2xl font-semibold tabular-nums text-slate-800 outline-none focus:border-[#A0F0F0] transition-colors placeholder:text-slate-300"
          />
          <div className="absolute right-3 flex items-center gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500">USDC</span>
            <button
              onClick={() => onWithdrawAmountChange(Math.floor(usdcBalance).toString())}
              className="px-2 py-1 text-[10px] font-bold text-slate-700 bg-[#E0FBFB] rounded-full uppercase hover:bg-[#cff5f5] transition-colors"
            >
              Max
            </button>
          </div>
        </div>
      </div>

      <div className="bg-slate-50 rounded-xl px-3.5 py-2.5 flex justify-between items-center border border-slate-100">
        <span className="uppercase text-slate-500 font-semibold tracking-wide text-[11px]">Fiat Value</span>
        <span className="text-slate-700 font-semibold text-[11px]">
          ≈ ₱{((Number(withdrawAmount) || 0) * phpRate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      </div>

      <button disabled className="w-full py-3.5 rounded-xl bg-slate-50 border border-slate-100 text-slate-300 text-xs font-bold uppercase tracking-widest cursor-not-allowed">
        Feature Pending
      </button>
    </div>
  );
}