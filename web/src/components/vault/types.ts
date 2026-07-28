export interface VaultData {
  id: string;
  onChainVaultId: string; // numeric on-chain vault ID, saved at creation time
  name: string;
  description: string | null;
  goalType: string;
  targetAmount: number;
  balance: number;
  status: string;
  vaultType: string;
  ownerPubkey: string;
  createdAt: string;
  withdrawable?: boolean;
}

export interface VaultsProps {
  publicKey: string | null;
  loading?: boolean;
  onWalletChanged?: () => void | Promise<void>;
  focusVaultId?: string | null;
  onFocusHandled?: () => void;
  onFocusVaultNotFound?: () => void;
}

export interface VaultMemberRow {
  id: string;
  vaultId: string;
  pubkey: string;
  role: string;
  addedAt: string;
}

export interface VaultProposalRow {
  id: string;
  vaultId: string;
  proposedBy: string;
  type: 'edit_goal' | 'edit_lock' | 'delete';
  changes: { targetAmount?: number; lockUntil?: string } | null;
  status: 'pending' | 'approved' | 'rejected' | 'executed';
  createdAt: string;
  approvals: { pubkey: string }[];
}

export type VaultSubTab = 'owned' | 'joined';
export type MoneyAction = 'deposit' | 'withdraw';

export const SESSION_KEY_MISSING_MESSAGE = 'Your session key is unavailable. Please unlock your account again.';
