// 执行数据库迁移脚本
const fs = require('fs');
const path = require('path');

// SQLite3 Node.js模块
const sqlite3 = require('sqlite3').verbose();

const dbPath = path.join(__dirname, 'prisma', 'dev.db');
const db = new sqlite3.Database(dbPath);

console.log('🚀 开始执行数据库迁移...');

// 读取并执行模板增强迁移
const templateMigration = fs.readFileSync(path.join(__dirname, 'prisma', 'migrations', '20250929_add_template_enhancements.sql'), 'utf8');

db.exec(templateMigration, (err) => {
  if (err) {
    console.error('模板迁移执行失败:', err);
  } else {
    console.log('✅ 模板增强迁移执行成功');
  }

  // 读取并执行批量操作迁移
  const batchMigration = fs.readFileSync(path.join(__dirname, 'prisma', 'migrations', '20250929_add_batch_operations.sql'), 'utf8');

  db.exec(batchMigration, (err) => {
    if (err) {
      console.error('批量操作迁移执行失败:', err);
    } else {
      console.log('✅ 批量操作迁移执行成功');
    }

    // 读取并执行知识库迁移
    const knowledgeMigration = fs.readFileSync(path.join(__dirname, 'prisma', 'migrations', '20250929_add_knowledge_base.sql'), 'utf8');

    db.exec(knowledgeMigration, (err) => {
      if (err) {
        console.error('知识库迁移执行失败:', err);
      } else {
        console.log('✅ 知识库迁移执行成功');
      }

      // 验证表是否创建成功
      db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, rows) => {
        if (err) {
          console.error('查询表失败:', err);
        } else {
          console.log('\n📊 数据库中的表:');
          rows.forEach(row => console.log(`  - ${row.name}`));
        }

        db.close();
        console.log('\n🎉 数据库迁移完成！');
      });
    });
  });
});
