'use client';

import React from 'react';
import type { Tab } from '@/lib/dashboardTypes';
import { useSwipeX } from '@/lib/useSwipeX';

export type AppTab = Tab | 'tracker';

/** currentColor-based glyphs so the active tab's orange color can be set by the wrapper. */
function NavGlyph({ type }: { type: Tab }) {
  if (type === 'home') {
    return (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
        <polyline points="9 22 9 12 15 12 15 22"></polyline>
      </svg>
    );
  }
  if (type === 'activity') {
    return (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10"></circle>
        <polyline points="12 6 12 12 16 14"></polyline>
      </svg>
    );
  }
  if (type === 'vaults') {
    return (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <rect x="4" y="10" width="16" height="12" rx="2"></rect>
        <path d="M7 10V7a5 5 0 0 1 10 0v3"></path>
      </svg>
    );
  }
  // profile
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <circle cx="12" cy="7" r="4"></circle>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
    </svg>
  );
}

const TAB_LABELS: Record<Tab, string> = {
  home: 'Home',
  vaults: 'Vaults',
  activity: 'Activity',
  profile: 'Profile',
};

interface NavBarProps {
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
  /** Which home sub-zone is active, so the Home icon can reflect it (orange = vault, cyan = wallet). */
  homeZone?: 'vault' | 'wallet';
}

export default function NavBar({ activeTab, onTabChange, homeZone = 'vault' }: NavBarProps) {
  const tabs: AppTab[] = ['home', 'vaults', 'activity', 'profile'];

  const changeTab = (direction: 1 | -1) => {
    const idx = tabs.indexOf(activeTab);
    const next = idx + direction;
    if (next >= 0 && next < tabs.length) onTabChange(tabs[next]);
  };
  const swipeHandlers = useSwipeX(() => changeTab(1), () => changeTab(-1));

  return (
    <div
      {...swipeHandlers}
      className="absolute bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-slate-100 px-4 pt-3 pb-7 flex justify-between items-end z-40 touch-pan-y"
    >
      {tabs.map((tab) => {
        const isSelected = activeTab === tab;
        const isCyan = isSelected && tab === 'home' && homeZone === 'wallet';

        return (
          <button
            key={tab}
            onClick={() => onTabChange(tab)}
            className="flex-1 flex flex-col items-center justify-end gap-1"
          >
            <span
              className={`flex items-center justify-center transition-all ${
                isSelected
                  ? `w-11 h-11 rounded-full -mt-5 shadow-lg text-white ${isCyan ? 'bg-cyan-500 shadow-cyan-500/30' : 'bg-[#FF9F1C] shadow-[#FF9F1C]/30'}`
                  : 'w-9 h-9 rounded-full text-slate-400'
              }`}
            >
              <NavGlyph type={tab as Tab} />
            </span>
            <span
              className={`text-[10px] font-medium tracking-wide ${
                isSelected ? (isCyan ? 'text-cyan-500' : 'text-[#FF9F1C]') : 'text-slate-400'
              }`}
            >
              {TAB_LABELS[tab as Tab]}
            </span>
          </button>
        );
      })}
    </div>
  );
}