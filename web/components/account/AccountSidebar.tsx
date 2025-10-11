'use client';

import { useState } from 'react';
import { Plus, Check } from 'lucide-react';
import { useAccount } from '@/lib/account-context';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { AddAccountDialog } from './AddAccountDialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface AccountSidebarProps {
  className?: string;
}

export function AccountSidebar({ className }: AccountSidebarProps) {
  const { 
    accounts, 
    currentAccountId, 
    switchAccount, 
    isLoading 
  } = useAccount();
  
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [hoveredAccountId, setHoveredAccountId] = useState<string | null>(null);

  // 获取账号简称
  const getAccountInitials = (account: typeof accounts[0]) => {
    if (account.phoneNumber) {
      return account.phoneNumber.slice(-2);
    }
    return account.name.slice(0, 2).toUpperCase();
  };

  // 🔧 标准化状态值（支持后端返回的 READY/ONLINE）
  const normalizeStatus = (status: string): string => {
    const normalized = status.toLowerCase();
    if (normalized === 'ready' || normalized === 'online') return 'online';
    if (normalized === 'qr' || normalized === 'authenticating') return 'qr';
    if (normalized === 'connecting') return 'connecting';
    return 'offline';
  };

  // 获取状态颜色
  const getStatusColor = (status: string) => {
    const normalizedStatus = normalizeStatus(status);
    const statusConfig = {
      online: 'bg-green-500',
      offline: 'bg-gray-400',
      connecting: 'bg-yellow-500',
    };
    return statusConfig[normalizedStatus as keyof typeof statusConfig] || statusConfig.offline;
  };

  if (isLoading) {
    return (
      <div className={cn('flex flex-col items-center gap-2 py-2', className)}>
        <div className="w-12 h-12 rounded-full bg-muted animate-pulse" />
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={300}>
      <div className={cn('flex flex-col items-center gap-2 py-2 px-2', className)}>
        {/* 账号列表 */}
        {accounts.map((account) => {
          const isCurrent = account.id === currentAccountId;
          const isHovered = hoveredAccountId === account.id;
          
          return (
            <Tooltip key={account.id}>
              <TooltipTrigger asChild>
                <div
                  className={cn(
                    'relative cursor-pointer transition-all duration-200',
                    isCurrent && 'scale-110'
                  )}
                  onClick={() => {
                    if (!isCurrent) {
                      switchAccount(account.id);
                    }
                  }}
                  onMouseEnter={() => setHoveredAccountId(account.id)}
                  onMouseLeave={() => setHoveredAccountId(null)}
                >
                  {/* 账号头像 */}
                  <Avatar 
                    className={cn(
                      'h-12 w-12 border-2 transition-all',
                      isCurrent 
                        ? 'border-blue-500 ring-2 ring-blue-200' 
                        : 'border-transparent hover:border-gray-300'
                    )}
                  >
                    <AvatarFallback 
                      className={cn(
                        'text-sm font-semibold',
                        isCurrent 
                          ? 'bg-blue-100 text-blue-600' 
                          : 'bg-gray-100 text-gray-600'
                      )}
                    >
                      {getAccountInitials(account)}
                    </AvatarFallback>
                  </Avatar>
                  
                  {/* 状态指示器 */}
                  <div 
                    className={cn(
                      'absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white',
                      getStatusColor(account.status)
                    )}
                  />
                  
                  {/* 当前账号标记 */}
                  {isCurrent && (
                    <div className="absolute -top-1 -right-1 bg-blue-500 rounded-full p-0.5">
                      <Check className="h-3 w-3 text-white" />
                    </div>
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-xs">
                <div className="text-sm">
                  <div className="font-semibold">{account.name}</div>
                  {account.phoneNumber && (
                    <div className="text-muted-foreground">{account.phoneNumber}</div>
                  )}
                  <div className="mt-1 flex items-center gap-1.5">
                    <div className={cn('w-2 h-2 rounded-full', getStatusColor(account.status))} />
                    <span className="text-xs">
                      {account.status === 'online' ? '在线' : account.status === 'connecting' ? '连接中' : '离线'}
                    </span>
                  </div>
                  {!isCurrent && (
                    <div className="mt-1 text-xs text-muted-foreground">
                      点击切换到此账号
                    </div>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
          );
        })}
        
        {/* 添加账号按钮 */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className="w-12 h-12 rounded-full border-2 border-dashed border-gray-300 hover:border-blue-500 flex items-center justify-center cursor-pointer transition-all duration-200 hover:scale-110"
              onClick={() => setAddDialogOpen(true)}
            >
              <Plus className="h-5 w-5 text-gray-400 hover:text-blue-500" />
            </div>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>添加新账号</p>
          </TooltipContent>
        </Tooltip>
        
        {/* 添加账号对话框 */}
        <AddAccountDialog 
          open={addDialogOpen} 
          onOpenChange={setAddDialogOpen}
          onSuccess={() => setAddDialogOpen(false)}
        />
      </div>
    </TooltipProvider>
  );
}

