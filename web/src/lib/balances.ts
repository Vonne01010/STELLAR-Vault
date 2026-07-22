import { Horizon } from '@stellar/stellar-sdk';
import { HORIZON_URL } from './stellar';

const horizon = new Horizon.Server(HORIZON_URL);

export interface Balances {
  xlm: string;
  usdc: string;
  funded: boolean;
  hasUsdcTrustline: boolean;
}

export async function fetchBalances(publicKey: string): Promise<Balances> {
  try {
    const account = await horizon.loadAccount(publicKey);
    let xlm = '0';
    let usdc = '0';
    let hasUsdcTrustline = false;

    for (const b of account.balances) {
      if (b.asset_type === 'native') {
        xlm = parseFloat(b.balance).toFixed(2);
      } else if (
        (b.asset_type === 'credit_alphanum4' ||
          b.asset_type === 'credit_alphanum12') &&
        b.asset_code === 'USDC'
      ) {
        usdc = parseFloat(b.balance).toFixed(2);
        hasUsdcTrustline = true;
      }
    }
    return { xlm, usdc, funded: true, hasUsdcTrustline };
  } catch (e: unknown) {
    const status = (e as { response?: { status?: number } })?.response?.status;
    if (status === 404 || (e as { name?: string })?.name === 'NotFoundError') {
      return { xlm: '0', usdc: '0', funded: false, hasUsdcTrustline: false };
    }
    throw e;
  }
}