-- 清理离线账号的SQL脚本
-- 禁用外键约束检查
PRAGMA foreign_keys = OFF;

-- 删除所有状态为DISCONNECTED或FAILED的账号及其所有关联数据
DELETE FROM Account WHERE status IN ('DISCONNECTED', 'FAILED');

-- 重新启用外键约束检查
PRAGMA foreign_keys = ON;

-- 显示剩余账号
SELECT id, name, phoneNumber, status, lastOnline FROM Account;

