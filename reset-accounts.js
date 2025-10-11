// 重置所有账号状态为离线
const { PrismaClient } = require('./server/node_modules/@prisma/client');

async function main() {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: 'file:./server/prisma/dev.db'
      }
    }
  });
  
  try {
    console.log('🔄 正在重置所有账号状态...');
    
    // 将所有账号状态改为 offline
    const result = await prisma.account.updateMany({
      data: {
        status: 'offline',
        phoneNumber: null,
      },
    });
    
    console.log(`✅ 成功重置 ${result.count} 个账号状态`);
    console.log('📝 现在可以重新添加账号了');
    
  } catch (error) {
    console.error('❌ 重置失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();

