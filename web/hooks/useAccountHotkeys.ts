'use client';

import { useEffect } from 'react';
import { useAccount } from '@/lib/account-context';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

/**
 * 全局账号快捷键管理器
 * 
 * 支持的快捷键：
 * - Ctrl+1 ~ Ctrl+9: 切换到第 1-9 个账号
 * - Ctrl+Alt+A: 打开账号管理页面
 * - Ctrl+Alt+N: 添加新账号
 * - Ctrl+Shift+R: 刷新当前账号状态
 */
export function useAccountHotkeys() {
  const { accounts, switchAccount, refreshAccounts } = useAccount();
  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl+1 ~ Ctrl+9: 切换到第 1-9 个账号
      if (event.ctrlKey && !event.altKey && !event.shiftKey) {
        const key = event.key;
        if (/^[1-9]$/.test(key)) {
          event.preventDefault();
          const index = parseInt(key) - 1;
          
          if (index < accounts.length) {
            const targetAccount = accounts[index];
            switchAccount(targetAccount.id);
            toast.info(`切换到账号 ${index + 1}: ${targetAccount.name}`);
          } else {
            toast.warning(`账号 ${index + 1} 不存在`);
          }
        }
      }

      // Ctrl+Alt+A: 打开账号管理页面
      if (event.ctrlKey && event.altKey && !event.shiftKey && event.key.toLowerCase() === 'a') {
        event.preventDefault();
        router.push('/accounts');
        toast.info('跳转到账号管理页面');
      }

      // Ctrl+Alt+N: 添加新账号（跳转到账号页面）
      if (event.ctrlKey && event.altKey && !event.shiftKey && event.key.toLowerCase() === 'n') {
        event.preventDefault();
        router.push('/accounts');
        toast.info('打开账号管理，准备添加新账号');
      }

      // Ctrl+Shift+R: 刷新当前账号状态
      if (event.ctrlKey && event.shiftKey && !event.altKey && event.key.toLowerCase() === 'r') {
        event.preventDefault();
        refreshAccounts();
        toast.success('正在刷新账号状态...');
      }

      // 显示快捷键帮助: Ctrl+Shift+/
      if (event.ctrlKey && event.shiftKey && event.key === '?') {
        event.preventDefault();
        showHotkeyHelp();
      }
    };

    // 监听键盘事件
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [accounts, switchAccount, refreshAccounts, router]);
}

/**
 * 显示快捷键帮助
 */
function showHotkeyHelp() {
  toast.info('账号管理快捷键', {
    description: `
Ctrl+1~9 - 切换账号
Ctrl+Alt+A - 账号管理
Ctrl+Alt+N - 添加账号
Ctrl+Shift+R - 刷新状态
    `.trim(),
    duration: 5000,
  });
}

/**
 * 格式化快捷键显示文本
 */
export function formatHotkeyText(keys: string[]): string {
  return keys.join('+');
}

