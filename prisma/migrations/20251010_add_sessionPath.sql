-- 添加 sessionPath 字段到 Account 表

-- 步骤 1: 创建新表结构
CREATE TABLE "Account_new" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "phoneNumber" TEXT,
    "phoneE164" TEXT,
    "sessionPath" TEXT NOT NULL UNIQUE,
    "status" TEXT NOT NULL DEFAULT 'offline',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "lastOnline" DATETIME
);

-- 步骤 2: 迁移数据（为每个账号生成唯一的 sessionPath）
INSERT INTO "Account_new" ("id", "name", "phoneNumber", "phoneE164", "sessionPath", "status", "isActive", "createdAt", "updatedAt", "lastOnline")
SELECT 
    "id",
    "name",
    "phoneNumber",
    "phoneE164",
    '.sessions/account_' || "id" as "sessionPath",  -- 生成唯一的 sessionPath
    "status",
    "isActive",
    "createdAt",
    "updatedAt",
    "lastOnlineAt"
FROM "Account";

-- 步骤 3: 删除旧表
DROP TABLE "Account";

-- 步骤 4: 重命名新表
ALTER TABLE "Account_new" RENAME TO "Account";

-- 步骤 5: 创建索引
CREATE INDEX "Account_status_isActive_idx" ON "Account"("status", "isActive");

