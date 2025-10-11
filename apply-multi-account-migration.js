#!/usr/bin/env node

/**
 * 应用多账号支持迁移脚本
 * 此脚本会读取SQL迁移文件并应用到SQLite数据库
 */

const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

// 数据库路径
const DB_PATH = path.join(__dirname, 'prisma', 'dev.db');
const MIGRATION_FILE = path.join(__dirname, 'prisma', 'migrations', '20251010_add_multi_account_support_fixed.sql');

console.log('🚀 开始应用多账号支持迁移...\n');

// 检查数据库文件是否存在
if (!fs.existsSync(DB_PATH)) {
  console.error('❌ 错误: 数据库文件不存在:', DB_PATH);
  console.log('请先运行 `npm run server` 以创建数据库\n');
  process.exit(1);
}

// 检查迁移文件是否存在
if (!fs.existsSync(MIGRATION_FILE)) {
  console.error('❌ 错误: 迁移文件不存在:', MIGRATION_FILE);
  process.exit(1);
}

// 读取迁移SQL
const migrationSQL = fs.readFileSync(MIGRATION_FILE, 'utf8');

// 连接数据库
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('❌ 连接数据库失败:', err.message);
    process.exit(1);
  }
  console.log('✅ 已连接到数据库:', DB_PATH);
});

// 执行迁移
db.serialize(() => {
  // 分割SQL语句（按分号和换行符）
  const statements = migrationSQL
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  let completed = 0;
  let failed = 0;

  console.log(`\n📝 共有 ${statements.length} 条SQL语句需要执行\n`);

  statements.forEach((statement, index) => {
    db.run(statement, function(err) {
      if (err) {
        // 忽略已存在的表/索引错误
        if (err.message.includes('already exists')) {
          console.log(`⚠️  [${index + 1}/${statements.length}] 跳过已存在的对象`);
          completed++;
        } else {
          console.error(`❌ [${index + 1}/${statements.length}] 执行失败:`, err.message);
          console.error('   SQL:', statement.substring(0, 100) + '...');
          failed++;
        }
      } else {
        completed++;
        // 只显示重要的操作
        if (statement.includes('CREATE TABLE')) {
          const tableName = statement.match(/CREATE TABLE\s+"?(\w+)"?/i)?.[1];
          console.log(`✅ [${index + 1}/${statements.length}] 创建表: ${tableName}`);
        } else if (statement.includes('INSERT INTO')) {
          const tableName = statement.match(/INSERT INTO\s+"?(\w+)"?/i)?.[1];
          console.log(`✅ [${index + 1}/${statements.length}] 迁移数据: ${tableName}`);
        } else if (statement.includes('DROP TABLE')) {
          const tableName = statement.match(/DROP TABLE\s+"?(\w+)"?/i)?.[1];
          console.log(`✅ [${index + 1}/${statements.length}] 删除旧表: ${tableName}`);
        } else if (statement.includes('ALTER TABLE')) {
          console.log(`✅ [${index + 1}/${statements.length}] 重命名表`);
        }
      }

      // 最后一条语句执行完毕
      if (index === statements.length - 1) {
        setTimeout(() => {
          console.log('\n' + '='.repeat(60));
          console.log(`✅ 迁移完成! 成功: ${completed}, 失败: ${failed}`);
          console.log('='.repeat(60) + '\n');

          if (failed > 0) {
            console.log('⚠️  有部分语句执行失败，请检查错误信息');
          } else {
            console.log('🎉 所有语句都已成功执行!');
            console.log('\n📋 下一步操作:');
            console.log('   1. 运行 `npx prisma generate` 重新生成Prisma客户端');
            console.log('   2. 重启后端服务器');
          }

          // 关闭数据库连接
          db.close((err) => {
            if (err) {
              console.error('❌ 关闭数据库失败:', err.message);
            }
            process.exit(failed > 0 ? 1 : 0);
          });
        }, 500);
      }
    });
  });
});

