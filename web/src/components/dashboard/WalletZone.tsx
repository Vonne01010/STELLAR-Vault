'use client';

import React from 'react';
import { SendIcon, ReceiveIcon } from '@/app/icons';
import type { Panel } from '@/lib/dashboardTypes';
import type { HistoryEntry } from '@/lib/history';
import { useSwipeX } from '@/lib/useSwipeX';
import BalanceCard from './BalanceCard';

interface WalletZoneProps {
  loading: boolean;
  showBalance: boolean;
  onToggleBalance: () => void;
  totalEquivalentInPhp: number;
  walletUsdcBalance: number;
  panel: Panel;
  setPanel: (panel: Panel) => void;
  history: HistoryEntry[];
  onSeeAllActivity: () => void;
  /** Swipe the balance card right to jump back to the Vault zone. */
  onSwipeToVault?: () => void;
}

function ChevronLeftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
  );
}

export default function WalletZone({
  loading,
  showBalance,
  onToggleBalance,
  totalEquivalentInPhp,
  walletUsdcBalance,
  panel,
  setPanel,
  history,
  onSeeAllActivity,
  onSwipeToVault,
}: WalletZoneProps) {
  const isPanelOpen = panel === 'send' || panel === 'receive';
  const swipeHandlers = useSwipeX(undefined, onSwipeToVault);

  return (
    <div className="mx-6 mt-6 space-y-5">
      {isPanelOpen ? (
        // Compact header while a panel is open — no need to scroll past the
        // full hero card and action grid to reach the form underneath.
        <div className="flex items-start gap-3 px-1 animate-fadeIn">
          <button
            onClick={() => setPanel(null)}
            aria-label="Back to wallet"
            className="w-9 h-9 rounded-full bg-white border border-slate-100 shadow-sm flex items-center justify-center text-slate-500 hover:text-slate-700 transition-colors shrink-0 mt-0.5"
          >
            <ChevronLeftIcon className="w-4 h-4" />
          </button>
          <span
            className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
              panel === 'send' ? 'bg-amber-50 text-[#FF9F1C]' : 'bg-cyan-50 text-cyan-500'
            }`}
          >
            {panel === 'send' ? <SendIcon className="w-4 h-4" /> : <ReceiveIcon className="w-4 h-4" />}
          </span>
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-slate-800 leading-tight">
              {panel === 'send' ? 'Send' : 'Receive'}
            </h2>
            <p className="text-[11px] text-slate-400 leading-snug mt-0.5">
              {panel === 'send'
                ? 'Transfer USDC to another wallet address'
                : 'Share your address or QR code to get paid'}
            </p>
          </div>
          <span className="ml-auto text-[11px] text-slate-400 font-medium shrink-0 mt-1">
            {showBalance ? `${walletUsdcBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDC` : '•••••• USDC'}
          </span>
        </div>
      ) : (
        <>
          <BalanceCard
            label="Spendable Balance"
            loading={loading}
            showBalance={showBalance}
            onToggleBalance={onToggleBalance}
            phpAmount={totalEquivalentInPhp}
            usdcAmount={walletUsdcBalance}
            gradientClassName="bg-linear-to-br from-cyan-400 via-cyan-500 to-blue-600"
            shadowClassName="shadow-[0_18px_30px_-14px_rgba(8,145,178,0.40)]"
            swipeProps={swipeHandlers}
          />

          <div className="grid grid-cols-2 gap-4 px-2">
            {([
              { key: 'send' as Panel, label: 'Send', Icon: SendIcon },
              { key: 'receive' as Panel, label: 'Receive', Icon: ReceiveIcon },
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
                        ? 'bg-linear-to-b from-white to-cyan-50/70 border-cyan-400 text-cyan-500 shadow-[0_6px_18px_-6px_rgba(34,211,238,0.55)] ring-4 ring-cyan-100/70'
                        : 'bg-linear-to-b from-white to-slate-50 border-slate-200 text-slate-500 shadow-[0_3px_10px_-4px_rgba(15,23,42,0.15)] group-hover:border-cyan-200 group-hover:text-cyan-500'
                    }`}
                  >
                    <Icon className="w-5.5 h-5.5" />
                  </span>
                  <span className={`text-[10px] tracking-wider uppercase font-semibold px-2.5 py-1 rounded-full transition-colors ${
                    isActive ? 'text-cyan-700 bg-cyan-50 border border-cyan-200' : 'text-slate-500'
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
        <div className="animate-fadeIn">
          <div className="flex items-center justify-between px-1 mb-2">
            <h3 className="text-sm font-semibold text-slate-700">Recent activity</h3>
            <button
              onClick={onSeeAllActivity}
              className="text-[11px] font-semibold text-cyan-600"
            >
              See all
            </button>
          </div>
          <div className="space-y-2">
            {history.length === 0 ? (
              <p className="p-4 rounded-2xl bg-white border border-slate-100 text-xs text-slate-400 text-center">
                No recent activity yet.
              </p>
            ) : (
              history.slice(0, 3).map((entry) => {
                const isCredit = entry.amount >= 0;
                return (
                  <div
                    key={entry.id}
                    className="p-3.5 rounded-2xl bg-white border border-slate-100 shadow-[0_2px_8px_-4px_rgba(15,23,42,0.06)] flex items-center gap-3"
                  >
                    <span
                      className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center ${
                        isCredit ? 'bg-cyan-50 text-cyan-500' : 'bg-amber-50 text-[#FF9F1C]'
                      }`}
                    >
                      {isCredit ? <ReceiveIcon className="w-4 h-4" /> : <SendIcon className="w-4 h-4" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-slate-800 truncate">{entry.title}</p>
                      <p className="text-[10px] text-slate-400 truncate mt-0.5">{entry.description}</p>
                    </div>
                    <span className={`text-xs font-semibold shrink-0 ${isCredit ? 'text-cyan-600' : 'text-slate-800'}`}>
                      {isCredit ? '+' : ''}{entry.amount.toFixed(2)}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}