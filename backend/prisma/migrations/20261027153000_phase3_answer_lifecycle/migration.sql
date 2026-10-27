-- Phase 3 answer lifecycle: retain removed answers for audit and link a
-- resolved doubt to its accepted answer. Both changes are additive and safe
-- for existing rows.
ALTER TABLE "Answer" ADD COLUMN "isDeleted" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "Doubt" ADD COLUMN "acceptedAnswerId" TEXT;

CREATE UNIQUE INDEX "Doubt_acceptedAnswerId_key" ON "Doubt"("acceptedAnswerId");

ALTER TABLE "Doubt"
  ADD CONSTRAINT "Doubt_acceptedAnswerId_fkey"
  FOREIGN KEY ("acceptedAnswerId") REFERENCES "Answer"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- Enforce the lifecycle invariant for all new and changed rows without
-- rejecting any legacy resolved rows that predate accepted-answer support.
ALTER TABLE "Doubt"
  ADD CONSTRAINT "Doubt_resolved_requires_accepted_answer"
  CHECK (NOT "isResolved" OR "acceptedAnswerId" IS NOT NULL) NOT VALID;
