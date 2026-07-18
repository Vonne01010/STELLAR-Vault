import "dotenv/config"
import { prisma } from "@/lib/prisma"
import { verifyAuth } from "@/lib/verifyAuth"
import { loadProfileByPubkey, loadTrustScoreByPubkey } from "@/lib/auth/verification.server"

export async function GET(request: Request) {
  const auth = await verifyAuth(request)
  if (!auth) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const [profile, trust] = await Promise.all([
    loadProfileByPubkey(auth.pubkey),
    loadTrustScoreByPubkey(auth.pubkey),
  ])

  if (!profile) {
    return Response.json({ error: "Account not found" }, { status: 404 })
  }

  const [user, vaultsCount] = await Promise.all([
    prisma.user.findUnique({ where: { pubkey: auth.pubkey }, select: { points: true } }),
    prisma.vaultMember.count({ where: { pubkey: auth.pubkey } }),
  ])

  return Response.json({ profile, trust, points: user?.points ?? 0, vaultsCount })
}