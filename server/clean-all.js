// 完全清理所有账号和 session
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

async function main() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🗑️ 删除所有账号...');
    
    // 删除所有账号
    await prisma.account.deleteMany({});
    
    console.log('✅ 所有账号已删除');
    
  } catch (error) {
    console.error('❌ 清理失败:', error.message);
  } finally {
    await prisma.$disconnect();
  }
  
  // 删除 sessions 文件夹
  const sessionsPath = path.join(__dirname, '.sessions');
  try {
    if (fs.existsSync(sessionsPath)) {
      fs.rmSync(sessionsPath, { recursive: true, force: true });
      console.log('✅ Sessions 文件夹已删除');
    }
  } catch (error) {
    console.error('❌ 删除 sessions 失败:', error.message);
  }
  
  console.log('\n🎉 清理完成！现在可以重新启动后端并添加新账号了');
}

main();

