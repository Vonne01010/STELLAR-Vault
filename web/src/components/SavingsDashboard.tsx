'use client';
import React, { useState, useEffect, useCallback } from 'react';
import {
  contractConfigured,
  readSavingsState,
  buildContributeXDR,
  type SavingsState,
} from '@/lib/contract';
import { submitSignedXDR, pollTransaction } from '@/lib/payment';
import { NETWORK_PASSPHRASE } from '@/lib/stellar';

interface DashboardProps {
  publicKey: string | null;
}

export default function SavingsDashboard({ publicKey }: DashboardProps) {
  const configured = contractConfigured();
  const [state, setState] = useState<SavingsState | null>(null);
  const [phpRate, setPhpRate] = useState<number>(58.60);
  const [loading, setLoading] = useState<boolean>(configured);
  const [depositAmount, setDepositAmount] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  const refresh = useCallback(async () => {
    if (!configured) return;
    setLoading(true);
    setError('');
    try {
      setState(await readSavingsState());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to read contract');
    } finally {
      setLoading(false);
    }
  }, [configured]);

  useEffect(() => {
    if (configured) {
      (async () => {
        await refresh();
      })();
    }
  }, [configured, refresh]);

  useEffect(() => {
    // Fetch live exchange rate
    fetch('https://open.er-api.com/v6/latest/USD')
      .then((res) => res.json())
      .then((data) => {
        if (data?.rates?.PHP) {
          setPhpRate(data.rates.PHP);
        }
      })
      .catch(() => {});
  }, []);

  const handleDeposit = async () => {
    if (!publicKey || !depositAmount) return;
    setBusy(true);
    setError('');
    setMsg('');
    try {
      const xdr = await buildContributeXDR(publicKey, Number(depositAmount));
      const freighter = await import('@stellar/freighter-api');
      const signed = await freighter.signTransaction(xdr, {
        networkPassphrase: NETWORK_PASSPHRASE,
        address: publicKey,
      });
      if (signed.error) {
        throw new Error(
          typeof signed.error === 'string' ? signed.error : 'Signing was rejected',
        );
      }
      const hash = await submitSignedXDR(signed.signedTxXdr);
      await pollTransaction(hash);
      setMsg('Contribution saved successfully!');
      setDepositAmount('');
      await refresh();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Contribution failed');
    } finally {
      setBusy(false);
    }
  };

  if (!configured) {
    return (
      <div className="p-6 max-w-md mx-auto bg-slate-900 border border-slate-800 rounded-2xl text-white shadow-xl">
        <p className="text-sm text-slate-400">Contract not configured. Deploy first.</p>
      </div>
    );
  }

  const usdcBalance = state?.saved || 0;
  const totalEquivalentInPhp = usdcBalance * phpRate;
  const purchasingPowerSaved = usdcBalance * (phpRate * 0.06);

  return (
    <div className="p-6 max-w-md mx-auto bg-slate-900 border border-slate-800 rounded-2xl text-white shadow-xl space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Peso Inflation Shield 🇵🇭</h2>
          <p className="text-xs text-slate-400 mt-1">Soroban-Secured USDC Vault</p>
        </div>
        <span className="bg-blue-500/10 text-blue-400 text-[10px] font-bold px-2 py-1 rounded border border-blue-500/20 uppercase tracking-wider">
          Active
        </span>
      </div>

      {/* Primary Balance Interface */}
      <div className="bg-linear-to-br from-indigo-600 to-blue-700 p-5 rounded-xl shadow-inner">
        <span className="text-xs text-blue-200 uppercase tracking-wider block font-semibold">Protected Asset Balance</span>
        {loading ? (
          <span className="text-2xl font-extrabold mt-1 block text-blue-200">Loading...</span>
        ) : (
          <>
            <span className="text-4xl font-extrabold mt-1 block tracking-tight">${usdcBalance.toFixed(2)} <span className="text-lg font-medium text-blue-200">USDC</span></span>
            <div className="mt-4 pt-3 border-t border-blue-500/30 flex justify-between text-sm text-blue-100">
              <span>Current Cash Value:</span>
              <span className="font-bold">₱{totalEquivalentInPhp.toLocaleString(undefined, {maximumFractionDigits: 2})} PHP</span>
            </div>
          </>
        )}
      </div>

      {/* Protection Insights Widget */}
      <div className="bg-slate-800/40 border border-slate-800 p-4 rounded-xl space-y-2 text-xs">
        <div className="flex justify-between">
          <span className="text-slate-400">Live Forex Index Rate:</span>
          <span className="text-emerald-400 font-mono font-medium">1 USD = ₱{phpRate.toFixed(2)} PHP</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">Purchasing Power Defended:</span>
          <span className="text-emerald-400 font-semibold">+₱{purchasingPowerSaved.toFixed(2)} Saved from Inflation</span>
        </div>
      </div>

      {/* Deposit Input Section */}
      {publicKey && (
        <div className="space-y-2">
          <label className="text-xs text-slate-400 uppercase tracking-wide block font-semibold">
            Amount to Deposit (USDC)
          </label>
          <input
            type="number"
            value={depositAmount}
            onChange={(e) => setDepositAmount(e.target.value)}
            placeholder="0.00"
            disabled={busy}
            className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 disabled:opacity-50"
          />
          {error && <p className="text-xs text-red-400">{error}</p>}
          {msg && <p className="text-xs text-green-400">{msg}</p>}
        </div>
      )}

      {/* Action Triggers */}
      <div className="grid grid-cols-2 gap-3 pt-2">
        <button 
          disabled={true}
          className="bg-slate-800 hover:bg-slate-700 disabled:opacity-50 border border-slate-700 text-sm font-semibold py-3 rounded-xl transition-all active:scale-[0.98]">
          Withdraw
        </button>
        <button 
          onClick={handleDeposit}
          disabled={!publicKey || !depositAmount || busy || loading}
          className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-sm font-semibold py-3 rounded-xl transition-all shadow-lg shadow-blue-600/10 active:scale-[0.98]">
          {busy ? 'Processing...' : 'Convert & Save'}
        </button>
      </div>

      <button
        onClick={refresh}
        disabled={loading}
        className="w-full text-xs text-slate-400 hover:text-slate-300 disabled:opacity-50"
      >
        {loading ? 'Refreshing...' : 'Refresh'}
      </button>
    </div>
  );
}