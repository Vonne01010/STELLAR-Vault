import { keypairFromMnemonic } from "@/lib/stellar";
import { encryptSecretKey } from "@/lib/auth/encryption";
import { saveAccount } from "@/lib/auth/storage";

export interface RecoveryResult {
  publicKey: string;
  secretKey: string;
}

/**
 * Validates a mnemonic has the expected word count and derives its keypair.
 * Does NOT touch storage or authenticate — pure derivation, so callers can
 * verify the resulting publicKey against an expected value before committing
 * to anything (e.g. confirming it matches the account the user meant to recover).
 */
export function deriveFromMnemonic(mnemonic: string): RecoveryResult {
  const trimmed = mnemonic.trim().toLowerCase();
  const words = trimmed.split(/\s+/);

  if (words.length !== 24 && words.length !== 12) {
    throw new Error("Recovery phrase should be 12 or 24 words. Please check and try again.");
  }

  const { publicKey, secretKey } = keypairFromMnemonic(trimmed);
  return { publicKey, secretKey };
}

/**
 * Re-derives the keypair from a mnemonic, encrypts it with a new PIN, and
 * saves it locally — restoring local access to a PIN account whose
 * localStorage entry was lost (cleared cache, new device, new browser).
 * Does NOT authenticate with the backend — call authenticateWithSecretKey
 * (in wallet.ts) separately after this, so recovery.ts stays storage-only
 * and has no knowledge of the backend auth flow.
 */
export async function recoverAndStoreAccount(
  mnemonic: string,
  pin: string
): Promise<{ publicKey: string; secretKey: string }> {
  const { publicKey, secretKey } = deriveFromMnemonic(mnemonic);
  const encryptedData = await encryptSecretKey(secretKey, pin);
  saveAccount({ publicKey, ...encryptedData });
  return { publicKey, secretKey };
}