/**
 * 数据迁移脚本：将现有单账号数据迁移到多账号架构
 * 
 * 执行方式：
 * cd server
 * npx ts-node scripts/migrate-to-multi-account.ts
 */

import { PrismaClient } from '@prisma/client';
import * as path from 'path';

const prisma = new PrismaClient();

async function migrate() {
  console.log('🚀 开始多账号数据迁移...\n');

  try {
    // 1. 检查是否已有账号
    const existingAccounts = await prisma.account.findMany();
    
    if (existingAccounts.length > 0) {
      console.log(`✅ 已存在 ${existingAccounts.length} 个账号，跳过默认账号创建`);
      console.log('账号列表:');
      existingAccounts.forEach(acc => {
        console.log(`  - ${acc.name} (${acc.id})`);
      });
      return;
    }

    // 2. 创建默认账号
    console.log('📝 创建默认账号...');
    const defaultAccount = await prisma.account.create({
      data: {
        name: '默认账号',
        sessionPath: path.join('.', '.sessions', 'default'),
        status: 'offline',
        isActive: true,
      }
    });
    console.log(`✅ 默认账号创建成功: ${defaultAccount.id}\n`);

    // 3. 统计现有数据
    console.log('📊 统计现有数据...');
    const stats = {
      contacts: await prisma.contact.count(),
      threads: await prisma.thread.count(),
      messages: await prisma.message.count(),
      templates: await prisma.messageTemplate.count(),
      campaigns: await prisma.campaign.count(),
      knowledgeBases: await prisma.knowledgeBase.count(),
      groups: await prisma.whatsAppGroup.count(),
      batchOperations: await prisma.batchOperation.count(),
      translations: await prisma.translation.count(),
      joinGroupTasks: await prisma.joinGroupTask.count(),
      groupBroadcasts: await prisma.groupBroadcast.count(),
    };

    console.log('现有数据统计:');
    Object.entries(stats).forEach(([key, count]) => {
      console.log(`  - ${key}: ${count}`);
    });
    console.log();

    // 4. 迁移数据 - 为所有现有数据添加 accountId
    const totalItems = Object.values(stats).reduce((sum, count) => sum + count, 0);
    
    if (totalItems === 0) {
      console.log('✅ 没有需要迁移的数据\n');
    } else {
      console.log(`🔄 开始迁移 ${totalItems} 条数据到默认账号...\n`);

      // 迁移联系人
      if (stats.contacts > 0) {
        console.log(`  迁移联系人 (${stats.contacts})...`);
        await prisma.contact.updateMany({
          where: { accountId: null as any }, // 假设之前没有 accountId
          data: { accountId: defaultAccount.id }
        });
        console.log(`  ✅ 联系人迁移完成`);
      }

      // 迁移会话
      if (stats.threads > 0) {
        console.log(`  迁移会话 (${stats.threads})...`);
        await prisma.thread.updateMany({
          where: { accountId: null as any },
          data: { accountId: defaultAccount.id }
        });
        console.log(`  ✅ 会话迁移完成`);
      }

      // 迁移消息
      if (stats.messages > 0) {
        console.log(`  迁移消息 (${stats.messages})...`);
        await prisma.message.updateMany({
          where: { accountId: null as any },
          data: { accountId: defaultAccount.id }
        });
        console.log(`  ✅ 消息迁移完成`);
      }

      // 迁移模板
      if (stats.templates > 0) {
        console.log(`  迁移模板 (${stats.templates})...`);
        await prisma.messageTemplate.updateMany({
          where: { accountId: null as any },
          data: { accountId: defaultAccount.id }
        });
        console.log(`  ✅ 模板迁移完成`);
      }

      // 迁移营销活动
      if (stats.campaigns > 0) {
        console.log(`  迁移营销活动 (${stats.campaigns})...`);
        await prisma.campaign.updateMany({
          where: { accountId: null as any },
          data: { accountId: defaultAccount.id }
        });
        console.log(`  ✅ 营销活动迁移完成`);
      }

      // 迁移知识库
      if (stats.knowledgeBases > 0) {
        console.log(`  迁移知识库 (${stats.knowledgeBases})...`);
        await prisma.knowledgeBase.updateMany({
          where: { accountId: null as any },
          data: { accountId: defaultAccount.id }
        });
        console.log(`  ✅ 知识库迁移完成`);
      }

      // 迁移群组
      if (stats.groups > 0) {
        console.log(`  迁移群组 (${stats.groups})...`);
        await prisma.whatsAppGroup.updateMany({
          where: { accountId: null as any },
          data: { accountId: defaultAccount.id }
        });
        console.log(`  ✅ 群组迁移完成`);
      }

      // 迁移批量操作
      if (stats.batchOperations > 0) {
        console.log(`  迁移批量操作 (${stats.batchOperations})...`);
        await prisma.batchOperation.updateMany({
          where: { accountId: null as any },
          data: { accountId: defaultAccount.id }
        });
        console.log(`  ✅ 批量操作迁移完成`);
      }

      // 迁移翻译缓存
      if (stats.translations > 0) {
        console.log(`  迁移翻译缓存 (${stats.translations})...`);
        await prisma.translation.updateMany({
          where: { accountId: null as any },
          data: { accountId: defaultAccount.id }
        });
        console.log(`  ✅ 翻译缓存迁移完成`);
      }

      // 迁移进群任务
      if (stats.joinGroupTasks > 0) {
        console.log(`  迁移进群任务 (${stats.joinGroupTasks})...`);
        await prisma.joinGroupTask.updateMany({
          where: { accountId: null as any },
          data: { accountId: defaultAccount.id }
        });
        console.log(`  ✅ 进群任务迁移完成`);
      }

      // 迁移群发记录
      if (stats.groupBroadcasts > 0) {
        console.log(`  迁移群发记录 (${stats.groupBroadcasts})...`);
        await prisma.groupBroadcast.updateMany({
          where: { accountId: null as any },
          data: { accountId: defaultAccount.id }
        });
        console.log(`  ✅ 群发记录迁移完成`);
      }

      console.log();
    }

    console.log('🎉 多账号数据迁移完成！\n');
    console.log('📋 迁移总结:');
    console.log(`  - 默认账号ID: ${defaultAccount.id}`);
    console.log(`  - 默认账号名称: ${defaultAccount.name}`);
    console.log(`  - 已迁移数据: ${totalItems} 条`);
    console.log();
    console.log('💡 提示:');
    console.log('  1. 现在可以通过账号管理页面创建更多账号');
    console.log('  2. 所有现有数据已关联到"默认账号"');
    console.log('  3. 新账号将拥有独立的数据空间');
    console.log();

  } catch (error) {
    console.error('❌ 迁移失败:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// 执行迁移
migrate()
  .then(() => {
    console.log('✅ 迁移脚本执行成功');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ 迁移脚本执行失败:', error);
    process.exit(1);
  });

