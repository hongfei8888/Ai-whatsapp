-- 检查并添加 sessionPath 列到 Account 表

-- 由于 SQLite 不支持 ALTER TABLE ADD COLUMN IF NOT EXISTS，
-- 我们需要使用创建新表的方式

-- 1. 创建临时表
DROP TABLE IF EXISTS Account_temp;

-- 2. 创建新的 Account 表结构（包含 sessionPath）
CREATE TABLE Account_temp (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phoneNumber TEXT,
    phoneE164 TEXT,
    sessionPath TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'offline',
    isActive INTEGER NOT NULL DEFAULT 1,
    createdAt TEXT NOT NULL DEFAULT (datetime('now')),
    updatedAt TEXT NOT NULL,
    lastOnline TEXT
);

-- 3. 从旧表复制数据，为每个账号生成唯一的 sessionPath
INSERT INTO Account_temp (id, name, phoneNumber, phoneE164, sessionPath, status, isActive, createdAt, updatedAt, lastOnline)
SELECT 
    id,
    name,
    phoneNumber,
    phoneE164,
    '.sessions/account_' || id AS sessionPath,
    status,
    isActive,
    createdAt,
    updatedAt,
    lastOnline
FROM Account;

-- 4. 删除旧表
DROP TABLE Account;

-- 5. 重命名新表
ALTER TABLE Account_temp RENAME TO Account;

-- 6. 创建索引
CREATE INDEX Account_status_isActive_idx ON Account(status, isActive);

-- 完成！
SELECT '✅ Account 表已更新，添加了 sessionPath 字段' AS result;
SELECT COUNT(*) as account_count FROM Account;

