'use client';
import { useState, useEffect, useCallback } from 'react';
import { fetchVaultInvitations, confirmInvitation, type Invitation } from '@/lib/invitations';
import { buildAddMemberXDR, readListMembers } from '@/lib/contract';
import { signWithCurrentAccount } from '@/lib/wallet';
import { submitSignedXDR, pollTransaction } from '@/lib/payment';

const SESSION_KEY_MISSING_MESSAGE = 'Your session key is unavailable. Please unlock your account again.';

export default function PendingConfirmations({
  vaultId,
  onChainVaultId,
  ownerPubkey,
  onConfirmed,
}: {
  vaultId: string;
  onChainVaultId: string;
  ownerPubkey: string;
  onConfirmed: () => void;
}) {
  const [invites, setInvites] = useState<Invitation[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    try {
      const all = await fetchVaultInvitations(vaultId);
      setInvites(all.filter((i) => i.status === 'accepted'));
    } catch {
      // silent — non-critical list
    }
  }, [vaultId]);

  useEffect(() => { void refresh(); }, [refresh]);

  const confirm = async (invitation: Invitation) => {
    setBusyId(invitation.id);
    setError('');
    try {
      const members = await readListMembers(onChainVaultId);
      const shareBps = Math.floor(10_000 / (members.length + 1));

      const xdr = await buildAddMemberXDR(ownerPubkey, onChainVaultId, invitation.inviteePubkey, shareBps);
      const signedXdr = await signWithCurrentAccount(xdr);
      const hash = await submitSignedXDR(signedXdr);
      await pollTransaction(hash);

      await confirmInvitation(invitation.id);
      await refresh();
      onConfirmed();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Failed to confirm member';
      if (message === SESSION_KEY_MISSING_MESSAGE) {
        setError('Please unlock your account and try again.');
      } else {
        setError(message);
      }
    } finally {
      setBusyId(null);
    }
  };

  if (invites.length === 0) return null;

  return (
    <div className="space-y-2 pt-2 border-t border-slate-100 mt-2">
      <p className="text-[10px] uppercase tracking-wider text-slate-400 font-light">Awaiting your confirmation</p>
      {error && <p className="text-[10px] text-rose-500">{error}</p>}
      {invites.map((inv) => (
        <div key={inv.id} className="flex items-center justify-between gap-2 bg-slate-50 rounded-xl px-3 py-2">
          <span className="text-[10px] font-mono text-slate-500 truncate">{inv.inviteePubkey}</span>
          <button
            onClick={() => confirm(inv)}
            disabled={busyId === inv.id}
            className="shrink-0 px-3 py-1.5 rounded-lg bg-[#FF9F1C] text-white text-[9px] font-semibold uppercase tracking-wider disabled:opacity-50"
          >
            {busyId === inv.id ? 'Confirming…' : 'Add to vault'}
          </button>
        </div>
      ))}
    </div>
  );
}