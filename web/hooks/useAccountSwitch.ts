'use client';

import { useEffect, useCallback } from 'react';
import { useAccount } from '@/lib/account-context';

/**
 * 监听账号切换事件的 Hook
 * 当账号切换时，自动执行回调函数来刷新数据
 */
export function useAccountSwitch(callback: (accountId: string) => void | Promise<void>) {
  const { currentAccountId } = useAccount();

  const handleAccountSwitch = useCallback((event: Event) => {
    const customEvent = event as CustomEvent<{ 
      accountId: string; 
      previousAccountId: string | null;
    }>;
    
    const { accountId } = customEvent.detail;
    
    // 执行回调
    callback(accountId);
  }, [callback]);

  useEffect(() => {
    window.addEventListener('account-switched', handleAccountSwitch);
    
    return () => {
      window.removeEventListener('account-switched', handleAccountSwitch);
    };
  }, [handleAccountSwitch]);

  // 当组件首次加载或 currentAccountId 变化时也执行一次
  useEffect(() => {
    if (currentAccountId) {
      callback(currentAccountId);
    }
  }, []); // 只在首次加载时执行
}

/**
 * 简化版：只需要刷新数据，不需要访问 accountId
 */
export function useAccountSwitchRefresh(refreshCallback: () => void | Promise<void>) {
  useAccountSwitch(useCallback(() => {
    refreshCallback();
  }, [refreshCallback]));
}

