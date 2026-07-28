'use client';
import { useState, useEffect, useCallback } from 'react';
import { authFetch, walletService, signWithCurrentAccount } from '@/lib/wallet';
import { submitSignedXDR, pollTransaction } from '@/lib/payment';
import {
  buildUpdateGoalXDR,
  buildUpdateLockXDR,
  buildRemoveMemberXDR,
  buildCloseVaultXDR,
} from '@/lib/contract';
import { SESSION_KEY_MISSING_MESSAGE, type VaultData, type VaultMemberRow, type VaultProposalRow } from './types';

interface VaultManagePanelProps {
  vault: VaultData;
  isOwned: boolean;
  isMemberOnly: boolean;
  publicKey: string | null;
  onChanged: () => void;
}

export default function VaultManagePanel({ vault, isOwned, isMemberOnly, publicKey, onChanged }: VaultManagePanelProps) {
  const [manageLoading, setManageLoading] = useState(false);
  const [manageError, setManageError] = useState('');
  const [members, setMembers] = useState<VaultMemberRow[]>([]);
  const [proposals, setProposals] = useState<VaultProposalRow[]>([]);

  const [proposeType, setProposeType] = useState<'edit_goal' | 'edit_lock' | null>(null);
  const [proposeGoal, setProposeGoal] = useState('');
  const [proposeLock, setProposeLock] = useState('');
  const [proposing, setProposing] = useState(false);
  const [proposeError, setProposeError] = useState('');

  const [leaving, setLeaving] = useState(false);
  const [leaveError, setLeaveError] = useState('');
  const [deletingVault, setDeletingVault] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const [proposalBusy, setProposalBusy] = useState<string | null>(null);
  const [proposalActionError, setProposalActionError] = useState('');
  const [proposalNeedsPin, setProposalNeedsPin] = useState(false);
  const [proposalPinInput, setProposalPinInput] = useState('');
  const [proposalPinError, setProposalPinError] = useState('');
  const [proposalUnlocking, setProposalUnlocking] = useState(false);
  const [pendingProposalExecution, setPendingProposalExecution] = useState<VaultProposalRow | null>(null);

  const loadManageData = useCallback(async () => {
    setManageLoading(true);
    setManageError('');
    try {
      const [membersRes, proposalsRes] = await Promise.all([
        authFetch(`/api/vaults/${vault.id}/members`),
        authFetch(`/api/vaults/${vault.id}/proposals`),
      ]);
      const membersData = await membersRes.json();
      const proposalsData = await proposalsRes.json();
      if (!membersRes.ok) throw new Error(membersData?.error ?? 'Failed to load members');
      if (!proposalsRes.ok) throw new Error(proposalsData?.error ?? 'Failed to load proposals');
      setMembers(membersData);
      setProposals(proposalsData);
    } catch (e: unknown) {
      setManageError(e instanceof Error ? e.message : 'Failed to load vault management data');
    } finally {
      setManageLoading(false);
    }
  }, [vault.id]);

  // Load members + proposals as soon as this panel mounts (i.e. as soon as it's shown).
  useEffect(() => {
    let canceled = false;
    void Promise.resolve().then(() => {
      if (canceled) return;
      void loadManageData();
    });
    return () => {
      canceled = true;
    };
  }, [loadManageData]);

  const handleLeave = async () => {
    if (!publicKey) return;
    setLeaving(true);
    setLeaveError('');
    try {
      const xdr = await buildRemoveMemberXDR(publicKey, vault.onChainVaultId, publicKey);
      const signedXdr = await signWithCurrentAccount(xdr);
      const hash = await submitSignedXDR(signedXdr);
      await pollTransaction(hash);

      const res = await authFetch(`/api/vaults/${vault.id}/leave`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? 'Failed to leave vault');

      onChanged();
    } catch (e: unknown) {
      setLeaveError(e instanceof Error ? e.message : 'Failed to leave vault');
    } finally {
      setLeaving(false);
    }
  };

  const handleDeletePersonalVault = async () => {
    if (!publicKey) return;
    setDeletingVault(true);
    setDeleteError('');
    try {
      const xdr = await buildCloseVaultXDR(publicKey, vault.onChainVaultId);
      const signedXdr = await signWithCurrentAccount(xdr);
      const hash = await submitSignedXDR(signedXdr);
      await pollTransaction(hash);

      const res = await authFetch(`/api/vaults/${vault.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? 'Failed to delete vault');
      onChanged();
    } catch (e: unknown) {
      setDeleteError(e instanceof Error ? e.message : 'Failed to delete vault');
    } finally {
      setDeletingVault(false);
    }
  };

  const handleProposeSubmit = async () => {
    if (!proposeType) return;
    setProposing(true);
    setProposeError('');
    try {
      const changes =
        proposeType === 'edit_goal'
          ? { targetAmount: Number(proposeGoal) }
          : { lockUntil: proposeLock };

      const res = await authFetch(`/api/vaults/${vault.id}/proposals`, {
        method: 'POST',
        body: JSON.stringify({ type: proposeType, changes }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? 'Failed to create proposal');

      setProposeType(null);
      setProposeGoal('');
      setProposeLock('');
      await loadManageData();
    } catch (e: unknown) {
      setProposeError(e instanceof Error ? e.message : 'Failed to create proposal');
    } finally {
      setProposing(false);
    }
  };

  const handleApproveProposal = async (proposalId: string) => {
    setProposalBusy(proposalId);
    setProposalActionError('');
    try {
      const res = await authFetch(`/api/vaults/${vault.id}/proposals/${proposalId}/approve`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? 'Failed to approve proposal');
      await loadManageData();
    } catch (e: unknown) {
      setProposalActionError(e instanceof Error ? e.message : 'Failed to approve proposal');
    } finally {
      setProposalBusy(null);
    }
  };

  const handleRejectProposal = async (proposalId: string) => {
    setProposalBusy(proposalId);
    setProposalActionError('');
    try {
      const res = await authFetch(`/api/vaults/${vault.id}/proposals/${proposalId}/reject`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? 'Failed to reject proposal');
      await loadManageData();
    } catch (e: unknown) {
      setProposalActionError(e instanceof Error ? e.message : 'Failed to reject proposal');
    } finally {
      setProposalBusy(null);
    }
  };

  const handleExecuteProposal = async (proposal: VaultProposalRow) => {
    setProposalBusy(proposal.id);
    setProposalActionError('');
    try {
      if (proposal.type === 'edit_goal' && proposal.changes?.targetAmount) {
        const xdr = await buildUpdateGoalXDR(vault.ownerPubkey, vault.onChainVaultId, proposal.changes.targetAmount);
        const signedXdr = await signWithCurrentAccount(xdr);
        const hash = await submitSignedXDR(signedXdr);
        await pollTransaction(hash);
      } else if (proposal.type === 'edit_lock' && proposal.changes?.lockUntil) {
        const lockTimestamp = Math.floor(new Date(proposal.changes.lockUntil).getTime() / 1000);
        const xdr = await buildUpdateLockXDR(vault.ownerPubkey, vault.onChainVaultId, lockTimestamp);
        const signedXdr = await signWithCurrentAccount(xdr);
        const hash = await submitSignedXDR(signedXdr);
        await pollTransaction(hash);
      }
      // type === 'delete' assumes balance is already 0 (distributed) before reaching here.

      const res = await authFetch(`/api/vaults/${vault.id}/proposals/${proposal.id}/execute`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? 'Failed to execute proposal');

      await loadManageData();
      onChanged();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Failed to execute proposal';
      if (message === SESSION_KEY_MISSING_MESSAGE) {
        setPendingProposalExecution(proposal);
        setProposalNeedsPin(true);
        setProposalBusy(null);
        return;
      }
      setProposalActionError(message);
    } finally {
      setProposalBusy(null);
    }
  };

  const handleProposalUnlockAndRetry = async () => {
    setProposalUnlocking(true);
    setProposalPinError('');
    try {
      await walletService.unlockPinAccount(proposalPinInput);
      setProposalNeedsPin(false);
      setProposalPinInput('');
      if (pendingProposalExecution) {
        const proposal = pendingProposalExecution;
        setPendingProposalExecution(null);
        await handleExecuteProposal(proposal);
      }
    } catch (e: unknown) {
      setProposalPinError(e instanceof Error ? e.message : 'Incorrect PIN');
    } finally {
      setProposalUnlocking(false);
    }
  };

  const proposeDelete = async () => {
    setProposing(true);
    setProposeError('');
    try {
      const res = await authFetch(`/api/vaults/${vault.id}/proposals`, {
        method: 'POST',
        body: JSON.stringify({ type: 'delete' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? 'Failed to propose deletion');
      await loadManageData();
    } catch (e: unknown) {
      setProposeError(e instanceof Error ? e.message : 'Failed to propose deletion');
    } finally {
      setProposing(false);
    }
  };

  const pendingProposal = proposals.find((p) => p.status === 'pending' || p.status === 'approved');

  if (manageLoading) {
    return <p className="text-[11px] text-slate-400 text-center py-2">Loading…</p>;
  }
  if (manageError) {
    return <p className="text-[10px] text-rose-500">{manageError}</p>;
  }

  return (
    <div className="space-y-4">
      {/* Members list */}
      <div className="space-y-1.5">
        <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Members</p>
        <div className="rounded-xl border border-slate-100 divide-y divide-slate-100 overflow-hidden">
          {members.map((m) => (
            <div key={m.id} className="flex items-center justify-between px-3 py-2 text-[11px]">
              <span className="font-mono text-slate-600 truncate">{m.pubkey}</span>
              <span className="text-[9px] uppercase tracking-wide text-slate-400">{m.role}</span>
            </div>
          ))}
          {members.length === 0 && (
            <p className="px-3 py-2 text-[11px] text-slate-400">No members found.</p>
          )}
        </div>
      </div>

      {/* Pending / approved proposal display */}
      {pendingProposal && (
        <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
              {pendingProposal.type.replace('_', ' ')} proposal
            </span>
            <span className={`text-[9px] uppercase tracking-wide px-2 py-0.5 rounded-full ${
              pendingProposal.status === 'approved' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
            }`}>
              {pendingProposal.status}
            </span>
          </div>
          {pendingProposal.changes?.targetAmount && (
            <p className="text-[11px] text-slate-500">New goal: {pendingProposal.changes.targetAmount} USDC</p>
          )}
          {pendingProposal.changes?.lockUntil && (
            <p className="text-[11px] text-slate-500">New unlock date: {new Date(pendingProposal.changes.lockUntil).toLocaleDateString()}</p>
          )}

          {proposalActionError && <p className="text-[10px] text-rose-500">{proposalActionError}</p>}

          {proposalNeedsPin && (
            <div className="rounded-lg border border-slate-100 bg-white p-3 space-y-2">
              <p className="text-[9px] uppercase tracking-wider text-slate-400 font-light">
                Enter PIN to continue
              </p>
              <input
                type="password"
                inputMode="numeric"
                value={proposalPinInput}
                onChange={(e) => setProposalPinInput(e.target.value)}
                placeholder="••••"
                disabled={proposalUnlocking}
                className="w-full rounded-lg bg-slate-50 border border-slate-100 px-3 py-2 text-xs outline-none focus:border-[#A0F0F0] disabled:opacity-50"
              />
              {proposalPinError && <p className="text-[9px] text-rose-500">{proposalPinError}</p>}
              <div className="flex gap-2">
                <button
                  onClick={handleProposalUnlockAndRetry}
                  disabled={proposalUnlocking || !proposalPinInput}
                  className="flex-1 py-2 rounded-lg bg-linear-to-r from-[#FF9F1C] to-[#F37A00] text-white text-[10px] uppercase tracking-wider font-normal disabled:opacity-40"
                >
                  {proposalUnlocking ? 'Unlocking…' : 'Unlock & continue'}
                </button>
                <button
                  onClick={() => { setProposalNeedsPin(false); setProposalPinInput(''); setProposalPinError(''); setPendingProposalExecution(null); }}
                  disabled={proposalUnlocking}
                  className="px-3 py-2 rounded-lg bg-slate-50 border border-slate-100 text-[10px] uppercase tracking-wide text-slate-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {pendingProposal.status === 'pending' && !isOwned && (
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => handleApproveProposal(pendingProposal.id)}
                disabled={proposalBusy === pendingProposal.id}
                className="flex-1 py-2 rounded-lg bg-emerald-500 text-white text-[10px] uppercase tracking-wider font-semibold disabled:opacity-50"
              >
                {proposalBusy === pendingProposal.id ? 'Approving…' : 'Approve'}
              </button>
              <button
                onClick={() => handleRejectProposal(pendingProposal.id)}
                disabled={proposalBusy === pendingProposal.id}
                className="flex-1 py-2 rounded-lg bg-rose-50 text-rose-600 text-[10px] uppercase tracking-wider font-semibold disabled:opacity-50"
              >
                Reject
              </button>
            </div>
          )}

          {pendingProposal.status === 'approved' && isOwned && (
            <button
              onClick={() => handleExecuteProposal(pendingProposal)}
              disabled={proposalBusy === pendingProposal.id || proposalNeedsPin}
              className="w-full py-2 rounded-lg bg-[#FF9F1C] text-white text-[10px] uppercase tracking-wider font-semibold disabled:opacity-50"
            >
              {proposalBusy === pendingProposal.id ? 'Executing…' : 'Execute Approved Change'}
            </button>
          )}
        </div>
      )}

      {/* Owner: propose edit / delete */}
      {isOwned && vault.vaultType === 'Collaborative' && !pendingProposal && (
        <div className="space-y-2">
          {proposeType === null ? (
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setProposeType('edit_goal')}
                className="py-2 rounded-lg bg-slate-50 border border-slate-100 text-[10px] uppercase tracking-wider text-slate-500 font-semibold"
              >
                Propose New Goal
              </button>
              <button
                onClick={() => setProposeType('edit_lock')}
                className="py-2 rounded-lg bg-slate-50 border border-slate-100 text-[10px] uppercase tracking-wider text-slate-500 font-semibold"
              >
                Propose New Lock Date
              </button>
            </div>
          ) : (
            <div className="rounded-xl border border-slate-100 p-3 space-y-2">
              {proposeType === 'edit_goal' ? (
                <input
                  type="number"
                  value={proposeGoal}
                  onChange={(e) => setProposeGoal(e.target.value)}
                  placeholder="New goal amount (USDC)"
                  className="w-full rounded-lg bg-slate-50 border border-slate-100 px-3 py-2 text-xs outline-none focus:border-[#A0F0F0]"
                />
              ) : (
                <input
                  type="date"
                  value={proposeLock}
                  onChange={(e) => setProposeLock(e.target.value)}
                  className="w-full rounded-lg bg-slate-50 border border-slate-100 px-3 py-2 text-xs outline-none focus:border-[#A0F0F0]"
                />
              )}
              {proposeError && <p className="text-[10px] text-rose-500">{proposeError}</p>}
              <div className="flex gap-2">
                <button
                  onClick={handleProposeSubmit}
                  disabled={proposing || (proposeType === 'edit_goal' ? !proposeGoal : !proposeLock)}
                  className="flex-1 py-2 rounded-lg bg-[#FF9F1C] text-white text-[10px] uppercase tracking-wider font-semibold disabled:opacity-50"
                >
                  {proposing ? 'Submitting…' : 'Submit Proposal'}
                </button>
                <button
                  onClick={() => { setProposeType(null); setProposeGoal(''); setProposeLock(''); setProposeError(''); }}
                  disabled={proposing}
                  className="px-3 py-2 rounded-lg bg-slate-50 border border-slate-100 text-[10px] uppercase tracking-wide text-slate-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Leave (non-owner collaborative member) */}
      {isMemberOnly && (
        <div className="space-y-1.5">
          {leaveError && <p className="text-[10px] text-rose-500">{leaveError}</p>}
          <button
            onClick={handleLeave}
            disabled={leaving}
            className="w-full py-2.5 rounded-xl bg-rose-50 text-rose-600 text-[11px] font-semibold uppercase tracking-wider disabled:opacity-50"
          >
            {leaving ? 'Leaving…' : 'Leave Vault'}
          </button>
        </div>
      )}

      {/* Delete (owner, personal vault) */}
      {isOwned && vault.vaultType === 'Personal' && (
        <div className="space-y-1.5">
          {deleteError && <p className="text-[10px] text-rose-500">{deleteError}</p>}
          {vault.status === 'Closed' ? (
            <p className="text-[10px] text-slate-400 text-center py-2">This vault has been closed.</p>
          ) : (
            <button
              onClick={handleDeletePersonalVault}
              disabled={deletingVault || vault.balance !== 0}
              title={vault.balance !== 0 ? 'Withdraw all funds before deleting' : undefined}
              className="w-full py-2.5 rounded-xl bg-rose-50 text-rose-600 text-[11px] font-semibold uppercase tracking-wider disabled:opacity-40"
            >
              {deletingVault ? 'Deleting…' : 'Delete Vault'}
            </button>
          )}
        </div>
      )}

      {/* Delete (owner, collaborative vault — via proposal) */}
      {isOwned && vault.vaultType === 'Collaborative' && !pendingProposal && (
        <div className="space-y-1.5">
          {proposeError && <p className="text-[10px] text-rose-500">{proposeError}</p>}
          <button
            onClick={proposeDelete}
            disabled={proposing || vault.balance !== 0}
            title={vault.balance !== 0 ? 'Distribute all funds before proposing deletion' : undefined}
            className="w-full py-2.5 rounded-xl bg-rose-50 text-rose-600 text-[11px] font-semibold uppercase tracking-wider disabled:opacity-40"
          >
            {proposing ? 'Proposing…' : 'Propose Vault Deletion'}
          </button>
        </div>
      )}
    </div>
  );
}