-- Phase 4 community interactions. Existing upvotes remain positive votes.
ALTER TABLE "AnswerUpvote" ADD COLUMN "value" INTEGER NOT NULL DEFAULT 1;

ALTER TABLE "AnswerUpvote"
  ADD CONSTRAINT "AnswerUpvote_value_check" CHECK ("value" IN (-1, 1));

CREATE TABLE "AnswerComment" (
  "id" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "isDeleted" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "authorId" TEXT NOT NULL,
  "answerId" TEXT NOT NULL,
  CONSTRAINT "AnswerComment_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AnswerComment_answerId_createdAt_idx" ON "AnswerComment"("answerId", "createdAt");
CREATE INDEX "AnswerComment_authorId_idx" ON "AnswerComment"("authorId");

ALTER TABLE "AnswerComment"
  ADD CONSTRAINT "AnswerComment_authorId_fkey"
  FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "AnswerComment"
  ADD CONSTRAINT "AnswerComment_answerId_fkey"
  FOREIGN KEY ("answerId") REFERENCES "Answer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
