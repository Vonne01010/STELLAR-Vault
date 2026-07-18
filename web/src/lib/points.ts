import { prisma } from "@/lib/prisma";

export async function getUserPoints(pubkey: string): Promise<number> {
  const user = await prisma.user.findUnique({
    where: { pubkey },
    select: { points: true },
  });
  return user?.points ?? 0;
}