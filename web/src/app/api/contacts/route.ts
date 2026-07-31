import "dotenv/config"
import { prisma } from "@/lib/prisma"
import { verifyAuth } from "@/lib/verifyAuth"
import { StrKey } from "@stellar/stellar-sdk"

export async function GET(request: Request) {
  const auth = await verifyAuth(request)
  if (!auth) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const contacts = await prisma.contact.findMany({
      where: { ownerPubkey: auth.pubkey },
      orderBy: { createdAt: "desc" },
      include: {
        contact: { select: { username: true, avatarUrl: true, pubkey: true } },
      },
    })

    const shaped = contacts.map((c) => ({
      id: c.id,
      pubkey: c.contact.pubkey,
      username: c.contact.username,
      avatarUrl: c.contact.avatarUrl,
      label: c.label,
      createdAt: c.createdAt,
    }))

    return Response.json({ contacts: shaped })
  } catch (error) {
    console.error("Failed to fetch contacts:", error)
    return Response.json({ error: "Failed to fetch contacts" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const auth = await verifyAuth(request)
  if (!auth) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const pubkey = String(body?.pubkey ?? "").trim()
    const label = typeof body?.label === "string" && body.label.trim() ? body.label.trim() : null

    if (!StrKey.isValidEd25519PublicKey(pubkey)) {
      return Response.json({ error: "Please provide a valid Stellar public address." }, { status: 400 })
    }
    if (pubkey === auth.pubkey) {
      return Response.json({ error: "You can't add yourself as a contact." }, { status: 400 })
    }

    const targetUser = await prisma.user.findUnique({ where: { pubkey } })
    if (!targetUser) {
      return Response.json({ error: "This user doesn't exist." }, { status: 404 })
    }

    const created = await prisma.contact.create({
      data: {
        ownerPubkey: auth.pubkey,
        contactPubkey: pubkey,
        label,
      },
    })

    return Response.json({
      contact: {
        id: created.id,
        pubkey: targetUser.pubkey,
        username: targetUser.username,
        avatarUrl: targetUser.avatarUrl,
        label: created.label,
        createdAt: created.createdAt,
      },
    }, { status: 201 })
  } catch (error: unknown) {
    if (typeof error === "object" && error !== null && "code" in error && (error as { code?: string }).code === "P2002") {
      return Response.json({ error: "You've already added this contact." }, { status: 409 })
    }
    console.error("Failed to add contact:", error)
    return Response.json({ error: "Failed to add contact" }, { status: 500 })
  }
}