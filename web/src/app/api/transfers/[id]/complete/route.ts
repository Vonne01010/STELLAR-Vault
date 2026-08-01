import "dotenv/config"
import { prisma } from "@/lib/prisma"
import { verifyAuth } from "@/lib/verifyAuth"

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
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
    if (transfer.status === "submitted") {
      return Response.json({ error: "This transfer has already been completed" }, { status: 409 })
    }

    const body = await request.json().catch(() => null)
    const hash = typeof body?.hash === "string" ? body.hash : null

    // Idempotency guard: only the request that actually flips the status
    // away from its current pre-submitted state gets to send notifications.
    // A duplicate/racing call sees count === 0 and short-circuits.
    const flip = await prisma.pendingTransfer.updateMany({
      where: { id, status: { not: "submitted" } },
      data: { status: "submitted" },
    })

    if (flip.count === 0) {
      return Response.json({ error: "This transfer has already been completed" }, { status: 409 })
    }

    await Promise.all([
      prisma.notification.create({
        data: {
          pubkey: transfer.senderPubkey,
          message: `You sent ${transfer.amount} USDC successfully.`,
          vaultId: null,
          variant: "success",
          meta: { event: "transfer_completed", transferId: id, hash, role: "sender", timestamp: new Date().toISOString() },
        },
      }),
      prisma.notification.create({
        data: {
          pubkey: transfer.recipientPubkey,
          message: `You received ${transfer.amount} USDC.`,
          vaultId: null,
          variant: "success",
          meta: { event: "transfer_completed", transferId: id, hash, role: "recipient", timestamp: new Date().toISOString() },
        },
      }),
    ]).catch((err) => console.error("Failed to notify parties of completed transfer:", err))

    return Response.json({ success: true })
  } catch (error) {
    console.error("Failed to complete transfer:", error)
    return Response.json({ error: "Failed to complete transfer" }, { status: 500 })
  }
}