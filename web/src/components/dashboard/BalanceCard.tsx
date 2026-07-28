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
  /** Live horizontal drag offset while swiping. */
  dragX?: number;
  /** True while the pointer is actively dragging. */
  dragging?: boolean;
  /** True while the card is in its exit animation state. */
  exiting?: boolean;
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
  dragX = 0,
  dragging = false,
  exiting = false,
}: BalanceCardProps) {
  const peelRotation = Math.max(-10, Math.min(10, dragX / 22));
  const peelOffset = dragX;
  const peelScale = 1 - Math.min(0.12, Math.abs(dragX) / 900);
  const peelOpacity = exiting ? 0.2 : 1 - Math.min(0.25, Math.abs(dragX) / 700);
  const peelShadow = dragging ? '0 22px 30px -16px rgba(15, 23, 42, 0.35)' : '0 18px 30px -14px rgba(15, 23, 42, 0.25)';
  const swipeTransform = `translateX(${peelOffset}px) rotate(${peelRotation}deg) scale(${peelScale})`;

  return (
    <div
      {...swipeProps}
      className={`p-6 rounded-3xl text-white relative overflow-hidden animate-fadeIn touch-none ${gradientClassName} ${shadowClassName}`}
      style={{
        transform: swipeTransform,
        transition: dragging ? 'none' : 'transform 220ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow 220ms ease, opacity 220ms ease',
        opacity: peelOpacity,
        boxShadow: peelShadow,
        willChange: 'transform, opacity, box-shadow',
      }}
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