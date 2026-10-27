-- AlterTable Subject: add joinCode
ALTER TABLE "Subject" ADD COLUMN "joinCode" TEXT;
CREATE UNIQUE INDEX "Subject_joinCode_key" ON "Subject"("joinCode");

-- CreateTable SubjectMember
CREATE TABLE "SubjectMember" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SubjectMember_pkey" PRIMARY KEY ("id")
);

-- AlterTable Answer: add parentAnswerId for nested replies
ALTER TABLE "Answer" ADD COLUMN "parentAnswerId" TEXT;

-- CreateTable Attachment
CREATE TABLE "Attachment" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "fileType" "MediaType" NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "doubtId" TEXT,
    "answerId" TEXT,
    "uploaderId" TEXT NOT NULL,

    CONSTRAINT "Attachment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SubjectMember_userId_subjectId_key" ON "SubjectMember"("userId", "subjectId");
CREATE INDEX "SubjectMember_subjectId_idx" ON "SubjectMember"("subjectId");
CREATE INDEX "SubjectMember_userId_idx" ON "SubjectMember"("userId");

-- CreateIndex
CREATE INDEX "Answer_parentAnswerId_idx" ON "Answer"("parentAnswerId");

-- CreateIndex
CREATE INDEX "Attachment_doubtId_idx" ON "Attachment"("doubtId");
CREATE INDEX "Attachment_answerId_idx" ON "Attachment"("answerId");
CREATE INDEX "Attachment_uploaderId_idx" ON "Attachment"("uploaderId");

-- AddForeignKey
ALTER TABLE "SubjectMember" ADD CONSTRAINT "SubjectMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SubjectMember" ADD CONSTRAINT "SubjectMember_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Answer" ADD CONSTRAINT "Answer_parentAnswerId_fkey" FOREIGN KEY ("parentAnswerId") REFERENCES "Answer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_doubtId_fkey" FOREIGN KEY ("doubtId") REFERENCES "Doubt"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_answerId_fkey" FOREIGN KEY ("answerId") REFERENCES "Answer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_uploaderId_fkey" FOREIGN KEY ("uploaderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
