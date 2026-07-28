'use client';
import { useState, useEffect } from 'react';
import { signWithCurrentAccount, walletService, authFetch } from '@/lib/wallet';
import { submitSignedXDR, pollTransaction } from '@/lib/payment';
import { depositUSDC, withdrawUSDC } from '@/lib/transfer';
import { buildDistributeXDR } from '@/lib/contract';
import { createAppNotification } from '@/lib/notifications';
import InviteMemberModal from '@/components/vault/InviteMemberModal';
import PendingConfirmations from '@/components/vault/PendingConfirmations';
import { DotsIcon } from '@/app/icons';
import VaultManagePanel from './VaultManagePanel';
import { SESSION_KEY_MISSING_MESSAGE, type VaultData, type MoneyAction } from './types';

/** Same two-layer wave motif used on CreateVault's live preview, reused here so a
 *  saved vault card reads as part of the same visual family as creating one. */
function WaveAnimation() {
  return (
    <div className="absolute inset-x-0 bottom-0 h-14 overflow-hidden pointer-events-none select-none">
      <svg className="absolute bottom-0 left-0 w-[200%] h-full wave-layer-back" viewBox="0 0 1200 120" preserveAspectRatio="none">
        <path d="M0,50 C150,90 350,10 600,50 C850,90 1050,10 1200,50 L1200,120 L0,120 Z" fill="rgba(255,255,255,0.10)" />
      </svg>
      <svg className="absolute bottom-0 left-0 w-[200%] h-full wave-layer-front" viewBox="0 0 1200 120" preserveAspectRatio="none">
        <path d="M0,65 C200,25 400,95 600,65 C800,35 1000,95 1200,65 L1200,120 L0,120 Z" fill="rgba(255,255,255,0.16)" />
      </svg>
      <style jsx>{`
        @keyframes wave-slide-back { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        @keyframes wave-slide-front { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        .wave-layer-back { animation: wave-slide-back 9s linear infinite; }
        .wave-layer-front { animation: wave-slide-front 5.5s linear infinite reverse; }
      `}</style>
    </div>
  );
}

function SparkleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2c.6 3.2 1.4 5.2 2.4 6.2 1 1 3 1.8 6.2 2.4-3.2.6-5.2 1.4-6.2 2.4-1 1-1.8 3-2.4 6.2-.6-3.2-1.4-5.2-2.4-6.2-1-1-3-1.8-6.2-2.4 3.2-.6 5.2-1.4 6.2-2.4C10.6 7.2 11.4 5.2 12 2z" />
    </svg>
  );
}

interface VaultCardProps {
  vault: VaultData;
  onChanged: () => void;
  isOwned: boolean;
  highlighted?: boolean;
  publicKey: string | null;
}

export default function VaultCard({ vault, onChanged, isOwned, highlighted, publicKey }: VaultCardProps) {
  const progress = vault.targetAmount > 0
    ? Math.min(100, (vault.balance / vault.targetAmount) * 100)
    : 0;

  const [showInvite, setShowInvite] = useState(false);
  const [action, setAction] = useState<MoneyAction | null>(null);
  const [amount, setAmount] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const [needsPin, setNeedsPin] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [unlocking, setUnlocking] = useState(false);

  const [showHighlight, setShowHighlight] = useState(false);
  const [showManage, setShowManage] = useState(false);

  const [distributing, setDistributing] = useState(false);
  const [distributeError, setDistributeError] = useState('');

  useEffect(() => {
    if (!highlighted) return;

    const timeoutId = window.setTimeout(() => {
      setShowHighlight(false);
    }, 2500);

    return () => window.clearTimeout(timeoutId);
  }, [highlighted]);

  const openAction = (a: MoneyAction) => {
    setAction(a);
    setAmount('');
    setError('');
    setNeedsPin(false);
    setPinInput('');
    setPinError('');
  };

  const closeAction = () => {
    setAction(null);
    setBusy(false);
    setNeedsPin(false);
  };

  const runAction = async () => {
    if (!action) return;
    setBusy(true);
    setError('');
    try {
      const fn = action === 'deposit' ? depositUSDC : withdrawUSDC;
      await fn(amount, vault.onChainVaultId, vault.id, {
        onCompleted: async () => {
          onChanged();
        },
      });
      closeAction();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : `${action} failed`;
      if (message === SESSION_KEY_MISSING_MESSAGE) {
        setNeedsPin(true);
        setBusy(false);
        return;
      }
      setError(message);
      setBusy(false);
    }
  };

  const runDistribute = async () => {
    setDistributing(true);
    setDistributeError('');
    try {
      const xdr = await buildDistributeXDR(vault.ownerPubkey, vault.onChainVaultId);
      const signedXdr = await signWithCurrentAccount(xdr);
      await createAppNotification({
        message: 'Distribution transaction submitted to the blockchain.',
        vaultId: vault.id,
        variant: 'info',
        meta: { event: 'transaction_submitted', operation: 'distribute', timestamp: new Date().toISOString() },
      }).catch(() => undefined);
      const hash = await submitSignedXDR(signedXdr);
      await pollTransaction(hash);

      const eventRes = await authFetch(`/api/vaults/${vault.id}/events`, {
        method: 'POST',
        body: JSON.stringify({
          eventType: 'distribution_completed',
          totalAmount: vault.balance,
        }),
      });
      const eventData = await eventRes.json().catch(() => null);
      if (!eventRes.ok) {
        throw new Error(eventData?.error ?? 'Vault balance sync failed after distribution');
      }

      await createAppNotification({
        message: 'Distribution transaction confirmed on-chain.',
        vaultId: vault.id,
        variant: 'success',
        meta: { event: 'transaction_confirmed', operation: 'distribute', hash, timestamp: new Date().toISOString() },
      }).catch(() => undefined);
      onChanged();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Distribution failed';
      await createAppNotification({
        message: `Distribution failed: ${message}`,
        vaultId: vault.id,
        variant: 'error',
        meta: { event: 'transaction_failed', operation: 'distribute', error: message, timestamp: new Date().toISOString() },
      }).catch(() => undefined);
      setDistributeError(message);
    } finally {
      setDistributing(false);
    }
  };

  const handleUnlockAndRetry = async () => {
    setUnlocking(true);
    setPinError('');
    try {
      await walletService.unlockPinAccount(pinInput);
      setNeedsPin(false);
      setPinInput('');
      await runAction();
    } catch (e: unknown) {
      setPinError(e instanceof Error ? e.message : 'Incorrect PIN');
    } finally {
      setUnlocking(false);
    }
  };

  const withdrawDisabled = vault.vaultType !== 'Personal' || !vault.withdrawable;
  const isMemberOnly = !isOwned && vault.vaultType === 'Collaborative';
  const isCollab = vault.vaultType === 'Collaborative';

  return (
    <div
      className={`rounded-2xl bg-white overflow-hidden border border-slate-200/70 transition-all duration-700 ${
        showHighlight
          ? 'ring-2 ring-[#FF9F1C]/40'
          : 'shadow-[0_8px_24px_-10px_rgba(15,23,42,0.18)]'
      }`}
    >
      {/* Hero header — same wave/sparkle motif used on CreateVault's live preview,
          so a saved vault reads as part of the same visual family as creating one. */}
      <div
        className={`p-4 text-white relative overflow-hidden transition-colors duration-300 ${
          isCollab
            ? 'bg-linear-to-br from-cyan-400 via-cyan-500 to-blue-600 shadow-[0_12px_20px_-14px_rgba(8,145,178,0.45)]'
            : 'bg-linear-to-br from-[#FFB238] via-[#FF9F1C] to-[#F37A00] shadow-[0_12px_20px_-14px_rgba(230,80,0,0.45)]'
        }`}
      >
        <SparkleIcon className="absolute top-3 right-4 w-3 h-3 text-white/70" />
        <SparkleIcon className="absolute top-7 right-11 w-1.5 h-1.5 text-white/40" />
        <SparkleIcon className="absolute bottom-9 right-6 w-2 h-2 text-white/50" />
        <WaveAnimation />

        <div className="relative z-10 flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-0.5">
            <span className="text-[10px] tracking-[0.14em] uppercase font-semibold text-white/80">
              {vault.vaultType}
            </span>
            <h4 className="text-base font-semibold tracking-tight leading-snug truncate">{vault.name}</h4>
          </div>
          <button
            onClick={() => setShowManage((v) => !v)}
            aria-label="Manage vault"
            aria-expanded={showManage}
            className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-colors ${
              showManage ? 'bg-white/25 text-white' : 'bg-white/10 text-white/80 hover:bg-white/20 hover:text-white'
            }`}
          >
            <DotsIcon className="w-4 h-4" />
          </button>
        </div>

        <div className="relative z-10 pt-2.5 space-y-1">
          <div className="flex items-baseline gap-1.5">
            <span className="text-lg font-semibold tracking-tight leading-none">
              {vault.balance.toFixed(2)}
            </span>
            <span className="text-[11px] font-medium text-white/75">
              / {vault.targetAmount.toFixed(2)} USDC
            </span>
          </div>
          <div className="flex justify-between text-[9px] font-medium text-white/70">
            <span>{progress.toFixed(0)}%</span>
          </div>
          <div className="h-1 rounded-full bg-white/25 overflow-hidden">
            <div
              className="h-full rounded-full bg-white transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      <div className="p-4 space-y-2.5">
      {vault.description && (
        <p className="text-xs text-slate-400 font-normal">{vault.description}</p>
      )}

      {/* Contribute / Withdraw entry buttons */}
      {action === null && (
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            onClick={() => openAction('deposit')}
            className="py-2.5 rounded-xl bg-[#FF9F1C] text-white text-xs font-semibold hover:bg-[#FF8C00] active:scale-95 transition-all"
          >
            Contribute
          </button>
          <button
            onClick={() => openAction('withdraw')}
            disabled={withdrawDisabled}
            title={withdrawDisabled ? 'Withdrawals are only available for personal vaults once active' : undefined}
            className="py-2.5 rounded-xl bg-slate-50 text-slate-600 text-xs font-semibold hover:bg-slate-100 active:scale-95 transition-all disabled:opacity-40 disabled:hover:bg-slate-50"
          >
            Withdraw
          </button>
        </div>
      )}

      {/* Amount entry + confirm */}
      {action !== null && !needsPin && (
        <div className="pt-1 space-y-2.5 border-t border-slate-100 mt-1">
          <label className="block text-[10px] uppercase tracking-wider text-slate-400 font-light pt-2">
            {action === 'deposit' ? 'Contribute amount' : 'Withdraw amount'}
          </label>
          <div className="relative flex items-center">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              disabled={busy}
              className="w-full rounded-xl bg-slate-50 border border-slate-100 pl-3.5 pr-12 py-2.5 text-xs text-slate-800 outline-none focus:border-[#A0F0F0] disabled:opacity-50 transition-colors"
            />
            <span className="absolute right-3.5 text-[10px] text-slate-400">USDC</span>
          </div>

          {error && <p className="text-[10px] text-rose-500">{error}</p>}

          <div className="flex gap-2">
            <button
              onClick={runAction}
              disabled={busy || !amount || Number(amount) <= 0}
              className="flex-1 py-2.5 rounded-xl bg-[#FF9F1C] text-white text-xs font-semibold disabled:opacity-40 flex items-center justify-center gap-2"
            >
              {busy && (
                <svg className="animate-spin h-3 w-3 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              )}
              {busy ? 'Processing…' : 'Confirm'}
            </button>
            <button
              onClick={closeAction}
              disabled={busy}
              className="rounded-xl bg-slate-50 border border-slate-100 px-4 py-2.5 text-xs font-medium text-slate-400"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* PIN re-auth prompt */}
      {needsPin && (
        <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 space-y-3 mt-1">
          <p className="text-[10px] uppercase tracking-wider text-slate-400 font-light">
            Enter PIN to continue
          </p>
          <input
            type="password"
            inputMode="numeric"
            value={pinInput}
            onChange={(e) => setPinInput(e.target.value)}
            placeholder="••••••"
            disabled={unlocking}
            className="w-full rounded-xl bg-white border border-slate-100 px-3.5 py-2.5 text-xs text-slate-800 outline-none focus:border-[#A0F0F0] disabled:opacity-50"
          />
          {pinError && <p className="text-[10px] text-rose-500">{pinError}</p>}
          <div className="flex gap-2">
            <button
              onClick={handleUnlockAndRetry}
              disabled={unlocking || !pinInput}
              className="flex-1 rounded-xl bg-linear-to-r from-[#FF9F1C] to-[#F37A00] text-white py-2.5 text-[10px] uppercase tracking-widest font-normal disabled:opacity-40"
            >
              {unlocking ? 'Unlocking…' : 'Unlock & continue'}
            </button>
            <button
              onClick={closeAction}
              disabled={unlocking}
              className="rounded-xl bg-slate-50 border border-slate-100 px-4 py-2.5 text-[10px] uppercase tracking-wide text-slate-400"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Collaborative-vault owner controls: invite + on-chain confirmation */}
      {isOwned && vault.vaultType === 'Collaborative' && (
        <div className="pt-1 space-y-2 border-t border-slate-100 mt-1">
          {!showInvite ? (
            <button
              onClick={() => setShowInvite(true)}
              className="w-full py-2 rounded-xl bg-slate-50 border border-slate-100 text-[10px] font-semibold uppercase tracking-wider text-slate-500 hover:bg-slate-100 transition-colors"
            >
              Invite Member
            </button>
          ) : (
            <InviteMemberModal
              vaultId={vault.id}
              onClose={() => setShowInvite(false)}
              onSent={() => setShowInvite(false)}
            />
          )}
          <PendingConfirmations
            vaultId={vault.id}
            onChainVaultId={vault.onChainVaultId}
            ownerPubkey={vault.ownerPubkey}
            onConfirmed={onChanged}
          />
          {vault.status === 'GoalReached' && (
            <div className="pt-1">
              {distributeError && <p className="text-[10px] text-rose-500 pb-1.5">{distributeError}</p>}
              <button
                onClick={runDistribute}
                disabled={distributing}
                className="w-full py-2.5 rounded-xl bg-emerald-500 text-white text-[11px] font-semibold uppercase tracking-wider disabled:opacity-50"
              >
                {distributing ? 'Distributing…' : 'Distribute to Members'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ---------- MANAGE SECTION ---------- */}
      {showManage && (
        <div className="pt-1 border-t border-slate-100 mt-1">
          <div className="mt-3">
            <VaultManagePanel
              vault={vault}
              isOwned={isOwned}
              isMemberOnly={isMemberOnly}
              publicKey={publicKey}
              onChanged={onChanged}
            />
          </div>
        </div>
      )}
      </div>
    </div>
  );
}