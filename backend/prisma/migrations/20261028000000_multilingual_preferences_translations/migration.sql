-- AlterTable
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "preferredLanguage" TEXT DEFAULT 'en';

-- AlterTable
ALTER TABLE "Attachment" ADD COLUMN IF NOT EXISTS "detectedLanguage" TEXT;

-- CreateTable
CREATE TABLE IF NOT EXISTS "ContentTranslation" (
    "id" TEXT NOT NULL,
    "sourceHash" TEXT NOT NULL,
    "targetLang" TEXT NOT NULL,
    "sourceLang" TEXT,
    "translatedText" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContentTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "ContentTranslation_sourceHash_targetLang_key" ON "ContentTranslation"("sourceHash", "targetLang");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ContentTranslation_sourceHash_idx" ON "ContentTranslation"("sourceHash");
