import "dotenv/config"
import { prisma } from "@/lib/prisma"
import { verifyAuth } from "@/lib/verifyAuth"

export async function DELETE(request: Request) {
  try {
    const auth = await verifyAuth(request)
    if (!auth) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    await prisma.notification.deleteMany({
      where: { pubkey: auth.pubkey },
    })

    return Response.json({ success: true })
  } catch (error) {
    console.error("Clear notifications error:", error)
    return Response.json({ error: "Failed to clear notifications" }, { status: 500 })
  }
}
