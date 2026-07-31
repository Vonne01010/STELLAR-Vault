import "dotenv/config"
import { prisma } from "@/lib/prisma"
import { verifyAuth } from "@/lib/verifyAuth"
import { logActivity } from "@/lib/logActivity"

/**
 * Client must have already signed and submitted the on-chain
 * `approve_withdrawal` transaction before calling this route. This route
 * only syncs the database — it never submits anything on-chain.
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

    const withdrawalRequest = await prisma.withdrawalRequest.findUnique({
      where: { id: requestId },
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

    await prisma.withdrawalApproval.upsert({
      where: { requestId_pubkey: { requestId, pubkey: auth.pubkey } },
      create: { requestId, pubkey: auth.pubkey },
      update: {},
    })

    const [memberCount, approvals] = await Promise.all([
      prisma.vaultMember.count({ where: { vaultId } }),
      prisma.withdrawalApproval.findMany({ where: { requestId } }),
    ])

    await logActivity({
      pubkey: auth.pubkey,
      action: "withdrawal_approved",
      vaultId,
      detail: `Approved a pending withdrawal request on vault ${vaultId}`,
    })

    // Contract requires strictly more than 50% of current members.
    const hasMajority = approvals.length * 2 > memberCount

    return Response.json({
      approvedCount: approvals.length,
      requiredCount: Math.floor(memberCount / 2) + 1,
      memberCount,
      readyToExecute: hasMajority,
    })
  } catch (error) {
    console.error("Withdrawal approval error:", error)
    return Response.json({ error: "Failed to approve withdrawal request" }, { status: 500 })
  }
}