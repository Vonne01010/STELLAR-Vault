import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/verifyAuth";
import { submitLevel2Verification } from "@/lib/auth/verification.server";

export async function POST(req: NextRequest) {
  const auth = await verifyAuth(req);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const form = await req.formData();
  const raw = form.get("payload");
  if (typeof raw !== "string") {
    return NextResponse.json({ error: "Missing payload" }, { status: 400 });
  }

  const payload = JSON.parse(raw);

  // form.get("idImage") is available here but unused — no file storage wired up yet.

  await submitLevel2Verification(auth.pubkey, payload);

  return NextResponse.json({ ok: true });
}