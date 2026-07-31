import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')?.trim().toUpperCase();
  if (!code) {
    return NextResponse.json({ valid: false }, { status: 400 });
  }

  const referrer = await prisma.user.findUnique({
    where: { referralCode: code },
    select: { pubkey: true, username: true },
  });

  if (!referrer) {
    return NextResponse.json({ valid: false });
  }

  return NextResponse.json({ valid: true, referrerName: referrer.username });
}