'use client';

import React from 'react';
import type { Tab } from '@/lib/dashboardTypes';
import { useSwipeX } from '@/lib/useSwipeX';
import { CreateIcon } from '@/app/icons'

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
        <CreateIcon />
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
      className="absolute bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-slate-100 px-4 pt-3 pb-7 flex justify-between items-center z-40 touch-pan-y"
    >
      {tabs.map((tab) => {
        const isSelected = activeTab === tab;
        const isCyan = isSelected && tab === 'home' && homeZone === 'wallet';

        return (
          <button
            key={tab}
            onClick={() => onTabChange(tab)}
            className="flex-1 flex items-center justify-center"
          >
            <span
              className={`p-2 rounded-full transition-colors flex items-center justify-center ${
                isSelected
                  ? `bg-slate-100 ${isCyan ? 'text-cyan-500' : 'text-[#FF9F1C]'}`
                  : 'text-slate-400 hover:bg-slate-50'
              }`}
            > 
                <NavGlyph type={tab as Tab} />
            </span>
          </button>
        );
      })}
    </div>
  );
}