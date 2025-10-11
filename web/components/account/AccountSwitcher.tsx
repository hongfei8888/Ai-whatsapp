'use client';

import { useState, useEffect, useRef } from 'react';
import { useAccount } from '@/lib/account-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Plus, 
  Search, 
  Power, 
  PowerOff, 
  MoreVertical, 
  Edit, 
  Check,
  RefreshCw,
  LogOut,
  X,
  Trash2
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import QRCodeDialog from '@/components/QRCodeDialog';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

interface AccountSwitcherProps {
  isOpen: boolean;
  onClose: () => void;
  triggerRef: React.RefObject<HTMLDivElement>;
  onOpenAddDialog?: () => void;
}

export function AccountSwitcher({ isOpen, onClose, triggerRef, onOpenAddDialog }: AccountSwitcherProps) {
  const {
    accounts,
    currentAccountId,
    switchAccount,
    startAccount,
    stopAccount,
    deleteAccount,
    refreshAccounts,
    isLoading,
  } = useAccount();
  
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingAccountId, setLoadingAccountId] = useState<string | null>(null);
  const [showQRDialog, setShowQRDialog] = useState(false);
  const [qrAccountId, setQrAccountId] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // 🔒 禁用点击外部关闭功能 - 只能通过关闭按钮关闭
  // useEffect(() => {
  //   if (!isOpen) return;

  //   const handleClickOutside = (event: MouseEvent) => {
  //     if (
  //       panelRef.current &&
  //       !panelRef.current.contains(event.target as Node) &&
  //       triggerRef.current &&
  //       !triggerRef.current.contains(event.target as Node)
  //     ) {
  //       onClose();
  //     }
  //   };

  //   document.addEventListener('mousedown', handleClickOutside);
  //   return () => document.removeEventListener('mousedown', handleClickOutside);
  // }, [isOpen, onClose, triggerRef]);

  // 获取账号缩写
  const getAccountInitials = (account: any) => {
    // 优先使用手机号后4位
    if (account.phoneNumber && account.phoneNumber.length >= 4) {
      return account.phoneNumber.slice(-4);
    }
    
    // 其次使用账号名称
    if (account.name && account.name.trim()) {
      const name = account.name.trim();
      const words = name.split(/\s+/);
      
      if (words.length >= 2) {
        // 两个单词：取首字母
        return (words[0][0] + words[words.length - 1][0]).toUpperCase();
      } else if (name.length >= 2) {
        // 单词：取前两个字符
        return name.substring(0, 2).toUpperCase();
      } else {
        return name.toUpperCase();
      }
    }
    
    // 最后使用默认值
    return '??';
  };

  // 🔧 标准化状态值（支持后端返回的 READY/ONLINE）
  const normalizeStatus = (status: string): string => {
    const normalized = status.toLowerCase();
    // READY 和 ONLINE 都映射为 online
    if (normalized === 'ready' || normalized === 'online') return 'online';
    // QR/AUTHENTICATING 映射为 qr
    if (normalized === 'qr' || normalized === 'authenticating') return 'qr';
    // CONNECTING 映射为 connecting
    if (normalized === 'connecting') return 'connecting';
    // 其他都是 offline
    return 'offline';
  };

  // 获取状态徽章
  const getStatusBadge = (status: string) => {
    const normalizedStatus = normalizeStatus(status);
    const config = {
      online: { label: '在线', color: '#10b981' },
      offline: { label: '离线', color: '#9ca3af' },
      connecting: { label: '连接中', color: '#f59e0b' },
      qr: { label: '待扫码', color: '#ef4444' },
    };
    const statusConfig = config[normalizedStatus as keyof typeof config] || config.offline;
    return (
      <span style={{
        fontSize: '11px',
        padding: '3px 8px',
        backgroundColor: `${statusConfig.color}20`,
        color: statusConfig.color,
        borderRadius: '6px',
        fontWeight: '600'
      }}>
        {statusConfig.label}
      </span>
    );
  };

  // 处理启动/停止账号
  const handleToggleAccount = async (accountId: string, status: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setLoadingAccountId(accountId);
    
    try {
      if (normalizeStatus(status) === 'online') {
        // 停止账号
        await stopAccount(accountId);
        toast.success('账号已停止');
      } else {
        // 启动账号
        toast.info('正在启动账号...');
        await startAccount(accountId);
        
        // 等待一下，然后检查状态
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        try {
          // 检查账号状态
          const statusResult = await api.accounts.getStatus(accountId);
          
          if (normalizeStatus(statusResult.status) === 'online') {
            // 已登录，刷新状态即可
            toast.success('账号已上线！');
            refreshAccounts();
          } else if (statusResult.status === 'qr' || statusResult.status === 'connecting') {
            // 需要扫码登录
            toast.info('请扫描二维码登录');
            setQrAccountId(accountId);
            setShowQRDialog(true);
          } else {
            // 其他状态，也尝试显示二维码
            toast.info('正在获取登录二维码...');
            setQrAccountId(accountId);
            setShowQRDialog(true);
          }
        } catch (statusError) {
          // 状态检查失败，尝试显示二维码
          console.warn('Status check failed:', statusError);
          setQrAccountId(accountId);
          setShowQRDialog(true);
        }
      }
    } catch (error) {
      console.error('Toggle account error:', error);
      const message = error instanceof Error ? error.message : '操作失败';
      toast.error(message);
    } finally {
      setLoadingAccountId(null);
    }
  };

  // 处理账号退出登录
  const handleLogoutAccount = async (accountId: string, accountName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!confirm(`确定要退出账号 "${accountName}" 的登录吗？\n\n退出后需要重新扫码登录。`)) {
      return;
    }
    
    setLoadingAccountId(accountId);
    
    try {
      toast.info('正在退出登录...');
      await api.accounts.stop(accountId);
      toast.success('账号已退出登录');
      refreshAccounts();
    } catch (error) {
      console.error('Logout account error:', error);
      const message = error instanceof Error ? error.message : '退出登录失败';
      toast.error(message);
    } finally {
      setLoadingAccountId(null);
    }
  };

  // 处理删除账号
  const handleDeleteAccount = async (accountId: string, accountName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!confirm(`确定要删除账号 "${accountName}" 吗？\n\n⚠️ 警告：此操作将永久删除该账号及其所有数据（包括消息、联系人等），且无法恢复！\n\n如果您只是想暂时停用账号，请使用"退出登录"功能。`)) {
      return;
    }
    
    // 二次确认
    if (!confirm(`最后确认：真的要删除账号 "${accountName}" 吗？\n\n此操作不可撤销！`)) {
      return;
    }
    
    setLoadingAccountId(accountId);
    
    try {
      toast.info('正在删除账号...');
      await deleteAccount(accountId);
      toast.success(`账号 "${accountName}" 已删除`);
      refreshAccounts();
    } catch (error) {
      console.error('Delete account error:', error);
      const message = error instanceof Error ? error.message : '删除账号失败';
      toast.error(message);
    } finally {
      setLoadingAccountId(null);
    }
  };

  // 过滤账号
  const filteredAccounts = accounts.filter(account =>
    account.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (account.phoneNumber && account.phoneNumber.includes(searchQuery))
  );

  if (!isOpen) return null;

  return (
    <>
      <div
        ref={panelRef}
        style={{
          position: 'fixed',
          left: '80px',
          top: '16px',
          width: '320px',
          maxHeight: 'calc(100vh - 32px)',
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {/* 头部 */}
        <div style={{
          padding: '16px',
          borderBottom: '1px solid #e5e7eb',
          background: 'linear-gradient(to bottom, #ffffff 0%, #f9fafb 100%)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '12px'
          }}>
            <h2 style={{
              fontSize: '16px',
              fontWeight: '700',
              color: '#111827'
            }}>
              账号切换
            </h2>
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <button
                onClick={refreshAccounts}
                disabled={isLoading}
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '6px',
                  border: '1px solid #e5e7eb',
                  backgroundColor: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
              <span style={{
                fontSize: '12px',
                fontWeight: '600',
                color: '#ffffff',
                backgroundColor: '#3b82f6',
                padding: '4px 10px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center'
              }}>
                {accounts.length}
              </span>
              {/* 关闭按钮 */}
              <button
                onClick={onClose}
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '6px',
                  border: '1px solid #e5e7eb',
                  backgroundColor: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  color: '#6b7280'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#fee2e2';
                  e.currentTarget.style.borderColor = '#fca5a5';
                  e.currentTarget.style.color = '#dc2626';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#ffffff';
                  e.currentTarget.style.borderColor = '#e5e7eb';
                  e.currentTarget.style.color = '#6b7280';
                }}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* 搜索框 */}
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
                height: '36px',
                fontSize: '13px',
                width: '100%',
                borderRadius: '8px'
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
            <div style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>
              加载中...
            </div>
          ) : filteredAccounts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📱</div>
              <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '8px' }}>
                {searchQuery ? '未找到匹配的账号' : '还没有账号'}
              </h3>
              <p style={{ fontSize: '14px', color: '#6b7280' }}>
                {searchQuery ? '请尝试其他搜索关键词' : '点击下方按钮添加您的第一个 WhatsApp 账号'}
              </p>
            </div>
          ) : (
            filteredAccounts.map((account, index) => {
              const isCurrent = account.id === currentAccountId;
              const isOnline = normalizeStatus(account.status) === 'online';
              const isLoadingThis = loadingAccountId === account.id;

              return (
                <div
                  key={account.id}
                  style={{
                    marginBottom: '6px',
                    padding: '10px',
                    border: isCurrent ? '2px solid #10b981' : '1px solid #e5e7eb',
                    borderRadius: '10px',
                    backgroundColor: isCurrent ? '#f0fdf4' : '#ffffff',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onClick={() => {
                    if (!isCurrent) {
                      switchAccount(account.id);
                      onClose();
                    }
                  }}
                  onMouseEnter={(e) => {
                    if (!isCurrent) {
                      e.currentTarget.style.backgroundColor = '#f9fafb';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isCurrent) {
                      e.currentTarget.style.backgroundColor = '#ffffff';
                    }
                  }}
                >
                  {/* 账号信息 */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    marginBottom: '10px'
                  }}>
                    {/* 头像 - 更大更醒目 */}
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '12px',
                        background: isCurrent 
                          ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                          : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
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
                      
                      {/* 在线状态点 - 更明显 */}
                      <div style={{
                        position: 'absolute',
                        bottom: '-3px',
                        right: '-3px',
                        width: '16px',
                        height: '16px',
                        borderRadius: '50%',
                        backgroundColor: isOnline ? '#10b981' : '#9ca3af',
                        border: '3px solid #ffffff',
                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                      }} />
                    </div>

                    {/* 信息 - 更清晰的文字层次 */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginBottom: '4px'
                      }}>
                        <span style={{
                          fontSize: '15px',
                          fontWeight: '700',
                          color: '#111827',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {account.name || '未命名账号'}
                        </span>
                        {isCurrent && (
                          <span style={{
                            padding: '2px 8px',
                            borderRadius: '12px',
                            backgroundColor: '#dcfce7',
                            color: '#166534',
                            fontSize: '10px',
                            fontWeight: '600',
                            flexShrink: 0
                          }}>
                            当前
                          </span>
                        )}
                      </div>
                      <div style={{
                        fontSize: '13px',
                        color: '#6b7280',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {account.phoneNumber || '未绑定号码'}
                      </div>
                    </div>
                  </div>

                  {/* 底部操作 */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingTop: '8px',
                    borderTop: '1px solid #f3f4f6'
                  }}>
                    <div>
                      {getStatusBadge(account.status)}
                    </div>
                    
                    <div 
                      style={{ display: 'flex', gap: '4px' }}
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
                          width: '32px',
                          height: '32px',
                          padding: '0',
                          borderRadius: '6px'
                        }}
                      >
                        {isOnline ? (
                          <PowerOff className="h-3.5 w-3.5" />
                        ) : (
                          <Power className="h-3.5 w-3.5" />
                        )}
                      </Button>

                      <DropdownMenu modal={false}>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                            }}
                            style={{
                              width: '32px',
                              height: '32px',
                              padding: '0',
                              borderRadius: '6px'
                            }}
                          >
                            <MoreVertical className="h-3.5 w-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent 
                          align="end" 
                          className="w-48" 
                          style={{ zIndex: 10001 }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <DropdownMenuItem 
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push('/accounts');
                            }}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            管理账号
                          </DropdownMenuItem>
                          {isOnline && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleLogoutAccount(account.id, account.name, e);
                                }}
                                className="text-orange-600 focus:text-orange-600 focus:bg-orange-50"
                              >
                                <LogOut className="h-4 w-4 mr-2" />
                                退出登录
                              </DropdownMenuItem>
                            </>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteAccount(account.id, account.name, e);
                            }}
                            className="text-red-600 focus:text-red-600 focus:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
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

        {/* 底部按钮 */}
        <div style={{
          padding: '12px',
          borderTop: '1px solid #e5e7eb',
          backgroundColor: '#f9fafb',
          display: 'flex',
          gap: '8px'
        }}>
          <Button 
            variant="default" 
            style={{ 
              flex: 1,
              height: '38px',
              fontSize: '13px',
              fontWeight: '600',
              borderRadius: '8px'
            }}
            onClick={() => {
              onOpenAddDialog?.();
              // 不关闭账号切换窗口，让用户可以看到添加账号的过程
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            添加账号
          </Button>
          
          <Button 
            variant="outline" 
            style={{ 
              height: '38px',
              width: '38px',
              padding: '0',
              borderRadius: '8px'
            }}
            onClick={() => {
              router.push('/accounts');
              onClose();
            }}
          >
            <span style={{ fontSize: '16px' }}>📊</span>
          </Button>
        </div>
      </div>
      
      {/* 二维码登录对话框 */}
      <QRCodeDialog
        isOpen={showQRDialog}
        onClose={() => {
          setShowQRDialog(false);
          setQrAccountId(null);
        }}
        accountId={qrAccountId}
        onSuccess={() => {
          setShowQRDialog(false);
          setQrAccountId(null);
          refreshAccounts();
          toast.success('账号登录成功！');
        }}
      />
    </>
  );
}

