'use client';
import { useState } from 'react';
import { sendInvitation } from '@/lib/invitations';

export default function InviteMemberModal({
  vaultId,
  onClose,
  onSent,
}: {
  vaultId: string;
  onClose: () => void;
  onSent: () => void;
}) {
  const [pubkey, setPubkey] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    setBusy(true); setError('');
    try {
      await sendInvitation(vaultId, pubkey.trim());
      onSent();
      onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to send invitation');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 space-y-3">
      <label className="block text-[10px] uppercase tracking-wider text-slate-400 font-light">
        Invitee Stellar Address
      </label>
      <input
        type="text"
        value={pubkey}
        onChange={(e) => setPubkey(e.target.value)}
        placeholder="G..."
        disabled={busy}
        className="w-full rounded-xl bg-white border border-slate-100 px-3.5 py-2.5 text-xs font-mono text-slate-800 outline-none focus:border-[#A0F0F0] disabled:opacity-50"
      />
      {error && <p className="text-[10px] text-rose-500">{error}</p>}
      <div className="flex gap-2">
        <button
          onClick={submit}
          disabled={busy || !pubkey.trim()}
          className="flex-1 rounded-xl bg-linear-to-r from-[#FF9F1C] to-[#F37A00] text-white py-2.5 text-[10px] uppercase tracking-widest disabled:opacity-40"
        >
          {busy ? 'Sending…' : 'Send Invite'}
        </button>
        <button onClick={onClose} disabled={busy} className="rounded-xl bg-slate-50 border border-slate-100 px-4 py-2.5 text-[10px] uppercase tracking-wide text-slate-400">
          Cancel
        </button>
      </div>
    </div>
  );
}