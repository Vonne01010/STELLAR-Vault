import jwt from "jsonwebtoken"
import { prisma } from "@/lib/prisma"

export async function verifyAuth(request: Request): Promise<{ pubkey: string } | null> {
  const authHeader = request.headers.get("authorization")

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null
  }

  const token = authHeader.replace("Bearer ", "").trim()

  const secret = process.env.JWT_SECRET
  if (!secret) {
    return null
  }

  try {
    const payload = jwt.verify(token, secret) as { pubkey?: string }
    if (!payload.pubkey || typeof payload.pubkey !== "string") {
      return null
    }

    const user = await prisma.user.findUnique({ where: { pubkey: payload.pubkey } })
    if (!user || user.deletedAt) {
      return null
    }

    return { pubkey: payload.pubkey }
  } catch (error) {
    return null
  }
}