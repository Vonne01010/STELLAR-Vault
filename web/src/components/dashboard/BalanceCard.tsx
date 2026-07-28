'use client';

import React from 'react';
import { EyeIcon } from '@/app/icons';

interface BalanceCardProps {
  label: string;
  loading: boolean;
  showBalance: boolean;
  onToggleBalance: () => void;
  phpAmount: number;
  usdcAmount: number;
  /** Tailwind gradient + text color classes for the card background. */
  gradientClassName: string;
  /** Tailwind shadow classes, kept separate since each zone uses a differently-tinted shadow. */
  shadowClassName?: string;
  /** Spread onto the card root — used to attach swipe/drag handlers for zone switching. */
  swipeProps?: Record<string, unknown>;
}

/** Two offset, differently-timed wave layers create a subtle water motion
 *  along the card's base instead of a static decorative icon. */
function WaveAnimation() {
  return (
    <div className="absolute inset-x-0 bottom-0 h-24 overflow-hidden pointer-events-none select-none">
      <svg
        className="absolute bottom-0 left-0 w-[200%] h-full wave-layer-back"
        viewBox="0 0 1200 120"
        preserveAspectRatio="none"
      >
        <path
          d="M0,50 C150,90 350,10 600,50 C850,90 1050,10 1200,50 L1200,120 L0,120 Z"
          fill="rgba(255,255,255,0.10)"
        />
      </svg>
      <svg
        className="absolute bottom-0 left-0 w-[200%] h-full wave-layer-front"
        viewBox="0 0 1200 120"
        preserveAspectRatio="none"
      >
        <path
          d="M0,65 C200,25 400,95 600,65 C800,35 1000,95 1200,65 L1200,120 L0,120 Z"
          fill="rgba(255,255,255,0.16)"
        />
      </svg>
      <style jsx>{`
        @keyframes wave-slide-back {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        @keyframes wave-slide-front {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        .wave-layer-back {
          animation: wave-slide-back 9s linear infinite;
        }
        .wave-layer-front {
          animation: wave-slide-front 5.5s linear infinite reverse;
        }
      `}</style>
    </div>
  );
}

export default function BalanceCard({
  label,
  loading,
  showBalance,
  onToggleBalance,
  phpAmount,
  usdcAmount,
  gradientClassName,
  shadowClassName = '',
  swipeProps,
}: BalanceCardProps) {
  return (
    <div
      {...swipeProps}
      className={`p-6 rounded-3xl text-white relative overflow-hidden animate-fadeIn touch-pan-y ${gradientClassName} ${shadowClassName}`}
    >
      <WaveAnimation />

      <div className="space-y-2 relative z-10">
        <div className="flex items-center justify-between">
          <span className="text-[11px] tracking-[0.14em] uppercase font-semibold text-white/80">{label}</span>
        </div>

        <div className="flex items-baseline gap-1.5 mt-3">
          <span className="text-lg font-semibold text-white/85">₱</span>
          {loading ? (
            <h1 className="text-xl font-light text-white/60">Loading…</h1>
          ) : (
            <h1 className="text-[2.6rem] font-semibold tracking-tight leading-none">
              {showBalance ? phpAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '••••••'}
            </h1>
          )}
          <button
            onClick={onToggleBalance}
            className="w-6 h-6 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors shrink-0 self-center"
            aria-label="Toggle balance visibility"
          >
            <EyeIcon className="w-3.5 h-3.5" />
          </button>
        </div>

        <span className="text-xs font-medium tracking-wide text-white/80 flex items-center gap-1.5 pt-1">
          {showBalance ? `≈ ${usdcAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDC` : '•••••• USDC'}
        </span>
      </div>
    </div>
  );
}