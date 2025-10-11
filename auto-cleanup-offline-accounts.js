/**
 * 自动清理离线账号脚本
 * 自动调用清理API删除所有离线账号
 */

const axios = require('axios');

// 配置
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';
const CLEANUP_INTERVAL_MINUTES = parseInt(process.env.CLEANUP_INTERVAL_MINUTES) || 60; // 默认60分钟执行一次
const RUN_ONCE = process.env.RUN_ONCE === 'true'; // 是否只运行一次

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = colors.reset) {
  const timestamp = new Date().toLocaleString('zh-CN');
  console.log(`${color}[${timestamp}] ${message}${colors.reset}`);
}

/**
 * 调用清理API删除离线账号
 */
async function cleanupOfflineAccounts() {
  try {
    log('🔍 开始清理离线账号...', colors.cyan);
    
    const response = await axios.delete(`${API_BASE_URL}/api/accounts/cleanup`, {
      timeout: 30000 // 30秒超时
    });
    
    if (response.data.ok) {
      const { deletedCount, deletedAccounts, message } = response.data.data;
      
      if (deletedCount > 0) {
        log(`✅ ${message}`, colors.green);
        log(`📊 删除的账号详情:`, colors.yellow);
        deletedAccounts.forEach(acc => {
          log(`  - ${acc.name} (${acc.phoneNumber || '无手机号'}) - ${acc.status}`, colors.yellow);
        });
      } else {
        log(`✨ ${message}`, colors.green);
      }
      
      return {
        success: true,
        deletedCount,
        deletedAccounts
      };
    } else {
      log(`❌ 清理失败: ${response.data.message}`, colors.red);
      return {
        success: false,
        error: response.data.message
      };
    }
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      log(`❌ 无法连接到服务器 ${API_BASE_URL}，请确保服务器正在运行`, colors.red);
    } else if (error.response) {
      log(`❌ API错误 (${error.response.status}): ${error.response.data?.message || error.message}`, colors.red);
    } else {
      log(`❌ 清理失败: ${error.message}`, colors.red);
    }
    
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * 获取账号列表并显示状态
 */
async function getAccountsStatus() {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/accounts`, {
      timeout: 10000
    });
    
    if (response.data.ok) {
      const accounts = response.data.data;
      
      const onlineAccounts = accounts.filter(acc => 
        acc.status === 'READY' || acc.status === 'ONLINE'
      );
      
      const offlineAccounts = accounts.filter(acc => 
        acc.status !== 'READY' && acc.status !== 'ONLINE'
      );
      
      log(`📊 当前账号状态:`, colors.blue);
      log(`  ✅ 在线账号: ${onlineAccounts.length}`, colors.green);
      log(`  ❌ 离线账号: ${offlineAccounts.length}`, colors.red);
      
      if (offlineAccounts.length > 0) {
        log(`\n离线账号列表:`, colors.yellow);
        offlineAccounts.forEach(acc => {
          log(`  - ${acc.name} (${acc.phoneNumber || '无手机号'}) - ${acc.status}`, colors.yellow);
        });
      }
      
      return {
        total: accounts.length,
        online: onlineAccounts.length,
        offline: offlineAccounts.length
      };
    }
  } catch (error) {
    log(`⚠️  无法获取账号状态: ${error.message}`, colors.yellow);
    return null;
  }
}

/**
 * 执行一次清理任务
 */
async function runCleanupTask() {
  log('═════════════════════════════════════════', colors.bright);
  log('🚀 开始执行清理任务', colors.bright);
  log('═════════════════════════════════════════', colors.bright);
  
  // 先获取当前状态
  await getAccountsStatus();
  
  log(''); // 空行
  
  // 执行清理
  const result = await cleanupOfflineAccounts();
  
  log(''); // 空行
  
  // 清理后再次获取状态
  if (result.success && result.deletedCount > 0) {
    log('🔄 清理后的账号状态:', colors.cyan);
    await getAccountsStatus();
  }
  
  log('═════════════════════════════════════════', colors.bright);
  log('✨ 清理任务完成', colors.bright);
  log('═════════════════════════════════════════', colors.bright);
  
  return result;
}

/**
 * 启动定时任务
 */
async function startScheduledCleanup() {
  log('🎯 自动清理离线账号服务已启动', colors.bright);
  log(`📡 API地址: ${API_BASE_URL}`, colors.cyan);
  log(`⏰ 清理间隔: ${CLEANUP_INTERVAL_MINUTES} 分钟`, colors.cyan);
  log(''); // 空行
  
  // 立即执行一次
  await runCleanupTask();
  
  if (!RUN_ONCE) {
    // 设置定时任务
    const intervalMs = CLEANUP_INTERVAL_MINUTES * 60 * 1000;
    setInterval(async () => {
      log(''); // 空行
      await runCleanupTask();
    }, intervalMs);
    
    log(''); // 空行
    log(`⏰ 下次清理时间: ${new Date(Date.now() + intervalMs).toLocaleString('zh-CN')}`, colors.cyan);
    log('💡 按 Ctrl+C 停止服务', colors.yellow);
  } else {
    log(''); // 空行
    log('✅ 单次运行完成，脚本退出', colors.green);
    process.exit(0);
  }
}

// 优雅退出
process.on('SIGINT', () => {
  log(''); // 空行
  log('👋 正在停止自动清理服务...', colors.yellow);
  process.exit(0);
});

process.on('SIGTERM', () => {
  log(''); // 空行
  log('👋 正在停止自动清理服务...', colors.yellow);
  process.exit(0);
});

// 启动
startScheduledCleanup().catch(error => {
  log(`❌ 服务启动失败: ${error.message}`, colors.red);
  process.exit(1);
});

