import "dotenv/config"
import { prisma } from "@/lib/prisma"
import { logActivity } from "@/lib/logActivity"

export async function GET() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" }
  })
  return Response.json(users)
}

export async function POST(request: Request) {
  const body = await request.json()

  if (!body.pubkey) {
    return Response.json({ error: "pubkey is required" }, { status: 400 })
  }

  // Check existence first so we know whether to log a creation or a login.
  const existing = await prisma.user.findUnique({
    where: { pubkey: body.pubkey },
  })

  const user = await prisma.user.upsert({
    where: { pubkey: body.pubkey },
    update: {
      ...(body.username !== undefined && { username: body.username }),
      ...(body.avatarUrl !== undefined && { avatarUrl: body.avatarUrl }),
    },
    create: {
      pubkey: body.pubkey,
      username: body.username,
      avatarUrl: body.avatarUrl,
    },
  })

  // Fire-and-forget: logActivity already swallows its own errors internally,
  // so this never blocks or breaks the response below.
  void logActivity({
    pubkey: body.pubkey,
    action: existing ? "account_login" : "account_created",
  })

  return Response.json(user, { status: existing ? 200 : 201 })
}