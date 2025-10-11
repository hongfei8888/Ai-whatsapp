'use client';

import { useEffect, useState } from 'react';
import { useAccount } from '@/lib/account-context';
import { Users, Plus, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AddAccountDialog } from '@/components/account/AddAccountDialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { toast } from 'sonner';

interface AccountGuardProps {
  children: React.ReactNode;
  /**
   * 自定义无账号时的提示内容
   */
  fallback?: React.ReactNode;
  /**
   * 是否显示添加账号按钮（默认: true）
   */
  showAddButton?: boolean;
  /**
   * 无账号时的提示标题
   */
  title?: string;
  /**
   * 无账号时的提示描述
   */
  description?: string;
}

/**
 * AccountGuard - 账号保护组件
 * 
 * 用于保护需要账号才能访问的页面和组件
 * 如果用户没有账号或未选择账号，显示提示信息
 * 
 * @example
 * ```tsx
 * <AccountGuard>
 *   <YourProtectedComponent />
 * </AccountGuard>
 * ```
 */
export function AccountGuard({
  children,
  fallback,
  showAddButton = true,
  title = '需要账号才能继续',
  description = '您还没有添加 WhatsApp 账号。请先添加一个账号以使用此功能。',
}: AccountGuardProps) {
  const { currentAccountId, hasAccounts, isLoading, refreshAccounts } = useAccount();
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  // 加载中状态
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">加载账号信息...</p>
        </div>
      </div>
    );
  }

  // 没有账号或未选择账号
  if (!hasAccounts || !currentAccountId) {
    // 如果提供了自定义 fallback，使用它
    if (fallback) {
      return <>{fallback}</>;
    }

    // 默认的无账号提示
    return (
      <div className="flex items-center justify-center min-h-[400px] p-6">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
              <Users className="h-8 w-8 text-blue-600" />
            </div>
            <CardTitle className="text-2xl">{title}</CardTitle>
            <CardDescription className="text-base mt-2">
              {description}
            </CardDescription>
          </CardHeader>
          
          {showAddButton && (
            <CardContent className="flex flex-col gap-3">
              <Button 
                size="lg" 
                className="w-full"
                onClick={() => setAddDialogOpen(true)}
              >
                <Plus className="h-5 w-5 mr-2" />
                添加账号
              </Button>
              
              <p className="text-xs text-muted-foreground text-center">
                添加账号后，您将能够使用所有功能
              </p>
            </CardContent>
          )}
        </Card>

        <AddAccountDialog 
          open={addDialogOpen} 
          onOpenChange={setAddDialogOpen}
          onSuccess={async () => {
            setAddDialogOpen(false);
            // 🔥 手动刷新账号列表
            await refreshAccounts();
            toast.success('账号已添加', {
              description: '页面将自动更新...'
            });
          }}
        />
      </div>
    );
  }

  // 有账号且已选择，显示受保护的内容
  return <>{children}</>;
}

/**
 * AccountGuardAlert - 简单的警告样式账号保护
 * 
 * 在页面顶部显示警告条，而不是完全阻止内容显示
 * 
 * @example
 * ```tsx
 * <AccountGuardAlert />
 * <YourContent />
 * ```
 */
export function AccountGuardAlert() {
  const { currentAccountId, hasAccounts, isLoading } = useAccount();
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  // 加载中或有账号时不显示
  if (isLoading || (hasAccounts && currentAccountId)) {
    return null;
  }

  return (
    <>
      <Alert variant="destructive" className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>需要账号</AlertTitle>
        <AlertDescription className="flex items-center justify-between">
          <span>您还没有添加 WhatsApp 账号。请先添加账号以使用完整功能。</span>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setAddDialogOpen(true)}
            className="ml-4"
          >
            <Plus className="h-4 w-4 mr-1" />
            添加
          </Button>
        </AlertDescription>
      </Alert>

      <AddAccountDialog 
        open={addDialogOpen} 
        onOpenChange={setAddDialogOpen}
        onSuccess={async () => {
          setAddDialogOpen(false);
          // 🔥 手动刷新账号列表
          await refreshAccounts();
          toast.success('账号已添加', {
            description: '页面将自动更新...'
          });
        }}
      />
    </>
  );
}

/**
 * 检查是否有账号的辅助 Hook
 * 
 * @example
 * ```tsx
 * const { hasAccount, needsAccount } = useRequireAccount();
 * 
 * if (needsAccount) {
 *   return <div>请添加账号</div>;
 * }
 * ```
 */
export function useRequireAccount() {
  const { currentAccountId, hasAccounts, isLoading } = useAccount();
  
  const hasAccount = !isLoading && hasAccounts && currentAccountId !== null;
  const needsAccount = !isLoading && !hasAccount;
  
  return {
    hasAccount,
    needsAccount,
    isLoading,
    currentAccountId,
    hasAccounts,
  };
}

