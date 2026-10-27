-- CreateTable
CREATE TABLE IF NOT EXISTS "AiAssistantConversation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subjectId" TEXT,
    "language" TEXT NOT NULL DEFAULT 'en',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiAssistantConversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "AiAssistantMessage" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "retrievedContext" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiAssistantMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "AiResponseFeedback" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "isHelpful" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiResponseFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "AiResponseReport" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "details" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiResponseReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "AiAssistantConversation_userId_updatedAt_idx" ON "AiAssistantConversation"("userId", "updatedAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "AiAssistantMessage_conversationId_createdAt_idx" ON "AiAssistantMessage"("conversationId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "AiResponseFeedback_messageId_key" ON "AiResponseFeedback"("messageId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "AiResponseFeedback_userId_idx" ON "AiResponseFeedback"("userId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "AiResponseFeedback_userId_messageId_key" ON "AiResponseFeedback"("userId", "messageId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "AiResponseReport_userId_idx" ON "AiResponseReport"("userId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "AiResponseReport_messageId_idx" ON "AiResponseReport"("messageId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "AiResponseReport_userId_messageId_key" ON "AiResponseReport"("userId", "messageId");

-- AddForeignKey
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'AiAssistantConversation_userId_fkey') THEN
        ALTER TABLE "AiAssistantConversation" ADD CONSTRAINT "AiAssistantConversation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'AiAssistantMessage_conversationId_fkey') THEN
        ALTER TABLE "AiAssistantMessage" ADD CONSTRAINT "AiAssistantMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "AiAssistantConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'AiResponseFeedback_messageId_fkey') THEN
        ALTER TABLE "AiResponseFeedback" ADD CONSTRAINT "AiResponseFeedback_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "AiAssistantMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'AiResponseFeedback_userId_fkey') THEN
        ALTER TABLE "AiResponseFeedback" ADD CONSTRAINT "AiResponseFeedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'AiResponseReport_messageId_fkey') THEN
        ALTER TABLE "AiResponseReport" ADD CONSTRAINT "AiResponseReport_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "AiAssistantMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'AiResponseReport_userId_fkey') THEN
        ALTER TABLE "AiResponseReport" ADD CONSTRAINT "AiResponseReport_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
