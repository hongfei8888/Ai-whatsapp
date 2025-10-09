'use client';

import { useEffect, useMemo, useState } from 'react';
import QRCode from 'qrcode';

// import { useToast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { api } from '@/lib/api';
import type { StatusPayload } from '@/lib/types';

interface StatusCardProps {
  initial: StatusPayload;
}

const STATUS_BADGES: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' }> = {
  READY: { label: 'Online', variant: 'default' },
  QR: { label: 'Awaiting QR', variant: 'secondary' },
  INITIALIZING: { label: 'Starting', variant: 'secondary' },
  AUTHENTICATING: { label: 'Authenticating', variant: 'secondary' },
  DISCONNECTED: { label: 'Disconnected', variant: 'destructive' },
  FAILED: { label: 'Failed', variant: 'destructive' },
};

export function StatusCard({ initial }: StatusCardProps) {
  // const { toast } = useToast();
  const [status, setStatus] = useState(initial);
  const [qrImage, setQrImage] = useState<string | null>(null);
  const [isRefreshing, setRefreshing] = useState(false);
  const [isLoggingIn, setLoggingIn] = useState(false);
  const [isLoggingOut, setLoggingOut] = useState(false);

  const badge = useMemo(() => STATUS_BADGES[status.status] ?? { label: status.status, variant: 'secondary' as const }, [status.status]);

  useEffect(() => {
    let active = true;
    if (!status.qr) {
      setQrImage(null);
      return () => {
        active = false;
      };
    }

    QRCode.toDataURL(status.qr, { margin: 1, width: 240 })
      .then((dataUrl) => {
        if (active) {
          setQrImage(dataUrl);
        }
      })
      .catch(() => {
        if (active) {
          setQrImage(null);
        }
      });

    return () => {
      active = false;
    };
  }, [status.qr]);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const next = await api.getStatus();
        setStatus(next);
      } catch (error) {
        console.error(error);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const next = await api.getStatus();
      setStatus(next);
    } catch (error) {
      console.error('Failed to refresh status:', error);
      // toast({
      //   variant: 'destructive',
      //   title: 'Failed to refresh status',
      //   description: error instanceof Error ? error.message : 'Unable to load status',
      // });
    } finally {
      setRefreshing(false);
    }
  };

  const handleLogin = async () => {
    setLoggingIn(true);
    try {
      // 这里应该调用登录API，暂时模拟
      await new Promise(resolve => setTimeout(resolve, 1000));
      const next = await api.getStatus();
      setStatus(next);
    } catch (error) {
      console.error('Failed to login:', error);
    } finally {
      setLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      // 这里应该调用登出API，暂时模拟
      await new Promise(resolve => setTimeout(resolve, 1000));
      const next = await api.getStatus();
      setStatus(next);
    } catch (error) {
      console.error('Failed to logout:', error);
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* 状态信息 */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-gray-700 font-medium">Online</span>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            status.online ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {status.online ? 'Yes' : 'No'}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-700 font-medium">Session ready</span>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            status.sessionReady ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {status.sessionReady ? 'Yes' : 'No'}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-700 font-medium">Cooldown (hours)</span>
          <span className="font-bold text-gray-800">{status.cooldownHours}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-700 font-medium">Reply cooldown (minutes)</span>
          <span className="font-bold text-gray-800">{status.perContactReplyCooldownMinutes}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-700 font-medium">Contacts</span>
          <span className="font-bold text-gray-800">{status.contactCount}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-700 font-medium">Latest message</span>
          <span className="font-bold text-gray-800">{formatDateTime(status.latestMessageAt)}</span>
        </div>
      </div>

      {/* QR码区域 */}
      <div className="mt-6">
        <div className="text-center">
          {qrImage ? (
            <div className="space-y-4">
              <img 
                src={qrImage} 
                alt="WhatsApp QR" 
                className="mx-auto h-48 w-48 rounded-xl border-2 border-gray-200 shadow-lg"
                style={{ borderRadius: '0.75rem' }}
              />
              <div className="space-y-2">
                <p className="text-sm text-gray-600">请使用手机扫描二维码登录</p>
                <div className="flex gap-2 justify-center">
                  <button 
                    onClick={handleRefresh} 
                    disabled={isRefreshing}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors text-sm"
                  >
                    {isRefreshing ? 'Refreshing...' : '刷新二维码'}
                  </button>
                  <button 
                    onClick={handleLogin} 
                    disabled={isLoggingIn}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 transition-colors text-sm"
                  >
                    {isLoggingIn ? 'Logging in...' : '开始登录'}
                  </button>
                </div>
              </div>
            </div>
          ) : status.status === 'READY' ? (
            <div className="space-y-4">
              <div 
                className="flex h-48 w-48 mx-auto items-center justify-center rounded-xl border-2 border-green-200 bg-green-50 text-green-600"
                style={{ borderRadius: '0.75rem' }}
              >
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-white text-2xl">✓</span>
                  </div>
                  <p className="font-semibold">已连接</p>
                  <p className="text-sm">WhatsApp 已成功登录</p>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-green-600">登录成功！可以开始使用自动化功能</p>
                <button 
                  onClick={handleLogout} 
                  disabled={isLoggingOut}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 transition-colors text-sm"
                >
                  {isLoggingOut ? 'Logging out...' : '退出登录'}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div 
                className="flex h-48 w-48 mx-auto items-center justify-center rounded-xl border-2 border-dashed border-gray-300 text-gray-500"
                style={{ borderRadius: '0.75rem' }}
              >
                <div className="text-center">
                  <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-gray-400 text-2xl">📱</span>
                  </div>
                  <p className="font-semibold">等待连接</p>
                  <p className="text-sm">QR code not available</p>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-gray-600">请等待QR码生成或点击刷新</p>
                <button 
                  onClick={handleRefresh} 
                  disabled={isRefreshing}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors text-sm"
                >
                  {isRefreshing ? 'Refreshing...' : '刷新状态'}
                </button>
              </div>
            </div>
          )}
        </div>
        
        {/* 操作步骤 */}
        <div className="mt-6">
          <h3 className="text-sm font-semibold text-gray-800 mb-3">操作步骤</h3>
          {status.status === 'READY' ? (
            <div className="space-y-2 text-xs text-green-600">
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xs font-bold">✓</span>
                <span>WhatsApp 已成功连接</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xs font-bold">✓</span>
                <span>可以开始使用自动化功能</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xs font-bold">✓</span>
                <span>系统正在监控消息并自动回复</span>
              </div>
            </div>
          ) : qrImage ? (
            <div className="space-y-2 text-xs text-gray-600">
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">1</span>
                <span>打开手机上的 WhatsApp</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">2</span>
                <span>点击右上角的三个点→已连接的设备</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">3</span>
                <span>点击"连接设备"</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">4</span>
                <span>扫描上方二维码</span>
              </div>
            </div>
          ) : (
            <div className="space-y-2 text-xs text-gray-600">
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 bg-gray-100 text-gray-600 rounded-full flex items-center justify-center text-xs font-bold">1</span>
                <span>等待系统初始化</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 bg-gray-100 text-gray-600 rounded-full flex items-center justify-center text-xs font-bold">2</span>
                <span>系统将自动生成QR码</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 bg-gray-100 text-gray-600 rounded-full flex items-center justify-center text-xs font-bold">3</span>
                <span>点击"刷新状态"按钮</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2 px-3 bg-white/50 rounded-lg">
      <span className="text-gray-700 font-medium">{label}</span>
      <span className="font-bold text-gray-900">{value}</span>
    </div>
  );
}

function formatDateTime(value: string | null): string {
  if (!value) return 'N/A';
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}
