-- AlterTable
ALTER TABLE "User" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "optionalDataDeletedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "User_isDeleted_deletedAt_idx" ON "User"("isDeleted", "deletedAt");
