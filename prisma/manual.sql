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
    "phoneE164" TEXT NOT NULL UNIQUE,
    "name" TEXT,
    "cooldownUntil" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

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
    "threadId" TEXT NOT NULL,
    "externalId" TEXT UNIQUE,
    "direction" TEXT NOT NULL,
    "text" TEXT,
    "status" TEXT NOT NULL DEFAULT 'SENT',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Message_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "Thread" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "Message_threadId_createdAt_idx" ON "Message" ("threadId", "createdAt");
