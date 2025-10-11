-- ========================================
-- 多账号支持迁移脚本（修复版）
-- 创建时间: 2025-10-10
-- ========================================

-- 步骤 1: 创建 Account 表（先创建表再创建索引）
CREATE TABLE IF NOT EXISTS "Account" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "phoneNumber" TEXT,
    "phoneE164" TEXT UNIQUE,
    "status" TEXT NOT NULL DEFAULT 'offline',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "lastOnlineAt" DATETIME
);

-- 步骤 2: 创建 Group 表
CREATE TABLE IF NOT EXISTS "Group" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "accountId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "isMonitoring" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "memberCount" INTEGER NOT NULL DEFAULT 0,
    "messageCount" INTEGER NOT NULL DEFAULT 0,
    "lastMessageAt" DATETIME,
    CONSTRAINT "Group_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- 步骤 3: 创建 GroupMember 表
CREATE TABLE IF NOT EXISTS "GroupMember" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "groupId" TEXT NOT NULL,
    "phoneE164" TEXT NOT NULL,
    "name" TEXT,
    "role" TEXT NOT NULL DEFAULT 'member',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "joinedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" DATETIME,
    CONSTRAINT "GroupMember_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- 步骤 4: 创建索引（表创建后）
CREATE INDEX IF NOT EXISTS "Account_status_isActive_idx" ON "Account"("status", "isActive");
CREATE INDEX IF NOT EXISTS "Account_phoneE164_idx" ON "Account"("phoneE164");
CREATE UNIQUE INDEX IF NOT EXISTS "Group_accountId_groupId_key" ON "Group"("accountId", "groupId");
CREATE INDEX IF NOT EXISTS "Group_accountId_isActive_idx" ON "Group"("accountId", "isActive");
CREATE UNIQUE INDEX IF NOT EXISTS "GroupMember_groupId_phoneE164_key" ON "GroupMember"("groupId", "phoneE164");
CREATE INDEX IF NOT EXISTS "GroupMember_groupId_isActive_idx" ON "GroupMember"("groupId", "isActive");

-- 步骤 5: 插入默认账号
INSERT OR IGNORE INTO "Account" ("id", "name", "phoneNumber", "status", "isActive", "createdAt", "updatedAt")
VALUES ('default-account-001', '默认账号', NULL, 'offline', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- 步骤 6: 备份现有表
CREATE TABLE IF NOT EXISTS "Contact_backup" AS SELECT * FROM "Contact";
CREATE TABLE IF NOT EXISTS "Message_backup" AS SELECT * FROM "Message";
CREATE TABLE IF NOT EXISTS "MessageTemplate_backup" AS SELECT * FROM "MessageTemplate";
CREATE TABLE IF NOT EXISTS "Campaign_backup" AS SELECT * FROM "Campaign";
CREATE TABLE IF NOT EXISTS "BatchOperation_backup" AS SELECT * FROM "BatchOperation";
CREATE TABLE IF NOT EXISTS "KnowledgeBase_backup" AS SELECT * FROM "KnowledgeBase";

-- 步骤 7: 更新 Contact 表
CREATE TABLE "Contact_new" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "accountId" TEXT NOT NULL,
    "phoneE164" TEXT NOT NULL,
    "name" TEXT,
    "consent" BOOLEAN NOT NULL DEFAULT true,
    "optedOutAt" DATETIME,
    "tags" TEXT,
    "source" TEXT,
    "importBatchId" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Contact_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

INSERT INTO "Contact_new" ("id", "accountId", "phoneE164", "name", "consent", "optedOutAt", "tags", "source", "importBatchId", "notes", "createdAt", "updatedAt")
SELECT "id", 'default-account-001', "phoneE164", "name", 
       COALESCE("consent", true), "optedOutAt", "tags", "source", "importBatchId", "notes", 
       "createdAt", "updatedAt"
FROM "Contact";

DROP TABLE "Contact";
ALTER TABLE "Contact_new" RENAME TO "Contact";
CREATE UNIQUE INDEX "Contact_accountId_phoneE164_key" ON "Contact"("accountId", "phoneE164");
CREATE INDEX "Contact_accountId_idx" ON "Contact"("accountId");

-- 步骤 8: 更新 Message 表
CREATE TABLE "Message_new" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "accountId" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "externalId" TEXT,
    "direction" TEXT NOT NULL,
    "text" TEXT,
    "translatedText" TEXT,
    "status" TEXT NOT NULL DEFAULT 'SENT',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
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
    CONSTRAINT "Message_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "Thread" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

INSERT INTO "Message_new" 
SELECT "id", 'default-account-001', "threadId", "externalId", "direction", "text", "translatedText", "status", "createdAt",
       "mediaUrl", "mediaType", "mediaMimeType", "mediaSize", "mediaFileName", "originalFileName", "thumbnailUrl", "duration",
       "replyToId", 
       COALESCE("isEdited", false), "editedAt", "originalText",
       COALESCE("isDeleted", false), "deletedAt", "deletedBy",
       COALESCE("isForwarded", false), "forwardedFrom",
       COALESCE("isStarred", false), "starredAt",
       "deliveredAt", "readAt"
FROM "Message";

DROP TABLE "Message";
ALTER TABLE "Message_new" RENAME TO "Message";
CREATE UNIQUE INDEX "Message_accountId_externalId_key" ON "Message"("accountId", "externalId");
CREATE INDEX "Message_accountId_threadId_createdAt_idx" ON "Message"("accountId", "threadId", "createdAt");
CREATE INDEX "Message_threadId_createdAt_idx" ON "Message"("threadId", "createdAt");
CREATE INDEX "Message_replyToId_idx" ON "Message"("replyToId");

-- 步骤 9: 更新 MessageTemplate 表
CREATE TABLE "MessageTemplate_new" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "accountId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL DEFAULT 'general',
    "tags" TEXT,
    "variables" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "lastUsedAt" DATETIME,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MessageTemplate_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

INSERT INTO "MessageTemplate_new"
SELECT "id", 'default-account-001', "name", "content", "description", 
       COALESCE("category", 'general'), "tags", "variables", 
       COALESCE("isActive", true), COALESCE("usageCount", 0), "lastUsedAt", COALESCE("sortOrder", 0),
       "createdAt", "updatedAt"
FROM "MessageTemplate";

DROP TABLE "MessageTemplate";
ALTER TABLE "MessageTemplate_new" RENAME TO "MessageTemplate";
CREATE INDEX "MessageTemplate_accountId_category_isActive_idx" ON "MessageTemplate"("accountId", "category", "isActive");
CREATE INDEX "MessageTemplate_usageCount_lastUsedAt_idx" ON "MessageTemplate"("usageCount", "lastUsedAt");

-- 步骤 10: 更新 Campaign 表
CREATE TABLE "Campaign_new" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "accountId" TEXT NOT NULL,
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
    CONSTRAINT "Campaign_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Campaign_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "MessageTemplate" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

INSERT INTO "Campaign_new"
SELECT "id", 'default-account-001', "name", "templateId", "content", "scheduleAt",
       COALESCE("ratePerMinute", 8), COALESCE("jitterMs", 300), COALESCE("status", 'DRAFT'),
       COALESCE("total", 0), COALESCE("sent", 0), COALESCE("failed", 0),
       "createdAt", "updatedAt"
FROM "Campaign";

DROP TABLE "Campaign";
ALTER TABLE "Campaign_new" RENAME TO "Campaign";
CREATE INDEX "Campaign_accountId_status_idx" ON "Campaign"("accountId", "status");

-- 步骤 11: 更新 BatchOperation 表
CREATE TABLE "BatchOperation_new" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "accountId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "title" TEXT NOT NULL,
    "description" TEXT,
    "totalCount" INTEGER NOT NULL DEFAULT 0,
    "processedCount" INTEGER NOT NULL DEFAULT 0,
    "successCount" INTEGER NOT NULL DEFAULT 0,
    "failedCount" INTEGER NOT NULL DEFAULT 0,
    "config" TEXT,
    "result" TEXT,
    "errorMessage" TEXT,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "startedAt" DATETIME,
    "completedAt" DATETIME,
    "createdBy" TEXT NOT NULL DEFAULT 'system',
    CONSTRAINT "BatchOperation_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

INSERT INTO "BatchOperation_new"
SELECT "id", 'default-account-001', "type", COALESCE("status", 'pending'), "title", "description",
       COALESCE("totalCount", 0), COALESCE("processedCount", 0), COALESCE("successCount", 0), COALESCE("failedCount", 0),
       "config", "result", "errorMessage", COALESCE("progress", 0),
       "createdAt", "updatedAt", "startedAt", "completedAt", COALESCE("createdBy", 'system')
FROM "BatchOperation";

DROP TABLE "BatchOperation";
ALTER TABLE "BatchOperation_new" RENAME TO "BatchOperation";
CREATE INDEX "BatchOperation_accountId_type_status_idx" ON "BatchOperation"("accountId", "type", "status");
CREATE INDEX "BatchOperation_type_status_idx" ON "BatchOperation"("type", "status");

-- 步骤 12: 更新 KnowledgeBase 表
CREATE TABLE "KnowledgeBase_new" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "accountId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'general',
    "tags" TEXT,
    "keywords" TEXT,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "createdBy" TEXT NOT NULL DEFAULT 'system',
    CONSTRAINT "KnowledgeBase_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

INSERT INTO "KnowledgeBase_new"
SELECT "id", 'default-account-001', "title", "content", COALESCE("category", 'general'),
       "tags", "keywords", COALESCE("priority", 0), COALESCE("usageCount", 0), COALESCE("isActive", true),
       "createdAt", "updatedAt", COALESCE("createdBy", 'system')
FROM "KnowledgeBase";

DROP TABLE "KnowledgeBase";
ALTER TABLE "KnowledgeBase_new" RENAME TO "KnowledgeBase";
CREATE INDEX "KnowledgeBase_accountId_category_isActive_idx" ON "KnowledgeBase"("accountId", "category", "isActive");
CREATE INDEX "KnowledgeBase_category_isActive_idx" ON "KnowledgeBase"("category", "isActive");
CREATE INDEX "KnowledgeBase_priority_usageCount_idx" ON "KnowledgeBase"("priority", "usageCount");

-- 完成！

