'use client';

import { SparkleStar } from '@/app/icons';
import QRScanner from '@/components/shared/QRScanner';
import type { PendingTransferApproval } from '@/lib/transfer';

export default function SendPanel({
  publicKey,
  sendMode,
  onSendModeChange,
  pendingApproval,
  recipient,
  onRecipientChange,
  transferAmount,
  onTransferAmountChange,
  busy,
  onTransferRequest,
  onApproveAsSender,
  onApproveAsReceiver,
  onSubmitApprovedTransfer,
  onVoidPendingApproval,
  needsPin,
  scannedOk,
  scanError,
  onQrScanResult,
  phpRate,
}: {
  publicKey: string | null;
  sendMode: 'amount' | 'qr';
  onSendModeChange: (mode: 'amount' | 'qr') => void;
  pendingApproval: PendingTransferApproval | null;
  recipient: string;
  onRecipientChange: (value: string) => void;
  transferAmount: string;
  onTransferAmountChange: (value: string) => void;
  busy: boolean;
  onTransferRequest: () => void;
  onApproveAsSender: () => void;
  onApproveAsReceiver: () => void;
  onSubmitApprovedTransfer: () => void;
  onVoidPendingApproval: () => void;
  needsPin: boolean;
  scannedOk: boolean;
  scanError: string;
  onQrScanResult: (raw: string) => void;
  /** PHP-per-USDC rate, used to show a live peso equivalent under the amount field. */
  phpRate?: number;
}) {
  const phpEquivalent = phpRate ? Number(transferAmount || 0) * phpRate : null;

  return (
    <div className="rounded-2xl bg-white border border-slate-100 p-5 space-y-4 text-[#1A1A1A] animate-fadeIn">
      {!publicKey ? (
        <p className="p-4 bg-slate-50 text-[11px] text-slate-400 font-medium text-center rounded-xl">Verify parameters to initialize transfer.</p>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-2 p-1 bg-slate-50 border border-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => onSendModeChange('amount')}
              className={`py-2 text-[11px] font-semibold uppercase tracking-wide rounded-lg transition-all ${sendMode === 'amount' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-500'}`}
            >
              Enter
            </button>
            <button
              type="button"
              onClick={() => onSendModeChange('qr')}
              className={`py-2 text-[11px] font-semibold uppercase tracking-wide rounded-lg transition-all ${sendMode === 'qr' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-500'}`}
            >
              Scan
            </button>
          </div>

          {sendMode === 'amount' ? (
            <>
              {(!pendingApproval || pendingApproval.recipient === publicKey) && (
                <div className="space-y-3 animate-fadeIn">
                  <div className="space-y-1">
                    <label className="block text-[11px] uppercase tracking-wide text-slate-500 font-semibold">Address</label>
                    <input
                      type="text"
                      value={recipient}
                      onChange={(e) => onRecipientChange(e.target.value)}
                      placeholder="Stellar Public Address (G...)"
                      disabled={busy}
                      className="w-full rounded-xl bg-slate-50 border border-slate-100 px-3.5 py-2.5 text-[11px] font-mono text-slate-600 outline-none focus:border-[#A0F0F0] transition-colors placeholder:text-slate-300"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[11px] uppercase tracking-wide text-slate-500 font-semibold">Amount</label>
                    <div className="relative flex items-center">
                      <input
                        type="number"
                        value={transferAmount}
                        onChange={(e) => onTransferAmountChange(e.target.value)}
                        placeholder="0.00"
                        disabled={busy}
                        className="w-full rounded-xl bg-slate-50 border border-slate-100 pl-4 pr-20 py-3.5 text-2xl font-semibold tabular-nums text-slate-800 outline-none focus:border-[#A0F0F0] transition-colors placeholder:text-slate-300"
                      />
                      <span className="absolute right-3.5 text-[10px] font-bold uppercase tracking-wide text-slate-500 bg-white border border-slate-200 rounded-full px-2 py-1">
                        USDC
                      </span>
                    </div>
                    {phpEquivalent !== null && (
                      <p className="text-[11px] text-slate-400 font-medium pl-1">
                        ≈ ₱{phpEquivalent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={onTransferRequest}
                    disabled={busy || !recipient || !transferAmount || Number(transferAmount) <= 0}
                    className="w-full py-3.5 rounded-xl bg-linear-to-r from-[#FF9F1C] to-[#F37A00] text-white text-xs font-bold uppercase tracking-widest hover:opacity-95 transition-opacity disabled:opacity-40 shadow-sm shadow-orange-900/10"
                  >
                    {busy ? 'Sending Request…' : 'Send'}
                  </button>
                </div>
              )}

              {pendingApproval && pendingApproval.sender === publicKey && (
                <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4 space-y-3.5 animate-fadeIn">
                  <div className="flex justify-between items-end border-b border-slate-100 pb-3">
                    <span className="text-[11px] uppercase text-slate-500 font-semibold tracking-wide">Pending Transaction</span>
                    <div className="text-right">
                      <span className="text-xl font-bold tabular-nums text-slate-800">{pendingApproval.amount} <span className="text-xs font-semibold text-slate-400">USDC</span></span>
                      {phpRate && (
                        <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                          ≈ ₱{(pendingApproval.amount * phpRate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="space-y-1 text-slate-500 font-medium text-[11px]">
                    <p className="flex gap-1.5"><span className="uppercase tracking-wide text-slate-400 shrink-0">From</span> <span className="truncate font-mono">{pendingApproval.sender}</span></p>
                    <p className="flex gap-1.5"><span className="uppercase tracking-wide text-slate-400 shrink-0">To</span> <span className="truncate font-mono">{pendingApproval.recipient}</span></p>
                  </div>

                  <p className="text-[11px] text-slate-600 font-medium bg-white rounded-lg px-3 py-2.5 border border-slate-100">
                    {pendingApproval.senderAuthorized && pendingApproval.receiverAuthorized
                      ? 'Both parties approved. Ready to send.'
                      : pendingApproval.sender === publicKey && !pendingApproval.senderAuthorized
                        ? 'Approve below to authorize this transfer.'
                        : pendingApproval.sender === publicKey
                          ? "Waiting on the recipient to accept."
                          : pendingApproval.recipient === publicKey && !pendingApproval.receiverAuthorized
                            ? 'Approve below to accept this transfer.'
                            : 'Waiting on the sender to send.'}
                  </p>

                  <div className="flex items-center gap-2 px-1">
                    {/* Step 1: Sender */}
                    <div className="flex flex-col items-center gap-1.5 shrink-0">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors ${
                          pendingApproval.senderAuthorized
                            ? 'bg-[#00A3A3] border-[#00A3A3] text-white'
                            : pendingApproval.sender === publicKey
                              ? 'bg-white border-[#FF9F1C] text-[#FF9F1C] animate-pulse'
                              : 'bg-white border-slate-200 text-slate-300'
                        }`}
                      >
                        {pendingApproval.senderAuthorized ? (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <span className="text-[11px] font-bold">1</span>
                        )}
                      </div>
                      <span className="text-[9px] font-bold uppercase tracking-wide text-slate-400">Sender</span>
                    </div>

                    {/* Connecting line, fills in once step 1 is done */}
                    <div className="flex-1 h-0.5 rounded-full bg-slate-100 -mt-4 overflow-hidden">
                      <div
                        className="h-full bg-[#00A3A3] transition-all duration-500"
                        style={{ width: pendingApproval.senderAuthorized ? '100%' : '0%' }}
                      />
                    </div>

                    {/* Step 2: Receiver */}
                    <div className="flex flex-col items-center gap-1.5 shrink-0">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors ${
                          pendingApproval.receiverAuthorized
                            ? 'bg-[#00A3A3] border-[#00A3A3] text-white'
                            : pendingApproval.recipient === publicKey
                              ? 'bg-white border-[#FF9F1C] text-[#FF9F1C] animate-pulse'
                              : 'bg-white border-slate-200 text-slate-300'
                        }`}
                      >
                        {pendingApproval.receiverAuthorized ? (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <span className="text-[11px] font-bold">2</span>
                        )}
                      </div>
                      <span className="text-[9px] font-bold uppercase tracking-wide text-slate-400">Receiver</span>
                    </div>

                    {/* Connecting line to submit, fills once both parties approved */}
                    <div className="flex-1 h-0.5 rounded-full bg-slate-100 -mt-4 overflow-hidden">
                      <div
                        className="h-full bg-[#00A3A3] transition-all duration-500"
                        style={{ width: pendingApproval.senderAuthorized && pendingApproval.receiverAuthorized ? '100%' : '0%' }}
                      />
                    </div>

                    {/* Step 3: Submitted */}
                    <div className="flex flex-col items-center gap-1.5 shrink-0">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors ${
                          pendingApproval.senderAuthorized && pendingApproval.receiverAuthorized
                            ? 'bg-white border-[#FF9F1C] text-[#FF9F1C]'
                            : 'bg-white border-slate-200 text-slate-300'
                        }`}
                      >
                        <span className="text-[11px] font-bold">3</span>
                      </div>
                      <span className="text-[9px] font-bold uppercase tracking-wide text-slate-400">Send</span>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-1">
                    {pendingApproval.sender === publicKey && !pendingApproval.senderAuthorized && (
                      <button type="button" onClick={onApproveAsSender} disabled={busy} className="flex-1 py-2.5 rounded-xl bg-linear-to-r from-[#FF9F1C] to-[#F37A00] text-white text-[11px] font-bold uppercase tracking-wide disabled:opacity-50">
                        Confirm Transaction
                      </button>
                    )}
                    {pendingApproval.recipient === publicKey && !pendingApproval.receiverAuthorized && (
                      <button type="button" onClick={onApproveAsReceiver} disabled={busy} className="flex-1 py-2.5 rounded-xl bg-linear-to-r from-[#FF9F1C] to-[#F37A00] text-white text-[11px] font-bold uppercase tracking-wide disabled:opacity-50">
                        Accept Transaction
                      </button>
                    )}
                    {pendingApproval.sender === publicKey && pendingApproval.senderAuthorized && pendingApproval.receiverAuthorized && (
                      <button type="button" onClick={onSubmitApprovedTransfer} disabled={busy} className="flex-1 py-2.5 rounded-xl bg-linear-to-r from-[#FF9F1C] to-[#F37A00] text-white text-[11px] font-bold uppercase tracking-wide disabled:opacity-50">
                        {busy ? 'Processing…' : 'Send'}
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={busy}
                      onClick={onVoidPendingApproval}
                      className="px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-500 text-[11px] font-bold uppercase tracking-wide hover:bg-slate-50 disabled:opacity-50"
                    >
                      Void
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-5 bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-3 animate-fadeIn">
              <QRScanner
                active={sendMode === 'qr' && !pendingApproval && !needsPin}
                onScan={onQrScanResult}
              />
              {!scannedOk && !scanError && (
                <p className="text-[11px] text-slate-400 font-medium text-center px-4">
                  Point your camera at the recipient&apos;s QR code
                </p>
              )}
              {scannedOk && (
                <p className="flex items-center gap-1.5 text-[11px] text-emerald-700 font-semibold bg-emerald-50 border border-emerald-100 rounded-full px-3 py-1.5">
                  <SparkleStar className="w-3 h-3" />
                  Address captured
                </p>
              )}
              {scanError && (
                <p className="text-[11px] text-rose-600 font-medium text-center px-3.5 py-2 bg-rose-50 border border-rose-100 rounded-xl">{scanError}</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}