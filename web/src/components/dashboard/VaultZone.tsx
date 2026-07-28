'use client';

import React from 'react';
import Image from 'next/image';
import VaultCore from '@/components/dashboard/VaultCore';
import BalanceCard from '@/components/dashboard/BalanceCard';
import { DepositIcon, WithdrawIcon, CreateIcon } from '@/app/icons';
import type { Panel } from '@/lib/dashboardTypes';

interface VaultZoneProps {
  loading: boolean;
  showBalance: boolean;
  onToggleBalance: () => void;
  totalEquivalentInPhp: number;
  walletUsdcBalance: number;
  panel: Panel;
  setPanel: (panel: Panel) => void;
  goalProgress: number;
  vaultLevel: number;
  vaultName?: string;
  targetLabel?: string;
  members?: { id: string; initial: string; color?: string }[];
  onViewVaultDetails?: () => void;
  /** Swipe the balance card left to jump to the Wallet zone. */
  onSwipeToWallet?: () => void;
}

function ChevronLeftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
  );
}

const PANEL_LABEL: Record<string, string> = {
  deposit: 'Deposit',
  withdraw: 'Withdraw',
  create: 'Create Vault',
};

const PANEL_DESCRIPTION: Record<string, string> = {
  deposit: 'Add USDC into this vault',
  withdraw: 'Pull USDC back out of this vault',
  create: 'Set up a new personal or collaborative vault',
};

export default function VaultZone({
  loading,
  showBalance,
  onToggleBalance,
  totalEquivalentInPhp,
  walletUsdcBalance,
  panel,
  setPanel,
  goalProgress,
  vaultLevel,
  vaultName,
  targetLabel,
  members,
  onViewVaultDetails,
  onSwipeToWallet,
}: VaultZoneProps) {
  const isPanelOpen = panel === 'deposit' || panel === 'withdraw' || panel === 'create';

  return (
    <div className="mx-6 mt-6 space-y-5">
      {isPanelOpen ? (
        // Compact header while a panel is open — mirrors WalletZone's treatment
        // so opening a form doesn't require scrolling past the full hero + grid.
        <div className="flex items-start gap-3 px-1 animate-fadeIn">
          <button
            onClick={() => setPanel(null)}
            aria-label="Back to vault"
            className="w-9 h-9 rounded-full bg-white border border-slate-100 shadow-sm flex items-center justify-center text-slate-500 hover:text-slate-700 transition-colors shrink-0 mt-0.5"
          >
            <ChevronLeftIcon className="w-4 h-4" />
          </button>
          <span className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 bg-orange-50 text-[#FF9F1C]">
            {panel === 'deposit' && <DepositIcon className="w-4 h-4" />}
            {panel === 'withdraw' && <WithdrawIcon className="w-4 h-4" />}
            {panel === 'create' && <CreateIcon className="w-4 h-4" />}
          </span>
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-slate-800 leading-tight">
              {panel ? PANEL_LABEL[panel] : ''}
            </h2>
            <p className="text-[11px] text-slate-400 leading-snug mt-0.5">
              {panel ? PANEL_DESCRIPTION[panel] : ''}
            </p>
          </div>
          <span className="ml-auto text-[11px] text-slate-400 font-medium shrink-0 mt-1">
            {showBalance ? `${walletUsdcBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDC` : '•••••• USDC'}
          </span>
        </div>
      ) : (
        <>
          <BalanceCard
            zone="vault"
            loading={loading}
            showBalance={showBalance}
            onToggleBalance={onToggleBalance}
            totalEquivalentInPhp={totalEquivalentInPhp}
            walletUsdcBalance={walletUsdcBalance}
            onSwipeToWallet={onSwipeToWallet}
            label="Total Balance"
            artwork={
              <Image
                src="/safeIcon.png"
                alt=""
                aria-hidden="true"
                width={176}
                height={176}
                className="absolute right-6 top-1/2 -translate-y-1/2 w-40 h-40 object-contain pointer-events-none select-none"
              />
            }
          />

          <div className="grid grid-cols-3 gap-4 px-2">
            {([
              { key: 'deposit' as Panel, label: 'Deposit', Icon: DepositIcon },
              { key: 'withdraw' as Panel, label: 'Withdraw', Icon: WithdrawIcon },
              { key: 'create' as Panel, label: 'Create Vault', Icon: CreateIcon },
            ]).map(({ key, label, Icon }) => {
              const isActive = panel === key;
              return (
                <button
                  key={key}
                  onClick={() => setPanel(isActive ? null : key)}
                  className="flex flex-col items-center gap-2 group"
                >
                  <span
                    className={`flex items-center justify-center w-14 h-14 rounded-full border transition-all duration-200 active:scale-90 group-hover:scale-[1.05] ${
                      isActive
                        ? 'bg-linear-to-b from-white to-orange-50/70 border-[#FF9F1C] text-[#FF9F1C] shadow-[0_6px_18px_-6px_rgba(255,159,28,0.55)] ring-4 ring-orange-100/70'
                        : 'bg-linear-to-b from-white to-slate-50 border-slate-200 text-slate-500 shadow-[0_3px_10px_-4px_rgba(15,23,42,0.15)] group-hover:border-orange-200 group-hover:text-[#FF9F1C]'
                    }`}
                  >
                    <Icon className="w-5.5 h-5.5" />
                  </span>
                  <span className={`text-[10px] tracking-wider uppercase font-semibold px-2.5 py-1 rounded-full transition-colors ${
                    isActive ? 'text-orange-700 bg-orange-50 border border-orange-200' : 'text-slate-500'
                  }`}>
                    {label}
                  </span>
                </button>
              );
            })}
          </div>
        </>
      )}

      {!isPanelOpen && (
        <div className="mt-8 mb-6 flex flex-col items-center animate-fadeIn">
          <VaultCore
            goalProgress={goalProgress}
            vaultLevel={vaultLevel}
            vaultName={vaultName}
            targetLabel={targetLabel}
            members={members}
            onViewDetails={onViewVaultDetails}
          />
        </div>
      )}
    </div>
  );
}