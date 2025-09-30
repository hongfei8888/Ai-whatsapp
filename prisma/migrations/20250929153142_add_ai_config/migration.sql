-- CreateTable
CREATE TABLE "AiConfig" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'global',
    "systemPrompt" TEXT NOT NULL,
    "maxTokens" INTEGER NOT NULL DEFAULT 384,
    "temperature" REAL NOT NULL DEFAULT 0.4,
    "minChars" INTEGER NOT NULL DEFAULT 80,
    "stylePreset" TEXT NOT NULL DEFAULT 'concise-cn',
    "updatedAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
