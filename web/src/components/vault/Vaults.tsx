'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { authFetch } from '@/lib/wallet';
import MyInvitations from '@/components/profile/MyInvitations';
import { RefreshIcon } from '@/app/icons';
import VaultCard from './VaultCard';
import type { VaultData, VaultsProps, VaultSubTab } from './types';

function VaultCardSkeleton() {
  return (
    <div className="p-4 rounded-2xl bg-slate-100 animate-pulse space-y-3">
      <div className="space-y-2">
        <div className="h-2.5 w-16 rounded-full bg-slate-200" />
        <div className="h-4 w-32 rounded-full bg-slate-200" />
      </div>
      <div className="space-y-1.5 pt-1">
        <div className="h-4 w-28 rounded-full bg-slate-200" />
        <div className="h-1 w-full rounded-full bg-slate-200" />
      </div>
    </div>
  );
}

export default function Vaults({
  publicKey,
  loading: parentLoading,
  onWalletChanged,
  focusVaultId,
  onFocusHandled,
  onFocusVaultNotFound
}: VaultsProps) {
  const [subTab, setSubTab] = useState<VaultSubTab>('owned');
  const [owned, setOwned] = useState<VaultData[]>([]);
  const [joined, setJoined] = useState<VaultData[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const refresh = useCallback(async () => {
    if (!publicKey) {
      setOwned([]);
      setJoined([]);
      setLoading(false);
      setHasLoadedOnce(true);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await authFetch('/api/vaults/mine');
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? 'Failed to load vaults');
      setOwned(data.owned ?? []);
      setJoined(data.joined ?? []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load vaults');
    } finally {
      setLoading(false);
      setHasLoadedOnce(true);
    }
  }, [publicKey]);

  const handleVaultChanged = useCallback(async () => {
    await refresh();
    if (onWalletChanged) {
      await onWalletChanged();
    }
  }, [refresh, onWalletChanged]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void refresh();
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [refresh]);

  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  useEffect(() => {
    if (!focusVaultId || (owned.length === 0 && joined.length === 0)) return;

    const inOwned = owned.some((v) => v.id === focusVaultId);
    const inJoined = joined.some((v) => v.id === focusVaultId);

    if (!inOwned && !inJoined) {
      onFocusVaultNotFound?.(); 
      onFocusHandled?.();
      return;
    }

    window.setTimeout(() => {
      setSubTab(inOwned ? 'owned' : 'joined');
    }, 0);

    const timeout = window.setTimeout(() => {
      const el = cardRefs.current.get(focusVaultId);
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      onFocusHandled?.();
    }, 50);

    return () => window.clearTimeout(timeout);
  }, [focusVaultId, owned, joined, onFocusHandled, onFocusVaultNotFound]);

  const isLoading = loading || parentLoading;
  const activeList = subTab === 'owned' ? owned : joined;
  const filteredList = search.trim()
    ? activeList.filter((v) =>
        v.name.toLowerCase().includes(search.trim().toLowerCase()) ||
        (v.description ?? '').toLowerCase().includes(search.trim().toLowerCase())
      )
    : activeList;

  return (
    <div className="px-6 py-2 space-y-6 animate-fade-in">
      <div className="flex justify-between items-center px-1">
        <h3 className="text-xl font-semibold text-[#FF5E00] tracking-tight">Vaults</h3>
        <button
          onClick={refresh}
          disabled={isLoading}
          className="p-2 rounded-full hover:bg-slate-100 transition-colors disabled:opacity-50 cursor-pointer"
          aria-label="Sync Data"
        >
          <RefreshIcon
            className={`w-5 h-5 transition-colors ${
              isLoading
                ? 'text-cyan-500 animate-spin'
                : error
                ? 'text-orange-500'
                : 'text-gray-400'
            }`}
          />
        </button>
      </div>

      {!publicKey ? (
        <p className="p-6 rounded-3xl bg-white border border-slate-200/60 text-xs font-normal text-slate-400 text-center shadow-md shadow-slate-900/5">
          Log in to view your vaults.
        </p>
      ) : (
        <>
          <MyInvitations onResponded={refresh} focusVaultId={focusVaultId} onFocusHandled={onFocusHandled} />

          {error && (
            <div className="rounded-xl bg-rose-50 border border-rose-100 px-3 py-2.5">
              <p className="text-xs font-medium text-rose-600 leading-normal">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl">
            <button
              onClick={() => setSubTab('owned')}
              className={`py-2 text-[11px] font-semibold uppercase tracking-wider rounded-lg transition-all ${
                subTab === 'owned' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-400'
              }`}
            >
              Owned {owned.length > 0 && `(${owned.length})`}
            </button>
            <button
              onClick={() => setSubTab('joined')}
              className={`py-2 text-[11px] font-semibold uppercase tracking-wider rounded-lg transition-all ${
                subTab === 'joined' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-400'
              }`}
            >
              Joined {joined.length > 0 && `(${joined.length})`}
            </button>
          </div>

          <div className="relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search vaults…"
              className="w-full rounded-xl bg-slate-50 border border-slate-100 pl-9 pr-3.5 py-2.5 text-xs text-slate-800 outline-none focus:border-[#A0F0F0] transition-colors"
            />
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400"
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35m0 0a7.5 7.5 0 10-10.6 0 7.5 7.5 0 0010.6 0z" />
            </svg>
          </div>

          {/* List Container with scrollbar hidden & horizontal overflow disabled */}
          <div className="space-y-3 max-h-150 overflow-y-auto overflow-x-hidden scrollbar-none [&::-webkit-scrollbar]:hidden">
            {isLoading && !hasLoadedOnce ? (
              Array.from({ length: 3 }).map((_, i) => <VaultCardSkeleton key={i} />)
            ) : filteredList.length === 0 ? (
              <p className="p-6 rounded-3xl bg-white border border-slate-200/60 text-xs font-normal text-slate-400 text-center shadow-md shadow-slate-900/5">
                {search.trim()
                  ? 'No vaults match your search.'
                  : subTab === 'owned'
                    ? "You don't own any vaults yet."
                    : "You haven't joined any vaults yet."}
              </p>
            ) : (
              <div className={`space-y-3 transition-opacity duration-300 ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}>
              {filteredList.map((v) => (
                <div
                  key={v.id}
                  ref={(el) => {
                    if (el) cardRefs.current.set(v.id, el);
                    else cardRefs.current.delete(v.id);
                  }}
                >
                  <VaultCard
                    vault={v}
                    onChanged={handleVaultChanged}
                    isOwned={subTab === 'owned'}
                    highlighted={v.id === focusVaultId}
                    publicKey={publicKey}
                  />
                </div>
              ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}