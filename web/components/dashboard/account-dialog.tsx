'use client';

import { useState, useEffect } from 'react';
import { UserPlus, Smartphone, Trash2, Power, Clock, MoreHorizontal, AlertCircle, Users } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { api } from '@/lib/api';

interface AccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Account {
  id: string;
  phoneE164: string;
  name?: string;
  status: 'ONLINE' | 'OFFLINE' | 'CONNECTING' | 'NEED_QR';
  lastOnline?: string;
  messagesCount: number;
  contactsCount: number;
}

export function AccountDialog({ open, onOpenChange }: AccountDialogProps) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      loadAccounts();
    }
  }, [open]);

  const loadAccounts = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // 获取当前状态
      const status = await api.getStatus();
      
      // 模拟账号数据（实际项目中应该从API获取）
      const mockAccounts: Account[] = [];
      
      if (status.phoneE164) {
        mockAccounts.push({
          id: '1',
          phoneE164: status.phoneE164,
          name: '主账号',
          status: status.state === 'ONLINE' ? 'ONLINE' : status.state as any,
          lastOnline: status.lastOnline || new Date().toISOString(),
          messagesCount: 156,
          contactsCount: status.contactCount || 0
        });
      }

      setAccounts(mockAccounts);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载账号失败');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async (accountId: string) => {
    if (!confirm('确定要删除此账号吗？此操作不可撤销。')) {
      return;
    }

    try {
      await api.logout();
      setAccounts(prev => prev.filter(acc => acc.id !== accountId));
    } catch (err) {
      setError('删除账号失败');
    }
  };

  const handleLogoutAccount = async (accountId: string) => {
    try {
      await api.logout();
      setAccounts(prev => prev.map(acc => 
        acc.id === accountId ? { ...acc, status: 'OFFLINE' as const } : acc
      ));
    } catch (err) {
      setError('账号退出失败');
    }
  };

  const getStatusBadge = (status: Account['status']) => {
    const statusConfig = {
      ONLINE: { label: '在线', className: 'bg-green-100 text-green-800 hover:bg-green-100' },
      OFFLINE: { label: '离线', className: 'bg-gray-100 text-gray-800 hover:bg-gray-100' },
      CONNECTING: { label: '连接中', className: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100' },
      NEED_QR: { label: '等待扫码', className: 'bg-blue-100 text-blue-800 hover:bg-blue-100' },
    };

    const config = statusConfig[status] || statusConfig.OFFLINE;
    return <Badge variant="secondary" className={config.className}>{config.label}</Badge>;
  };

  const formatLastOnline = (timestamp?: string) => {
    if (!timestamp) return 'N/A';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}天前`;
    if (hours > 0) return `${hours}小时前`;
    if (minutes > 0) return `${minutes}分钟前`;
    return '刚刚';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold">账号管理</DialogTitle>
              <DialogDescription>
                管理所有已连接的 WhatsApp 账号
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="py-4">
          {/* 错误提示 */}
          {error && (
            <Alert className="mb-6 border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {/* 加载状态 */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
                <p className="text-gray-600">加载账号数据中...</p>
              </div>
            </div>
          ) : accounts.length === 0 ? (
            /* 空状态 */
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    <Smartphone className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">暂无已连接账号</h3>
                  <p className="text-gray-600 mb-6">
                    您还没有连接任何 WhatsApp 账号，点击"添加账号"开始使用
                  </p>
                  <Button onClick={() => onOpenChange(false)} className="gap-2">
                    <UserPlus className="h-4 w-4" />
                    添加账号
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            /* 账号列表 */
            <div className="grid gap-4">
              {accounts.map((account) => (
                <Card key={account.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                          {account.phoneE164?.slice(-2) || 'WA'}
                        </div>
                        
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="font-semibold text-gray-900">
                              {account.name || '未命名账号'}
                            </h3>
                            {getStatusBadge(account.status)}
                          </div>
                          <p className="text-sm text-gray-600 mb-1">
                            {account.phoneE164}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatLastOnline(account.lastOnline)}
                            </span>
                            <span>{account.contactsCount} 联系人</span>
                            <span>{account.messagesCount} 消息</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {account.status === 'ONLINE' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleLogoutAccount(account.id)}
                            className="gap-2"
                          >
                            <Power className="h-4 w-4" />
                            退出
                          </Button>
                        )}
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleDeleteAccount(account.id)} className="text-red-600">
                              <Trash2 className="mr-2 h-4 w-4" />
                              删除账号
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* 操作按钮 */}
          <div className="flex items-center justify-between pt-6">
            <div className="text-sm text-gray-500">
              共 {accounts.length} 个账号
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                关闭
              </Button>
              <Button onClick={loadAccounts} variant="outline">
                刷新
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
