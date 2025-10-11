// 删除旧的重复账号
const fetch = require('node-fetch');

const API_BASE = 'http://localhost:4000';

async function deleteOldAccount() {
  console.log('\n========================================');
  console.log('  删除旧的重复账号');
  console.log('========================================\n');

  // 要删除的旧账号ID
  const oldAccountId = 'cmgl1sjr40001wse4hter3pmp';  // dsdsds - 旧的断开的账号
  
  try {
    console.log(`正在删除账号: ${oldAccountId}...`);
    
    const response = await fetch(`${API_BASE}/accounts/${oldAccountId}`, {
      method: 'DELETE',
    });

    if (response.ok) {
      console.log('✅ 账号删除成功！\n');
      console.log('下一步：');
      console.log('1. 重启后端（Ctrl+C 然后 npm run dev）');
      console.log('2. 刷新前端页面（F5）');
      console.log('3. 现在应该只有一个账号，不会再冲突了！\n');
    } else {
      const error = await response.text();
      console.error('❌ 删除失败:', error);
    }
  } catch (error) {
    console.error('❌ 错误:', error.message);
    console.log('\n可能原因：');
    console.log('- 后端没有运行');
    console.log('- 网络连接问题\n');
  }
}

deleteOldAccount();

