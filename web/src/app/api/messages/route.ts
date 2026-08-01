import "dotenv/config"
import { prisma } from "@/lib/prisma"
import { verifyAuth } from "@/lib/verifyAuth"
import { StrKey } from "@stellar/stellar-sdk"

export async function GET(request: Request) {
  const auth = await verifyAuth(request)
  if (!auth) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const withPubkey = searchParams.get("with")

  if (!withPubkey || !StrKey.isValidEd25519PublicKey(withPubkey)) {
    return Response.json({ error: "A valid 'with' pubkey query param is required" }, { status: 400 })
  }

  try {
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderPubkey: auth.pubkey, recipientPubkey: withPubkey },
          { senderPubkey: withPubkey, recipientPubkey: auth.pubkey },
        ],
      },
      orderBy: { createdAt: "asc" },
      take: 200,
    })

    // Mark incoming messages as read
    await prisma.message.updateMany({
      where: { senderPubkey: withPubkey, recipientPubkey: auth.pubkey, read: false },
      data: { read: true },
    })

    return Response.json({ messages })
  } catch (error) {
    console.error("Failed to fetch messages:", error)
    return Response.json({ error: "Failed to fetch messages" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const auth = await verifyAuth(request)
  if (!auth) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const recipientPubkey = String(body?.recipientPubkey ?? "")
    const text = String(body?.body ?? "").trim()

    if (!StrKey.isValidEd25519PublicKey(recipientPubkey)) {
      return Response.json({ error: "Please provide a valid Stellar recipient address." }, { status: 400 })
    }
    if (recipientPubkey === auth.pubkey) {
      return Response.json({ error: "You can't message yourself." }, { status: 400 })
    }
    if (!text) {
      return Response.json({ error: "Message body is required" }, { status: 400 })
    }
    if (text.length > 2000) {
      return Response.json({ error: "Message is too long (max 2000 characters)" }, { status: 400 })
    }

    const recipient = await prisma.user.findUnique({ where: { pubkey: recipientPubkey } })
    if (!recipient) {
      return Response.json({ error: "This user doesn't exist." }, { status: 404 })
    }

    const message = await prisma.message.create({
      data: {
        senderPubkey: auth.pubkey,
        recipientPubkey,
        body: text,
      },
    })

    await prisma.notification.create({
      data: {
        pubkey: recipientPubkey,
        message: `New message from ${auth.pubkey.slice(0, 8)}...`,
        vaultId: null,
        variant: "info",
        meta: {
          event: "message_received",
          senderPubkey: auth.pubkey,
          messageId: message.id,
          timestamp: new Date().toISOString(),
        },
      },
    }).catch((err) => {
      console.error("Failed to create message notification:", err)
    })

    return Response.json({ message }, { status: 201 })
  } catch (error) {
    console.error("Failed to send message:", error)
    return Response.json({ error: "Failed to send message" }, { status: 500 })
  }
}