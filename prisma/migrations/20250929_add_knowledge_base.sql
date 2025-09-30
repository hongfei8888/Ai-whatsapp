-- 知识库集成功能数据库扩展
-- 执行时间: 2025-09-29

-- 1. 创建知识库表
CREATE TABLE KnowledgeBase (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4)))),
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  category VARCHAR(50) DEFAULT 'general',
  tags TEXT, -- JSON array of tags
  keywords TEXT, -- JSON array for search
  priority INTEGER DEFAULT 0, -- 优先级，数字越大越优先
  usageCount INTEGER DEFAULT 0,
  isActive BOOLEAN DEFAULT true,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  createdBy VARCHAR(100) DEFAULT 'system'
);

-- 2. 创建FAQ分类表
CREATE TABLE FAQCategory (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4)))),
  name VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  icon VARCHAR(20),
  color VARCHAR(7),
  sortOrder INTEGER DEFAULT 0,
  isActive BOOLEAN DEFAULT true,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 3. 插入默认FAQ分类
INSERT INTO FAQCategory (id, name, description, icon, color, sortOrder) VALUES
('product', '产品问题', '产品功能和使用问题', '📦', '#3B82F6', 1),
('billing', '计费问题', '价格、付费、退款等问题', '💰', '#10B981', 2),
('technical', '技术问题', '技术支持和故障排除', '🔧', '#F59E0B', 3),
('account', '账户问题', '登录、注册、密码等问题', '👤', '#8B5CF6', 4),
('other', '其他问题', '其他常见问题', '❓', '#6B7280', 5);

-- 4. 插入示例知识库数据
INSERT INTO KnowledgeBase (title, content, category, tags, keywords, priority, usageCount) VALUES
('如何注册账户？', '您可以通过以下步骤注册账户：

1. 访问我们的官方网站
2. 点击"注册"按钮
3. 填写必要的个人信息
4. 验证邮箱地址
5. 完成注册

如有疑问，请联系客服。', 'account', '["注册", "账户", "新用户"]', '["注册", "开户", "新用户", "账户", "如何注册"]', 10, 0),

('产品价格是多少？', '我们的产品有多种套餐：

基础版：¥99/月
- 包含基础功能
- 支持100个联系人

专业版：¥299/月
- 包含所有功能
- 支持1000个联系人
- 优先客服支持

企业版：¥999/月
- 包含所有功能
- 无联系人限制
- 专属客服支持

所有套餐均支持7天免费试用。', 'billing', '["价格", "套餐", "计费"]', '["价格", "费用", "多少钱", "套餐", "计费", "收费"]', 10, 0),

('如何联系客服？', '您可以通过以下方式联系我们：

1. 在线客服：工作日9:00-18:00
2. 邮箱：support@example.com
3. 电话：400-123-4567
4. 微信：扫描官网二维码

我们承诺在24小时内回复您的咨询。', 'other', '["客服", "联系", "支持"]', '["客服", "联系", "支持", "帮助", "人工"]', 8, 0),

('忘记密码怎么办？', '如果您忘记了密码，请按以下步骤操作：

1. 在登录页面点击"忘记密码"
2. 输入您的注册邮箱
3. 查收重置密码邮件
4. 点击邮件中的重置链接
5. 设置新密码

如果未收到邮件，请检查垃圾邮件文件夹。', 'account', '["密码", "忘记", "重置"]', '["密码", "忘记密码", "重置密码", "登录"]', 9, 0),

('如何导入联系人？', '您可以通过以下方式导入联系人：

方法1：CSV文件导入
1. 准备CSV文件（包含姓名、电话等）
2. 在联系人页面点击"导入"
3. 选择CSV文件上传
4. 确认导入信息

方法2：手动添加
1. 点击"添加联系人"
2. 填写联系人信息
3. 保存联系人

支持批量导入，最多1000个联系人。', 'technical', '["导入", "联系人", "CSV"]', '["导入", "联系人", "CSV", "批量", "添加联系人"]', 7, 0),

('系统支持哪些功能？', '我们的系统支持以下主要功能：

1. 智能自动回复
2. 联系人管理
3. 对话记录
4. 消息模板
5. 批量操作
6. 数据分析
7. 多账户管理
8. API接口

更多详细信息请查看产品文档。', 'product', '["功能", "特性", "系统"]', '["功能", "特性", "系统", "支持", "能力"]', 6, 0);

-- 5. 创建搜索索引
CREATE INDEX idx_knowledge_search ON KnowledgeBase(title, content);
CREATE INDEX idx_knowledge_category ON KnowledgeBase(category, isActive);
CREATE INDEX idx_knowledge_priority ON KnowledgeBase(priority DESC, usageCount DESC);
CREATE INDEX idx_knowledge_tags ON KnowledgeBase(tags);
CREATE INDEX idx_knowledge_keywords ON KnowledgeBase(keywords);
CREATE INDEX idx_knowledge_active ON KnowledgeBase(isActive, createdAt DESC);

-- 6. 创建全文搜索虚拟表（SQLite FTS5）
CREATE VIRTUAL TABLE knowledge_fts USING fts5(
  title, 
  content, 
  tags, 
  keywords, 
  category,
  content='KnowledgeBase',
  content_rowid='id'
);

-- 7. 为FTS表创建触发器，保持数据同步
CREATE TRIGGER knowledge_ai AFTER INSERT ON KnowledgeBase BEGIN
  INSERT INTO knowledge_fts(rowid, title, content, tags, keywords, category) 
  VALUES (new.rowid, new.title, new.content, new.tags, new.keywords, new.category);
END;

CREATE TRIGGER knowledge_ad AFTER DELETE ON KnowledgeBase BEGIN
  DELETE FROM knowledge_fts WHERE rowid = old.rowid;
END;

CREATE TRIGGER knowledge_au AFTER UPDATE ON KnowledgeBase BEGIN
  DELETE FROM knowledge_fts WHERE rowid = old.rowid;
  INSERT INTO knowledge_fts(rowid, title, content, tags, keywords, category) 
  VALUES (new.rowid, new.title, new.content, new.tags, new.keywords, new.category);
END;

-- 8. 插入现有数据到FTS表
INSERT INTO knowledge_fts(knowledge_fts) VALUES('rebuild');

-- 验证数据插入
SELECT 'Knowledge base migration completed successfully' as status;
SELECT COUNT(*) as knowledge_count FROM KnowledgeBase;
SELECT COUNT(*) as category_count FROM FAQCategory;
