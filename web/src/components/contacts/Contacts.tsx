'use client';

import { useState, useEffect, useCallback } from 'react';
import { fetchContacts, addContact, removeContact, type Contact } from '@/lib/contacts';
import { RefreshIcon } from '@/app/icons';

export default function Contacts({
  publicKey,
  onSendToContact,
}: {
  publicKey: string | null;
  onSendToContact?: (pubkey: string) => void;
}) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [listError, setListError] = useState('');

  const [addressInput, setAddressInput] = useState('');
  const [labelInput, setLabelInput] = useState('');
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState('');

  const refresh = useCallback(async () => {
    if (!publicKey) { setContacts([]); setLoading(false); setHasLoadedOnce(true); return; }
    setLoading(true);
    setListError('');
    try {
      setContacts(await fetchContacts());
    } catch (e: unknown) {
      setListError(e instanceof Error ? e.message : 'Failed to load contacts');
    } finally {
      setLoading(false);
      setHasLoadedOnce(true);
    }
  }, [publicKey]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => { void refresh(); }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [refresh]);

  const handleAdd = async () => {
    if (!addressInput.trim()) return;
    setAdding(true);
    setAddError('');
    try {
      await addContact(addressInput.trim(), labelInput.trim() || undefined);
      setAddressInput('');
      setLabelInput('');
      await refresh();
    } catch (e: unknown) {
      setAddError(e instanceof Error ? e.message : 'Failed to add contact');
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (id: string) => {
    try {
      await removeContact(id);
      await refresh();
    } catch (e: unknown) {
      setListError(e instanceof Error ? e.message : 'Failed to remove contact');
    }
  };

  return (
    <div className="px-6 py-2 space-y-6 animate-fade-in">
      <div className="flex justify-between items-center px-1">
        <h3 className="text-xl font-semibold text-[#FF5E00] tracking-tight">Contacts</h3>
        <button
          onClick={refresh}
          disabled={loading}
          className="p-2 rounded-full hover:bg-slate-100 transition-colors disabled:opacity-50 cursor-pointer"
          aria-label="Sync Data"
        >
          <RefreshIcon className={`w-5 h-5 transition-colors ${loading ? 'text-cyan-500 animate-spin' : 'text-slate-400'}`} />
        </button>
      </div>

      {!publicKey ? (
        <p className="p-6 rounded-3xl bg-white border border-slate-200/60 text-xs font-normal text-slate-400 text-center shadow-md shadow-slate-900/5">
          Log in to view your contacts.
        </p>
      ) : (
        <>
          <div className="rounded-2xl bg-white border border-slate-100 p-5 space-y-3">
            <label className="block text-[10px] uppercase tracking-wider text-slate-400 font-light">Add contact</label>
            <input
              type="text"
              value={addressInput}
              onChange={(e) => setAddressInput(e.target.value)}
              placeholder="Stellar Public Address (G...)"
              disabled={adding}
              className="w-full rounded-xl bg-slate-50 border border-slate-100 px-3.5 py-2.5 text-[11px] font-mono text-slate-600 outline-none focus:border-[#A0F0F0] disabled:opacity-50 transition-colors"
            />
            <input
              type="text"
              value={labelInput}
              onChange={(e) => setLabelInput(e.target.value)}
              placeholder="Label (optional, e.g. 'Mom')"
              disabled={adding}
              className="w-full rounded-xl bg-slate-50 border border-slate-100 px-3.5 py-2.5 text-xs text-slate-800 outline-none focus:border-[#A0F0F0] disabled:opacity-50 transition-colors"
            />
            {addError && <p className="text-[11px] text-rose-500 font-light">{addError}</p>}
            <button
              onClick={handleAdd}
              disabled={adding || !addressInput.trim()}
              className="w-full py-3 rounded-xl bg-linear-to-r from-[#FF9F1C] to-[#F37A00] text-white text-[10px] uppercase tracking-widest hover:opacity-95 transition-opacity disabled:opacity-40"
            >
              {adding ? 'Adding…' : 'Add Contact'}
            </button>
          </div>

          {listError && (
            <div className="rounded-xl bg-rose-50 border border-rose-100 px-3 py-2.5">
              <p className="text-xs font-medium text-rose-600 leading-normal">{listError}</p>
            </div>
          )}

          <div className="space-y-3 max-h-150 overflow-y-auto pr-1">
            {loading && !hasLoadedOnce ? (
              <p className="p-6 rounded-3xl bg-white border border-slate-200/60 text-xs font-normal text-slate-400 text-center shadow-md shadow-slate-900/5">
                Loading…
              </p>
            ) : contacts.length === 0 ? (
              <p className="p-6 rounded-3xl bg-white border border-slate-200/60 text-xs font-normal text-slate-400 text-center shadow-md shadow-slate-900/5">
                No contacts yet. Add one using their Stellar address above.
              </p>
            ) : (
              contacts.map((c) => (
                <div key={c.id} className="p-5 rounded-3xl bg-white border border-slate-200/60 shadow-md shadow-slate-900/5 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#FFEFE6] text-[#FF5E00] flex items-center justify-center shrink-0 font-bold text-sm shadow-inner">
                    {(c.label || c.username || c.pubkey).charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-xs text-slate-800 truncate">{c.label || c.username || 'Unnamed contact'}</h4>
                    <p className="text-[10px] text-slate-400 truncate mt-0.5 font-mono">{c.pubkey}</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    {onSendToContact && (
                      <button
                        onClick={() => onSendToContact(c.pubkey)}
                        className="px-3 py-2 rounded-xl bg-linear-to-r from-[#FF9F1C] to-[#F37A00] text-white text-[10px] uppercase tracking-wide"
                      >
                        Send
                      </button>
                    )}
                    <button
                      onClick={() => handleRemove(c.id)}
                      className="px-3 py-2 rounded-xl bg-slate-100 text-slate-400 text-[10px] uppercase tracking-wide"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}