import "dotenv/config"
import { prisma } from "@/lib/prisma"
import { verifyAuth } from "@/lib/verifyAuth"
import { logActivity } from "@/lib/logActivity"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyAuth(request)
    if (!auth) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: vaultId } = await params

    const isMember = await prisma.vaultMember.findUnique({
      where: { vaultId_pubkey: { vaultId, pubkey: auth.pubkey } },
    })
    if (!isMember) {
      return Response.json({ error: "Not a member of this vault" }, { status: 403 })
    }

    const requests = await prisma.withdrawalRequest.findMany({
      where: { vaultId },
      include: { approvals: true },
      orderBy: { createdAt: "desc" },
    })

    return Response.json(
      requests.map((r) => ({ ...r, onChainRequestId: r.onChainRequestId.toString() }))
    )
  } catch (error) {
    console.error("Withdrawal requests fetch error:", error)
    return Response.json({ error: "Failed to fetch withdrawal requests" }, { status: 500 })
  }
}

/**
 * Client must have already signed and submitted the on-chain
 * `request_withdrawal` transaction and read back the resulting
 * `onChainRequestId` from the transaction result before calling this route.
 * This route only syncs the database — it never submits anything on-chain.
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
    const onChainRequestId = body?.onChainRequestId
    const recipientPubkey = body?.recipientPubkey
    const amount = Number(body?.amount)

    if (!onChainRequestId || !recipientPubkey || !amount || amount <= 0) {
      return Response.json(
        { error: "onChainRequestId, recipientPubkey, and a positive amount are required" },
        { status: 400 }
      )
    }

    const vault = await prisma.vault.findUnique({ where: { id: vaultId } })
    if (!vault) {
      return Response.json({ error: "Vault not found" }, { status: 404 })
    }
    if (vault.vaultType !== "Collaborative") {
      return Response.json(
        { error: "Only Collaborative vaults use the withdrawal-request flow" },
        { status: 400 }
      )
    }

    const isMember = await prisma.vaultMember.findUnique({
      where: { vaultId_pubkey: { vaultId, pubkey: auth.pubkey } },
    })
    if (!isMember) {
      return Response.json({ error: "Not a member of this vault" }, { status: 403 })
    }

    if (amount > vault.balance) {
      return Response.json({ error: "Amount exceeds vault balance" }, { status: 400 })
    }

    // Paluwagan enforcement: if a rotation order is set, the recipient must
    // be whoever is next in line, and the amount must be the full pot
    // (fixed contribution × member count) — no free-form recipient/amount.
    if (vault.rotationOrder) {
      const rotation = vault.rotationOrder as string[]
      const expectedRecipient = rotation[vault.currentRound % rotation.length]
      const memberCount = await prisma.vaultMember.count({ where: { vaultId } })
      const expectedAmount = (vault.contributionAmount ?? 0) * memberCount

      if (recipientPubkey !== expectedRecipient) {
        return Response.json(
          { error: `This round's payout must go to the next member in rotation (${expectedRecipient})` },
          { status: 400 }
        )
      }
      if (Math.abs(amount - expectedAmount) > 0.0001) {
        return Response.json(
          { error: `Paluwagan payout must equal the full pot (${expectedAmount})` },
          { status: 400 }
        )
      }
    }

    // The requester's own approval is recorded automatically on-chain, so we
    // mirror that here.
    const withdrawalRequest = await prisma.withdrawalRequest.create({
      data: {
        vaultId,
        onChainRequestId: BigInt(onChainRequestId),
        requesterPubkey: auth.pubkey,
        recipientPubkey,
        amount,
        approvals: { create: { pubkey: auth.pubkey } },
      },
      include: { approvals: true },
    })

    await logActivity({
      pubkey: auth.pubkey,
      action: "withdrawal_requested",
      vaultId,
      detail: `Requested a withdrawal of ${amount} from "${vault.name}"`,
    })

    // Notify the other members so they know a vote is pending.
    const otherMembers = await prisma.vaultMember.findMany({
      where: { vaultId, pubkey: { not: auth.pubkey } },
    })
    if (otherMembers.length) {
      await prisma.notification.createMany({
        data: otherMembers.map((m) => ({
          pubkey: m.pubkey,
          message: `A withdrawal of ${amount} was requested on "${vault.name}" — your approval is needed.`,
          vaultId,
          variant: "info",
        })),
      })
    }

    return Response.json(
      {
        ...withdrawalRequest,
        onChainRequestId: withdrawalRequest.onChainRequestId.toString(),
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Withdrawal request creation error:", error)
    return Response.json({ error: "Failed to create withdrawal request" }, { status: 500 })
  }
}