'use client';

import { useState } from 'react';
import { Plus, Search, Power, PowerOff, Edit, MoreVertical, Check } from 'lucide-react';
import { useAccount } from '@/lib/account-context';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { AddAccountDialog } from './AddAccountDialog';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

export function AccountPanel() {
  const router = useRouter();
  const { 
    accounts, 
    currentAccountId, 
    switchAccount,
    startAccount,
    stopAccount,
    isLoading 
  } = useAccount();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [loadingAccountId, setLoadingAccountId] = useState<string | null>(null);

  // 获取账号简称
  const getAccountInitials = (account: any) => {
    if (account.phoneNumber) {
      return account.phoneNumber.slice(-4);
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

  // 获取状态徽章
  const getStatusBadge = (status: string) => {
    const normalizedStatus = normalizeStatus(status);
    if (normalizedStatus === 'online') {
      return <Badge variant="default" className="text-xs bg-green-500">在线</Badge>;
    }
    if (normalizedStatus === 'connecting') {
      return <Badge variant="outline" className="text-xs">连接中</Badge>;
    }
    return <Badge variant="secondary" className="text-xs">离线</Badge>;
  };

  // 筛选账号
  const filteredAccounts = accounts.filter(account => {
    const searchLower = searchQuery.toLowerCase();
    return (
      account.name.toLowerCase().includes(searchLower) ||
      (account.phoneNumber && account.phoneNumber.includes(searchLower))
    );
  });

  // 处理账号启动/停止
  const handleToggleAccount = async (accountId: string, status: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setLoadingAccountId(accountId);
    try {
      if (normalizeStatus(status) === 'online') {
        await stopAccount(accountId);
      } else {
        await startAccount(accountId);
      }
    } finally {
      setLoadingAccountId(null);
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100%',
      backgroundColor: '#ffffff',
      borderRight: '1px solid #e5e7eb'
    }}>
      {/* 头部：搜索栏 */}
      <div style={{
        padding: '16px',
        borderBottom: '1px solid #e5e7eb',
        background: 'linear-gradient(to bottom, #ffffff 0%, #f9fafb 100%)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '14px'
        }}>
          <h2 style={{
            fontSize: '16px',
            fontWeight: '700',
            color: '#111827'
          }}>
            账号列表
          </h2>
          <span style={{
            fontSize: '12px',
            fontWeight: '600',
            color: '#ffffff',
            backgroundColor: '#3b82f6',
            padding: '4px 10px',
            borderRadius: '12px'
          }}>
            {accounts.length}
          </span>
        </div>
        
        <div style={{ position: 'relative' }}>
          <Search style={{
            position: 'absolute',
            left: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            width: '16px',
            height: '16px',
            color: '#9ca3af'
          }} />
          <Input
            type="text"
            placeholder="搜索手机号或备注名"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              paddingLeft: '36px',
              height: '40px',
              fontSize: '14px',
              width: '100%',
              borderRadius: '10px',
              border: '1px solid #e5e7eb',
              backgroundColor: '#ffffff'
            }}
          />
        </div>
      </div>

      {/* 账号列表 */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '8px'
      }}>
        {isLoading ? (
          <div style={{ padding: '16px', textAlign: 'center', color: '#6b7280' }}>
            加载中...
          </div>
        ) : filteredAccounts.length === 0 ? (
          <div style={{ padding: '16px', textAlign: 'center', color: '#6b7280' }}>
            {searchQuery ? '未找到匹配的账号' : '暂无账号'}
          </div>
        ) : (
          filteredAccounts.map((account, index) => {
            const isCurrent = account.id === currentAccountId;
            const isLoadingThis = loadingAccountId === account.id;
            const isOnline = normalizeStatus(account.status) === 'online';
            
            return (
              <div
                key={account.id}
                style={{
                  position: 'relative',
                  marginBottom: '10px',
                  padding: '14px',
                  border: isCurrent ? '2px solid #10b981' : '1px solid #e5e7eb',
                  borderRadius: '12px',
                  backgroundColor: isCurrent ? '#f0fdf4' : '#ffffff',
                  cursor: 'pointer',
                  boxShadow: isCurrent 
                    ? '0 4px 12px rgba(16, 185, 129, 0.15)' 
                    : '0 1px 3px rgba(0, 0, 0, 0.05)',
                  transition: 'all 0.2s ease',
                  overflow: 'hidden'
                }}
                onClick={() => {
                  if (!isCurrent) {
                    switchAccount(account.id);
                  }
                }}
                onMouseEnter={(e) => {
                  if (!isCurrent) {
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isCurrent) {
                    e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.05)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }
                }}
              >
                {/* 序号角标 */}
                <div style={{
                  position: 'absolute',
                  top: '8px',
                  right: '8px',
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  backgroundColor: isCurrent ? '#10b981' : '#e5e7eb',
                  color: isCurrent ? '#ffffff' : '#6b7280',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '11px',
                  fontWeight: '600'
                }}>
                  {index + 1}
                </div>

                {/* 顶部：头像和账号信息 */}
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  marginBottom: '10px'
                }}>
                  {/* 头像 */}
                  <div style={{
                    position: 'relative',
                    flexShrink: 0
                  }}>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '12px',
                      backgroundColor: isCurrent ? '#10b981' : '#3b82f6',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '18px',
                      fontWeight: '700',
                      color: '#ffffff',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                    }}>
                      {getAccountInitials(account)}
                    </div>
                    
                    {/* 在线状态点 */}
                    <div style={{
                      position: 'absolute',
                      bottom: '-2px',
                      right: '-2px',
                      width: '14px',
                      height: '14px',
                      borderRadius: '50%',
                      backgroundColor: isOnline ? '#10b981' : '#9ca3af',
                      border: '2px solid #ffffff',
                      boxShadow: '0 0 0 2px rgba(255, 255, 255, 0.8)'
                    }} />
                  </div>

                  {/* 账号信息 */}
                  <div style={{
                    flex: 1,
                    minWidth: 0,
                    paddingTop: '2px'
                  }}>
                    {/* 账号名称 */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      marginBottom: '4px'
                    }}>
                      <span style={{
                        fontSize: '15px',
                        fontWeight: '600',
                        color: '#111827',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        flex: 1
                      }}>
                        {account.name}
                      </span>
                      {isCurrent && (
                        <span style={{
                          fontSize: '10px',
                          padding: '2px 6px',
                          backgroundColor: '#10b981',
                          color: '#ffffff',
                          borderRadius: '4px',
                          fontWeight: '600',
                          flexShrink: 0
                        }}>
                          当前
                        </span>
                      )}
                    </div>
                    
                    {/* 手机号 */}
                    <div style={{
                      fontSize: '12px',
                      color: '#6b7280',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      📱 {account.phoneNumber || '未绑定号码'}
                    </div>
                  </div>
                </div>

                {/* 底部：状态和操作按钮 */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingTop: '10px',
                  borderTop: '1px solid #f3f4f6'
                }}>
                  <div>
                    {getStatusBadge(account.status)}
                  </div>
                  
                  <div 
                    style={{ display: 'flex', gap: '6px' }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={isLoadingThis}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleAccount(account.id, account.status, e);
                      }}
                      style={{
                        width: '36px',
                        height: '36px',
                        padding: '0',
                        borderRadius: '8px'
                      }}
                    >
                      {isOnline ? (
                        <PowerOff className="h-4 w-4" style={{ color: '#f59e0b' }} />
                      ) : (
                        <Power className="h-4 w-4" style={{ color: '#10b981' }} />
                      )}
                    </Button>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          style={{
                            width: '36px',
                            height: '36px',
                            padding: '0',
                            borderRadius: '8px'
                          }}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => router.push('/accounts')}>
                          <Edit className="h-4 w-4 mr-2" />
                          编辑备注名
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {!isCurrent && (
                          <DropdownMenuItem onClick={() => switchAccount(account.id)}>
                            <Check className="h-4 w-4 mr-2" />
                            切换到此账号
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={() => router.push('/accounts')}
                        >
                          删除账号
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 底部：添加账号按钮 */}
      <div style={{
        padding: '16px',
        borderTop: '1px solid #e5e7eb',
        backgroundColor: '#f9fafb',
        boxShadow: '0 -4px 6px -1px rgba(0, 0, 0, 0.05)'
      }}>
        <Button 
          variant="default" 
          style={{ 
            width: '100%', 
            marginBottom: '10px',
            height: '44px',
            fontSize: '14px',
            fontWeight: '600',
            borderRadius: '10px',
            boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)'
          }}
          onClick={() => setAddDialogOpen(true)}
        >
          <Plus className="h-5 w-5 mr-2" />
          添加新账号
        </Button>
        
        <Button 
          variant="outline" 
          style={{ 
            width: '100%',
            height: '40px',
            fontSize: '13px',
            borderRadius: '10px'
          }}
          onClick={() => router.push('/accounts')}
        >
          <span style={{ fontSize: '16px', marginRight: '8px' }}>📊</span>
          团队管理后台
        </Button>
      </div>

      {/* 添加账号对话框 */}
      <AddAccountDialog 
        open={addDialogOpen} 
        onOpenChange={setAddDialogOpen}
        onSuccess={() => setAddDialogOpen(false)}
      />
    </div>
  );
}

