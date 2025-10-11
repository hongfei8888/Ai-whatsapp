// 检查批量操作状态
const { PrismaClient } = require('./node_modules/@prisma/client');

async function main() {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: 'file:./prisma/dev.db'
      }
    }
  });

  try {
    console.log('📊 检查批量操作状态...\n');
    
    // 获取最近的批量操作
    const recentBatch = await prisma.batchOperation.findFirst({
      orderBy: { createdAt: 'desc' },
      include: {
        items: {
          take: 5,
          orderBy: { itemIndex: 'asc' }
        }
      }
    });

    if (!recentBatch) {
      console.log('ℹ️ 没有找到批量操作');
      return;
    }

    console.log('📋 最近的批量操作：');
    console.log('  ID:', recentBatch.id.substring(0, 8) + '...');
    console.log('  类型:', recentBatch.type);
    console.log('  状态:', recentBatch.status);
    console.log('  总数:', recentBatch.totalCount);
    console.log('  成功:', recentBatch.successCount);
    console.log('  失败:', recentBatch.failedCount);
    console.log('  进度:', recentBatch.progress + '%');
    console.log('  创建时间:', recentBatch.createdAt.toLocaleString());
    console.log('  配置:', recentBatch.config);
    console.log('');

    if (recentBatch.items.length > 0) {
      console.log('📝 任务项示例（前5个）：');
      for (const item of recentBatch.items) {
        const data = JSON.parse(item.itemData);
        console.log(`  ${item.itemIndex + 1}. 状态: ${item.status}`);
        console.log(`     联系人ID: ${data.contactId?.substring(0, 8)}...`);
        console.log(`     电话: ${data.phoneE164 || '(无)'}`);
        console.log(`     名称: ${data.name || '(无名称)'}`);
        if (item.errorMessage) {
          console.log(`     ❌ 错误: ${item.errorMessage}`);
        }
        if (item.result) {
          const result = JSON.parse(item.result);
          console.log(`     ✅ 结果: ${result.success ? '成功' : '失败'}`);
        }
        console.log('');
      }
    }

    // 检查联系人电话号码
    console.log('\n📞 检查联系人电话号码...');
    const contactsWithoutPhone = await prisma.contact.count({
      where: {
        OR: [
          { phoneE164: null },
          { phoneE164: '' }
        ]
      }
    });
    
    const totalContacts = await prisma.contact.count();
    
    console.log(`  总联系人数: ${totalContacts}`);
    console.log(`  无电话号码: ${contactsWithoutPhone}`);
    console.log(`  有效联系人: ${totalContacts - contactsWithoutPhone}`);

    if (contactsWithoutPhone > 0) {
      console.log('\n⚠️ 警告: 有 ' + contactsWithoutPhone + ' 个联系人没有电话号码');
      console.log('   这些联系人会被自动跳过');
    }

  } catch (error) {
    console.error('❌ 检查失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();

