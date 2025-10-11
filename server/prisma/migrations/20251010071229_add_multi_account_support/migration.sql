/*
  Warnings:

  - You are about to drop the column `cooldownUntil` on the `Contact` table. All the data in the column will be lost.
  - Added the required column `accountId` to the `Campaign` table without a default value. This is not possible if the table is not empty.
  - Added the required column `accountId` to the `Contact` table without a default value. This is not possible if the table is not empty.
  - Added the required column `accountId` to the `Message` table without a default value. This is not possible if the table is not empty.
  - Added the required column `accountId` to the `MessageTemplate` table without a default value. This is not possible if the table is not empty.
  - Added the required column `accountId` to the `Thread` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "phoneNumber" TEXT,
    "status" TEXT NOT NULL DEFAULT 'offline',
    "sessionPath" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastOnline" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "TemplateCategory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "color" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "BatchOperation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "title" TEXT NOT NULL,
    "description" TEXT,
    "totalCount" INTEGER NOT NULL DEFAULT 0,
    "processedCount" INTEGER NOT NULL DEFAULT 0,
    "successCount" INTEGER NOT NULL DEFAULT 0,
    "failedCount" INTEGER NOT NULL DEFAULT 0,
    "config" JSONB,
    "result" JSONB,
    "errorMessage" TEXT,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "startedAt" DATETIME,
    "completedAt" DATETIME,
    "createdBy" TEXT NOT NULL DEFAULT 'system',
    "accountId" TEXT NOT NULL,
    CONSTRAINT "BatchOperation_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BatchOperationItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "batchId" TEXT NOT NULL,
    "itemIndex" INTEGER NOT NULL,
    "itemData" JSONB,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "errorMessage" TEXT,
    "result" JSONB,
    "processedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BatchOperationItem_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "BatchOperation" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "KnowledgeBase" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'general',
    "tags" JSONB,
    "keywords" JSONB,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "createdBy" TEXT NOT NULL DEFAULT 'system',
    "accountId" TEXT NOT NULL,
    CONSTRAINT "KnowledgeBase_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FAQCategory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "color" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "translations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "originalText" TEXT NOT NULL,
    "translatedText" TEXT NOT NULL,
    "sourceLang" TEXT NOT NULL,
    "targetLang" TEXT NOT NULL,
    "textHash" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'baidu',
    "usageCount" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "accountId" TEXT NOT NULL,
    CONSTRAINT "translations_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "JoinGroupTask" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "inviteLinks" JSONB NOT NULL,
    "totalLinks" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "joinedCount" INTEGER NOT NULL DEFAULT 0,
    "failedCount" INTEGER NOT NULL DEFAULT 0,
    "config" JSONB,
    "result" JSONB,
    "errorMessage" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" DATETIME,
    "completedAt" DATETIME,
    "accountId" TEXT NOT NULL,
    CONSTRAINT "JoinGroupTask_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WhatsAppGroup" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "groupId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "avatarUrl" TEXT,
    "memberCount" INTEGER NOT NULL DEFAULT 0,
    "tags" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isMonitoring" BOOLEAN NOT NULL DEFAULT false,
    "keywords" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "accountId" TEXT NOT NULL,
    CONSTRAINT "WhatsAppGroup_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GroupBroadcast" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "mediaUrl" TEXT,
    "targetGroupIds" JSONB NOT NULL,
    "totalGroups" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "sentCount" INTEGER NOT NULL DEFAULT 0,
    "failedCount" INTEGER NOT NULL DEFAULT 0,
    "scheduledAt" DATETIME,
    "result" JSONB,
    "errorMessage" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" DATETIME,
    "completedAt" DATETIME,
    "accountId" TEXT NOT NULL,
    CONSTRAINT "GroupBroadcast_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GroupMember" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "groupId" TEXT NOT NULL,
    "phoneE164" TEXT NOT NULL,
    "displayName" TEXT,
    "role" TEXT NOT NULL DEFAULT 'member',
    "messageCount" INTEGER NOT NULL DEFAULT 0,
    "lastMessageAt" DATETIME,
    "joinedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "leftAt" DATETIME,
    CONSTRAINT "GroupMember_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "WhatsAppGroup" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GroupMessage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "groupId" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "fromPhone" TEXT NOT NULL,
    "fromName" TEXT,
    "text" TEXT,
    "mediaType" TEXT,
    "mediaUrl" TEXT,
    "keywords" JSONB,
    "isViolation" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GroupMessage_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "WhatsAppGroup" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GroupActivity" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "groupId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "actorPhone" TEXT,
    "targetPhone" TEXT,
    "data" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GroupActivity_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "WhatsAppGroup" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_GroupBroadcastToWhatsAppGroup" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_GroupBroadcastToWhatsAppGroup_A_fkey" FOREIGN KEY ("A") REFERENCES "GroupBroadcast" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_GroupBroadcastToWhatsAppGroup_B_fkey" FOREIGN KEY ("B") REFERENCES "WhatsAppGroup" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Campaign" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "templateId" TEXT,
    "content" TEXT,
    "scheduleAt" DATETIME,
    "ratePerMinute" INTEGER NOT NULL DEFAULT 8,
    "jitterMs" INTEGER NOT NULL DEFAULT 300,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "total" INTEGER NOT NULL DEFAULT 0,
    "sent" INTEGER NOT NULL DEFAULT 0,
    "failed" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "accountId" TEXT NOT NULL,
    CONSTRAINT "Campaign_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Campaign_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "MessageTemplate" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Campaign" ("content", "createdAt", "failed", "id", "jitterMs", "name", "ratePerMinute", "scheduleAt", "sent", "status", "templateId", "total", "updatedAt") SELECT "content", "createdAt", "failed", "id", "jitterMs", "name", "ratePerMinute", "scheduleAt", "sent", "status", "templateId", "total", "updatedAt" FROM "Campaign";
DROP TABLE "Campaign";
ALTER TABLE "new_Campaign" RENAME TO "Campaign";
CREATE INDEX "Campaign_accountId_idx" ON "Campaign"("accountId");
CREATE TABLE "new_Contact" (
    "consent" BOOLEAN NOT NULL DEFAULT true,
    "optedOutAt" DATETIME,
    "tags" JSONB,
    "source" TEXT,
    "importBatchId" TEXT,
    "notes" TEXT,
    "avatarUrl" TEXT,
    "id" TEXT NOT NULL PRIMARY KEY,
    "phoneE164" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "accountId" TEXT NOT NULL,
    CONSTRAINT "Contact_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Contact" ("avatarUrl", "consent", "createdAt", "id", "name", "optedOutAt", "phoneE164", "updatedAt") SELECT "avatarUrl", "consent", "createdAt", "id", "name", "optedOutAt", "phoneE164", "updatedAt" FROM "Contact";
DROP TABLE "Contact";
ALTER TABLE "new_Contact" RENAME TO "Contact";
CREATE INDEX "Contact_accountId_idx" ON "Contact"("accountId");
CREATE UNIQUE INDEX "Contact_accountId_phoneE164_key" ON "Contact"("accountId", "phoneE164");
CREATE TABLE "new_Message" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "threadId" TEXT NOT NULL,
    "externalId" TEXT,
    "direction" TEXT NOT NULL,
    "text" TEXT,
    "translatedText" TEXT,
    "status" TEXT NOT NULL DEFAULT 'SENT',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "accountId" TEXT NOT NULL,
    "mediaUrl" TEXT,
    "mediaType" TEXT,
    "mediaMimeType" TEXT,
    "mediaSize" INTEGER,
    "mediaFileName" TEXT,
    "originalFileName" TEXT,
    "thumbnailUrl" TEXT,
    "duration" INTEGER,
    "replyToId" TEXT,
    "isEdited" BOOLEAN NOT NULL DEFAULT false,
    "editedAt" DATETIME,
    "originalText" TEXT,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" DATETIME,
    "deletedBy" TEXT,
    "isForwarded" BOOLEAN NOT NULL DEFAULT false,
    "forwardedFrom" TEXT,
    "isStarred" BOOLEAN NOT NULL DEFAULT false,
    "starredAt" DATETIME,
    "deliveredAt" DATETIME,
    "readAt" DATETIME,
    CONSTRAINT "Message_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Message_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "Thread" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Message_replyToId_fkey" FOREIGN KEY ("replyToId") REFERENCES "Message" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Message" ("createdAt", "direction", "externalId", "id", "status", "text", "threadId") SELECT "createdAt", "direction", "externalId", "id", "status", "text", "threadId" FROM "Message";
DROP TABLE "Message";
ALTER TABLE "new_Message" RENAME TO "Message";
CREATE INDEX "Message_accountId_idx" ON "Message"("accountId");
CREATE INDEX "Message_threadId_createdAt_idx" ON "Message"("threadId", "createdAt");
CREATE INDEX "Message_replyToId_idx" ON "Message"("replyToId");
CREATE UNIQUE INDEX "Message_accountId_externalId_key" ON "Message"("accountId", "externalId");
CREATE TABLE "new_MessageTemplate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL DEFAULT 'general',
    "tags" JSONB,
    "variables" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "lastUsedAt" DATETIME,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "accountId" TEXT NOT NULL,
    CONSTRAINT "MessageTemplate_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_MessageTemplate" ("content", "createdAt", "id", "name", "updatedAt", "variables") SELECT "content", "createdAt", "id", "name", "updatedAt", "variables" FROM "MessageTemplate";
DROP TABLE "MessageTemplate";
ALTER TABLE "new_MessageTemplate" RENAME TO "MessageTemplate";
CREATE INDEX "MessageTemplate_accountId_idx" ON "MessageTemplate"("accountId");
CREATE INDEX "MessageTemplate_category_isActive_idx" ON "MessageTemplate"("category", "isActive");
CREATE INDEX "MessageTemplate_usageCount_lastUsedAt_idx" ON "MessageTemplate"("usageCount", "lastUsedAt");
CREATE TABLE "new_Thread" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contactId" TEXT NOT NULL,
    "aiEnabled" BOOLEAN NOT NULL DEFAULT false,
    "autoTranslate" BOOLEAN NOT NULL DEFAULT false,
    "takenOver" BOOLEAN NOT NULL DEFAULT false,
    "takenOverAt" DATETIME,
    "lastHumanAt" DATETIME,
    "lastBotAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "accountId" TEXT NOT NULL,
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "pinnedAt" DATETIME,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "archivedAt" DATETIME,
    "labels" JSONB,
    "unreadCount" INTEGER NOT NULL DEFAULT 0,
    "lastReadAt" DATETIME,
    "draft" TEXT,
    "draftUpdatedAt" DATETIME,
    "notes" TEXT,
    CONSTRAINT "Thread_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Thread_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Thread" ("aiEnabled", "contactId", "createdAt", "id", "lastBotAt", "lastHumanAt", "takenOver", "takenOverAt", "updatedAt") SELECT "aiEnabled", "contactId", "createdAt", "id", "lastBotAt", "lastHumanAt", "takenOver", "takenOverAt", "updatedAt" FROM "Thread";
DROP TABLE "Thread";
ALTER TABLE "new_Thread" RENAME TO "Thread";
CREATE UNIQUE INDEX "Thread_contactId_key" ON "Thread"("contactId");
CREATE INDEX "Thread_accountId_idx" ON "Thread"("accountId");
CREATE INDEX "Thread_isPinned_updatedAt_idx" ON "Thread"("isPinned", "updatedAt");
CREATE INDEX "Thread_isArchived_idx" ON "Thread"("isArchived");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Account_sessionPath_key" ON "Account"("sessionPath");

-- CreateIndex
CREATE INDEX "Account_status_isActive_idx" ON "Account"("status", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "TemplateCategory_name_key" ON "TemplateCategory"("name");

-- CreateIndex
CREATE INDEX "BatchOperation_accountId_idx" ON "BatchOperation"("accountId");

-- CreateIndex
CREATE INDEX "BatchOperation_type_status_idx" ON "BatchOperation"("type", "status");

-- CreateIndex
CREATE INDEX "BatchOperationItem_batchId_status_idx" ON "BatchOperationItem"("batchId", "status");

-- CreateIndex
CREATE INDEX "KnowledgeBase_accountId_idx" ON "KnowledgeBase"("accountId");

-- CreateIndex
CREATE INDEX "KnowledgeBase_category_isActive_idx" ON "KnowledgeBase"("category", "isActive");

-- CreateIndex
CREATE INDEX "KnowledgeBase_priority_usageCount_idx" ON "KnowledgeBase"("priority", "usageCount");

-- CreateIndex
CREATE UNIQUE INDEX "FAQCategory_name_key" ON "FAQCategory"("name");

-- CreateIndex
CREATE INDEX "translations_accountId_idx" ON "translations"("accountId");

-- CreateIndex
CREATE INDEX "translations_textHash_idx" ON "translations"("textHash");

-- CreateIndex
CREATE UNIQUE INDEX "translations_accountId_textHash_key" ON "translations"("accountId", "textHash");

-- CreateIndex
CREATE INDEX "JoinGroupTask_accountId_idx" ON "JoinGroupTask"("accountId");

-- CreateIndex
CREATE INDEX "JoinGroupTask_status_createdAt_idx" ON "JoinGroupTask"("status", "createdAt");

-- CreateIndex
CREATE INDEX "WhatsAppGroup_accountId_idx" ON "WhatsAppGroup"("accountId");

-- CreateIndex
CREATE INDEX "WhatsAppGroup_groupId_idx" ON "WhatsAppGroup"("groupId");

-- CreateIndex
CREATE INDEX "WhatsAppGroup_isActive_isMonitoring_idx" ON "WhatsAppGroup"("isActive", "isMonitoring");

-- CreateIndex
CREATE UNIQUE INDEX "WhatsAppGroup_accountId_groupId_key" ON "WhatsAppGroup"("accountId", "groupId");

-- CreateIndex
CREATE INDEX "GroupBroadcast_accountId_idx" ON "GroupBroadcast"("accountId");

-- CreateIndex
CREATE INDEX "GroupBroadcast_status_scheduledAt_idx" ON "GroupBroadcast"("status", "scheduledAt");

-- CreateIndex
CREATE INDEX "GroupBroadcast_createdAt_idx" ON "GroupBroadcast"("createdAt");

-- CreateIndex
CREATE INDEX "GroupMember_groupId_isActive_idx" ON "GroupMember"("groupId", "isActive");

-- CreateIndex
CREATE INDEX "GroupMember_phoneE164_idx" ON "GroupMember"("phoneE164");

-- CreateIndex
CREATE UNIQUE INDEX "GroupMember_groupId_phoneE164_key" ON "GroupMember"("groupId", "phoneE164");

-- CreateIndex
CREATE UNIQUE INDEX "GroupMessage_messageId_key" ON "GroupMessage"("messageId");

-- CreateIndex
CREATE INDEX "GroupMessage_groupId_createdAt_idx" ON "GroupMessage"("groupId", "createdAt");

-- CreateIndex
CREATE INDEX "GroupMessage_fromPhone_idx" ON "GroupMessage"("fromPhone");

-- CreateIndex
CREATE INDEX "GroupMessage_isViolation_idx" ON "GroupMessage"("isViolation");

-- CreateIndex
CREATE INDEX "GroupActivity_groupId_type_createdAt_idx" ON "GroupActivity"("groupId", "type", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "_GroupBroadcastToWhatsAppGroup_AB_unique" ON "_GroupBroadcastToWhatsAppGroup"("A", "B");

-- CreateIndex
CREATE INDEX "_GroupBroadcastToWhatsAppGroup_B_index" ON "_GroupBroadcastToWhatsAppGroup"("B");
