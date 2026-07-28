import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/verifyAuth';
import { checkLevel3Eligibility } from '@/lib/auth/verification';

export async function GET(request: NextRequest) {
  const auth = await verifyAuth(request);
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const result = await checkLevel3Eligibility(auth.pubkey);
  return NextResponse.json(result);
}