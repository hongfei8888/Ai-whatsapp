/**
 * 清理错误同步的联系人
 * 只保留真正的 WhatsApp 联系人
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanupWrongContacts() {
  try {
    console.log('🔍 开始清理错误同步的联系人...\n');

    // 1. 统计当前联系人数量
    const totalContacts = await prisma.contact.count();
    console.log(`📊 当前总联系人数: ${totalContacts}`);

    // 2. 查找所有通过 whatsapp_sync 同步的联系人
    const syncedContacts = await prisma.contact.findMany({
      where: {
        source: 'whatsapp_sync'
      },
      select: {
        id: true,
        phoneE164: true,
        name: true,
        source: true,
      }
    });

    console.log(`📋 通过 whatsapp_sync 同步的联系人: ${syncedContacts.length} 个\n`);

    if (syncedContacts.length === 0) {
      console.log('✅ 没有需要清理的联系人');
      return;
    }

    // 3. 显示前10个示例
    console.log('📝 前10个联系人示例:');
    syncedContacts.slice(0, 10).forEach((contact, index) => {
      console.log(`  ${index + 1}. ${contact.name || '未命名'} (${contact.phoneE164})`);
    });
    console.log('');

    // 4. 询问用户确认
    console.log('⚠️  即将删除所有通过 whatsapp_sync 同步的联系人');
    console.log('⚠️  请确认这些联系人是错误同步的');
    console.log('');
    console.log('如果确认删除，请运行:');
    console.log('  node server/cleanup-wrong-contacts.js --confirm');
    console.log('');

    // 5. 如果用户传入 --confirm 参数，执行删除
    if (process.argv.includes('--confirm')) {
      console.log('🗑️  开始删除...\n');

      // 获取要删除的联系人 ID 列表
      const contactsToDelete = await prisma.contact.findMany({
        where: {
          source: 'whatsapp_sync'
        },
        select: {
          id: true
        }
      });

      const contactIds = contactsToDelete.map(c => c.id);
      console.log(`📋 即将删除 ${contactIds.length} 个联系人及其关联数据...\n`);

      let deletedCount = 0;

      // 逐个删除联系人及其关联数据
      for (const contactId of contactIds) {
        try {
          // 1. 删除相关的 Thread（会级联删除 Message）
          await prisma.thread.deleteMany({
            where: {
              contactId: contactId
            }
          });

          // 2. 删除联系人
          await prisma.contact.delete({
            where: {
              id: contactId
            }
          });

          deletedCount++;

          // 每删除50个显示一次进度
          if (deletedCount % 50 === 0) {
            console.log(`  进度: ${deletedCount}/${contactIds.length} (${Math.round(deletedCount/contactIds.length*100)}%)`);
          }
        } catch (error) {
          console.warn(`⚠️  跳过联系人 ${contactId}:`, error.message);
        }
      }

      console.log(`\n✅ 删除完成！共删除 ${deletedCount} 个联系人\n`);

      // 统计剩余联系人
      const remainingContacts = await prisma.contact.count();
      console.log(`📊 剩余联系人数: ${remainingContacts}`);
    }

  } catch (error) {
    console.error('❌ 清理失败:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupWrongContacts();

