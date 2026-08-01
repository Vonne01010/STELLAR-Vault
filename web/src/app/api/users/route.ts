import "dotenv/config"
import { prisma } from "@/lib/prisma"
import { verifyAuth } from "@/lib/verifyAuth"
import { customAlphabet } from "nanoid"
import { Prisma } from "@prisma/client"

const genCode = customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 6) // no ambiguous chars
const REFERRAL_BONUS_POINTS = 100

async function generateUniqueReferralCode(tx: Prisma.TransactionClient): Promise<string> {
  for (let i = 0; i < 5; i++) {
    const code = genCode()
    const exists = await tx.user.findUnique({ where: { referralCode: code } })
    if (!exists) return code
  }
  throw new Error("Failed to generate a unique referral code after 5 attempts")
}

export async function GET() {
  const users = await prisma.user.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "desc" }
  })
  return Response.json(users)
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    if (!body.pubkey) {
      return Response.json({ error: "pubkey is required" }, { status: 400 })
    }

    const existing = await prisma.user.findUnique({ where: { pubkey: body.pubkey } })

    if (existing?.deletedAt) {
      return Response.json({ error: "This account has been deleted" }, { status: 410 })
    }

    if (existing) {
      const auth = await verifyAuth(request)
      if (!auth || auth.pubkey !== body.pubkey) {
        return Response.json({ error: "Cannot modify another user's profile" }, { status: 403 })
      }
    }

    const user = await prisma.$transaction(async (tx) => {
      let referrer = null
      if (body.referralCode) {
        const alreadyReferred = await tx.referral.findUnique({
          where: { refereePubkey: body.pubkey },
        })
        console.log('[referral debug] alreadyReferred:', alreadyReferred)

        if (!alreadyReferred) {
          referrer = await tx.user.findUnique({
            where: { referralCode: body.referralCode.trim().toUpperCase() },
          })
          console.log('[referral debug] looked up code:', body.referralCode.trim().toUpperCase(), '→ referrer found:', referrer?.pubkey ?? 'NONE')
        }
      }

      const savedUser = await tx.user.upsert({
        where: { pubkey: body.pubkey },
        update: {
          ...(body.username !== undefined && { username: body.username }),
          ...(body.avatarUrl !== undefined && { avatarUrl: body.avatarUrl }),
          ...(body.phone !== undefined && { phone: body.phone }),
          ...(body.phoneVerified !== undefined && { phoneVerified: body.phoneVerified }),
          ...(body.email !== undefined && { email: body.email }),
          ...(body.country !== undefined && { country: body.country }),
          ...(body.tosAccepted !== undefined && { tosAccepted: body.tosAccepted }),
        },
        create: {
          pubkey: body.pubkey,
          username: body.username,
          avatarUrl: body.avatarUrl,
          phone: body.phone,
          phoneVerified: body.phoneVerified ?? false,
          email: body.email,
          country: body.country,
          tosAccepted: body.tosAccepted ?? false,
          referralCode: await generateUniqueReferralCode(tx),
        },
      })

      if (referrer && referrer.pubkey !== savedUser.pubkey) {
        console.log('[referral debug] attempting to credit referrer:', referrer.pubkey)
        try {
          await tx.referral.create({
            data: {
              referrerPubkey: referrer.pubkey,
              refereePubkey: savedUser.pubkey,
              pointsAwarded: REFERRAL_BONUS_POINTS,
            },
          })
          await tx.user.update({
            where: { pubkey: referrer.pubkey },
            data: { points: { increment: REFERRAL_BONUS_POINTS } },
          })
          console.log('[referral debug] credited successfully')
        } catch (referralErr: any) {
          console.log('[referral debug] referral create/update FAILED:', referralErr.code, referralErr.message)
          if (referralErr.code !== 'P2002') throw referralErr
        }
      } else {
        console.log('[referral debug] skipped crediting — referrer:', referrer?.pubkey, 'savedUser:', savedUser.pubkey)
      }

      return savedUser
    })

    return Response.json(user, { status: 201 })
  } catch (error) {
    console.error("User upsert error:", error)
    return Response.json({ error: "Failed to save user" }, { status: 500 })
  }
}