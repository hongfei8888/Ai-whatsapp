'use client';

import { useEffect, useRef, useState } from 'react';
import { QrCode, Loader2, RefreshCw, X } from 'lucide-react';
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
import { api } from '@/lib/api';
import { toast } from 'sonner';

type State = 'UNINITIALIZED' | 'NEED_QR' | 'CONNECTING' | 'ONLINE' | 'OFFLINE';

interface AddAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function AddAccountDialog({ open, onOpenChange, onSuccess }: AddAccountDialogProps) {
  const [state, setState] = useState<State>('UNINITIALIZED');
  const [qr, setQr] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startAtRef = useRef<number>(0);

  const stopPolling = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const startLogin = async () => {
    setIsRefreshing(true);
    try {
      await api.startLogin();
      setQr(null);
      setState('NEED_QR');
      startAtRef.current = Date.now();
      
      stopPolling();
      timerRef.current = setInterval(async () => {
        try {
          const data = await api.getQRCode();
          setState(data.state as State);
          
          if (data.qr) {
            setQr(data.qr);
          }
          
          // 超时 10 分钟
          if (Date.now() - startAtRef.current > 10 * 60 * 1000) {
            stopPolling();
            toast.error('二维码已过期，请刷新');
            return;
          }
          
          if (data.state === 'ONLINE') {
            stopPolling();
            toast.success('登录成功', {
              description: '账号已连接，正在同步数据...'
            });
            onOpenChange(false);
            onSuccess?.();
          }
        } catch (error) {
          // 忽略瞬时网络错误，继续轮询
          console.warn('QR polling error:', error);
        }
      }, 2000);
    } catch (error) {
      toast.error('启动登录失败', {
        description: error instanceof Error ? error.message : '请检查网络连接'
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    await startLogin();
  };

  const handleClose = () => {
    stopPolling();
    onOpenChange(false);
  };

  useEffect(() => {
    if (open) {
      startLogin();
    }
    return () => stopPolling();
  }, [open]);

  const getStatusBadge = () => {
    const variants = {
      ONLINE: 'default',
      CONNECTING: 'secondary', 
      NEED_QR: 'outline',
      OFFLINE: 'destructive',
      UNINITIALIZED: 'outline'
    } as const;

    const labels = {
      NEED_QR: '等待扫码',
      CONNECTING: '连接中',
      ONLINE: '已在线',
      OFFLINE: '已断开',
      UNINITIALIZED: '初始化中'
    } as const;

    return (
      <Badge variant={variants[state]}>
        {labels[state]}
      </Badge>
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md z-[100]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <div className="p-1.5 bg-green-100 rounded-lg">
                <QrCode className="h-4 w-4 text-green-600" />
              </div>
              扫码添加账号
            </DialogTitle>
            <DialogClose asChild>
              <Button variant="ghost" size="sm" className="rounded-full">
                <X className="h-4 w-4" />
                <span className="sr-only">关闭</span>
              </Button>
            </DialogClose>
          </div>
          <DialogDescription>
            使用手机 WhatsApp 扫描下方二维码完成登录，登录成功后会自动保持会话。
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-6 py-4">
          {/* 二维码容器 */}
          <div className="aspect-square w-[220px] md:w-[320px] rounded-xl border bg-muted flex items-center justify-center overflow-hidden shadow-sm">
            {qr ? (
              <img 
                src={qr} 
                alt="QR Code" 
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="flex flex-col items-center gap-3">
                <Skeleton className="w-full h-full rounded-lg" />
                {state === 'NEED_QR' && (
                  <div className="absolute flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    生成二维码中...
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 状态指示 */}
          <div className="flex items-center gap-3">
            {getStatusBadge()}
            {state === 'CONNECTING' && (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </div>

          {/* 状态描述 */}
          <div className="text-center text-sm text-muted-foreground max-w-sm">
            {state === 'NEED_QR' && '请使用手机 WhatsApp 扫描上方二维码'}
            {state === 'CONNECTING' && '正在连接，请稍候...'}
            {state === 'ONLINE' && '登录成功！正在跳转...'}
            {state === 'OFFLINE' && '连接已断开，请重新扫码'}
            {state === 'UNINITIALIZED' && '正在初始化登录...'}
          </div>
        </div>

        <DialogFooter className="flex items-center gap-2 sm:justify-end">
          <Button 
            variant="outline" 
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? '刷新中...' : '刷新二维码'}
          </Button>
          <Button variant="outline" onClick={handleClose}>
            关闭
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
