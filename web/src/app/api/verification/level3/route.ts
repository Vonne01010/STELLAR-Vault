import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/verifyAuth';
import { attemptLevel3Upgrade } from '@/lib/auth/verification';

export async function POST(request: NextRequest) {
  const auth = await verifyAuth(request);
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const result = await attemptLevel3Upgrade(auth.pubkey);

  if (!result.ok) {
    return NextResponse.json(
      { error: 'Not yet eligible for Level 3', ...result },
      { status: 403 }
    );
  }

  return NextResponse.json(result);
}