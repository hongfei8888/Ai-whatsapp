'use client';

import { MessageSquare, Bot, Users, Activity, CheckCircle2, Wifi } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function ModernDashboardPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white dark:from-zinc-900 dark:to-zinc-950">
      <div className="max-w-[1200px] mx-auto px-4 md:px-6 py-6 space-y-6">
        {/* 测试页面头部 */}
        <div className="text-center py-8">
          <h1 className="text-4xl font-bold text-transparent bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text mb-4">
            🎉 现代化Dashboard测试页面
          </h1>
          <p className="text-lg text-muted-foreground">
            如果你看到这个页面，说明新设计已经生效！
          </p>
        </div>

        {/* 测试统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          <Card className="rounded-2xl border bg-card shadow-sm p-6">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">对话总数</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">42</div>
              <p className="text-xs text-muted-foreground mt-1">测试数据</p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border bg-card shadow-sm p-6">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">AI 自动回复</CardTitle>
              <Bot className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">24/42</div>
              <p className="text-xs text-muted-foreground mt-1">57% 覆盖率</p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border bg-card shadow-sm p-6">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">联系人数量</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">123</div>
              <p className="text-xs text-muted-foreground mt-1">已添加联系人</p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border bg-card shadow-sm p-6">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">最新活动</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2分钟前</div>
              <p className="text-xs text-muted-foreground mt-1">最后消息时间</p>
            </CardContent>
          </Card>
        </div>

        {/* 测试系统状态卡片 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="rounded-2xl border bg-card shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">客户端状态</CardTitle>
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Badge variant="default" className="font-medium">
                在线
              </Badge>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">会话就绪</span>
                  <Badge variant="default">是</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">在线状态</span>
                  <Wifi className="h-4 w-4 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border bg-card shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">✅ 测试成功！</CardTitle>
              <CardDescription>新的现代化设计已经正常工作</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span className="text-sm">shadcn/ui 组件正常</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span className="text-sm">TailwindCSS 样式生效</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span className="text-sm">渐变背景显示正常</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span className="text-sm">响应式布局正常</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 测试按钮 */}
        <Card className="rounded-2xl border bg-card shadow-sm">
          <CardContent className="p-6 text-center">
            <h3 className="text-lg font-semibold mb-4">现在请访问正确的Dashboard</h3>
            <Button 
              onClick={() => window.location.href = '/dashboard'} 
              size="lg"
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
            >
              🚀 跳转到主Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
