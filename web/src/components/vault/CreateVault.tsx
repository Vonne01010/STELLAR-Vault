'use client';

import { useState } from 'react';
import { buildCreateVaultXDR } from '@/lib/contract';
import { submitSignedXDR, pollTransactionForResult } from '@/lib/payment';
import { CONTRACT_ID } from '@/lib/stellar';
import { authFetch, signWithCurrentAccount, walletService } from '@/lib/wallet';
import { createAppNotification } from '@/lib/notifications';
import { recordHistoryEntry } from '@/lib/history';

type Status = 'idle' | 'building' | 'signing' | 'submitting' | 'confirming' | 'saving' | 'success' | 'error';

const STATUS_LABEL: Record<Status, string> = {
  idle: 'Create Vault',
  building: 'Preparing your vault…',
  signing: 'Waiting for your signature…',
  submitting: 'Sending to the blockchain…',
  confirming: 'Almost there…',
  saving: 'Saving the details…',
  success: 'Vault created! 🎉',
  error: 'Create Vault',
};

const STEPS: { key: Status; label: string }[] = [
  { key: 'building', label: 'Prepare' },
  { key: 'signing', label: 'Sign' },
  { key: 'submitting', label: 'Send' },
  { key: 'confirming', label: 'Confirm' },
  { key: 'saving', label: 'Save' },
];

const SESSION_KEY_MISSING_MESSAGE = 'Your session key is unavailable. Please unlock your account again.';

/** Same two-layer wave motif used on BalanceCard, reused here so the create-vault
 *  preview reads as part of the same visual family as the balance hero cards. */
function WaveAnimation() {
  return (
    <div className="absolute inset-x-0 bottom-0 h-20 overflow-hidden pointer-events-none select-none">
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

function PersonalIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <circle cx="12" cy="8" r="4" />
      <path strokeLinecap="round" d="M4 20c0-3.5 3.5-6 8-6s8 2.5 8 6" />
    </svg>
  );
}

function CollaborativeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <circle cx="8" cy="9" r="3" />
      <circle cx="16" cy="9" r="3" />
      <path strokeLinecap="round" d="M2 20c0-3 2.7-5 6-5s6 2 6 5M10 20c0-3 2.7-5 6-5s6 2 6 5" />
    </svg>
  );
}

export default function CreateVault({
  publicKey,
  onCreated,
  onClose,
}: {
  publicKey: string;
  onCreated: (vaultId: string) => void;
  onClose?: () => void;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [goalType, setGoalType] = useState('Emergency Fund');
  const [vaultType, setVaultType] = useState<'Personal' | 'Collaborative'>('Personal');
  const [targetAmount, setTargetAmount] = useState('500');
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState('');

  const [needsPin, setNeedsPin] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [unlocking, setUnlocking] = useState(false);

  const busy = !['idle', 'success', 'error'].includes(status);

  const runCreateVault = async () => {
    setStatus('building');
    setError('');
    try {
      const xdr = await buildCreateVaultXDR({
        creator: publicKey,
        purpose: name.trim(),
        vaultType,
        goalAmount: Number(targetAmount),
      });

      setStatus('signing');
      const signedXdr = await signWithCurrentAccount(xdr);

      setStatus('submitting');
      const hash = await submitSignedXDR(signedXdr);

      setStatus('confirming');
      const onChainVaultId = await pollTransactionForResult(hash);
       if (onChainVaultId === undefined || onChainVaultId === null) {
        throw new Error('Vault was created on-chain, but no vault ID was returned.');
      }

      setStatus('saving');
      const res = await authFetch('/api/vaults', {
        method: 'POST',
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
          goalType,
          targetAmount: Number(targetAmount),
          contractAddress: CONTRACT_ID,
          onChainVaultId: String(onChainVaultId),
          vaultType,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error ?? 'Vault created on-chain, but saving to the backend failed.');
      }

      setStatus('success');
      onClose?.();
      recordHistoryEntry({
        account: publicKey,
        kind: 'vault_create',
        title: 'Vault created',
        description: `Created ${vaultType.toLowerCase()} vault "${name.trim()}"${targetAmount ? ` with a goal of ${Number(targetAmount).toFixed(2)} USDC` : ''}`,
        amount: Number(targetAmount) || 0,
        asset: 'USDC',
        counterparty: 'vault',
        timestamp: new Date().toISOString(),
        source: 'local',
        hash,
        status: 'confirmed',
      });
      onCreated(data.id);

    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Vault creation failed';

      if (message === SESSION_KEY_MISSING_MESSAGE) {
        setNeedsPin(true);
        setStatus('idle');
        return;
      }

      await createAppNotification({
        message: `Vault creation failed: ${message}`,
        variant: 'error',
        meta: { event: 'transaction_failed', operation: 'create_vault', error: message, timestamp: new Date().toISOString() },
      }).catch(() => undefined);
      setError(message);
      setStatus('error');
    }
  };

  const handleUnlockAndRetry = async () => {
    setUnlocking(true);
    setPinError('');
    try {
      await walletService.unlockPinAccount(pinInput);
      setNeedsPin(false);
      setPinInput('');
      await runCreateVault();
    } catch (e: unknown) {
      setPinError(e instanceof Error ? e.message : 'Incorrect PIN');
    } finally {
      setUnlocking(false);
    }
  };

  return (
    <div className="bg-white p-5 text-[#1A1A1A] font-mono tracking-tight space-y-4 animate-fadeIn">
      {/* Live preview hero — mirrors BalanceCard's wave motif so vault creation
          feels like part of the same visual family as the balance cards. */}
      <div
        className={`p-5 rounded-3xl text-white relative overflow-hidden transition-colors duration-300 ${
          vaultType === 'Collaborative'
            ? 'bg-linear-to-br from-cyan-400 via-cyan-500 to-blue-600 shadow-[0_12px_20px_-14px_rgba(8,145,178,0.45)]'
            : 'bg-linear-to-br from-[#FFB238] via-[#FF9F1C] to-[#F37A00] shadow-[0_12px_20px_-14px_rgba(230,80,0,0.45)]'
        }`}
      >
        <SparkleIcon className="absolute top-4 right-5 w-3.5 h-3.5 text-white/70" />
        <SparkleIcon className="absolute top-10 right-14 w-2 h-2 text-white/40" />
        <SparkleIcon className="absolute bottom-14 right-8 w-2.5 h-2.5 text-white/50" />
        <WaveAnimation />
        <div className="relative z-10 space-y-1">
          <span className="text-[11px] tracking-[0.14em] uppercase font-semibold font-sans text-white/80">
            {vaultType} Vault
          </span>
          <h2 className="text-xl font-semibold tracking-tight leading-snug truncate">
            {name.trim() || 'Untitled vault'}
          </h2>
          <div className="flex items-baseline gap-1.5 pt-1">
            <span className="text-sm font-semibold text-white/85">Goal ₱</span>
            <span className="text-2xl font-semibold tracking-tight leading-none">
              {(Number(targetAmount) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-1">
        <label className="block text-[11px] uppercase tracking-wide text-slate-500 font-semibold font-sans">Vault Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Emergency Fund"
          disabled={busy}
          className="w-full rounded-xl bg-slate-50 border border-slate-100 px-3.5 py-2.5 text-xs text-slate-800 outline-none focus:border-[#A0F0F0] disabled:opacity-50 transition-colors placeholder:text-slate-300"
        />
      </div>

      <div className="space-y-1">
        <label className="block text-[11px] uppercase tracking-wide text-slate-500 font-semibold font-sans">Description (Optional)</label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description"
          disabled={busy}
          className="w-full rounded-xl bg-slate-50 border border-slate-100 px-3.5 py-2.5 text-xs text-slate-800 outline-none focus:border-[#A0F0F0] disabled:opacity-50 transition-colors placeholder:text-slate-300"
        />
      </div>

      <div className="space-y-1.5">
        <label className="block text-[11px] uppercase tracking-wide text-slate-500 font-semibold font-sans">Vault Type</label>
        <div className="grid grid-cols-2 gap-2">
          {([
            { key: 'Personal' as const, Icon: PersonalIcon, desc: 'Just for you' },
            { key: 'Collaborative' as const, Icon: CollaborativeIcon, desc: 'Save with others' },
          ]).map(({ key, Icon, desc }) => {
            const isActive = vaultType === key;
            const isCyan = key === 'Collaborative';
            return (
              <button
                key={key}
                type="button"
                onClick={() => setVaultType(key)}
                disabled={busy}
                className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border transition-all disabled:opacity-50 ${
                  isActive
                    ? isCyan
                      ? 'bg-linear-to-b from-white to-cyan-50/70 border-cyan-400 text-cyan-500 shadow-[0_4px_14px_-6px_rgba(34,211,238,0.5)] ring-2 ring-cyan-100'
                      : 'bg-linear-to-b from-white to-orange-50/70 border-[#FF9F1C] text-[#FF9F1C] shadow-[0_4px_14px_-6px_rgba(255,159,28,0.5)] ring-2 ring-orange-100'
                    : 'bg-slate-50 border-slate-100 text-slate-400 hover:border-slate-200'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className={`text-[10px] font-semibold font-sans uppercase tracking-wide ${
                  isActive ? (isCyan ? 'text-cyan-500' : 'text-[#FF9F1C]') : 'text-slate-500'
                }`}>
                  {key}
                </span>
                <span className="text-[9px] font-normal font-sans normal-case text-slate-400">{desc}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-1">
        <label className="block text-[11px] uppercase tracking-wide text-slate-500 font-semibold font-sans">Target Amount</label>
        <div className="relative flex items-center">
          <input
            type="number"
            value={targetAmount}
            onChange={(e) => setTargetAmount(e.target.value)}
            disabled={busy}
            className="w-full rounded-xl bg-slate-50 border border-slate-100 pl-3.5 pr-12 py-2.5 text-xs text-slate-800 outline-none focus:border-[#A0F0F0] disabled:opacity-50 transition-colors"
          />
          <span className="absolute right-3.5 text-[10px] text-slate-400">USDC</span>
        </div>
      </div>

      {!needsPin && (
        <div className="space-y-3">
          <button
            onClick={runCreateVault}
            disabled={busy || !name.trim() || Number(targetAmount) <= 0}
            className="w-full py-3 rounded-xl bg-linear-to-r from-[#FF9F1C] to-[#F37A00] text-white text-[10px] uppercase tracking-widest hover:opacity-95 transition-opacity disabled:opacity-40 flex items-center justify-center gap-2 font-normal"
          >
            {busy && (
              <svg className="animate-spin h-3 w-3 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            )}
            <span>{STATUS_LABEL[status]}</span>
          </button>

          {busy && (
            <div className="flex items-center gap-1.5 px-1 animate-fadeIn">
              {STEPS.map((step, i) => {
                const currentIndex = STEPS.findIndex((s) => s.key === status);
                const isDone = i < currentIndex;
                const isCurrent = i === currentIndex;
                return (
                  <div key={step.key} className="flex-1 flex flex-col items-center gap-1">
                    <div className="h-1 w-full rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className={`h-full rounded-full bg-linear-to-r from-[#FF9F1C] to-[#F37A00] transition-all duration-500 ${
                          isCurrent ? 'animate-pulse' : ''
                        }`}
                        style={{ width: isDone ? '100%' : isCurrent ? '60%' : '0%' }}
                      />
                    </div>
                    <span className={`text-[8px] uppercase tracking-wide font-sans font-semibold ${
                      isDone || isCurrent ? 'text-[#FF9F1C]' : 'text-slate-300'
                    }`}>
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {needsPin && (
        <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 space-y-3">
          <p className="text-[11px] uppercase tracking-wide text-slate-500 font-semibold font-sans">
            Enter PIN
          </p>
          <input
            type="password"
            inputMode="numeric"
            value={pinInput}
            onChange={(e) => setPinInput(e.target.value)}
            placeholder="••••"
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
              {unlocking ? 'Creating…' : 'Create Vault'}
            </button>
            <button
              onClick={() => { setNeedsPin(false); setPinInput(''); setPinError(''); }}
              disabled={unlocking}
              className="rounded-xl bg-slate-50 border border-slate-100 px-4 py-2.5 text-[10px] uppercase tracking-wide text-slate-400"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {status === 'success' && (
        <div className="p-3 text-[11px] text-emerald-600 font-light">
          <p>Vault created successfully.</p>
        </div>
      )}

      {error && (
        <div className="p-3 text-[11px] text-rose-500 font-light">
          <p>{error}</p>
        </div>
      )}
    </div>
  );
}