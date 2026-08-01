import "dotenv/config"
import { prisma } from "@/lib/prisma"
import { verifyAuth } from "@/lib/verifyAuth"
import { logActivity } from "@/lib/logActivity"

/**
 * Client must have already signed and submitted the on-chain
 * `execute_withdrawal` transaction and confirmed it landed before calling
 * this route. This route only syncs the database — it never submits
 * anything on-chain.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; requestId: string }> }
) {
  try {
    const auth = await verifyAuth(request)
    if (!auth) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: vaultId, requestId } = await params

    const vault = await prisma.vault.findUnique({ where: { id: vaultId } })
    if (!vault) {
      return Response.json({ error: "Vault not found" }, { status: 404 })
    }

    const withdrawalRequest = await prisma.withdrawalRequest.findUnique({
      where: { id: requestId },
      include: { approvals: true },
    })
    if (!withdrawalRequest || withdrawalRequest.vaultId !== vaultId) {
      return Response.json({ error: "Withdrawal request not found" }, { status: 404 })
    }
    if (withdrawalRequest.status === "executed") {
      return Response.json({ error: "This request has already executed" }, { status: 409 })
    }

    const isMember = await prisma.vaultMember.findUnique({
      where: { vaultId_pubkey: { vaultId, pubkey: auth.pubkey } },
    })
    if (!isMember) {
      return Response.json({ error: "Not a member of this vault" }, { status: 403 })
    }

    const memberCount = await prisma.vaultMember.count({ where: { vaultId } })
    const hasMajority = withdrawalRequest.approvals.length * 2 > memberCount
    if (!hasMajority) {
      return Response.json(
        { error: "This request does not yet have a majority of member approvals" },
        { status: 409 }
      )
    }

    if (withdrawalRequest.amount > vault.balance) {
      return Response.json({ error: "Amount exceeds current vault balance" }, { status: 409 })
    }

    // Idempotency guard: the status flip and the balance decrement happen
    // together inside one interactive transaction. updateMany's WHERE
    // includes status, so only the request that actually wins the race from
    // "pending" -> "executed" proceeds to touch the balance. A concurrent
    // duplicate call gets count === 0 and is rejected before any side effects.
    let updatedRequest
    try {
      updatedRequest = await prisma.$transaction(async (tx) => {
        const flip = await tx.withdrawalRequest.updateMany({
          where: { id: requestId, status: { not: "executed" } },
          data: { status: "executed" },
        })

        if (flip.count === 0) {
          throw new Error("ALREADY_EXECUTED")
        }

        await tx.vault.update({
          where: { id: vaultId },
          data: {
            balance: { decrement: withdrawalRequest.amount },
            ...(vault.rotationOrder ? { currentRound: { increment: 1 } } : {}),
          },
        })

        return tx.withdrawalRequest.findUniqueOrThrow({ where: { id: requestId } })
      })
    } catch (err) {
      if (err instanceof Error && err.message === "ALREADY_EXECUTED") {
        return Response.json({ error: "This request has already executed" }, { status: 409 })
      }
      throw err
    }

    await logActivity({
      pubkey: auth.pubkey,
      action: "withdrawal_executed",
      vaultId,
      detail: `Executed a withdrawal of ${withdrawalRequest.amount} from "${vault.name}"`,
    })

    return Response.json({
      success: true,
      request: { ...updatedRequest, onChainRequestId: updatedRequest.onChainRequestId.toString() },
    })
  } catch (error) {
    console.error("Withdrawal execution error:", error)
    return Response.json({ error: "Failed to execute withdrawal request" }, { status: 500 })
  }
}