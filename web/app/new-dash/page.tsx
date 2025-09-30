'use client';

import { useEffect, useState } from 'react';
import { 
  RefreshCw, 
  Wifi, 
  WifiOff, 
  MessageSquare, 
  Bot, 
  Users, 
  AlertCircle, 
  CheckCircle2, 
  Loader2,
  Activity
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { ActionButtons } from '@/components/dashboard/action-buttons';
import { api } from '@/lib/api';
import { toast } from 'sonner';

export default function NewDashPage() {
  const [status, setStatus] = useState<any>(null);
  const [threads, setThreads] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [mounted, setMounted] = useState(false);

  // 修复Hydration问题
  useEffect(() => {
    setMounted(true);
  }, []);

  const loadData = async (showRefreshing = false) => {
    if (showRefreshing) setIsRefreshing(true);
    
    try {
      const [statusResult, threadsResult] = await Promise.all([
        api.getStatus(),
        api.getThreads()
      ]);
      
      setStatus(statusResult);
      setThreads(threadsResult.threads || []);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      toast.error('加载数据失败');
    } finally {
      setIsLoading(false);
      if (showRefreshing) setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (mounted) {
      loadData();
      
      // 自动刷新
      const interval = setInterval(() => loadData(), 30000);
      return () => clearInterval(interval);
    }
  }, [mounted]);

  const handleRefresh = () => {
    loadData(true);
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await api.logout();
      toast.success('退出登录成功');
      await loadData();
    } catch (error) {
      console.error('Failed to logout:', error);
      toast.error('退出登录失败');
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleLoginSuccess = () => {
    toast.success('登录成功');
    loadData();
  };

  // 避免Hydration错误，在mounted之前不渲染动态内容
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-zinc-900 dark:to-zinc-950 flex items-center justify-center">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="text-lg">初始化中...</span>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-zinc-900 dark:to-zinc-950 flex items-center justify-center">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="text-lg">加载数据中...</span>
        </div>
      </div>
    );
  }

  const summary = {
    total: threads.length,
    aiEnabled: threads.filter((thread: any) => thread.aiEnabled).length,
    totalMessages: threads.reduce((sum: number, thread: any) => sum + (thread.messagesCount || 0), 0),
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-zinc-900 dark:to-zinc-950">
      <div className="max-w-[1200px] mx-auto px-4 md:px-6 py-6 space-y-6">
        {/* 页面头部 */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              🚀 全新 WhatsApp 自动化中心
            </h1>
            <p className="text-lg text-muted-foreground">
              现代化设计 • 完整功能 • 实时监控
            </p>
          </div>
          
          <ActionButtons
            isRefreshing={isRefreshing}
            isLoggingOut={isLoggingOut}
            onRefresh={handleRefresh}
            onLogout={handleLogout}
            onLoginSuccess={handleLoginSuccess}
          />
        </div>

        {/* ✅ 成功提示 */}
        <Card className="rounded-2xl border border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-full">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-green-800">🎉 现代化Dashboard成功激活！</h3>
                <p className="text-green-700 text-base">
                  全新UI设计正常运行，包括shadcn/ui组件、TailwindCSS样式和完整业务功能。
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 核心统计 */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          <Card className="rounded-2xl border bg-white dark:bg-card shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">对话总数</CardTitle>
              <MessageSquare className="h-5 w-5 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{summary.total}</div>
              <p className="text-sm text-muted-foreground mt-1">{summary.totalMessages} 条消息</p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border bg-white dark:bg-card shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">AI 自动回复</CardTitle>
              <Bot className="h-5 w-5 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">{summary.aiEnabled}/{summary.total}</div>
              <p className="text-sm text-muted-foreground mt-1">
                {summary.total > 0 ? Math.round((summary.aiEnabled / summary.total) * 100) : 0}% 覆盖率
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border bg-white dark:bg-card shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">联系人数量</CardTitle>
              <Users className="h-5 w-5 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{status?.contactCount || 0}</div>
              <p className="text-sm text-muted-foreground mt-1">已添加联系人</p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border bg-white dark:bg-card shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">系统状态</CardTitle>
              <Activity className="h-5 w-5 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">
                {status?.online ? '在线' : '离线'}
              </div>
              <div className="flex items-center gap-1 mt-1">
                {status?.online ? (
                  <Wifi className="h-4 w-4 text-green-500" />
                ) : (
                  <WifiOff className="h-4 w-4 text-red-500" />
                )}
                <p className="text-sm text-muted-foreground">WhatsApp 连接</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 系统状态详情 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 客户端状态 */}
          <Card className="rounded-2xl border bg-white dark:bg-card shadow-lg">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold text-gray-800">客户端状态</CardTitle>
                <div className="relative">
                  <CheckCircle2 className="h-6 w-6 text-green-500" />
                  {status?.online && (
                    <div className="absolute -top-1 -right-1 h-3 w-3 bg-green-500 rounded-full animate-pulse"></div>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Badge 
                variant={status?.online ? 'default' : 'destructive'} 
                className="font-medium text-sm px-3 py-1"
              >
                {status?.online ? '🟢 在线' : '🔴 离线'}
              </Badge>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">会话就绪</span>
                  <Badge variant={status?.sessionReady ? 'default' : 'destructive'}>
                    {status?.sessionReady ? '✅ 是' : '❌ 否'}
                  </Badge>
                </div>
                {status?.phoneE164 && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">绑定号码</span>
                    <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                      {status.phoneE164}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* AI 自动化进度 */}
          <Card className="rounded-2xl border bg-white dark:bg-card shadow-lg">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold text-gray-800">AI 自动化</CardTitle>
                <Bot className="h-6 w-6 text-purple-500" />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-end gap-2">
                <span className="text-3xl font-bold text-purple-600">{summary.aiEnabled}</span>
                <span className="text-lg text-muted-foreground">/ {summary.total}</span>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">活跃会话</span>
                  <span className="font-semibold text-purple-600">
                    {summary.total > 0 ? Math.round((summary.aiEnabled / summary.total) * 100) : 0}%
                  </span>
                </div>
                <Progress 
                  value={summary.total > 0 ? (summary.aiEnabled / summary.total) * 100 : 0} 
                  className="h-3"
                />
              </div>
              {summary.total - summary.aiEnabled > 0 && (
                <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 p-2 rounded-md">
                  <AlertCircle className="h-4 w-4" />
                  {summary.total - summary.aiEnabled} 个暂停的会话
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 快速导航 */}
        <Card className="rounded-2xl border bg-white dark:bg-card shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl font-semibold">🚀 快速导航</CardTitle>
            <CardDescription>访问其他功能页面</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button 
                onClick={() => window.location.href = '/contacts'}
                className="p-6 h-auto flex-col gap-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200"
                variant="outline"
              >
                <Users className="h-6 w-6" />
                <span className="font-semibold">联系人管理</span>
                <span className="text-sm opacity-75">添加和管理联系人</span>
              </Button>
              
              <Button 
                onClick={() => window.location.href = '/threads'}
                className="p-6 h-auto flex-col gap-2 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200"
                variant="outline"
              >
                <MessageSquare className="h-6 w-6" />
                <span className="font-semibold">对话管理</span>
                <span className="text-sm opacity-75">查看和管理对话</span>
              </Button>
              
              <Button 
                onClick={() => window.location.href = '/settings'}
                className="p-6 h-auto flex-col gap-2 bg-green-50 hover:bg-green-100 text-green-700 border border-green-200"
                variant="outline"
              >
                <Bot className="h-6 w-6" />
                <span className="font-semibold">AI设置</span>
                <span className="text-sm opacity-75">配置自动回复</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 空状态提示 */}
        {summary.total === 0 && (
          <Card className="rounded-2xl border bg-white dark:bg-card shadow-lg">
            <CardContent className="p-12 text-center">
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-blue-100 mx-auto mb-6">
                <MessageSquare className="h-12 w-12 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold mb-4">开始您的WhatsApp自动化之旅</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                添加联系人并发送首条消息，即可激活AI自动回复功能，让智能助手为您处理日常对话。
              </p>
              <Button 
                onClick={() => window.location.href = '/contacts'}
                size="lg"
                className="gap-3 px-8 py-4"
              >
                <Users className="h-5 w-5" />
                立即添加联系人
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
