'use client';

import { useState, useEffect } from 'react';
import { 
  Plus, 
  Power, 
  PowerOff, 
  Trash2, 
  RefreshCw, 
  QrCode,
  Users,
  MessageSquare,
  Activity,
  MoreHorizontal,
  Grid3x3,
  List
} from 'lucide-react';
import { useAccount } from '@/lib/account-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { AddAccountDialog } from '@/components/account/AddAccountDialog';
import { AccountTable } from '@/components/account/AccountTable';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { toast } from 'sonner';
import WhatsAppLayout from '@/components/layout/WhatsAppLayout';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ToggleGroup,
  ToggleGroupItem,
} from '@/components/ui/toggle-group';

export default function AccountsPage() {
  const { 
    accounts, 
    currentAccountId,
    switchAccount, 
    createAccount,
    deleteAccount,
    startAccount,
    stopAccount,
    refreshAccounts,
    isLoading 
  } = useAccount();
  
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [loadingAccountId, setLoadingAccountId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // 从 localStorage 加载视图偏好
  useEffect(() => {
    const saved = localStorage.getItem('account_view_mode');
    if (saved === 'grid' || saved === 'table') {
      setViewMode(saved);
    }
  }, []);

  // 保存视图偏好
  const handleViewModeChange = (mode: 'grid' | 'table') => {
    if (mode) {
      setViewMode(mode);
      localStorage.setItem('account_view_mode', mode);
    }
  };

  // 处理添加账号成功
  const handleAddAccountSuccess = () => {
    setAddDialogOpen(false);
    refreshAccounts();
  };

  // 处理启动账号
  const handleStartAccount = async (accountId: string) => {
    setLoadingAccountId(accountId);
    try {
      await startAccount(accountId);
    } catch (error) {
      // Error already handled in context
    } finally {
      setLoadingAccountId(null);
    }
  };

  // 处理停止账号
  const handleStopAccount = async (accountId: string) => {
    setLoadingAccountId(accountId);
    try {
      await stopAccount(accountId);
    } catch (error) {
      // Error already handled in context
    } finally {
      setLoadingAccountId(null);
    }
  };

  // 处理删除账号
  const handleDeleteAccount = async (accountId: string) => {
    try {
      await deleteAccount(accountId);
      setDeleteConfirmId(null);
    } catch (error) {
      // Error already handled in context
    }
  };

  // 获取状态标识
  const getStatusBadge = (status: string) => {
    const config = {
      online: { label: '在线', variant: 'default' as const },
      offline: { label: '离线', variant: 'secondary' as const },
      connecting: { label: '连接中', variant: 'outline' as const },
    };

    const statusConfig = config[status as keyof typeof config] || config.offline;
    
    return (
      <Badge variant={statusConfig.variant}>
        {statusConfig.label}
      </Badge>
    );
  };

  // 获取账号简称
  const getAccountInitials = (account: typeof accounts[0]) => {
    if (account.phoneNumber) {
      return account.phoneNumber.slice(-2);
    }
    return account.name.slice(0, 2).toUpperCase();
  };

  // 格式化时间
  const formatLastOnline = (date: Date | null) => {
    if (!date) return 'N/A';
    try {
      const dateObj = new Date(date);
      const now = new Date();
      const diffMs = now.getTime() - dateObj.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 60) return `${diffMins}分钟前`;
      if (diffHours < 24) return `${diffHours}小时前`;
      if (diffDays < 7) return `${diffDays}天前`;
      return dateObj.toLocaleDateString('zh-CN');
    } catch {
      return 'N/A';
    }
  };

  return (
    <WhatsAppLayout>
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* 头部 */}
        <div className="border-b bg-background p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Users className="h-8 w-8 text-primary" />
                账号管理
              </h1>
              <p className="text-muted-foreground mt-2">
                管理多个 WhatsApp 账号，支持同时登录和独立数据管理
              </p>
            </div>
            <div className="flex items-center gap-2">
              {/* 视图切换 */}
              <ToggleGroup type="single" value={viewMode} onValueChange={handleViewModeChange}>
                <ToggleGroupItem value="grid" aria-label="网格视图">
                  <Grid3x3 className="h-4 w-4" />
                </ToggleGroupItem>
                <ToggleGroupItem value="table" aria-label="表格视图">
                  <List className="h-4 w-4" />
                </ToggleGroupItem>
              </ToggleGroup>
              
              <Button 
                variant="outline" 
                onClick={refreshAccounts}
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                刷新
              </Button>
              <Button onClick={() => setAddDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                添加账号
              </Button>
            </div>
          </div>
        </div>

        {/* 内容区域 */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-16 w-16 rounded-full" />
                    <Skeleton className="h-6 w-32 mt-4" />
                    <Skeleton className="h-4 w-24 mt-2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-10 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : accounts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-12">
              <div className="rounded-full bg-muted p-6 mb-4">
                <Users className="h-12 w-12 text-muted-foreground" />
              </div>
              <h2 className="text-2xl font-semibold mb-2">还没有账号</h2>
              <p className="text-muted-foreground mb-6 text-center max-w-md">
                开始添加您的第一个 WhatsApp 账号，扫码登录后即可使用所有功能
              </p>
              <Button size="lg" onClick={() => setAddDialogOpen(true)}>
                <Plus className="h-5 w-5 mr-2" />
                添加第一个账号
              </Button>
            </div>
          ) : viewMode === 'table' ? (
            <AccountTable
              accounts={accounts}
              currentAccountId={currentAccountId}
              onSwitch={switchAccount}
              onStart={handleStartAccount}
              onStop={handleStopAccount}
              onDelete={(accountId) => setDeleteConfirmId(accountId)}
              loadingAccountId={loadingAccountId}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {accounts.map((account) => (
                <Card 
                  key={account.id}
                  className={`transition-all ${
                    account.id === currentAccountId 
                      ? 'ring-2 ring-primary shadow-lg' 
                      : 'hover:shadow-md'
                  }`}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-16 w-16">
                          <AvatarFallback className="bg-blue-100 text-blue-600 text-lg font-semibold">
                            {getAccountInitials(account)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            {account.name}
                            {account.id === currentAccountId && (
                              <Badge variant="default" className="text-xs">当前</Badge>
                            )}
                          </CardTitle>
                          <CardDescription>
                            {account.phoneNumber || '未绑定号码'}
                          </CardDescription>
                        </div>
                      </div>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {account.id !== currentAccountId && (
                            <>
                              <DropdownMenuItem onClick={() => switchAccount(account.id)}>
                                切换到此账号
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                            </>
                          )}
                          <DropdownMenuItem 
                            className="text-destructive"
                            onClick={() => setDeleteConfirmId(account.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            删除账号
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* 状态信息 */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">状态</span>
                      {getStatusBadge(account.status)}
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">最近在线</span>
                      <span className="text-sm">{formatLastOnline(account.lastOnline)}</span>
                    </div>

                    {/* 操作按钮 */}
                    <div className="flex gap-2 pt-2">
                      {account.status === 'offline' || account.status === 'connecting' ? (
                        <Button 
                          variant="default" 
                          className="flex-1"
                          onClick={() => handleStartAccount(account.id)}
                          disabled={loadingAccountId === account.id}
                        >
                          {loadingAccountId === account.id ? (
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Power className="h-4 w-4 mr-2" />
                          )}
                          启动
                        </Button>
                      ) : (
                        <Button 
                          variant="outline" 
                          className="flex-1"
                          onClick={() => handleStopAccount(account.id)}
                          disabled={loadingAccountId === account.id}
                        >
                          {loadingAccountId === account.id ? (
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <PowerOff className="h-4 w-4 mr-2" />
                          )}
                          停止
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 添加账号对话框 */}
      <AddAccountDialog 
        open={addDialogOpen} 
        onOpenChange={setAddDialogOpen}
        onSuccess={handleAddAccountSuccess}
      />

      {/* 删除确认对话框 */}
      {deleteConfirmId && (
        <ConfirmDialog
          open={!!deleteConfirmId}
          onOpenChange={(open) => !open && setDeleteConfirmId(null)}
          title="确认删除账号"
          description="删除账号将清除所有相关数据，包括联系人、消息、模板等。此操作无法撤销。"
          confirmText="删除"
          onConfirm={() => handleDeleteAccount(deleteConfirmId)}
          variant="destructive"
        />
      )}
    </WhatsAppLayout>
  );
}

