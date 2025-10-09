-- 批量操作功能数据库扩展
-- 执行时间: 2025-09-29

-- 1. 扩展Contact表
ALTER TABLE Contact ADD COLUMN tags TEXT; -- JSON array of tags
ALTER TABLE Contact ADD COLUMN source VARCHAR(50); -- 导入来源
ALTER TABLE Contact ADD COLUMN importBatchId TEXT; -- 批量导入批次ID
ALTER TABLE Contact ADD COLUMN notes TEXT; -- 备注信息

-- 2. 创建批量操作记录表
CREATE TABLE BatchOperation (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4)))),
  type VARCHAR(50) NOT NULL, -- 'import', 'send', 'tag', 'delete', 'archive'
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed', 'cancelled'
  title VARCHAR(200) NOT NULL,
  description TEXT,
  totalCount INTEGER DEFAULT 0,
  processedCount INTEGER DEFAULT 0,
  successCount INTEGER DEFAULT 0,
  failedCount INTEGER DEFAULT 0,
  config TEXT, -- JSON config
  result TEXT, -- JSON result
  errorMessage TEXT,
  progress INTEGER DEFAULT 0, -- 0-100
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  startedAt DATETIME,
  completedAt DATETIME,
  createdBy VARCHAR(100) DEFAULT 'system'
);

-- 3. 创建批量操作明细表
CREATE TABLE BatchOperationItem (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4)))),
  batchId TEXT NOT NULL,
  itemIndex INTEGER NOT NULL,
  itemData TEXT, -- JSON data
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed', 'skipped'
  errorMessage TEXT,
  result TEXT, -- JSON result
  processedAt DATETIME,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (batchId) REFERENCES BatchOperation(id) ON DELETE CASCADE
);

-- 4. 创建索引优化查询性能
CREATE INDEX idx_batch_operation_type_status ON BatchOperation(type, status);
CREATE INDEX idx_batch_operation_item_batch_status ON BatchOperationItem(batchId, status);
CREATE INDEX idx_batch_operation_created_at ON BatchOperation(createdAt DESC);
CREATE INDEX idx_contact_tags ON Contact(tags);
CREATE INDEX idx_contact_source ON Contact(source);
CREATE INDEX idx_contact_import_batch ON Contact(importBatchId);

-- 5. 更新现有联系人数据
UPDATE Contact SET tags = '[]' WHERE tags IS NULL;
UPDATE Contact SET source = 'manual' WHERE source IS NULL;

-- 验证数据插入
SELECT 'Batch operations migration completed successfully' as status;
SELECT COUNT(*) as batch_operations_count FROM BatchOperation;
SELECT COUNT(*) as batch_items_count FROM BatchOperationItem;
