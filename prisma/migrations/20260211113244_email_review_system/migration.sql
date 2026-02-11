-- CreateEnum
CREATE TYPE "EmailFilterStatus" AS ENUM ('UNPROCESSED', 'PASSED', 'REJECTED_SENDER', 'REJECTED_SUBJECT', 'REJECTED_CONTENT', 'USER_OVERRIDE');

-- CreateEnum
CREATE TYPE "EmailReviewStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'SKIPPED', 'AUTO_LINKED');

-- AlterTable
ALTER TABLE "Email" ADD COLUMN     "filterReason" TEXT,
ADD COLUMN     "filterStatus" "EmailFilterStatus" NOT NULL DEFAULT 'UNPROCESSED',
ADD COLUMN     "parseError" TEXT,
ADD COLUMN     "reviewStatus" "EmailReviewStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "reviewedAt" TIMESTAMP(3),
ADD COLUMN     "userId" TEXT;

-- CreateIndex
CREATE INDEX "Email_userId_filterStatus_idx" ON "Email"("userId", "filterStatus");

-- CreateIndex
CREATE INDEX "Email_userId_reviewStatus_idx" ON "Email"("userId", "reviewStatus");

-- CreateIndex
CREATE INDEX "Email_threadId_idx" ON "Email"("threadId");

-- AddForeignKey
ALTER TABLE "Email" ADD CONSTRAINT "Email_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
