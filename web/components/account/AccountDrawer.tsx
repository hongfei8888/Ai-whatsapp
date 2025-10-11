'use client';

import { useState, useEffect } from 'react';
import { Users, LogOut, MoreHorizontal, Wifi, WifiOff, MessageSquare } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { api } from '@/lib/api';
import { useAccount } from '@/lib/account-context';
import type { StatusPayload } from '@/lib/types';
import { toast } from 'sonner';

interface AccountDrawerProps {
  trigger: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function AccountDrawer({ trigger, open, onOpenChange }: AccountDrawerProps) {
  const { currentAccountId } = useAccount();
  const [status, setStatus] = useState<StatusPayload | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    if (open) {
      loadStatus();
    }
  }, [open]);

  const loadStatus = async () => {
    if (!currentAccountId) {
      toast.error('请先选择账号');
      return;
    }
    
    setIsLoading(true);
    try {
      const statusData = await api.accounts.getStatus(currentAccountId);
      setStatus(statusData);
    } catch (err) {
      toast.error('加载账号信息失败');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await api.logout();
      toast.success('已退出登录');
      onOpenChange?.(false);
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err) {
      toast.error('退出登录失败');
    } finally {
      setIsLoggingOut(false);
    }
  };

  const maskPhone = (phone: string) => {
    if (!phone || phone.length < 8) return phone;
    return phone.slice(0, 4) + '****' + phone.slice(-4);
  };

  const formatLastOnline = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 60) return `${diffMins}分钟前`;
      if (diffHours < 24) return `${diffHours}小时前`;
      if (diffDays < 7) return `${diffDays}天前`;
      return date.toLocaleDateString('zh-CN');
    } catch {
      return 'N/A';
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        {trigger}
      </SheetTrigger>
      <SheetContent side="right" className="w-[420px] p-0">
        <div className="flex flex-col h-full">
          <SheetHeader className="p-6 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <SheetTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  账号管理
                </SheetTitle>
                <SheetDescription>
                  管理当前 WhatsApp 账号和会话状态
                </SheetDescription>
              </div>
              <div className="flex items-center gap-2">
                <ConfirmDialog
                  trigger={
                    <Button 
                      variant="outline" 
                      size="sm" 
                      disabled={isLoggingOut}
                      className="text-destructive hover:text-destructive border-destructive hover:bg-destructive/10"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      {isLoggingOut ? '退出中...' : '退出登录'}
                    </Button>
                  }
                  title="确认退出登录"
                  description="退出登录将清除当前会话数据，需要重新扫码登录。确定要继续吗？"
                  confirmText="退出登录"
                  onConfirm={handleLogout}
                  variant="destructive"
                />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={loadStatus}>
                      刷新状态
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      导出数据
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      清除缓存
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </SheetHeader>

          <div className="flex-1 px-6 pb-6 space-y-6">
            {isLoading ? (
              <div className="space-y-4">
                <div className="h-20 bg-muted rounded-xl animate-pulse" />
                <div className="h-32 bg-muted rounded-xl animate-pulse" />
              </div>
            ) : status ? (
              <>
                {/* 账号信息卡片 */}
                <div className="rounded-2xl border bg-card shadow-sm p-6">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src="" alt="账号头像" />
                      <AvatarFallback className="bg-blue-100 text-blue-600 text-lg font-semibold">
                        {status.phoneE164 ? status.phoneE164.slice(-2) : 'WA'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-lg">
                          {status.phoneE164 ? maskPhone(status.phoneE164) : '未绑定账号'}
                        </h3>
                        <Badge variant={status.online ? "default" : "destructive"}>
                          {status.online ? (
                            <>
                              <Wifi className="h-3 w-3 mr-1" />
                              在线
                            </>
                          ) : (
                            <>
                              <WifiOff className="h-3 w-3 mr-1" />
                              离线
                            </>
                          )}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        最近在线: {formatLastOnline(status.lastOnline || null)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 统计信息 */}
                <div className="rounded-2xl border bg-card shadow-sm p-6">
                  <h4 className="font-semibold mb-4 flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    使用统计
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-muted/30 rounded-lg">
                      <div className="text-2xl font-bold text-primary">{status.contactCount}</div>
                      <div className="text-sm text-muted-foreground">联系人</div>
                    </div>
                    <div className="text-center p-3 bg-muted/30 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">24h</div>
                      <div className="text-sm text-muted-foreground">冷却时间</div>
                    </div>
                  </div>
                  
                  <Separator className="my-4" />
                  
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">会话就绪:</span>
                      <span className={status.sessionReady ? 'text-green-600' : 'text-red-600'}>
                        {status.sessionReady ? '是' : '否'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">客户端状态:</span>
                      <span className="font-medium">{status.state || 'UNKNOWN'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">最新消息:</span>
                      <span className="font-medium">
                        {status.latestMessageAt ? 
                          new Date(status.latestMessageAt).toLocaleDateString('zh-CN') : 
                          'N/A'
                        }
                      </span>
                    </div>
                  </div>
                </div>

                {/* 系统信息 */}
                <div className="rounded-2xl border bg-card shadow-sm p-6">
                  <h4 className="font-semibold mb-4">系统信息</h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">版本:</span>
                      <span className="font-medium">v1.0.0</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">启动时间:</span>
                      <span className="font-medium">
                        {new Date().toLocaleDateString('zh-CN')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">数据同步:</span>
                      <span className="font-medium text-green-600">正常</span>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">无法加载账号信息</p>
                <Button variant="outline" className="mt-4" onClick={loadStatus}>
                  重试
                </Button>
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
