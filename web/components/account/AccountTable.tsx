'use client';

import { useState } from 'react';
import { Power, PowerOff, Trash2, MoreHorizontal, RefreshCw } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface AccountTableProps {
  accounts: any[];
  currentAccountId: string | null;
  onSwitch: (accountId: string) => void;
  onStart: (accountId: string) => void;
  onStop: (accountId: string) => void;
  onDelete: (accountId: string) => void;
  loadingAccountId: string | null;
}

export function AccountTable({
  accounts,
  currentAccountId,
  onSwitch,
  onStart,
  onStop,
  onDelete,
  loadingAccountId,
}: AccountTableProps) {
  // 🔧 标准化状态值（支持后端返回的 READY/ONLINE）
  const normalizeStatus = (status: string): string => {
    const normalized = status.toLowerCase();
    if (normalized === 'ready' || normalized === 'online') return 'online';
    if (normalized === 'qr' || normalized === 'authenticating') return 'qr';
    if (normalized === 'connecting') return 'connecting';
    return 'offline';
  };

  // 获取状态标识
  const getStatusBadge = (status: string) => {
    const normalizedStatus = normalizeStatus(status);
    const config = {
      online: { label: '在线', variant: 'default' as const },
      offline: { label: '离线', variant: 'secondary' as const },
      connecting: { label: '连接中', variant: 'outline' as const },
    };

    const statusConfig = config[normalizedStatus as keyof typeof config] || config.offline;
    
    return (
      <Badge variant={statusConfig.variant}>
        {statusConfig.label}
      </Badge>
    );
  };

  // 获取账号简称
  const getAccountInitials = (account: any) => {
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
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]"></TableHead>
            <TableHead>账号名称</TableHead>
            <TableHead>手机号</TableHead>
            <TableHead>状态</TableHead>
            <TableHead>最近在线</TableHead>
            <TableHead className="w-[120px]">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {accounts.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                暂无账号
              </TableCell>
            </TableRow>
          ) : (
            accounts.map((account) => (
              <TableRow 
                key={account.id}
                className={account.id === currentAccountId ? 'bg-blue-50/50' : ''}
              >
                {/* 头像 */}
                <TableCell>
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-blue-100 text-blue-600 text-xs font-semibold">
                      {getAccountInitials(account)}
                    </AvatarFallback>
                  </Avatar>
                </TableCell>

                {/* 账号名称 */}
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    {account.name}
                    {account.id === currentAccountId && (
                      <Badge variant="default" className="text-xs">当前</Badge>
                    )}
                  </div>
                </TableCell>

                {/* 手机号 */}
                <TableCell>{account.phoneNumber || '未绑定'}</TableCell>

                {/* 状态 */}
                <TableCell>{getStatusBadge(account.status)}</TableCell>

                {/* 最近在线 */}
                <TableCell className="text-sm text-muted-foreground">
                  {formatLastOnline(account.lastOnline)}
                </TableCell>

                {/* 操作 */}
                <TableCell>
                  <div className="flex items-center gap-2">
                    {/* 启动/停止按钮 */}
                    {account.status === 'offline' || account.status === 'connecting' ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onStart(account.id)}
                        disabled={loadingAccountId === account.id}
                      >
                        {loadingAccountId === account.id ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          <Power className="h-4 w-4" />
                        )}
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onStop(account.id)}
                        disabled={loadingAccountId === account.id}
                      >
                        {loadingAccountId === account.id ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          <PowerOff className="h-4 w-4" />
                        )}
                      </Button>
                    )}

                    {/* 更多操作 */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {account.id !== currentAccountId && (
                          <>
                            <DropdownMenuItem onClick={() => onSwitch(account.id)}>
                              切换到此账号
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                          </>
                        )}
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={() => onDelete(account.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          删除账号
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

