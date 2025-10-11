'use client';

import { useEffect, useRef, useState } from 'react';
import { QrCode, Loader2, RefreshCw, X, HelpCircle, Clock, WifiOff, Shield, CheckCircle, AlertCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api';
import { toast } from 'sonner';

type State = 'UNINITIALIZED' | 'CREATING' | 'NEED_QR' | 'CONNECTING' | 'ONLINE' | 'OFFLINE';

interface AddAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function AddAccountDialog({ open, onOpenChange, onSuccess }: AddAccountDialogProps) {
  const [state, setState] = useState<State>('UNINITIALIZED');
  const [qr, setQr] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [accountName, setAccountName] = useState('');
  const [createdAccountId, setCreatedAccountId] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false); // 🔥 新增：防止重复点击
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startAtRef = useRef<number>(0);
  
  // 🆕 新增状态 - 错误处理
  const [errorDetails, setErrorDetails] = useState<{
    type: 'timeout' | 'network' | 'auth' | 'unknown',
    message: string,
    canRetry: boolean
  } | null>(null);
  
  // 🆕 新增状态 - 二维码倒计时
  const [qrExpireTime, setQrExpireTime] = useState<Date | null>(null);
  const [qrTimeLeft, setQrTimeLeft] = useState<number>(0);
  
  // 🆕 新增状态 - UI控制
  const [showHelp, setShowHelp] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [isDuplicateName, setIsDuplicateName] = useState(false);
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  
  // 🆕 新增状态 - 智能轮询
  const [pollInterval, setPollInterval] = useState(2000);
  const pollAttempts = useRef(0);

  const stopPolling = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const startLogin = async () => {
    // 🔥 验证账号名称
    if (!accountName || accountName.trim().length === 0) {
      toast.error('请输入账号名称');
      return;
    }

    // 🔥 防止重复点击
    if (isStarting || isRefreshing) {
      console.warn('Already starting login, ignoring duplicate click');
      return;
    }

    setIsStarting(true);
    setIsRefreshing(true);
    setState('CREATING');
    setErrorDetails(null); // 清除之前的错误
    
    try {
      // 🆕 超时保护（60秒）
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('操作超时，请检查网络连接')), 60000)
      );
      
      // 🔥 步骤1: 创建账号
      const createPromise = api.accounts.create(accountName.trim());
      const newAccount = await Promise.race([createPromise, timeoutPromise]);
      setCreatedAccountId(newAccount.id);
      
      toast.success(`账号 "${accountName}" 创建成功`, {
        description: '正在启动登录流程...'
      });
      
      // 🔥 步骤2: 启动账号（开始登录流程）
      try {
        const startPromise = api.accounts.start(newAccount.id);
        await Promise.race([startPromise, timeoutPromise]);
      } catch (startError) {
        // 如果启动失败，提供更详细的错误信息
        console.error('Failed to start account:', startError);
        throw new Error('启动登录流程失败：' + (startError instanceof Error ? startError.message : '未知错误'));
      }
      
      setQr(null);
      setState('NEED_QR');
      startAtRef.current = Date.now();
      setQrExpireTime(new Date(Date.now() + 60000)); // 设置二维码60秒后过期
      pollAttempts.current = 0; // 重置轮询次数
      
      // 🔥 步骤3: 轮询二维码（智能轮询）
      stopPolling();
      timerRef.current = setInterval(async () => {
        try {
          pollAttempts.current++;
          
          // 🆕 最多轮询60次（约5-10分钟）后停止
          if (pollAttempts.current > 60) {
            stopPolling();
            toast.error('等待超时，请重新获取二维码');
            setState('UNINITIALIZED');
            setCreatedAccountId(null);
            return;
          }
          
          // 🔥 获取该账号的二维码（允许失败，因为登录后 QR 码会消失）
          try {
            const qrData = await api.accounts.getQRCode(newAccount.id);
            
            if (qrData.qr) {
              setQr(qrData.qr);
              // 🆕 每次获取新二维码，重置过期时间
              setQrExpireTime(new Date(Date.now() + 60000));
            }
          } catch (qrError) {
            // QR 码获取失败（可能已登录），继续检查状态
            console.log('⚠️ [AddAccountDialog] QR 码获取失败（可能已登录）');
          }
          
          // 🔥 获取账号状态（无论 QR 码是否获取成功）
          const statusData = await api.accounts.getStatus(newAccount.id);
          console.log('📊 [AddAccountDialog] 轮询状态:', {
            status: statusData.status,
            state: statusData.state,
            sessionReady: statusData.sessionReady,
            phoneE164: statusData.phoneE164,
            pollAttempt: pollAttempts.current,
            fullData: statusData
          });
          setState(statusData.state as State);
          
          // 超时 10 分钟
          if (Date.now() - startAtRef.current > 10 * 60 * 1000) {
            stopPolling();
            toast.error('二维码已过期，请刷新');
            return;
          }
          
          // 🔥 检查是否已连接（增强判断条件）
          const isReady = statusData.status === 'READY' || 
                         statusData.state === 'READY' || 
                         statusData.state === 'ONLINE' ||
                         statusData.sessionReady === true;
          
          console.log('🔍 [AddAccountDialog] 连接检查:', {
            isReady,
            checks: {
              statusReady: statusData.status === 'READY',
              stateReady: statusData.state === 'READY',
              stateOnline: statusData.state === 'ONLINE',
              sessionReady: statusData.sessionReady === true
            }
          });
          
          if (isReady) {
            console.log('✅ [AddAccountDialog] 检测到已连接，停止轮询');
            stopPolling();
            toast.success('登录成功', {
              description: '账号已连接，正在同步数据...'
            });
            onOpenChange(false);
            onSuccess?.();
          }
        } catch (error) {
          // 状态获取也失败了，继续重试
          console.warn('Status polling error:', error);
        }
      }, 2000);
    } catch (error) {
      console.error('startLogin error:', error);
      
      // 🆕 详细的错误分类
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('超时') || errorMessage.includes('Timed Out') || errorMessage.includes('timeout')) {
        setErrorDetails({
          type: 'timeout',
          message: '连接超时，可能是网络不稳定或服务器响应慢',
          canRetry: true
        });
      } else if (errorMessage.includes('network') || errorMessage.includes('ECONNREFUSED') || errorMessage.includes('fetch')) {
        setErrorDetails({
          type: 'network',
          message: '网络连接失败，请检查后端服务是否运行',
          canRetry: true
        });
      } else if (errorMessage.includes('401') || errorMessage.includes('auth') || errorMessage.includes('Unauthorized')) {
        setErrorDetails({
          type: 'auth',
          message: '认证失败，请重新登录系统',
          canRetry: false
        });
      } else {
        setErrorDetails({
          type: 'unknown',
          message: errorMessage || '未知错误，请稍后重试',
          canRetry: true
        });
      }
      
      toast.error('创建账号失败', {
        description: errorMessage || '请检查后端服务器是否运行'
      });
      setState('UNINITIALIZED');
      setCreatedAccountId(null);
      stopPolling();
    } finally {
      setIsRefreshing(false);
      setIsStarting(false);
    }
  };

  const handleRefresh = async () => {
    // 🔥 防止重复点击
    if (isRefreshing || isStarting) {
      return;
    }

    if (createdAccountId) {
      // 如果已经创建了账号，只需要刷新二维码
      setIsRefreshing(true);
      try {
        await api.accounts.start(createdAccountId);
        startAtRef.current = Date.now();
        setQr(null);
        setState('NEED_QR');
        setQrExpireTime(new Date(Date.now() + 60000)); // 🆕 重置二维码60秒后过期
        toast.info('正在刷新二维码...');
      } catch (error) {
        console.error('handleRefresh error:', error);
        toast.error('刷新二维码失败', {
          description: error instanceof Error ? error.message : '请稍后重试'
        });
      } finally {
        setIsRefreshing(false);
      }
    } else {
      // 否则重新开始整个流程
      await startLogin();
    }
  };

  const handleClose = () => {
    stopPolling();
    // 🔥 重置所有状态
    setState('UNINITIALIZED');
    setQr(null);
    setAccountName('');
    setCreatedAccountId(null);
    setIsStarting(false);
    setIsRefreshing(false);
    onOpenChange(false);
  };

  // 🔥 不再自动启动，改为手动输入名称后启动
  useEffect(() => {
    if (open) {
      // 重置状态
      setState('UNINITIALIZED');
      setQr(null);
      setAccountName('');
      setCreatedAccountId(null);
      setIsStarting(false);
      setIsRefreshing(false);
      setErrorDetails(null);
      setShowHelp(false);
      setShowImport(false);
      pollAttempts.current = 0;
    }
    return () => stopPolling();
  }, [open]);

  // 🆕 监听网络状态
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // 🆕 二维码倒计时
  useEffect(() => {
    if (qr && qrExpireTime) {
      const timer = setInterval(() => {
        const now = Date.now();
        const expireAt = qrExpireTime.getTime();
        const timeLeft = Math.max(0, Math.floor((expireAt - now) / 1000));
        setQrTimeLeft(timeLeft);
        
        // 自动刷新即将过期的二维码（提前5秒）
        if (timeLeft === 5 && createdAccountId) {
          console.log('🔄 二维码即将过期，自动刷新...');
          handleRefresh();
        }
      }, 1000);
      
      return () => clearInterval(timer);
    } else {
      setQrTimeLeft(0);
    }
  }, [qr, qrExpireTime, createdAccountId]);

  // 🆕 键盘快捷键
  useEffect(() => {
    if (!open) return;
    
    const handleKeyboard = (e: KeyboardEvent) => {
      // Ctrl/Cmd + Enter 提交表单
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        if (state === 'UNINITIALIZED' && accountName.trim() && accountName.length >= 2 && !isDuplicateName) {
          e.preventDefault();
          startLogin();
        }
      }
      
      // Ctrl/Cmd + R 刷新二维码
      if ((e.ctrlKey || e.metaKey) && e.key === 'r' && state === 'NEED_QR') {
        e.preventDefault();
        handleRefresh();
      }
    };
    
    window.addEventListener('keydown', handleKeyboard);
    return () => window.removeEventListener('keydown', handleKeyboard);
  }, [open, state, accountName, isDuplicateName]);

  // 🆕 检测账号名称重复
  useEffect(() => {
    if (accountName.trim() && accountName.length >= 2) {
      const checkDuplicate = async () => {
        try {
          const accounts = await api.accounts.list();
          const duplicate = accounts.some(
            (acc: any) => acc.name.toLowerCase() === accountName.trim().toLowerCase()
          );
          setIsDuplicateName(duplicate);
        } catch (error) {
          console.error('检测重复账号名称失败:', error);
        }
      };
      
      // 防抖
      const timer = setTimeout(checkDuplicate, 500);
      return () => clearTimeout(timer);
    } else {
      setIsDuplicateName(false);
    }
  }, [accountName]);

  const getStatusBadge = () => {
    const variants = {
      ONLINE: 'default',
      CONNECTING: 'secondary', 
      NEED_QR: 'outline',
      OFFLINE: 'destructive',
      UNINITIALIZED: 'outline',
      CREATING: 'secondary'
    } as const;

    const labels = {
      NEED_QR: '等待扫码',
      CONNECTING: '连接中',
      ONLINE: '已在线',
      OFFLINE: '已断开',
      UNINITIALIZED: '输入账号名称',
      CREATING: '创建中...'
    } as const;

    return (
      <Badge variant={variants[state]}>
        {labels[state]}
      </Badge>
    );
  };

  return (
    <Dialog 
      open={open} 
      onOpenChange={(newOpen) => {
        // 🔒 禁止通过遮罩层或ESC键关闭
        // 只接受通过 open prop 的变化（即点击关闭按钮触发的 handleClose）
      }}
    >
      <DialogContent 
        className="!fixed p-0 gap-0 overflow-hidden flex flex-col !bg-white !opacity-100"
        showCloseButton={false}
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '90vw',  // 🆕 移动端占90%
          maxWidth: '800px',  // 桌面端最大800px
          minWidth: '320px',  // 🆕 最小320px
          height: 'auto',
          maxHeight: '90vh',  // 🆕 改为90vh以适应小屏幕
          borderRadius: '12px',
          boxShadow: '0 30px 60px -15px rgba(0, 0, 0, 0.6), 0 0 0 2px rgba(0, 0, 0, 0.12)',
          border: '2px solid rgba(0, 0, 0, 0.08)',
          backgroundColor: '#ffffff',
          zIndex: 9999,
          opacity: 1,
        }}
      >
        {/* 🆕 关闭按钮 - 右上角绝对定位 */}
        <DialogClose asChild>
          <Button 
            variant="ghost" 
            size="icon" 
            className="absolute top-4 right-4 z-50 rounded-lg hover:bg-gray-100 text-gray-600 hover:text-gray-900 h-8 w-8 transition-colors"
            style={{
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            }}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">关闭</span>
          </Button>
        </DialogClose>

        {/* 头部 - 简洁扁平设计 */}
        <div 
          className="px-5 py-4 bg-gradient-to-r from-green-500 to-emerald-600 border-b border-green-600/20"
          style={{
            borderTopLeftRadius: '12px',
            borderTopRightRadius: '12px',
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-white/90 rounded-lg flex items-center justify-center shadow-sm">
                <QrCode className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <DialogTitle className="text-white text-lg font-bold">
                  添加 WhatsApp 账号
                </DialogTitle>
                <DialogDescription className="text-green-50 text-xs mt-0.5">
                  {state === 'UNINITIALIZED' && '第1步：设置账号名称'}
                  {state === 'CREATING' && '正在创建账号...'}
                  {state === 'NEED_QR' && '第2步：扫码登录'}
                  {state === 'CONNECTING' && '正在连接...'}
                  {state === 'ONLINE' && '✓ 登录成功'}
                </DialogDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* 帮助按钮 */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowHelp(!showHelp)}
                className="rounded-lg hover:bg-white/20 text-white h-8 w-8 transition-colors"
              >
                <HelpCircle className="h-4 w-4" />
              </Button>
              <DialogClose asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="rounded-lg hover:bg-white/20 text-white h-8 w-8 transition-colors"
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">关闭</span>
                </Button>
              </DialogClose>
            </div>
          </div>
        </div>

        {/* 内容区域 - 可滚动 */}
        <div className="flex-1 overflow-y-auto bg-gray-50" style={{ backgroundColor: '#f9fafb', opacity: 1 }}>
          <div className="flex flex-col lg:flex-row items-stretch gap-4 p-5 min-h-full" style={{ backgroundColor: '#f9fafb', opacity: 1 }}>
            
            {/* 🆕 步骤指示器 */}
            {(state === 'UNINITIALIZED' || state === 'CREATING' || state === 'NEED_QR' || state === 'CONNECTING' || state === 'ONLINE') && (
              <div className="mb-4">
                <div className="flex items-center justify-between max-w-xl mx-auto">
                  {/* 步骤1 */}
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm transition-all ${
                      state === 'UNINITIALIZED' || state === 'CREATING'
                        ? 'bg-green-500 text-white' 
                        : 'bg-green-100 text-green-600'
                    }`}>
                      {state === 'UNINITIALIZED' || state === 'CREATING' ? '1' : '✓'}
                    </div>
                    <span className="text-sm font-medium text-gray-700">设置名称</span>
                  </div>
                  
                  {/* 连接线 */}
                  <div className={`flex-1 h-0.5 mx-2 transition-colors ${
                    ['NEED_QR', 'CONNECTING', 'ONLINE'].includes(state)
                      ? 'bg-green-500'
                      : 'bg-gray-300'
                  }`} />
                  
                  {/* 步骤2 */}
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm transition-all ${
                      ['NEED_QR', 'CONNECTING'].includes(state)
                        ? 'bg-green-500 text-white'
                        : state === 'ONLINE'
                        ? 'bg-green-100 text-green-600'
                        : 'bg-gray-200 text-gray-400'
                    }`}>
                      {state === 'ONLINE' ? '✓' : '2'}
                    </div>
                    <span className="text-sm font-medium text-gray-700">扫码登录</span>
                  </div>
                  
                  {/* 连接线 */}
                  <div className={`flex-1 h-0.5 mx-2 transition-colors ${
                    state === 'ONLINE' ? 'bg-green-500' : 'bg-gray-300'
                  }`} />
                  
                  {/* 步骤3 */}
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm transition-all ${
                      state === 'ONLINE'
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 text-gray-400'
                    }`}>
                      {state === 'ONLINE' ? '✓' : '3'}
                    </div>
                    <span className="text-sm font-medium text-gray-700">完成</span>
                  </div>
                </div>
              </div>
            )}

            {/* 🆕 离线警告 */}
            {!isOnline && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                <div className="flex items-center gap-2 text-red-700">
                  <WifiOff className="h-4 w-4" />
                  <span className="text-sm font-medium">网络已断开</span>
                </div>
                <p className="text-xs text-red-600 mt-1">
                  请检查您的网络连接后重试
                </p>
              </div>
            )}

            {/* 🆕 错误提示 */}
            {errorDetails && (
              <div className={`rounded-lg p-4 mb-4 ${
                errorDetails.type === 'timeout' ? 'bg-yellow-50 border border-yellow-200' :
                errorDetails.type === 'network' ? 'bg-orange-50 border border-orange-200' :
                'bg-red-50 border border-red-200'
              }`}>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    {errorDetails.type === 'timeout' && <Clock className="h-5 w-5 text-yellow-600" />}
                    {errorDetails.type === 'network' && <WifiOff className="h-5 w-5 text-orange-600" />}
                    {errorDetails.type === 'auth' && <Shield className="h-5 w-5 text-red-600" />}
                    {errorDetails.type === 'unknown' && <AlertCircle className="h-5 w-5 text-red-600" />}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 text-sm mb-1">
                      {errorDetails.type === 'timeout' ? '⏱️ 操作超时' :
                       errorDetails.type === 'network' ? '🔌 网络错误' :
                       errorDetails.type === 'auth' ? '🔒 认证失败' :
                       '❌ 发生错误'}
                    </h4>
                    <p className="text-sm text-gray-600 mb-2">
                      {errorDetails.message}
                    </p>
                    {errorDetails.canRetry && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setErrorDetails(null);
                            startLogin();
                          }}
                          className="text-xs"
                        >
                          🔄 重试
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setErrorDetails(null)}
                          className="text-xs"
                        >
                          取消
                        </Button>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => setErrorDetails(null)}
                    className="flex-shrink-0 text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {/* 🆕 帮助面板 */}
            {showHelp && (
              <div className="bg-white rounded-lg shadow-xl border border-gray-200 p-4 mb-4">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <span>💡</span> 使用帮助
                </h3>
                
                <div className="space-y-3 text-sm">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">1. 账号名称</h4>
                    <p className="text-gray-600 text-xs">
                      设置一个便于识别的名称，如"客服账号"、"销售1号"
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">2. 扫描二维码</h4>
                    <ul className="text-gray-600 text-xs space-y-1 ml-4 list-disc">
                      <li>打开手机 WhatsApp</li>
                      <li>点击右上角三点 → 已连接的设备</li>
                      <li>点击"连接设备"</li>
                      <li>扫描屏幕上的二维码</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">3. 快捷键</h4>
                    <p className="text-gray-600 text-xs">
                      <kbd className="px-1.5 py-0.5 bg-gray-100 rounded border text-xs">Ctrl</kbd>
                      {' + '}
                      <kbd className="px-1.5 py-0.5 bg-gray-100 rounded border text-xs">Enter</kbd>
                      {' 提交'}
                      &nbsp;&nbsp;
                      <kbd className="px-1.5 py-0.5 bg-gray-100 rounded border text-xs">Ctrl</kbd>
                      {' + '}
                      <kbd className="px-1.5 py-0.5 bg-gray-100 rounded border text-xs">R</kbd>
                      {' 刷新二维码'}
                    </p>
                  </div>
                </div>
                
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowHelp(false)}
                  className="w-full mt-3"
                >
                  关闭
                </Button>
              </div>
            )}

            {/* 🔥 步骤1: 输入账号名称 */}
            {state === 'UNINITIALIZED' && (
              <div className="w-full max-w-xl mx-auto space-y-4">
                {/* 说明卡片 - 更清晰 */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                      <span className="text-white text-xl">1️⃣</span>
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900 text-base mb-1">
                        设置账号名称
                      </div>
                      <div className="text-gray-600 text-sm">
                        为这个 WhatsApp 账号起一个便于识别的名称，例如"客服账号"或"销售1号"
                      </div>
                    </div>
                  </div>
                </div>

                {/* 输入表单 - 卡片式 */}
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <Label htmlFor="account-name" className="text-base font-semibold text-gray-900 mb-2 block">
                    账号名称 <span className="text-red-500">*</span>
                  </Label>
                  
                  <Input
                    id="account-name"
                    placeholder="输入账号名称，如：客服账号、销售1号"
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && accountName.trim() && accountName.length >= 2 && !isDuplicateName) {
                        startLogin();
                      }
                    }}
                    autoFocus
                    maxLength={50}
                    className="h-12 text-base border-2 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all"
                  />
                  
                  {/* 实时字数统计和验证提示 */}
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-xs text-gray-500">
                      用于区分多个账号
                    </p>
                    <p className="text-xs text-gray-400">
                      {accountName.length}/50
                    </p>
                  </div>
                  
                  {/* 实时验证提示 */}
                  {accountName.trim() && accountName.length < 2 && (
                    <p className="text-xs text-orange-600 mt-1 flex items-center gap-1">
                      <span>⚠️</span> 名称至少需要2个字符
                    </p>
                  )}
                  
                  {/* 重复检测提示 */}
                  {isDuplicateName && (
                    <div className="flex items-center gap-2 text-orange-600 text-xs mt-1">
                      <AlertCircle className="h-3 w-3" />
                      <span>此名称已存在，建议使用其他名称以便区分</span>
                    </div>
                  )}
                </div>
                
                {/* 提交按钮 - 更醒目 */}
                <Button 
                  onClick={startLogin} 
                  disabled={!accountName.trim() || accountName.length < 2 || isDuplicateName || isRefreshing || isStarting}
                  className="w-full h-12 text-base font-semibold bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {(isRefreshing || isStarting) ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        正在创建账号...
                      </>
                    ) : (
                      <>
                        <QrCode className="h-5 w-5 mr-2" />
                        下一步：获取二维码
                      </>
                    )}
                </Button>
                
                {/* 快捷键提示 */}
                <div className="text-xs text-gray-500 flex items-center justify-center gap-4">
                  <span>{'💡 快捷键：'}</span>
                  <span>
                    <kbd className="px-1.5 py-0.5 bg-gray-100 rounded border">Ctrl</kbd>
                    {' + '}
                    <kbd className="px-1.5 py-0.5 bg-gray-100 rounded border">Enter</kbd>
                    {' 提交'}
                  </span>
                </div>
                
                {/* 🆕 导入选项 */}
                <div className="flex items-center justify-center gap-2 pt-3 border-t border-gray-200">
                  <span className="text-xs text-gray-500">已有账号？</span>
                  <Button
                    variant="link"
                    size="sm"
                    className="text-xs h-auto p-0"
                    onClick={() => setShowImport(!showImport)}
                  >
                    导入现有会话
                  </Button>
                </div>
                
                {/* 🆕 导入面板 */}
                {showImport && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 text-sm mb-2">
                      导入账号会话
                    </h4>
                    <p className="text-xs text-gray-600 mb-3">
                      如果您之前已经登录过，可以导入会话文件快速恢复
                    </p>
                    <input
                      type="file"
                      accept=".json"
                      className="text-sm w-full p-2 border rounded bg-white"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            try {
                              const session = JSON.parse(event.target?.result as string);
                              toast.info('会话文件读取成功', {
                                description: '此功能正在开发中，敬请期待'
                              });
                            } catch (error) {
                              toast.error('无效的会话文件格式');
                            }
                          };
                          reader.readAsText(file);
                        }
                      }}
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      {'⚠️ 注意：导入功能正在开发中'}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* 🔥 步骤2: 显示二维码 - 两栏布局 */}
            {(state === 'CREATING' || state === 'NEED_QR' || state === 'CONNECTING' || state === 'ONLINE') && (
              <div className="w-full flex flex-col lg:flex-row gap-5">
                {/* 左侧：二维码区域 */}
                <div className="flex-1 flex flex-col items-center justify-center">
                  {/* 二维码容器 */}
                  <div className="relative">
                    <div 
                      className="rounded-xl bg-white p-4 flex items-center justify-center shadow-lg border-2 border-green-500"
                      style={{
                        width: '280px',
                        height: '280px',
                      }}
                    >
                      {qr ? (
                        <>
                          <img 
                            src={qr} 
                            alt="QR Code" 
                            className="w-full h-full object-contain"
                          />
                          
                          {/* 🆕 倒计时圈 */}
                          {qrTimeLeft > 0 && (
                            <div className="absolute bottom-4 right-4 w-14 h-14 rounded-full bg-white shadow-xl flex items-center justify-center border-2 border-gray-200">
                              <div className="text-center">
                                <div className={`text-xl font-bold ${
                                  qrTimeLeft < 10 ? 'text-red-600 animate-pulse' : 'text-gray-900'
                                }`}>
                                  {qrTimeLeft}
                                </div>
                                <div className="text-[8px] text-gray-500 -mt-1">秒</div>
                              </div>
                            </div>
                          )}
                          
                          {/* 🆕 过期提示 */}
                          {qrTimeLeft === 0 && (
                            <div className="absolute inset-0 bg-black/60 rounded-lg flex items-center justify-center backdrop-blur-sm">
                              <div className="text-center text-white px-4">
                                <Clock className="h-8 w-8 mx-auto mb-2" />
                                <p className="text-sm mb-3">二维码已过期</p>
                                <Button size="sm" onClick={handleRefresh} variant="outline" className="bg-white text-gray-900">
                                  刷新二维码
                                </Button>
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="relative w-full h-full flex items-center justify-center bg-gray-50">
                          <Skeleton className="w-full h-full" />
                          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                            <Loader2 className="h-10 w-10 animate-spin text-green-500" />
                            <span className="text-xs font-medium text-gray-600 bg-white px-3 py-1 rounded-full shadow-sm">
                              {state === 'CREATING' ? '创建中...' : '生成二维码...'}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 进度指示器 */}
                  {(state === 'CONNECTING' || state === 'CREATING') && (
                    <div className="flex items-center gap-1.5 mt-4">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  )}
                </div>

                {/* 右侧：信息和说明 */}
                <div className="flex-1 space-y-3">
                  {/* 账号信息卡片 */}
                  <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                        {accountName.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-900 text-sm truncate">{accountName}</div>
                        <div className="text-xs text-gray-500">等待扫码登录</div>
                      </div>
                      {getStatusBadge()}
                    </div>
                  </div>

                  {/* 状态说明卡片 */}
                  <div className="space-y-2">
                    {state === 'CREATING' && (
                      <div className="flex items-center gap-2 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                        <Loader2 className="h-4 w-4 animate-spin text-yellow-600 flex-shrink-0" />
                        <span className="text-sm font-medium text-yellow-800">正在创建账号...</span>
                      </div>
                    )}
                    
                    {state === 'NEED_QR' && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <div className="font-semibold text-gray-900 text-sm flex items-center gap-2 mb-2.5">
                          <span className="text-xl">📱</span>
                          扫描二维码登录
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-start gap-2">
                            <span className="inline-flex w-5 h-5 bg-green-500 text-white rounded-full items-center justify-center text-xs font-bold flex-shrink-0">1</span>
                            <div className="flex-1">
                              <div className="text-xs text-gray-700">打开手机 WhatsApp → 设置 → 已关联的设备</div>
                            </div>
                          </div>
                          <div className="flex items-start gap-2">
                            <span className="inline-flex w-5 h-5 bg-green-500 text-white rounded-full items-center justify-center text-xs font-bold flex-shrink-0">2</span>
                            <div className="flex-1">
                              <div className="text-xs text-gray-700">点击"关联设备"并扫描左侧二维码</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {state === 'CONNECTING' && (
                      <div className="flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-lg p-3">
                        <Loader2 className="h-4 w-4 animate-spin text-orange-600 flex-shrink-0" />
                        <span className="text-sm font-medium text-orange-800">正在连接...</span>
                      </div>
                    )}
                    
                    {state === 'ONLINE' && (
                      <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg p-3">
                        <span className="text-2xl">✅</span>
                        <span className="text-sm font-semibold text-green-800">登录成功！同步数据中...</span>
                      </div>
                    )}

                    {/* 提示信息 */}
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-2.5">
                      <div className="flex items-start gap-2">
                        <span className="text-base flex-shrink-0">💡</span>
                        <div className="text-xs text-gray-600">
                          二维码有效期10分钟，过期后点击刷新
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 底部操作栏 */}
        <div className="border-t border-gray-200 bg-gray-50 px-4 py-3" style={{ backgroundColor: '#f9fafb' }}>
          <DialogFooter className="flex items-center gap-2 sm:justify-between">
            <div className="flex-1 text-xs text-gray-500">
              {(state === 'NEED_QR' || state === 'CONNECTING') && (
                <span>二维码10分钟内有效</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {/* 只在显示二维码时显示刷新按钮 */}
              {(state === 'NEED_QR' || state === 'CONNECTING') && (
                <Button 
                  variant="outline" 
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="gap-1.5 h-9 px-3 text-sm hover:bg-green-50 hover:border-green-300"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin text-green-500' : ''}`} />
                  <span>{isRefreshing ? '刷新中' : '刷新'}</span>
                </Button>
              )}
              <Button 
                variant="outline" 
                onClick={handleClose}
                className="h-9 px-4 text-sm hover:bg-gray-100"
              >
                关闭
              </Button>
            </div>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
