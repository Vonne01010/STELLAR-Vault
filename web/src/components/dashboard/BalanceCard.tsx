'use client';

import React, { useEffect, useState } from 'react';
import { EyeIcon } from '@/app/icons';
import { useSwipeXAnimated } from '@/lib/useSwipeXAnimated';

type Zone = 'vault' | 'wallet';

interface BalanceCardProps {
  zone: Zone;
  loading: boolean;
  showBalance: boolean;
  onToggleBalance: () => void;
  totalEquivalentInPhp: number;
  walletUsdcBalance: number;
  /** Fired when the card is swiped left. On the vault card this moves to the wallet. */
  onSwipeToWallet?: () => void;
  /** Fired when the card is swiped right. On the wallet card this moves back to the vault. */
  onSwipeToVault?: () => void;
  /** Override the default label ("Vault Balance" / "Spendable Balance"). */
  label?: string;
  /** Override the default decorative corner artwork. */
  artwork?: React.ReactNode;
}

const ZONE_STYLES: Record<Zone, { gradient: string; shadow: string; label: string; badge: string }> = {
  vault: {
    gradient: 'from-[#FFB238] via-[#FF9F1C] to-[#F37A00]',
    shadow: 'shadow-[0_18px_30px_-14px_rgba(230,80,0,0.40)]',
    label: 'Vault Balance',
    badge: 'bg-white/20',
  },
  wallet: {
    gradient: 'from-cyan-400 via-cyan-500 to-blue-600',
    shadow: 'shadow-[0_18px_30px_-14px_rgba(8,145,178,0.40)]',
    label: 'Spendable Balance',
    badge: 'bg-white/20',
  },
};

function VaultArtwork() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="absolute right-3 top-1/2 -translate-y-1/2 w-40 h-40 text-white/15 pointer-events-none select-none">
      <rect x="4" y="4" width="16" height="16" rx="3" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="12" cy="12" r="0.8" fill="currentColor" />
      <path d="M12 8v1.2M12 14.8V16M8 12h1.2M14.8 12H16" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function WalletArtwork() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="absolute right-3 top-1/2 -translate-y-1/2 w-40 h-40 text-white/15 pointer-events-none select-none">
      <rect x="2" y="6" width="20" height="14" rx="3" stroke="currentColor" strokeWidth="1.2" />
      <path d="M2 10h20" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="17" cy="15" r="1.6" fill="currentColor" />
      <path d="M6 6V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v1" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

export default function BalanceCard({
  zone,
  loading,
  showBalance,
  onToggleBalance,
  totalEquivalentInPhp,
  walletUsdcBalance,
  onSwipeToWallet,
  onSwipeToVault,
  label,
  artwork,
}: BalanceCardProps) {
  const style = ZONE_STYLES[zone];

  const { dragX, dragging, exiting, onPointerDown, onPointerMove, onPointerUp, onPointerCancel } = useSwipeXAnimated(
    zone === 'vault' ? onSwipeToWallet : undefined,
    zone === 'wallet' ? onSwipeToVault : undefined
  );

  // Gentle entrance: the card fades/rises in on mount, which also plays every
  // time the zone switches since VaultZone/WalletZone mount a fresh card.
  const [entered, setEntered] = useState(false);
  useEffect(() => {
    const raf = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  // How far through the swipe the drag currently is, used to fade in a directional glow.
  const dragProgress = Math.min(1, Math.abs(dragX) / 64);
  const rotation = dragX / 24;

  return (
    <div
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      className="relative touch-pan-y"
      style={{ perspective: 800 }}
    >
      {/* Directional glow underneath, hinting at the zone you're swiping toward */}
      <div
        className={`absolute inset-0 rounded-3xl bg-linear-to-br ${ZONE_STYLES[zone === 'vault' ? 'wallet' : 'vault'].gradient} pointer-events-none`}
        style={{
          opacity: dragX !== 0 ? dragProgress * 0.5 : 0,
          transform: `scale(${1 + dragProgress * 0.04})`,
          transition: dragging ? 'none' : 'opacity 0.25s ease, transform 0.25s ease',
        }}
      />

      <div
        className={`p-6 rounded-3xl bg-linear-to-br ${style.gradient} text-white relative overflow-hidden select-none ${style.shadow}`}
        style={{
          transform: `translateX(${dragX}px) rotate(${rotation}deg) translateY(${entered ? 0 : 12}px)`,
          opacity: entered ? (exiting ? Math.max(0, 1 - Math.abs(dragX) / 400) : 1) : 0,
          transition: dragging
            ? 'none'
            : exiting
            ? `transform ${220}ms cubic-bezier(0.32, 0.72, 0, 1), opacity ${220}ms ease`
            : 'transform 0.35s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.35s ease',
          cursor: dragging ? 'grabbing' : 'grab',
        }}
      >
        {artwork ?? (zone === 'vault' ? <VaultArtwork /> : <WalletArtwork />)}

        <div className="space-y-2 relative z-10">
          <div className="flex items-center justify-between">
            <span className="text-[11px] tracking-[0.14em] uppercase font-semibold text-white/80">{label ?? style.label}</span>
          </div>

          <div className="flex items-baseline gap-1.5 mt-3">
            <span className="text-lg font-semibold text-white/85">₱</span>
            {loading ? (
              <h1 className="text-xl font-light text-white/60">Loading…</h1>
            ) : (
              <h1 className="text-[2.6rem] font-semibold tracking-tight leading-none">
                {showBalance
                  ? totalEquivalentInPhp.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                  : '••••••'}
              </h1>
            )}
            <button
              onClick={onToggleBalance}
              className={`w-6 h-6 rounded-full ${style.badge} hover:bg-white/30 flex items-center justify-center transition-colors shrink-0 self-center`}
              aria-label="Toggle balance visibility"
            >
              <EyeIcon className="w-3.5 h-3.5" />
            </button>
          </div>

          <span className="text-xs font-medium tracking-wide text-white/80 flex items-center gap-1.5 pt-1">
            {showBalance
              ? `≈ ${walletUsdcBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDC`
              : '•••••• USDC'}
          </span>
        </div>
      </div>
    </div>
  );
}
