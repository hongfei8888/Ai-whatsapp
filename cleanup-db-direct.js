// 直接使用SQL清理数据库
const { PrismaClient } = require('./server/node_modules/@prisma/client');
const path = require('path');

const dbPath = path.join(__dirname, 'server', 'prisma', 'dev.db');
console.log('📂 数据库路径:', dbPath);

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: `file:${dbPath}`
    }
  }
});

async function cleanup() {
  try {
    console.log('🔍 查询所有账号...');
    
    const allAccounts = await prisma.account.findMany({
      select: {
        id: true,
        name: true,
        phoneNumber: true,
        status: true
      }
    });
    
    console.log(`\n📊 找到 ${allAccounts.length} 个账号:`);
    allAccounts.forEach(acc => {
      console.log(`  - ${acc.name} (${acc.phoneNumber || '无手机号'}) - ${acc.status}`);
    });
    
    // 找出离线账号
    const offlineAccounts = allAccounts.filter(acc => 
      acc.status === 'DISCONNECTED' || acc.status === 'FAILED'
    );
    
    if (offlineAccounts.length === 0) {
      console.log('\n✨ 没有需要删除的离线账号');
      return;
    }
    
    console.log(`\n🗑️  准备删除 ${offlineAccounts.length} 个离线账号...`);
    
    // 使用原始SQL禁用外键约束并删除
    console.log('⚠️  禁用外键约束检查...');
    await prisma.$executeRawUnsafe('PRAGMA foreign_keys = OFF');
    
    console.log('🗑️  删除离线账号...');
    const result = await prisma.$executeRawUnsafe(
      `DELETE FROM Account WHERE status IN ('DISCONNECTED', 'FAILED')`
    );
    
    console.log('✅  重新启用外键约束检查...');
    await prisma.$executeRawUnsafe('PRAGMA foreign_keys = ON');
    
    console.log(`\n✅ 成功删除 ${result} 个离线账号`);
    
    // 显示剩余账号
    const remainingAccounts = await prisma.account.findMany({
      select: {
        id: true,
        name: true,
        phoneNumber: true,
        status: true
      }
    });
    
    console.log(`\n📊 剩余 ${remainingAccounts.length} 个账号:`);
    remainingAccounts.forEach(acc => {
      console.log(`  - ${acc.name} (${acc.phoneNumber || '无手机号'}) - ${acc.status}`);
    });
    
  } catch (error) {
    console.error('❌ 清理失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanup();

