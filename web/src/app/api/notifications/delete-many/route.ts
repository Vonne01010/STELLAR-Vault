import "dotenv/config"
import { prisma } from "@/lib/prisma"
import { verifyAuth } from "@/lib/verifyAuth"

export async function POST(request: Request) {
  try {
    const auth = await verifyAuth(request)
    if (!auth) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json().catch(() => null)
    const ids = Array.isArray(body?.ids) ? body.ids.filter((id): id is string => typeof id === "string") : []

    if (!ids.length) {
      return Response.json({ success: true })
    }

    await prisma.notification.deleteMany({
      where: {
        id: { in: ids },
        pubkey: auth.pubkey,
      },
    })

    return Response.json({ success: true })
  } catch (error) {
    console.error("Delete notifications error:", error)
    return Response.json({ error: "Failed to delete notifications" }, { status: 500 })
  }
}
