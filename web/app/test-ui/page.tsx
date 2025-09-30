'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageSquare, Bot, Activity, Clock } from 'lucide-react';

export default function TestUIPage() {
  return (
    <div 
      className="test-gradient min-h-screen"
      style={{
        background: 'linear-gradient(to bottom, #e0e7ff, #ffffff)',
        minHeight: '100vh'
      }}
    >
      <div className="max-w-[1200px] mx-auto px-4 md:px-6 py-8 space-y-8">
        {/* 页面标题 */}
        <div className="text-center">
          <h1 
            className="text-4xl font-bold mb-4"
            style={{ color: '#4f46e5' }}
          >
            🎉 UI测试页面
          </h1>
          <p style={{ color: '#6b7280' }}>
            如果你能看到这个页面，说明新的UI系统正常工作！
          </p>
        </div>

        {/* 12栅格布局测试 */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* KPI 统计卡片 - 顶部4张 */}
          <div className="lg:col-span-3">
            <Card className="rounded-2xl border bg-card shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">总对话数</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">12</div>
                <p className="text-xs text-muted-foreground mt-1">所有活跃对话</p>
              </CardContent>
            </Card>
          </div>
          
          <div className="lg:col-span-3">
            <Card className="rounded-2xl border bg-card shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">今日自动回复</CardTitle>
                <Bot className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">154</div>
                <p className="text-xs text-muted-foreground mt-1">AI已发送消息</p>
              </CardContent>
            </Card>
          </div>
          
          <div className="lg:col-span-3">
            <Card className="rounded-2xl border bg-card shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">24h 活跃线程</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">8</div>
                <p className="text-xs text-muted-foreground mt-1">最近活跃</p>
              </CardContent>
            </Card>
          </div>
          
          <div className="lg:col-span-3">
            <Card className="rounded-2xl border bg-card shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">平均响应时间</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">1.2s</div>
                <p className="text-xs text-muted-foreground mt-1">系统延迟</p>
              </CardContent>
            </Card>
          </div>

          {/* 左侧主栏 - 8列 */}
          <div className="lg:col-span-8 space-y-6">
            <Card className="rounded-2xl border bg-card shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  最近会话
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">张三</p>
                      <p className="text-sm text-gray-500">+1234567890</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm">5分钟前</p>
                      <p className="text-xs text-gray-500">15条消息</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">李四</p>
                      <p className="text-sm text-gray-500">+0987654321</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm">10分钟前</p>
                      <p className="text-xs text-gray-500">8条消息</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 右侧侧栏 - 4列 */}
          <div className="lg:col-span-4 space-y-6">
            <Card className="rounded-2xl border bg-card shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  系统状态
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">WhatsApp 连接</span>
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">在线</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">AI 服务</span>
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">正常</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">会话目录</span>
                  <span className="text-sm text-muted-foreground">5 个</span>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border bg-card shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  自动化日志
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-green-50">
                    <div className="w-2 h-2 rounded-full bg-green-500 mt-2" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">AI自动回复已发送</p>
                      <p className="text-xs text-gray-500">2分钟前</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-50">
                    <div className="w-2 h-2 rounded-full bg-blue-500 mt-2" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">新对话已建立</p>
                      <p className="text-xs text-gray-500">5分钟前</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* 测试按钮 */}
        <div className="text-center">
          <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
            测试按钮 - 如果你看到这个，UI系统正常！
          </Button>
        </div>
      </div>
    </div>
  );
}
