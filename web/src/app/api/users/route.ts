import "dotenv/config"
import { prisma } from "@/lib/prisma"
import { verifyAuth } from "@/lib/verifyAuth"

export async function GET() {
  const users = await prisma.user.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "desc" }
  })
  return Response.json(users)
}

export async function POST(request: Request) {
  const auth = await verifyAuth(request)
  if (!auth) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()

    if (!body.pubkey) {
      return Response.json({ error: "pubkey is required" }, { status: 400 })
    }

    // A caller can only ever create/update their own record — without this,
    // any authenticated user could pass someone else's pubkey and overwrite
    // that person's username/avatar.
    if (body.pubkey !== auth.pubkey) {
      return Response.json({ error: "Cannot modify another user's profile" }, { status: 403 })
    }

    const existing = await prisma.user.findUnique({ where: { pubkey: body.pubkey } })

    if (existing?.deletedAt) {
      return Response.json({ error: "This account has been deleted" }, { status: 410 })
    }

    const user = await prisma.user.upsert({
      where: { pubkey: body.pubkey },
      update: {
        // Only overwrite fields that were actually provided — avoids
        // accidentally wiping an existing username/avatar with undefined
        // if this route is ever called with a partial payload.
        ...(body.username !== undefined && { username: body.username }),
        ...(body.avatarUrl !== undefined && { avatarUrl: body.avatarUrl }),
      },
      create: {
        pubkey: body.pubkey,
        username: body.username,
        avatarUrl: body.avatarUrl,
      },
    })

    return Response.json(user, { status: 201 })
  } catch (error) {
    console.error("User upsert error:", error)
    return Response.json({ error: "Failed to save user" }, { status: 500 })
  }
}