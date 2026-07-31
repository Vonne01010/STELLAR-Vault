'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchConversation, sendMessage, type Message } from '@/lib/messages';

export default function ChatPanel({
  publicKey,
  contactPubkey,
  contactLabel,
  onClose,
}: {
  publicKey: string;
  contactPubkey: string;
  contactLabel: string;
  onClose: () => void;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const refresh = useCallback(async () => {
    try {
      setMessages(await fetchConversation(contactPubkey));
      setError('');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  }, [contactPubkey]);

  useEffect(() => {
    void refresh();
    const interval = setInterval(() => { void refresh(); }, 4000);
    return () => clearInterval(interval);
  }, [refresh]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!draft.trim()) return;
    setSending(true);
    try {
      await sendMessage(contactPubkey, draft.trim());
      setDraft('');
      await refresh();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
        <button onClick={onClose} className="p-2 -ml-2 rounded-full hover:bg-slate-100" aria-label="Back">
          <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="min-w-0">
          <h3 className="font-semibold text-sm text-slate-800 truncate">{contactLabel}</h3>
          <p className="text-[10px] text-slate-400 font-mono truncate">{contactPubkey}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
        {loading ? (
          <p className="text-center text-xs text-slate-400 py-6">Loading…</p>
        ) : messages.length === 0 ? (
          <p className="text-center text-xs text-slate-400 py-6">No messages yet. Say hello!</p>
        ) : (
          messages.map((m) => {
            const isMine = m.senderPubkey === publicKey;
            return (
              <div key={m.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[75%] px-3.5 py-2.5 rounded-2xl text-xs leading-snug ${
                    isMine
                      ? 'bg-linear-to-r from-[#FF9F1C] to-[#F37A00] text-white rounded-br-sm'
                      : 'bg-slate-100 text-slate-800 rounded-bl-sm'
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words">{m.body}</p>
                  <p className={`text-[9px] mt-1 ${isMine ? 'text-white/70' : 'text-slate-400'}`}>
                    {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {error && (
        <div className="px-4 pb-2">
          <p className="text-[11px] text-rose-500 font-light">{error}</p>
        </div>
      )}

      <div className="px-4 py-3 border-t border-slate-100 flex items-center gap-2">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void handleSend(); } }}
          placeholder="Type a message…"
          disabled={sending}
          className="flex-1 rounded-full bg-slate-50 border border-slate-100 px-4 py-2.5 text-xs text-slate-800 outline-none focus:border-[#A0F0F0] disabled:opacity-50 transition-colors"
        />
        <button
          onClick={handleSend}
          disabled={sending || !draft.trim()}
          className="w-10 h-10 rounded-full bg-linear-to-r from-[#FF9F1C] to-[#F37A00] text-white flex items-center justify-center disabled:opacity-40 shrink-0"
          aria-label="Send"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
          </svg>
        </button>
      </div>
    </div>
  );
}