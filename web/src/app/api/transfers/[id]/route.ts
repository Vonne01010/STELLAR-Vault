import "dotenv/config"
import { prisma } from "@/lib/prisma"
import { verifyAuth } from "@/lib/verifyAuth"

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyAuth(request)
  if (!auth) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params

  try {
    const transfer = await prisma.pendingTransfer.findUnique({ where: { id } })
    if (!transfer) {
      return Response.json({ error: "Transfer not found" }, { status: 404 })
    }

    if (auth.pubkey !== transfer.senderPubkey && auth.pubkey !== transfer.recipientPubkey) {
      return Response.json({ error: "You're not part of this transfer." }, { status: 403 })
    }

    const patch: { senderAuthorized?: boolean; receiverAuthorized?: boolean; status?: string } = {}
    if (auth.pubkey === transfer.senderPubkey) {
      patch.senderAuthorized = true
    }
    if (auth.pubkey === transfer.recipientPubkey) {
      patch.receiverAuthorized = true
    }

    const willBeSenderAuthorized = patch.senderAuthorized ?? transfer.senderAuthorized
    const willBeReceiverAuthorized = patch.receiverAuthorized ?? transfer.receiverAuthorized
    if (willBeSenderAuthorized && willBeReceiverAuthorized) {
      patch.status = "ready_to_submit"
    }

    const updated = await prisma.pendingTransfer.update({
      where: { id },
      data: patch,
    })

    // NEW — tell the other party what just happened
    const counterpartyPubkey = auth.pubkey === transfer.senderPubkey ? transfer.recipientPubkey : transfer.senderPubkey
    const approverRole = auth.pubkey === transfer.senderPubkey ? "sender" : "recipient"

    if (patch.status === "ready_to_submit") {
      await Promise.all([
        prisma.notification.create({
          data: {
            pubkey: transfer.senderPubkey,
            message: `Transfer of ${(transfer.amount).toFixed(2)} USDC approved by both parties. Ready to send.`,
            vaultId: null,
            variant: "success",
            meta: { event: "transfer_ready", transferId: id, timestamp: new Date().toISOString() },
          },
        }),
        prisma.notification.create({
          data: {
            pubkey: transfer.recipientPubkey,
            message: `Transfer of ${(transfer.amount).toFixed(2)} USDC approved by both parties. Ready to be sent to you.`,
            vaultId: null,
            variant: "success",
            meta: { event: "transfer_ready", transferId: id, timestamp: new Date().toISOString() },
          },
        }),
      ]).catch((err) => console.error("Failed to notify parties of ready transfer:", err))
    } else {
      await prisma.notification.create({
        data: {
          pubkey: counterpartyPubkey,
          message: `The ${approverRole} approved the ${Number(transfer.amount).toFixed(2)} USDC transfer request. Waiting on your approval.`,
          vaultId: null,
          variant: "action_required",
          meta: { event: "transfer_partial_approval", transferId: id, approverRole, timestamp: new Date().toISOString() },
        },
      }).catch((err) => console.error("Failed to notify counterparty of approval:", err))
    }

    return Response.json(updated)

  } catch (error) {
    console.error("Failed to update pending transfer:", error)
    return Response.json({ error: "Failed to update transfer" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyAuth(request)
  if (!auth) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params

  try {
    const transfer = await prisma.pendingTransfer.findUnique({ where: { id } })
    if (!transfer) {
      return Response.json({ error: "Transfer not found" }, { status: 404 })
    }
    if (auth.pubkey !== transfer.senderPubkey && auth.pubkey !== transfer.recipientPubkey) {
      return Response.json({ error: "You're not part of this transfer." }, { status: 403 })
    }

    await prisma.pendingTransfer.delete({ where: { id } })

    const counterpartyPubkey = auth.pubkey === transfer.senderPubkey ? transfer.recipientPubkey : transfer.senderPubkey
    await prisma.notification.create({
      data: {
        pubkey: counterpartyPubkey,
        message: `The ${Number(transfer.amount).toFixed(2)} USDC transfer request was cancelled.`,
        vaultId: null,
        variant: "warning",
        meta: { event: "transfer_cancelled", transferId: id, timestamp: new Date().toISOString() },
      },
    }).catch((err) => console.error("Failed to notify counterparty of cancellation:", err))
    return Response.json({ success: true })
  } catch (error) {
    console.error("Failed to delete pending transfer:", error)
    return Response.json({ error: "Failed to delete transfer" }, { status: 500 })
  }
}
