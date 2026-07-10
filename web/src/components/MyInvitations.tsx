'use client';
import { useState, useEffect, useCallback } from 'react';
import { fetchMyInvitations, respondToInvitation, type Invitation } from '@/lib/invitations';

export default function MyInvitations({ onResponded }: { onResponded?: () => void }) {
  const [invites, setInvites] = useState<Invitation[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    try {
      setInvites(await fetchMyInvitations());
    } catch {
      // silent
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  const respond = async (id: string, status: 'accepted' | 'declined') => {
    setBusyId(id);
    setError('');
    try {
      await respondToInvitation(id, status);
      await refresh();
      onResponded?.();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to respond');
    } finally {
      setBusyId(null);
    }
  };

  if (invites.length === 0) return null;

  return (
    <div className="p-4 rounded-2xl bg-white border border-slate-200/60 shadow-md shadow-slate-900/5 space-y-2">
      <h4 className="text-xs font-semibold text-slate-700">Vault Invitations</h4>
      {error && <p className="text-[10px] text-rose-500">{error}</p>}
      {invites.map((inv) => (
        <div key={inv.id} className="flex items-center justify-between gap-2 bg-slate-50 rounded-xl px-3 py-2.5">
          <span className="text-[11px] text-slate-600">
            Join <span className="font-medium">{inv.vault?.name ?? 'a vault'}</span>?
          </span>
          <div className="flex gap-1.5 shrink-0">
            <button
              onClick={() => respond(inv.id, 'accepted')}
              disabled={busyId === inv.id}
              className="px-2.5 py-1 rounded-lg bg-[#FF9F1C] text-white text-[9px] font-semibold uppercase disabled:opacity-50"
            >
              Accept
            </button>
            <button
              onClick={() => respond(inv.id, 'declined')}
              disabled={busyId === inv.id}
              className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-500 text-[9px] font-semibold uppercase disabled:opacity-50"
            >
              Decline
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}