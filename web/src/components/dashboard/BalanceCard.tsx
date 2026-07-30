'use client';

import React, { useState } from 'react';
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
          from { transform: translate3d(0, 0, 0); }
          to { transform: translate3d(-50%, 0, 0); }
        }
        @keyframes wave-slide-front {
          from { transform: translate3d(0, 0, 0); }
          to { transform: translate3d(-50%, 0, 0); }
        }
        .wave-layer-back {
          animation: wave-slide-back 9s linear infinite;
          will-change: transform;
        }
        .wave-layer-front {
          animation: wave-slide-front 5.5s linear infinite reverse;
          will-change: transform;
        }
      `}</style>
    </div>
  );
}

/** Diagonal light sheen across the top of the card — static, subtle, non-animated. */
function Glare() {
  return (
    <div
      className="absolute inset-0 pointer-events-none select-none"
      style={{
        background:
          'linear-gradient(115deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.06) 22%, rgba(255,255,255,0) 40%)',
      }}
    />
  );
}

/** Diagonal light band that sweeps across the card on hover or touch, via background-position
 *  on a full-bleed gradient so there's no hard rectangular edge to the moving band. */
function Shine({ active }: { active: boolean }) {
  return (
    <div
      className="absolute inset-0 pointer-events-none select-none transition-[background-position] duration-1600 ease-out"
      style={{
        backgroundImage:
          'linear-gradient(115deg, transparent 0%, transparent 40%, rgba(255,255,255,0.32) 50%, transparent 60%, transparent 100%)',
        backgroundSize: '300% 300%',
        backgroundPosition: active ? '-50% 0%' : '150% 0%',
      }}
    />
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
  const swipeTransform = `translate3d(${dragX}px, 0, 0)`;
  const opacity = exiting ? 0 : 1 - Math.min(0.2, Math.abs(dragX) / 800);

  const [shining, setShining] = useState(false);

  const callBoth = (fn: unknown, extra: () => void) => (event: unknown) => {
    if (typeof fn === 'function') fn(event);
    extra();
  };

  return (
    <div
      {...swipeProps}
      onMouseEnter={() => setShining(true)}
      onMouseLeave={() => setShining(false)}
      onTouchStart={callBoth(swipeProps?.onTouchStart, () => setShining(true))}
      onTouchEnd={callBoth(swipeProps?.onTouchEnd, () => setShining(false))}
      onTouchCancel={callBoth(swipeProps?.onTouchCancel, () => setShining(false))}
      className={`p-6 rounded-3xl text-white relative overflow-hidden animate-fadeIn touch-none ${gradientClassName} ${shadowClassName}`}
      style={{
        transform: swipeTransform,
        transition: dragging
          ? 'none'
          : 'transform 300ms cubic-bezier(0.2, 0.8, 0.2, 1), opacity 300ms ease',
        opacity,
        willChange: 'transform, opacity',
      }}
    >
      <Glare />
      <Shine active={shining} />
      <WaveAnimation />

      <div className="relative z-10">
        <div className="flex items-center justify-between">
          <span className="text-[11px] tracking-[0.14em] uppercase font-semibold text-white/80">{label}</span>
          <button
            onClick={onToggleBalance}
            className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors shrink-0"
            aria-label="Toggle balance visibility"
          >
            <EyeIcon className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex items-baseline gap-1.5 mt-4">
          <span className="text-lg font-semibold text-white/85">₱</span>
          {loading ? (
            <h1 className="text-xl font-light text-white/60">Loading…</h1>
          ) : (
            <h1 className="text-[2.6rem] font-semibold tracking-tight leading-none">
              {showBalance ? phpAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '••••••'}
            </h1>
          )}
        </div>

        <span className="text-xs font-medium tracking-wide text-white/80 flex items-center gap-1.5 pt-2">
          {showBalance ? `≈ ${usdcAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDC` : '•••••• USDC'}
        </span>
      </div>
    </div>
  );
}