'use client';

import { useState, useEffect } from 'react';
import { Activity, Wifi, WifiOff, MessageSquare, Clock, TrendingUp, AlertCircle, BarChart3 } from 'lucide-react';
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
import { Progress } from '@/components/ui/progress';
import { api } from '@/lib/api';
import type { StatusPayload } from '@/lib/types';

interface StatusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function StatusDialog({ open, onOpenChange }: StatusDialogProps) {
  const [status, setStatus] = useState<StatusPayload | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      loadStatus();
      // 每5秒自动刷新状态
      const interval = setInterval(loadStatus, 5000);
      return () => clearInterval(interval);
    }
  }, [open]);

  const loadStatus = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const statusData = await api.getStatus();
      setStatus(statusData);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载状态失败');
    } finally {
      setIsLoading(false);
    }
  };

  const getConnectionStatus = () => {
    if (!status) return { icon: WifiOff, label: '未知', color: 'text-gray-500', bgColor: 'bg-gray-100' };
    
    if (status.online && status.sessionReady) {
      return { icon: Wifi, label: '在线', color: 'text-green-600', bgColor: 'bg-green-100' };
    } else if (status.status === 'QR') {
      return { icon: Activity, label: '等待扫码', color: 'text-yellow-600', bgColor: 'bg-yellow-100' };
    } else {
      return { icon: WifiOff, label: '离线', color: 'text-red-600', bgColor: 'bg-red-100' };
    }
  };

  const formatDateTime = (timestamp: string | null) => {
    if (!timestamp) return 'N/A';
    return new Intl.DateTimeFormat('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(new Date(timestamp));
  };

  const formatUptime = () => {
    if (!status?.lastOnline) return 'N/A';
    
    const uptime = Date.now() - new Date(status.lastOnline).getTime();
    const hours = Math.floor(uptime / (1000 * 60 * 60));
    const minutes = Math.floor((uptime % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}小时${minutes}分钟`;
    } else {
      return `${minutes}分钟`;
    }
  };

  const connectionStatus = getConnectionStatus();
  const ConnectionIcon = connectionStatus.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <BarChart3 className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold">系统状态</DialogTitle>
              <DialogDescription>
                实时监控 WhatsApp 连接状态和系统运行情况
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
          {isLoading && !status ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
                <p className="text-gray-600">加载状态数据中...</p>
              </div>
            </div>
          ) : status ? (
            <div className="grid gap-6">
              {/* 连接状态卡片 */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <ConnectionIcon className={`h-5 w-5 ${connectionStatus.color}`} />
                        连接状态
                      </CardTitle>
                      <CardDescription>WhatsApp 客户端连接状态</CardDescription>
                    </div>
                    <Badge variant="secondary" className={`${connectionStatus.bgColor} ${connectionStatus.color} hover:${connectionStatus.bgColor}`}>
                      {connectionStatus.label}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <p className="text-2xl font-bold text-gray-900">{status.status}</p>
                      <p className="text-sm text-gray-600">客户端状态</p>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <p className="text-2xl font-bold text-gray-900">{status.phoneE164 || 'N/A'}</p>
                      <p className="text-sm text-gray-600">绑定号码</p>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <p className="text-2xl font-bold text-gray-900">{formatUptime()}</p>
                      <p className="text-sm text-gray-600">运行时长</p>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <p className="text-2xl font-bold text-gray-900">{formatDateTime(status.lastOnline || null)}</p>
                      <p className="text-sm text-gray-600">最后在线</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 统计数据 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-5 w-5 text-blue-600" />
                      <CardTitle className="text-lg">联系人统计</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-blue-600 mb-2">
                      {status.contactCount}
                    </div>
                    <p className="text-sm text-gray-600">总联系人数</p>
                    <div className="mt-4">
                      <Progress value={Math.min((status.contactCount / 100) * 100, 100)} className="h-2" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-orange-600" />
                      <CardTitle className="text-lg">冷却配置</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-orange-600 mb-2">
                      {status.cooldownHours}h
                    </div>
                    <p className="text-sm text-gray-600">全局冷却时间</p>
                    <div className="mt-2 text-sm text-gray-500">
                      单联系人：{status.perContactReplyCooldownMinutes}分钟
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-green-600" />
                      <CardTitle className="text-lg">最近活动</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-lg font-semibold text-green-600 mb-2">
                      {status.latestMessageAt ? formatDateTime(status.latestMessageAt) : 'N/A'}
                    </div>
                    <p className="text-sm text-gray-600">最新消息时间</p>
                  </CardContent>
                </Card>
              </div>

              {/* 系统信息 */}
              <Card>
                <CardHeader>
                  <CardTitle>系统信息</CardTitle>
                  <CardDescription>详细的系统配置和运行参数</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">会话就绪:</span>
                        <span className={status.sessionReady ? 'text-green-600' : 'text-red-600'}>
                          {status.sessionReady ? '是' : '否'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">在线状态:</span>
                        <span className={status.online ? 'text-green-600' : 'text-red-600'}>
                          {status.online ? '在线' : '离线'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">状态机:</span>
                        <span>{status.state || 'N/A'}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">冷却小时:</span>
                        <span>{status.cooldownHours}h</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">联系人冷却:</span>
                        <span>{status.perContactReplyCooldownMinutes}min</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">QR状态:</span>
                        <span>{status.qr ? '有二维码' : '无'}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            /* 空状态 */
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    <AlertCircle className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">无法获取状态信息</h3>
                  <p className="text-gray-600 mb-6">
                    系统状态数据加载失败，请检查网络连接
                  </p>
                  <Button onClick={loadStatus}>
                    重新加载
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 操作按钮 */}
          <div className="flex items-center justify-between pt-6">
            <div className="text-sm text-gray-500">
              {status && `最后更新: ${formatDateTime(new Date().toISOString())}`}
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                关闭
              </Button>
              <Button onClick={loadStatus} disabled={isLoading}>
                {isLoading ? '刷新中...' : '刷新'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
