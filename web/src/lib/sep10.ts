import { signWithCurrentAccount } from './wallet';
import type { AnchorConfig } from './anchor';

interface ChallengeResponse {
  transaction: string;
  network_passphrase?: string;
}

interface TokenResponse {
  token: string;
}

interface CachedToken {
  token: string;
  expiresAt: number; // epoch ms
}

const tokenCache = new Map<string, CachedToken>();

function cacheKey(anchor: AnchorConfig, account: string): string {
  return `${anchor.webAuthEndpoint}::${account}`;
}

/** Decode a JWT's payload without verifying the signature — we trust it
 *  because we just received it directly from the anchor over HTTPS. Only
 *  used to read `exp` for cache expiry. */
function decodeJwtExpiry(token: string): number | null {
  try {
    const payload = token.split('.')[1];
    const json = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    return typeof json.exp === 'number' ? json.exp * 1000 : null;
  } catch {
    return null;
  }
}

const FALLBACK_TTL_MS = 5 * 60 * 1000; // if exp is missing/unparseable, don't cache long
const EXPIRY_SAFETY_MARGIN_MS = 30 * 1000; // refresh a little before actual expiry

/**
 * SEP-10 web authentication: fetch a challenge transaction from the anchor,
 * sign it with the user's current account (never submitted on-chain — it's
 * only ever sent back to the anchor), and exchange it for a JWT.
 *
 * JWTs are cached per (anchor, account) pair in memory until shortly before
 * they expire, so repeated SEP-24 calls don't force a re-sign each time.
 */
export async function authenticateWithAnchor(
  anchor: AnchorConfig,
  account: string,
): Promise<string> {
  const key = cacheKey(anchor, account);
  const cached = tokenCache.get(key);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.token;
  }

  const challengeUrl = new URL(anchor.webAuthEndpoint);
  challengeUrl.searchParams.set('account', account);

  const challengeRes = await fetch(challengeUrl.toString());
  if (!challengeRes.ok) {
    throw new Error(`SEP-10 challenge request failed: ${challengeRes.status}`);
  }

  const challenge = (await challengeRes.json()) as ChallengeResponse;
  if (!challenge.transaction) {
    throw new Error('SEP-10 challenge response did not include a transaction');
  }

  const signedXdr = await signWithCurrentAccount(challenge.transaction);

  const tokenRes = await fetch(anchor.webAuthEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ transaction: signedXdr }),
  });

  if (!tokenRes.ok) {
    const body = await tokenRes.text().catch(() => '');
    throw new Error(`SEP-10 token exchange failed: ${tokenRes.status} ${body}`);
  }

  const { token } = (await tokenRes.json()) as TokenResponse;
  if (!token) {
    throw new Error('SEP-10 token exchange response did not include a token');
  }

  const exp = decodeJwtExpiry(token);
  const expiresAt = exp
    ? exp - EXPIRY_SAFETY_MARGIN_MS
    : Date.now() + FALLBACK_TTL_MS;

  tokenCache.set(key, { token, expiresAt });

  return token;
}

/** Force the next call to re-authenticate, e.g. after a 401 from a SEP-24 endpoint. */
export function invalidateAnchorToken(anchor: AnchorConfig, account: string): void {
  tokenCache.delete(cacheKey(anchor, account));
}