'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

// ==================== 类型定义 ====================

export interface Account {
  id: string;
  name: string;
  phoneNumber: string | null;
  status: 'READY' | 'QR' | 'AUTHENTICATING' | 'DISCONNECTED' | 'FAILED' | 'online' | 'offline' | 'connecting';
  state: 'UNINITIALIZED' | 'NEED_QR' | 'CONNECTING' | 'ONLINE' | 'OFFLINE' | string;
  isActive: boolean;
  lastOnline: Date | null;
  qr: string | null;
}

interface AccountContextValue {
  // 当前账号
  currentAccountId: string | null;
  currentAccount: Account | null;
  
  // 账号列表
  accounts: Account[];
  isLoading: boolean;
  error: string | null;
  
  // 操作方法
  switchAccount: (accountId: string) => void;
  refreshAccounts: () => Promise<void>;
  createAccount: (name: string) => Promise<Account>;
  deleteAccount: (accountId: string) => Promise<void>;
  startAccount: (accountId: string) => Promise<void>;
  stopAccount: (accountId: string) => Promise<void>;
  
  // 辅助方法
  hasAccounts: boolean;
  isMultiAccount: boolean;
}

// ==================== Context 创建 ====================

const AccountContext = createContext<AccountContextValue | null>(null);

// ==================== Provider 组件 ====================

interface AccountProviderProps {
  children: React.ReactNode;
}

export function AccountProvider({ children }: AccountProviderProps) {
  const [currentAccountId, setCurrentAccountId] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ==================== 辅助计算 ====================

  const currentAccount = accounts.find(acc => acc.id === currentAccountId) || null;
  const hasAccounts = accounts.length > 0;
  const isMultiAccount = accounts.length > 1;

  // ==================== LocalStorage 管理 ====================

  const STORAGE_KEY = 'whatsapp_current_account_id';

  const saveCurrentAccountId = useCallback((accountId: string | null) => {
    if (accountId) {
      localStorage.setItem(STORAGE_KEY, accountId);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const loadCurrentAccountId = useCallback((): string | null => {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch {
      return null;
    }
  }, []);

  // ==================== API 调用（使用统一的 API 客户端）====================
  
  // 注意：这里不能直接 import api，因为会导致循环依赖
  // 所以我们直接使用 fetch，但使用与 api.ts 相同的逻辑

  // ==================== 账号操作方法 ====================

  const refreshAccounts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // 直接调用 /accounts 端点（不需要 X-Account-Id）
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';
      const response = await fetch(`${API_BASE_URL}/accounts`, {
        cache: 'no-store',
      });
      
      if (!response.ok) {
        throw new Error(`获取账号列表失败: ${response.status}`);
      }
      
      const data = await response.json();
      const accountList = (data.ok || data.success) ? data.data : [];
      setAccounts(accountList);

      // 🔥 验证当前账号是否有效（存在且在线）
      if (currentAccountId) {
        const currentAcc = accountList.find((acc: Account) => acc.id === currentAccountId);
        
        // 如果账号不存在或不活跃，清除它
        if (!currentAcc || !currentAcc.isActive) {
          console.warn(`当前账号 ${currentAccountId} 不存在或未激活，将清除`);
          setCurrentAccountId(null);
          saveCurrentAccountId(null);
          
          // 尝试选择第一个在线且活跃的账号
          const firstActiveAccount = accountList.find((acc: Account) => acc.isActive);
          if (firstActiveAccount) {
            console.log(`自动切换到账号: ${firstActiveAccount.name}`);
            setCurrentAccountId(firstActiveAccount.id);
            saveCurrentAccountId(firstActiveAccount.id);
          }
        }
      } else {
        // 如果没有当前账号，自动选择第一个活跃的账号
        const firstActiveAccount = accountList.find((acc: Account) => acc.isActive);
        if (firstActiveAccount) {
          console.log(`自动选择账号: ${firstActiveAccount.name}`);
          setCurrentAccountId(firstActiveAccount.id);
          saveCurrentAccountId(firstActiveAccount.id);
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : '加载账号列表失败';
      setError(message);
      console.error('Failed to refresh accounts:', err);
      
      // 🔥 出错时清除当前账号，防止使用无效的 accountId
      setCurrentAccountId(null);
      saveCurrentAccountId(null);
    } finally {
      setIsLoading(false);
    }
  }, [currentAccountId, saveCurrentAccountId]);

  const switchAccount = useCallback((accountId: string) => {
    const account = accounts.find(acc => acc.id === accountId);
    
    if (!account) {
      toast.error('账号不存在');
      return;
    }

    setCurrentAccountId(accountId);
    saveCurrentAccountId(accountId);
    
    // 触发全局账号切换事件（不刷新页面）
    window.dispatchEvent(new CustomEvent('account-switched', { 
      detail: { 
        accountId, 
        account,
        previousAccountId: currentAccountId 
      } 
    }));
    
    toast.success(`已切换到账号: ${account.name}`);
  }, [accounts, currentAccountId, saveCurrentAccountId]);

  const createAccount = useCallback(async (name: string): Promise<Account> => {
    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';
      const response = await fetch(`${API_BASE_URL}/accounts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name }),
      });
      
      if (!response.ok) {
        throw new Error(`创建账号失败: ${response.status}`);
      }
      
      const data = await response.json();
      if (!data.ok && !data.success) {
        throw new Error(data.error || '创建账号失败');
      }
      const newAccount = data.data;
      
      // 刷新账号列表
      await refreshAccounts();
      
      // 自动切换到新账号
      setCurrentAccountId(newAccount.id);
      saveCurrentAccountId(newAccount.id);
      
      toast.success(`账号 "${name}" 创建成功`);
      return newAccount;
    } catch (err) {
      const message = err instanceof Error ? err.message : '创建账号失败';
      toast.error(message);
      throw err;
    }
  }, [refreshAccounts, saveCurrentAccountId]);

  const deleteAccount = useCallback(async (accountId: string) => {
    try {
      const account = accounts.find(acc => acc.id === accountId);
      
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';
      const response = await fetch(`${API_BASE_URL}/accounts/${accountId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error(`删除账号失败: ${response.status}`);
      }
      
      // 如果删除的是当前账号，切换到其他账号
      if (currentAccountId === accountId) {
        const remainingAccounts = accounts.filter(acc => acc.id !== accountId);
        if (remainingAccounts.length > 0) {
          setCurrentAccountId(remainingAccounts[0].id);
          saveCurrentAccountId(remainingAccounts[0].id);
        } else {
          setCurrentAccountId(null);
          saveCurrentAccountId(null);
        }
      }
      
      // 刷新账号列表
      await refreshAccounts();
      
      toast.success(`账号 "${account?.name}" 已删除`);
    } catch (err) {
      const message = err instanceof Error ? err.message : '删除账号失败';
      toast.error(message);
      throw err;
    }
  }, [accounts, currentAccountId, refreshAccounts, saveCurrentAccountId]);

  const startAccount = useCallback(async (accountId: string) => {
    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';
      const response = await fetch(`${API_BASE_URL}/accounts/${accountId}/start`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error(`启动账号失败: ${response.status}`);
      }
      toast.success('账号启动成功');
      
      // 刷新账号状态
      await refreshAccounts();
    } catch (err) {
      const message = err instanceof Error ? err.message : '启动账号失败';
      toast.error(message);
      throw err;
    }
  }, [refreshAccounts]);

  const stopAccount = useCallback(async (accountId: string) => {
    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';
      const response = await fetch(`${API_BASE_URL}/accounts/${accountId}/stop`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error(`停止账号失败: ${response.status}`);
      }
      toast.success('账号已停止');
      
      // 刷新账号状态
      await refreshAccounts();
    } catch (err) {
      const message = err instanceof Error ? err.message : '停止账号失败';
      toast.error(message);
      throw err;
    }
  }, [refreshAccounts]);

  // ==================== 初始化 ====================

  useEffect(() => {
    // 从 localStorage 恢复当前账号
    const savedAccountId = loadCurrentAccountId();
    if (savedAccountId) {
      setCurrentAccountId(savedAccountId);
    }

    // 加载账号列表
    refreshAccounts();
  }, [loadCurrentAccountId, refreshAccounts]);

  // ==================== Context Value ====================

  const value: AccountContextValue = {
    currentAccountId,
    currentAccount,
    accounts,
    isLoading,
    error,
    switchAccount,
    refreshAccounts,
    createAccount,
    deleteAccount,
    startAccount,
    stopAccount,
    hasAccounts,
    isMultiAccount,
  };

  return (
    <AccountContext.Provider value={value}>
      {children}
    </AccountContext.Provider>
  );
}

// ==================== Hook ====================

export function useAccount(): AccountContextValue {
  const context = useContext(AccountContext);
  
  if (!context) {
    throw new Error('useAccount must be used within AccountProvider');
  }
  
  return context;
}

// ==================== 辅助 Hook ====================

/**
 * 确保当前有选中的账号，如果没有则显示提示
 */
export function useRequireAccount() {
  const { currentAccountId, hasAccounts, isLoading } = useAccount();
  
  const hasAccount = !isLoading && hasAccounts && currentAccountId !== null;
  const needsAccount = !isLoading && !hasAccount;
  
  return {
    hasAccount,
    needsAccount,
    isLoading,
  };
}

