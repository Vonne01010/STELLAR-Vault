-- AlterTable
ALTER TABLE "User" ADD COLUMN     "country" TEXT,
ADD COLUMN     "governmentIdVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "kycPartner" TEXT,
ADD COLUMN     "tosAccepted" BOOLEAN NOT NULL DEFAULT false;
