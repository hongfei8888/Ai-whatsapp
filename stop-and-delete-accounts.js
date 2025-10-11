// 停止并删除重复账号
const fetch = require('node-fetch');

const API_BASE = 'http://localhost:4000';

async function stopAndDeleteAccounts() {
  console.log('\n========================================');
  console.log('  停止并删除重复账号');
  console.log('========================================\n');

  try {
    // 1. 先获取所有账号
    console.log('📋 获取账号列表...');
    const listResponse = await fetch(`${API_BASE}/accounts`);
    const listData = await listResponse.json();
    
    if (!listData.ok || !listData.data) {
      console.error('❌ 无法获取账号列表');
      return;
    }

    const accounts = listData.data;
    console.log(`✅ 找到 ${accounts.length} 个账号:\n`);
    
    accounts.forEach((acc, i) => {
      console.log(`[${i + 1}] ${acc.name}`);
      console.log(`    ID: ${acc.id}`);
      console.log(`    电话: ${acc.phoneNumber}`);
      console.log(`    状态: ${acc.status}`);
      console.log('');
    });

    // 2. 找出重复的电话号码
    const phoneMap = {};
    accounts.forEach(acc => {
      if (acc.phoneNumber) {
        if (!phoneMap[acc.phoneNumber]) {
          phoneMap[acc.phoneNumber] = [];
        }
        phoneMap[acc.phoneNumber].push(acc);
      }
    });

    // 3. 对于每个重复的电话号码，保留最新的，删除旧的
    for (const [phone, accs] of Object.entries(phoneMap)) {
      if (accs.length > 1) {
        console.log(`⚠️  电话 ${phone} 有 ${accs.length} 个账号（重复）\n`);
        
        // 按创建时间排序，最新的在最后
        accs.sort((a, b) => new Date(a.lastOnline || 0) - new Date(b.lastOnline || 0));
        
        // 删除除了最后一个（最新的）之外的所有账号
        const toDelete = accs.slice(0, -1);
        const toKeep = accs[accs.length - 1];
        
        console.log(`✅ 保留: ${toKeep.name} (${toKeep.id})`);
        console.log(`🗑️  删除: ${toDelete.map(a => a.name).join(', ')}\n`);
        
        for (const acc of toDelete) {
          console.log(`正在删除 ${acc.name} (${acc.id})...`);
          
          try {
            // 先尝试停止账号
            console.log('  步骤1: 停止账号...');
            const stopResponse = await fetch(`${API_BASE}/accounts/${acc.id}/stop`, {
              method: 'POST',
            });
            
            if (stopResponse.ok) {
              console.log('  ✅ 账号已停止');
            } else {
              console.log('  ⚠️  停止失败或账号已停止');
            }
            
            // 等待一下
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // 然后删除
            console.log('  步骤2: 删除账号...');
            const deleteResponse = await fetch(`${API_BASE}/accounts/${acc.id}`, {
              method: 'DELETE',
            });
            
            if (deleteResponse.ok) {
              console.log('  ✅ 账号已删除\n');
            } else {
              const error = await deleteResponse.json();
              console.error('  ❌ 删除失败:', error.message || error);
            }
          } catch (err) {
            console.error('  ❌ 错误:', err.message);
          }
        }
      }
    }

    console.log('\n========================================');
    console.log('  ✅ 清理完成！');
    console.log('========================================\n');
    console.log('下一步：');
    console.log('1. 重启后端（Ctrl+C 然后 cd server && npm run dev）');
    console.log('2. 刷新前端页面（F5）\n');

  } catch (error) {
    console.error('❌ 错误:', error.message);
  }
}

stopAndDeleteAccounts();

