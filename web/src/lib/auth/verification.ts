import { prisma } from "@/lib/prisma";

export type VerificationLevel = 1 | 2 | 3;

export interface UserProfile {
  displayName: string | null;
  country: string | null;
  phoneNumber: string | null;
  phoneVerified: boolean;
  tosAccepted: boolean;
  email: string | null;
  profilePicture: string | null;
  referralCode: string | null;
  alternativeIdType:
    | "school_id"
    | "employer_id"
    | "cooperative_id"
    | "barangay_cert"
    | "endorsement"
    | null;
  alternativeIdVerified: boolean;
  selfieVerified: boolean;
  governmentIdVerified: boolean;
  kycPartner: string | null;
  verificationLevel: VerificationLevel;
  createdAt: string;
}

export interface TrustScore {
  score: number;
  savingsGoalsCompleted: number;
  onTimeDeposits: number;
  collaborativeVaults: number;
  disputes: number;
  accountAgeMonths: number;
}

// ─── Profile ────────────────────────────────────────────────────────────────

export async function loadProfile(pubkey: string): Promise<UserProfile | null> {
  const user = await prisma.user.findUnique({ where: { pubkey } });
  if (!user) return null;

  return {
    displayName: user.username,
    country: null, // not yet on schema — add if you collect this
    phoneNumber: user.phone,
    phoneVerified: user.phoneVerified,
    tosAccepted: true, // not yet on schema — add a real column if this needs tracking
    email: user.email,
    profilePicture: user.avatarUrl,
    referralCode: null, // not yet on schema
    alternativeIdType: user.alternativeIdType as UserProfile["alternativeIdType"],
    alternativeIdVerified: user.alternativeIdVerified,
    selfieVerified: user.selfieVerified,
    governmentIdVerified: false, // Level 3 fields not yet on schema
    kycPartner: null,
    verificationLevel: user.verificationLevel as VerificationLevel,
    createdAt: user.createdAt.toISOString(),
  };
}

export async function updateProfile(
  pubkey: string,
  patch: Partial<{
    username: string;
    email: string;
    alternativeIdType: string;
    alternativeIdVerified: boolean;
    selfieVerified: boolean;
    verificationLevel: number;
  }>
) {
  return prisma.user.update({ where: { pubkey }, data: patch });
}

export async function getVerificationLevel(pubkey: string): Promise<VerificationLevel> {
  const user = await prisma.user.findUnique({ where: { pubkey }, select: { verificationLevel: true } });
  return (user?.verificationLevel as VerificationLevel) ?? 1;
}

// ─── Trust Score ─────────────────────────────────────────────────────────────

export async function loadTrustScore(pubkey: string): Promise<TrustScore> {
  const user = await prisma.user.findUnique({ where: { pubkey } });
  if (!user) return defaultTrustScore();

  const accountAgeMonths = Math.floor(
    (Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24 * 30)
  );

  const data = {
    savingsGoalsCompleted: user.savingsGoalsCompleted,
    onTimeDeposits: user.onTimeDeposits,
    collaborativeVaults: user.collaborativeVaultsCount,
    disputes: user.disputesCount,
    accountAgeMonths,
  };

  return { ...data, score: computeTrustScore(data) };
}

function defaultTrustScore(): TrustScore {
  return {
    score: 0,
    savingsGoalsCompleted: 0,
    onTimeDeposits: 0,
    collaborativeVaults: 0,
    disputes: 0,
    accountAgeMonths: 0,
  };
}

export function computeTrustScore(data: Omit<TrustScore, "score">): number {
  let score = 0;
  score += Math.min(data.savingsGoalsCompleted * 8, 30);
  score += Math.min(data.onTimeDeposits * 2, 20);
  score += Math.min(data.collaborativeVaults * 5, 25);
  score += Math.min(data.accountAgeMonths * 1, 15);
  score -= data.disputes * 15;
  return Math.max(0, Math.min(100, Math.round(score)));
}

export async function updateTrustScore(
  pubkey: string,
  patch: Partial<{
    savingsGoalsCompleted: number;
    onTimeDeposits: number;
    collaborativeVaultsCount: number;
    disputesCount: number;
  }>
) {
  await prisma.user.update({ where: { pubkey }, data: patch });
  return loadTrustScore(pubkey);
}

// ─── Feature gates by level ──────────────────────────────────────────────────
// (unchanged — pure constants, no storage dependency)

export const LEVEL_FEATURES = {
  1: [
    "Create personal savings vaults",
    "Join collaborative vaults (paluwagan)",
    "Deposit and receive USDC",
    "View vault balances and progress",
  ],
  2: [
    "Higher transaction limits",
    "Create more and larger collaborative vaults",
    "Verified badge on your profile",
    "Build a platform trust score",
  ],
  3: [
    "Cash out USDC to Philippine Pesos (PHP)",
    "Withdraw to banks or e-wallets",
    "Cross-border remittance settlement",
    "Access to regulated financial products",
  ],
} as const;

export const LEVEL_REQUIREMENTS = {
  1: ["PIN authentication", "Display name or nickname", "Accept Terms of Service"],
  2: [
    "Verified mobile number",
    "One of: School ID, Employer ID, Barangay Certificate, or Community Endorsement",
    "Selfie with liveness detection",
  ],
  3: [
    "Complete at least 2 collaborative vaults",
    "10+ on-time contributions",
    "No disputes or fraud reports",
    "Account active for 3+ months",
  ],
} as const;

// ─── Helpers ─────────────────────────────────────────────────────────────────

export async function canAccess(pubkey: string, requiredLevel: VerificationLevel): Promise<boolean> {
  const level = await getVerificationLevel(pubkey);
  return level >= requiredLevel;
}

export interface Level2SubmissionPayload {
  alternativeIdType?:
    | "school_id"
    | "employer_id"
    | "cooperative_id"
    | "barangay_cert"
    | "endorsement";
  idNumber?: string;
  endorsementCode?: string;
  email?: string;
  selfieCaptured: boolean;
}

export async function submitLevel2Verification(
  pubkey: string,
  payload: Level2SubmissionPayload
) {
  return prisma.user.update({
    where: { pubkey },
    data: {
      email: payload.email || undefined,
      alternativeIdType: payload.alternativeIdType,
      alternativeIdNumber:
        payload.alternativeIdType === "endorsement" ? undefined : payload.idNumber,
      endorsementCode:
        payload.alternativeIdType === "endorsement" ? payload.endorsementCode : undefined,
    },
  });
}

// ─── Level 3 eligibility ──────────────────────────────────────────────────

export async function checkLevel3Eligibility(pubkey: string) {
  const user = await prisma.user.findUnique({ where: { pubkey } });
  if (!user) return { eligible: false, reasons: ["User not found"] };

  const accountAgeMonths = Math.floor(
    (Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24 * 30)
  );

  const checks = {
    hasCompletedVaults: user.collaborativeVaultsCount >= 2,
    hasOnTimeHistory: user.onTimeDeposits >= 10,
    noDisputes: user.disputesCount === 0,
    hasAccountAge: accountAgeMonths >= 3,
    hasVerificationLevel2: user.verificationLevel >= 2,
  };

  const eligible = Object.values(checks).every(Boolean);
  const reasons = Object.entries(checks)
    .filter(([, passed]) => !passed)
    .map(([key]) => key);

  return { eligible, checks, reasons, accountAgeMonths };
}

export async function attemptLevel3Upgrade(pubkey: string) {
  const result = await checkLevel3Eligibility(pubkey);
  if (!result.eligible) {
    return { ok: false as const, ...result };
  }
  await prisma.user.update({ where: { pubkey }, data: { verificationLevel: 3 } });
  return { ok: true as const, ...result };
}