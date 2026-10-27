-- CreateEnum
CREATE TYPE "ProcessingStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "FeedbackAction" AS ENUM ('ANSWERED_MY_DOUBT', 'NONE_HELPED_POSTED');

-- AlterTable Doubt
ALTER TABLE "Doubt" ADD COLUMN "aiQuestion" TEXT;
ALTER TABLE "Doubt" ADD COLUMN "aiAnswer" TEXT;
ALTER TABLE "Doubt" ADD COLUMN "aiTags" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Doubt" ADD COLUMN "aiGeneratedAt" TIMESTAMP(3);
ALTER TABLE "Doubt" ADD COLUMN "aiStatus" "ProcessingStatus" NOT NULL DEFAULT 'COMPLETED';

-- AlterTable Attachment
ALTER TABLE "Attachment" ADD COLUMN "extractedText" TEXT;
ALTER TABLE "Attachment" ADD COLUMN "processingStatus" "ProcessingStatus" NOT NULL DEFAULT 'COMPLETED';
ALTER TABLE "Attachment" ADD COLUMN "processingError" TEXT;

-- CreateTable DoubtEmbedding
CREATE TABLE "DoubtEmbedding" (
    "id" TEXT NOT NULL,
    "doubtId" TEXT NOT NULL,
    "contentHash" TEXT NOT NULL,
    "vector" DOUBLE PRECISION[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DoubtEmbedding_pkey" PRIMARY KEY ("id")
);

-- CreateTable SearchFeedback
CREATE TABLE "SearchFeedback" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "doubtId" TEXT,
    "action" "FeedbackAction" NOT NULL,
    "query" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SearchFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DoubtEmbedding_doubtId_key" ON "DoubtEmbedding"("doubtId");
CREATE INDEX "DoubtEmbedding_doubtId_idx" ON "DoubtEmbedding"("doubtId");

-- CreateIndex
CREATE UNIQUE INDEX "SearchFeedback_userId_doubtId_action_query_key" ON "SearchFeedback"("userId", "doubtId", "action", "query");
CREATE INDEX "SearchFeedback_userId_idx" ON "SearchFeedback"("userId");
CREATE INDEX "SearchFeedback_doubtId_idx" ON "SearchFeedback"("doubtId");

-- AddForeignKey
ALTER TABLE "DoubtEmbedding" ADD CONSTRAINT "DoubtEmbedding_doubtId_fkey" FOREIGN KEY ("doubtId") REFERENCES "Doubt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SearchFeedback" ADD CONSTRAINT "SearchFeedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SearchFeedback" ADD CONSTRAINT "SearchFeedback_doubtId_fkey" FOREIGN KEY ("doubtId") REFERENCES "Doubt"("id") ON DELETE SET NULL ON UPDATE CASCADE;
