-- AlterTable
ALTER TABLE "User" ADD COLUMN     "allergenDisclaimerAcceptedAt" TIMESTAMP(3),
ADD COLUMN     "analyticsEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "communityGuidelinesVersion" TEXT,
ADD COLUMN     "personalisedRecommendationsEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "privacyNoticeSeenAt" TIMESTAMP(3),
ADD COLUMN     "productEmailsEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "termsAcceptedAt" TIMESTAMP(3),
ADD COLUMN     "termsVersion" TEXT;
