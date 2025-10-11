// 修复联系人电话号码
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
    console.log('🔍 检查联系人电话号码...');
    
    // 查找没有电话号码的联系人
    const contactsWithoutPhone = await prisma.contact.findMany({
      where: {
        OR: [
          { phoneE164: null },
          { phoneE164: '' }
        ]
      },
      select: {
        id: true,
        name: true,
        phoneE164: true,
        accountId: true,
      }
    });

    if (contactsWithoutPhone.length === 0) {
      console.log('✅ 所有联系人都有有效的电话号码');
      return;
    }

    console.log(`⚠️ 找到 ${contactsWithoutPhone.length} 个没有电话号码的联系人：`);
    console.table(contactsWithoutPhone.map(c => ({
      ID: c.id.substring(0, 8) + '...',
      名称: c.name || '(无名称)',
      电话: c.phoneE164 || '(空)',
      账号: c.accountId.substring(0, 8) + '...',
    })));

    console.log('\n📊 选项：');
    console.log('1. 这些联系人可能是从导入时创建的，但没有电话号码');
    console.log('2. 建议：删除这些无效联系人或手动补充电话号码');
    console.log('3. 群发功能现在会自动跳过这些联系人');

    // 询问是否删除
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });

    readline.question('\n是否删除这些无效联系人？(yes/no): ', async (answer) => {
      if (answer.toLowerCase() === 'yes') {
        console.log('\n🗑️ 删除无效联系人...');
        
        const result = await prisma.contact.deleteMany({
          where: {
            OR: [
              { phoneE164: null },
              { phoneE164: '' }
            ]
          }
        });

        console.log(`✅ 已删除 ${result.count} 个无效联系人`);
      } else {
        console.log('ℹ️ 保留这些联系人。群发功能会自动跳过它们。');
      }
      
      readline.close();
      await prisma.$disconnect();
    });

  } catch (error) {
    console.error('❌ 检查失败:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

main();

