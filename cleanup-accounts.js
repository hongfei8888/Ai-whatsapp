// 清理离线账号的脚本
const path = require('path');
const { PrismaClient } = require('./server/node_modules/@prisma/client');

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
    
    const accounts = await prisma.account.findMany({
      select: {
        id: true,
        name: true,
        phoneNumber: true,
        status: true,
        lastOnline: true
      }
    });
    
    console.log(`📊 找到 ${accounts.length} 个账号`);
    
    // 找出在线账号
    const onlineAccounts = accounts.filter(acc => 
      acc.status === 'online' || acc.status === 'READY'
    );
    
    // 找出离线账号
    const offlineAccounts = accounts.filter(acc => 
      acc.status !== 'online' && acc.status !== 'READY'
    );
    
    console.log(`\n✅ 在线账号 (${onlineAccounts.length}):`);
    onlineAccounts.forEach(acc => {
      console.log(`  - ${acc.name} (${acc.phoneNumber || '无手机号'}) - ${acc.status}`);
    });
    
    console.log(`\n❌ 离线账号 (${offlineAccounts.length}):`);
    offlineAccounts.forEach(acc => {
      console.log(`  - ${acc.name} (${acc.phoneNumber || '无手机号'}) - ${acc.status}`);
    });
    
    if (offlineAccounts.length === 0) {
      console.log('\n✨ 没有需要删除的离线账号');
      return;
    }
    
    console.log(`\n🗑️  准备删除 ${offlineAccounts.length} 个离线账号...`);
    
    const offlineIds = offlineAccounts.map(acc => acc.id);
    
    // 按顺序删除关联数据（避免外键约束错误）
    console.log('📦 正在删除关联数据...');
    
    // 1. 删除批量操作明细
    console.log('  - 删除批量操作明细...');
    await prisma.batchOperationItem.deleteMany({
      where: { batch: { accountId: { in: offlineIds } } }
    });
    
    // 2. 删除批量操作
    console.log('  - 删除批量操作...');
    await prisma.batchOperation.deleteMany({
      where: { accountId: { in: offlineIds } }
    });
    
    // 3. 删除群组活动
    console.log('  - 删除群组活动...');
    await prisma.groupActivity.deleteMany({
      where: { group: { accountId: { in: offlineIds } } }
    });
    
    // 4. 删除群消息
    console.log('  - 删除群消息...');
    await prisma.groupMessage.deleteMany({
      where: { group: { accountId: { in: offlineIds } } }
    });
    
    // 5. 删除群成员
    console.log('  - 删除群成员...');
    await prisma.groupMember.deleteMany({
      where: { group: { accountId: { in: offlineIds } } }
    });
    
    // 6. 删除群发记录
    console.log('  - 删除群发记录...');
    await prisma.groupBroadcast.deleteMany({
      where: { accountId: { in: offlineIds } }
    });
    
    // 7. 删除群组
    console.log('  - 删除群组...');
    await prisma.whatsAppGroup.deleteMany({
      where: { accountId: { in: offlineIds } }
    });
    
    // 8. 删除进群任务
    console.log('  - 删除进群任务...');
    await prisma.joinGroupTask.deleteMany({
      where: { accountId: { in: offlineIds } }
    });
    
    // 9. 删除活动接收者
    console.log('  - 删除活动接收者...');
    await prisma.campaignRecipient.deleteMany({
      where: { campaign: { accountId: { in: offlineIds } } }
    });
    
    // 10. 删除活动
    console.log('  - 删除活动...');
    await prisma.campaign.deleteMany({
      where: { accountId: { in: offlineIds } }
    });
    
    // 11. 删除消息
    console.log('  - 删除消息...');
    await prisma.message.deleteMany({
      where: { accountId: { in: offlineIds } }
    });
    
    // 12. 删除会话
    console.log('  - 删除会话...');
    await prisma.thread.deleteMany({
      where: { accountId: { in: offlineIds } }
    });
    
    // 13. 删除联系人
    console.log('  - 删除联系人...');
    await prisma.contact.deleteMany({
      where: { accountId: { in: offlineIds } }
    });
    
    // 14. 删除翻译
    console.log('  - 删除翻译...');
    await prisma.translation.deleteMany({
      where: { accountId: { in: offlineIds } }
    });
    
    // 15. 删除知识库
    console.log('  - 删除知识库...');
    await prisma.knowledgeBase.deleteMany({
      where: { accountId: { in: offlineIds } }
    });
    
    // 16. 删除模板
    console.log('  - 删除模板...');
    await prisma.messageTemplate.deleteMany({
      where: { accountId: { in: offlineIds } }
    });
    
    // 17. 最后删除账号
    console.log('  - 删除账号...');
    const result = await prisma.account.deleteMany({
      where: {
        id: {
          in: offlineIds
        }
      }
    });
    
    console.log(`\n✅ 成功删除 ${result.count} 个离线账号及所有关联数据`);
    console.log(`\n📊 剩余账号: ${onlineAccounts.length} 个在线账号`);
    
  } catch (error) {
    console.error('❌ 清理失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanup();

