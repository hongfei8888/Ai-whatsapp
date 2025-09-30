-- 消息模板管理功能数据库扩展
-- 执行时间: 2025-09-29

-- 1. 扩展MessageTemplate表
ALTER TABLE MessageTemplate ADD COLUMN category VARCHAR(50) DEFAULT 'general';
ALTER TABLE MessageTemplate ADD COLUMN tags TEXT; -- JSON array of tags
ALTER TABLE MessageTemplate ADD COLUMN isActive BOOLEAN DEFAULT true;
ALTER TABLE MessageTemplate ADD COLUMN usageCount INTEGER DEFAULT 0;
ALTER TABLE MessageTemplate ADD COLUMN lastUsedAt DATETIME;
ALTER TABLE MessageTemplate ADD COLUMN description TEXT;
ALTER TABLE MessageTemplate ADD COLUMN sortOrder INTEGER DEFAULT 0;

-- 2. 创建模板分类表
CREATE TABLE TemplateCategory (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4)))),
  name VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  icon VARCHAR(20),
  color VARCHAR(7),
  sortOrder INTEGER DEFAULT 0,
  isActive BOOLEAN DEFAULT true,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 3. 插入默认分类
INSERT INTO TemplateCategory (id, name, description, icon, color, sortOrder) VALUES
('greeting', '问候语', '初次接触和日常问候', '👋', '#10B981', 1),
('product', '产品介绍', '产品和服务介绍', '📦', '#3B82F6', 2),
('service', '售后服务', '客户服务和问题解答', '🛠️', '#F59E0B', 3),
('followup', '跟进回访', '客户跟进和回访', '📞', '#8B5CF6', 4),
('emergency', '紧急情况', '紧急情况处理', '🚨', '#EF4444', 5),
('general', '通用模板', '通用消息模板', '📝', '#6B7280', 6);

-- 4. 更新现有模板的默认分类
UPDATE MessageTemplate SET category = 'general' WHERE category IS NULL;
UPDATE MessageTemplate SET isActive = true WHERE isActive IS NULL;
UPDATE MessageTemplate SET usageCount = 0 WHERE usageCount IS NULL;
UPDATE MessageTemplate SET sortOrder = 0 WHERE sortOrder IS NULL;

-- 5. 创建索引优化查询性能
CREATE INDEX idx_template_category ON MessageTemplate(category, isActive);
CREATE INDEX idx_template_usage ON MessageTemplate(usageCount DESC, lastUsedAt DESC);
CREATE INDEX idx_template_active ON MessageTemplate(isActive, sortOrder);

-- 6. 插入示例模板数据
INSERT INTO MessageTemplate (name, content, category, description, tags, variables, sortOrder) VALUES
('欢迎问候', '您好！欢迎咨询我们的服务，我是您的专属客服。请问有什么可以帮助您的吗？', 'greeting', '新客户首次接触的欢迎语', '["欢迎", "问候", "客服"]', '["姓名", "服务"]', 1),
('产品介绍', '我们的产品具有以下特点：\n1. 功能强大\n2. 易于使用\n3. 性价比高\n\n您想了解哪个方面的详细信息呢？', 'product', '产品功能介绍模板', '["产品", "介绍", "特点"]', '["产品名", "特点"]', 2),
('售后服务', '感谢您的反馈！我们非常重视您的意见。\n\n您的{{问题类型}}问题我们已经收到，我们会尽快为您处理。预计{{处理时间}}内给您回复。', 'service', '售后服务标准回复', '["售后", "服务", "反馈"]', '["问题类型", "处理时间"]', 3),
('跟进回访', '您好{{姓名}}！距离我们上次联系已经有一段时间了。\n\n请问您对我们的{{产品/服务}}使用情况如何？有什么需要改进的地方吗？', 'followup', '客户跟进回访模板', '["跟进", "回访", "客户"]', '["姓名", "产品/服务"]', 4),
('紧急情况', '【紧急通知】\n\n您好，我们检测到您的账户存在异常情况。为了保障您的账户安全，请立即联系我们的客服团队。\n\n客服电话：{{客服电话}}\n工作时间：{{工作时间}}', 'emergency', '紧急情况处理模板', '["紧急", "通知", "安全"]', '["客服电话", "工作时间"]', 5);

-- 验证数据插入
SELECT 'Template enhancement migration completed successfully' as status;
SELECT COUNT(*) as template_count FROM MessageTemplate;
SELECT COUNT(*) as category_count FROM TemplateCategory;
