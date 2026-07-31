'use client';

export default function PinUnlockPanel({
  pinInput,
  onPinInputChange,
  pinError,
  unlocking,
  onUnlock,
  onCancel,
}: {
  pinInput: string;
  onPinInputChange: (value: string) => void;
  pinError: string;
  unlocking: boolean;
  onUnlock: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="rounded-2xl bg-white border border-slate-100 p-5 text-[#1A1A1A] space-y-3">
      <p className="text-[11px] uppercase tracking-wide text-slate-500 font-semibold">
        Enter PIN
      </p>
      <input
        type="password"
        inputMode="numeric"
        value={pinInput}
        onChange={(e) => onPinInputChange(e.target.value)}
        placeholder="••••••"
        disabled={unlocking}
        className="w-full rounded-xl bg-slate-50 border border-slate-100 px-3.5 py-2.5 text-sm tracking-[0.3em] outline-none focus:border-[#A0F0F0] disabled:opacity-50"
      />
      {pinError && (
        <p className="text-[11px] text-rose-600 font-medium bg-rose-50 border border-rose-100 rounded-lg px-3 py-2">
          {pinError}
        </p>
      )}
      <div className="flex gap-2">
        <button
          onClick={onUnlock}
          disabled={unlocking || !pinInput}
          className="flex-1 rounded-xl bg-linear-to-r from-[#FF9F1C] to-[#F37A00] text-white py-2.5 text-[11px] font-bold uppercase tracking-widest disabled:opacity-40 shadow-sm shadow-orange-900/10"
        >
          {unlocking ? 'Unlocking…' : 'Unlock'}
        </button>
        <button
          onClick={onCancel}
          disabled={unlocking}
          className="rounded-xl bg-white border border-slate-200 px-4 py-2.5 text-[11px] font-bold uppercase tracking-wide text-slate-500 hover:bg-slate-50 disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}