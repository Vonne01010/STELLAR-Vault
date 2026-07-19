import { prisma } from '@/lib/prisma';
import type { UserProfile, TrustScore, VerificationLevel } from './verification';

export async function loadProfileByPubkey(pubkey: string): Promise<UserProfile | null> {
  const user = await prisma.user.findUnique({ where: { pubkey } });
  if (!user || user.deletedAt) return null;

  return {
    displayName: user.username ?? '',
    country: user.country ?? '',
    phoneNumber: user.phone ?? '',
    phoneVerified: user.phoneVerified,
    tosAccepted: user.tosAccepted,
    email: user.email ?? undefined,
    profilePicture: user.avatarUrl ?? undefined,
    alternativeIdType: user.alternativeIdType as UserProfile['alternativeIdType'],
    alternativeIdVerified: user.alternativeIdVerified,
    selfieVerified: user.selfieVerified,
    governmentIdVerified: user.governmentIdVerified,
    kycPartner: user.kycPartner ?? undefined,
    verificationLevel: user.verificationLevel as VerificationLevel,
    createdAt: user.createdAt.toISOString(),
  };
}

export async function loadTrustScoreByPubkey(pubkey: string): Promise<TrustScore> {
  const user = await prisma.user.findUnique({ where: { pubkey } });
  if (!user) {
    return {
      score: 0,
      savingsGoalsCompleted: 0,
      onTimeDeposits: 0,
      collaborativeVaults: 0,
      disputes: 0,
      accountAgeMonths: 0,
    };
  }

  const accountAgeMonths = Math.floor(
    (Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24 * 30)
  );

  return {
    score: user.trustScore,
    savingsGoalsCompleted: user.savingsGoalsCompleted,
    onTimeDeposits: user.onTimeDeposits,
    collaborativeVaults: user.collaborativeVaultsCount,
    disputes: user.disputesCount,
    accountAgeMonths,
  };
}

export async function submitLevel2Verification(
  pubkey: string,
  payload: {
    alternativeIdType?: string;
    idNumber?: string;
    endorsementCode?: string;
    email?: string;
    selfieCaptured?: boolean;
  }
): Promise<void> {
  const user = await prisma.user.findUnique({ where: { pubkey } });
  if (!user || user.deletedAt) {
    throw new Error('Account not found');
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { pubkey },
      data: {
        alternativeIdType: payload.alternativeIdType ?? user.alternativeIdType,
        alternativeIdNumber: payload.idNumber ?? user.alternativeIdNumber,
        endorsementCode: payload.endorsementCode ?? user.endorsementCode,
        email: payload.email ?? user.email,
        selfieVerified: payload.selfieCaptured ?? user.selfieVerified,
        // Submission is pending review — level bump happens on approval, not here.
      },
    }),
    prisma.verificationReview.create({
      data: {
        userId: user.id,
        level: 2,
        decision: 'pending',
      },
    }),
  ]);
}