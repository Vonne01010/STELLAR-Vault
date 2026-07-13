// Gate requirements before a user can start Level 2 identity verification.
// Adjust POINTS_REQUIRED / UNLOCK_FEE to your actual economics —
// these are placeholders standing in for real values.

export const LEVEL_2_POINTS_REQUIRED = 5000;
export const LEVEL_2_UNLOCK_FEE_XLM = 5; // pay-to-skip amount, in XLM (or your chosen asset)

export interface GateStatus {
  eligible: boolean;
  pointsRequired: number;
  currentPoints: number;
  pointsShort: number;
  canPayToUnlock: boolean;
}

export function getLevel2GateStatus(currentPoints: number): GateStatus {
  const eligible = currentPoints >= LEVEL_2_POINTS_REQUIRED;
  return {
    eligible,
    pointsRequired: LEVEL_2_POINTS_REQUIRED,
    currentPoints,
    pointsShort: Math.max(0, LEVEL_2_POINTS_REQUIRED - currentPoints),
    canPayToUnlock: !eligible,
  };
}

// Called once payment confirms (via lib/payment.ts + lib/stellar.ts) to record
// that this user unlocked Level 2 verification by paying instead of earning points.
// Wire this into your existing prisma.ts user update.
export interface UnlockRecord {
  userId: string;
  method: "points" | "payment";
  amount: number; // points spent, or fee paid
  unlockedAt: Date;
}