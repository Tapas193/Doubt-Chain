-- AlterTable
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "role" TEXT DEFAULT 'STUDENT';

-- CreateTable
CREATE TABLE IF NOT EXISTS "TopicCluster" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "subjectId" TEXT,
    "vector" DOUBLE PRECISION[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TopicCluster_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "DoubtTopicAssignment" (
    "id" TEXT NOT NULL,
    "doubtId" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "similarity" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DoubtTopicAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "TopicCluster_subjectId_idx" ON "TopicCluster"("subjectId");
CREATE INDEX IF NOT EXISTS "TopicCluster_name_idx" ON "TopicCluster"("name");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "DoubtTopicAssignment_doubtId_key" ON "DoubtTopicAssignment"("doubtId");
CREATE INDEX IF NOT EXISTS "DoubtTopicAssignment_topicId_idx" ON "DoubtTopicAssignment"("topicId");
CREATE INDEX IF NOT EXISTS "DoubtTopicAssignment_doubtId_idx" ON "DoubtTopicAssignment"("doubtId");

-- AddForeignKey
ALTER TABLE "TopicCluster" ADD CONSTRAINT "TopicCluster_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DoubtTopicAssignment" ADD CONSTRAINT "DoubtTopicAssignment_doubtId_fkey" FOREIGN KEY ("doubtId") REFERENCES "Doubt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DoubtTopicAssignment" ADD CONSTRAINT "DoubtTopicAssignment_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "TopicCluster"("id") ON DELETE CASCADE ON UPDATE CASCADE;
