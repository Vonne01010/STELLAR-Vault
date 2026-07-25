// lib/referral.ts
import { customAlphabet } from "nanoid"

// Avoids ambiguous chars (0/O, 1/I/L) so codes are easy to read/type aloud.
const generateCode = customAlphabet("ABCDEFGHJKMNPQRSTUVWXYZ23456789", 8)

export async function generateUniqueReferralCode(prisma: PrismaClientLike): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateCode()
    const existing = await prisma.user.findUnique({ where: { referralCode: code } })
    if (!existing) return code
  }
  throw new Error("Failed to generate a unique referral code after 5 attempts")
}