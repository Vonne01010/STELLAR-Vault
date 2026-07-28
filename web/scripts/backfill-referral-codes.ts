// scripts/backfill-referral-codes.ts
import { prisma } from "@/lib/prisma"
import { generateUniqueReferralCode } from "@/lib/referral"

async function main() {
  const users = await prisma.user.findMany({ where: { referralCode: null } })
  for (const user of users) {
    const referralCode = await generateUniqueReferralCode(prisma)
    await prisma.user.update({ where: { id: user.id }, data: { referralCode } })
  }
  console.log(`Backfilled ${users.length} users.`)
}

main().then(() => process.exit(0))