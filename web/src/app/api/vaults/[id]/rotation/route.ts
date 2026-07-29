import "dotenv/config"
import { prisma } from "@/lib/prisma"
import { verifyAuth } from "@/lib/verifyAuth"

/**
 * Owner-only. Sets the Paluwagan payout rotation order and fixed per-round
 * contribution amount for a Collaborative vault. Can only be set once, before
 * any withdrawal requests exist, so members can't have the rules changed on
 * them mid-cycle.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyAuth(request)
    if (!auth) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: vaultId } = await params
    const body = await request.json().catch(() => null)
    const rotationOrder = body?.rotationOrder
    const contributionAmount = Number(body?.contributionAmount)

    if (!Array.isArray(rotationOrder) || rotationOrder.some((p: unknown) => typeof p !== "string")) {
      return Response.json({ error: "rotationOrder must be an array of member pubkeys" }, { status: 400 })
    }
    if (!contributionAmount || contributionAmount <= 0) {
      return Response.json({ error: "contributionAmount must be a positive number" }, { status: 400 })
    }

    const vault = await prisma.vault.findUnique({ where: { id: vaultId } })
    if (!vault) {
      return Response.json({ error: "Vault not found" }, { status: 404 })
    }
    if (vault.ownerPubkey !== auth.pubkey) {
      return Response.json({ error: "Only the vault owner can set the rotation order" }, { status: 403 })
    }
    if (vault.vaultType !== "Collaborative") {
      return Response.json({ error: "Rotation order only applies to Collaborative vaults" }, { status: 400 })
    }
    if (vault.rotationOrder) {
      return Response.json({ error: "Rotation order is already set for this vault" }, { status: 409 })
    }

    const members = await prisma.vaultMember.findMany({ where: { vaultId } })
    const memberPubkeys = new Set(members.map((m) => m.pubkey))
    const rotationSet = new Set(rotationOrder)

    if (
      rotationSet.size !== rotationOrder.length ||
      rotationSet.size !== memberPubkeys.size ||
      ![...rotationSet].every((p) => memberPubkeys.has(p as string))
    ) {
      return Response.json(
        { error: "rotationOrder must contain each current member's pubkey exactly once" },
        { status: 400 }
      )
    }

    const updated = await prisma.vault.update({
      where: { id: vaultId },
      data: { rotationOrder, contributionAmount, currentRound: 0 },
    })

    return Response.json({ ...updated, onChainVaultId: updated.onChainVaultId.toString() })
  } catch (error) {
    console.error("Rotation order set error:", error)
    return Response.json({ error: "Failed to set rotation order" }, { status: 500 })
  }
}