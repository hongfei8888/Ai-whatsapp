-- 🆕 多账号管理表
CREATE TABLE "Account" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "phoneNumber" TEXT,
    "phoneE164" TEXT UNIQUE,
    "status" TEXT NOT NULL DEFAULT 'offline',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastOnlineAt" DATETIME
);

CREATE INDEX "Account_status_isActive_idx" ON "Account"("status", "isActive");
CREATE INDEX "Account_phoneE164_idx" ON "Account"("phoneE164");

-- 插入默认账号
INSERT INTO "Account" ("id", "name", "status", "isActive", "createdAt", "updatedAt")
VALUES ('default-account-001', '默认账号', 'offline', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

CREATE TABLE "AiConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "systemPrompt" TEXT NOT NULL,
    "maxTokens" INTEGER NOT NULL DEFAULT 384,
    "temperature" REAL NOT NULL DEFAULT 0.4,
    "minChars" INTEGER NOT NULL DEFAULT 80,
    "stylePreset" TEXT NOT NULL DEFAULT 'concise-cn',
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "Contact" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "accountId" TEXT NOT NULL DEFAULT 'default-account-001',
    "phoneE164" TEXT NOT NULL,
    "name" TEXT,
    "cooldownUntil" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Contact_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "Contact_accountId_phoneE164_key" ON "Contact"("accountId", "phoneE164");
CREATE INDEX "Contact_accountId_idx" ON "Contact"("accountId");

CREATE TABLE "Thread" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contactId" TEXT NOT NULL UNIQUE,
    "aiEnabled" BOOLEAN NOT NULL DEFAULT false,
    "takenOver" BOOLEAN NOT NULL DEFAULT false,
    "takenOverAt" DATETIME,
    "lastHumanAt" DATETIME,
    "lastBotAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Thread_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "Message" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "accountId" TEXT NOT NULL DEFAULT 'default-account-001',
    "threadId" TEXT NOT NULL,
    "externalId" TEXT,
    "direction" TEXT NOT NULL,
    "text" TEXT,
    "status" TEXT NOT NULL DEFAULT 'SENT',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Message_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Message_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "Thread" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "Message_accountId_externalId_key" ON "Message"("accountId", "externalId");
CREATE INDEX "Message_accountId_threadId_createdAt_idx" ON "Message"("accountId", "threadId", "createdAt");
CREATE INDEX "Message_threadId_createdAt_idx" ON "Message" ("threadId", "createdAt");
