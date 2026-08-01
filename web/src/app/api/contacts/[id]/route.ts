import "dotenv/config"
import { prisma } from "@/lib/prisma"
import { verifyAuth } from "@/lib/verifyAuth"

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyAuth(request)
  if (!auth) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params

  try {
    const contact = await prisma.contact.findUnique({ where: { id } })
    if (!contact) {
      return Response.json({ error: "Contact not found" }, { status: 404 })
    }
    if (contact.ownerPubkey !== auth.pubkey) {
      return Response.json({ error: "You don't have access to this contact." }, { status: 403 })
    }

    await prisma.contact.delete({ where: { id } })
    return Response.json({ success: true })
  } catch (error) {
    console.error("Failed to delete contact:", error)
    return Response.json({ error: "Failed to delete contact" }, { status: 500 })
  }
}