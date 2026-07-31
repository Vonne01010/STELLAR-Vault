'use client';

import React from 'react';
import { type HistoryEntry } from '@/lib/history';
import { RefreshIcon } from '@/app/icons';

interface HistoryProps {
  history: HistoryEntry[];
  loading: boolean;
  onRefresh: () => void;
  onSelectEntry?: (entry: HistoryEntry) => void;
}

function entryVisual(kind: string) {
  switch (kind) {
    case 'withdraw':
      return { bg: 'bg-[#FFEFE6]', fg: 'text-[#FF5E00]', icon: '↑' };
    case 'send':
      return { bg: 'bg-[#E3FCFC]', fg: 'text-[#00A3A3]', icon: '➤' };
    case 'vault_create':
      return { bg: 'bg-[#F3E8FF]', fg: 'text-[#9333EA]', icon: '✦' };
    default:
      return { bg: 'bg-[#E6FBF3]', fg: 'text-[#10B981]', icon: '↓' };
  }
}

function HistorySkeletonRow() {
  return (
    <div className="p-6 rounded-3xl bg-white border border-slate-200/60 shadow-md shadow-slate-900/5 flex items-center gap-4 animate-pulse">
      <div className="w-10 h-10 rounded-full bg-slate-100 shrink-0" />
      <div className="flex-1 min-w-0 space-y-2">
        <div className="h-3 w-2/5 rounded-full bg-slate-100" />
        <div className="h-2.5 w-3/5 rounded-full bg-slate-100" />
      </div>
      <div className="shrink-0 space-y-2">
        <div className="h-3 w-12 rounded-full bg-slate-100 ml-auto" />
        <div className="h-2.5 w-16 rounded-full bg-slate-100 ml-auto" />
      </div>
    </div>
  );
}

export default function History({ history, loading, onRefresh, onSelectEntry }: HistoryProps) {
  const getIconColorClass = () => {
    if (loading) return 'text-cyan-500 animate-spin';
    if (history.length === 0) return 'text-orange-500';
    return 'text-slate-400';
  };

  return (
    <div className="px-6 py-2 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-xl font-semibold text-[#FF5E00] tracking-tight">History</h3>
        <button 
          onClick={onRefresh} 
          disabled={loading} 
          className="p-2 rounded-full hover:bg-slate-100 transition-colors disabled:opacity-50 cursor-pointer flex items-center justify-center"
          aria-label="Sync Data"
        >
          <RefreshIcon className={`w-5 h-5 transition-colors ${getIconColorClass()}`} />
        </button>
      </div>
      
      <div className="space-y-3 max-h-130 overflow-y-auto pr-1">
        {loading && history.length === 0 ? (
          Array.from({ length: 4 }).map((_, i) => <HistorySkeletonRow key={i} />)
        ) : history.length === 0 ? (
          <p className="p-6 rounded-3xl bg-white border border-slate-200/60 text-xs font-normal text-slate-400 text-center shadow-md shadow-slate-900/5">
            No localized network block events recorded on this public key.
          </p>
        ) : (
          <div className={`space-y-3 transition-opacity duration-300 ${loading ? 'opacity-50 pointer-events-none' : ''}`}>
          {history.map((entry) => {
            const v = entryVisual(entry.kind);
            const isClickable = Boolean(onSelectEntry);
            const handleClick = () => {
              if (isClickable) {
                onSelectEntry?.(entry);
              }
            };

            return (
              <button
                key={entry.id}
                type="button"
                onClick={handleClick}
                onPointerDown={(event) => event.stopPropagation()}
                onPointerUp={(event) => event.stopPropagation()}
                onMouseDown={(event) => event.stopPropagation()}
                onTouchStart={(event) => event.stopPropagation()}
                className={`w-full p-6 rounded-3xl bg-white border border-slate-200/60 shadow-md shadow-slate-900/5 flex items-center gap-4 text-left ${
                  isClickable ? 'cursor-pointer hover:border-slate-300 transition-colors' : 'cursor-default'
                }`}
              >
                <div className={`w-10 h-10 rounded-full ${v.bg} ${v.fg} flex items-center justify-center shrink-0 font-bold shadow-inner text-sm`}>
                  {v.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-xs text-slate-800 truncate">{entry.title}</h4>
                  <p className="text-[11px] text-slate-400 truncate mt-0.5 font-normal">{entry.description}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xs font-semibold text-slate-800">{entry.amount.toFixed(2)}</span>
                  <p className="text-[10px] text-slate-400 mt-0.5 font-normal">
                    {new Date(entry.timestamp).toLocaleDateString()}{' '}
                    {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </button>
            );
          })}
          </div>
        )}
      </div>
    </div>
  );
}