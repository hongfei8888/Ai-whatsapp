'use client';

import { RefreshCw, Wifi, MessageSquare, Bot, Clock, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function NewDashboard() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-blue-600 bg-clip-text text-transparent">
            WhatsApp 操作台 - 新界面
          </h1>
          <p className="text-slate-600 mt-2 text-lg">✨ 全新优化的现代化界面</p>
        </div>
        <Button 
          className="bg-white hover:bg-slate-50 text-slate-700 border shadow-lg hover:shadow-xl transition-all"
          variant="outline"
          size="lg"
        >
          <RefreshCw className="mr-2 h-5 w-5" />
          刷新
        </Button>
      </div>

      {/* 状态概览区 - 2x2 Grid */}
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4 mb-8">
        {/* 客户端状态 */}
        <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-2xl hover:shadow-3xl transition-all duration-500 hover:scale-[1.02] hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-sm font-semibold text-slate-700">客户端状态</CardTitle>
            <div className="relative">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
              <div className="absolute -top-1 -right-1 h-3 w-3 bg-green-500 rounded-full animate-pulse ring-2 ring-green-200"></div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Badge variant="default" className="text-sm font-semibold px-3 py-1 bg-green-100 text-green-800">
                在线
              </Badge>
              <div className="text-xs text-slate-500 space-y-2">
                <div className="flex justify-between items-center">
                  <span>会话就绪</span>
                  <span className="font-medium text-green-600">是</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>在线状态</span>
                  <Wifi className="h-4 w-4 text-green-600" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 对话统计 */}
        <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-2xl hover:shadow-3xl transition-all duration-500 hover:scale-[1.02] hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-sm font-semibold text-slate-700">对话统计</CardTitle>
            <MessageSquare className="h-6 w-6 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-3xl font-bold text-slate-900">5</div>
              <div className="text-xs text-slate-500 space-y-2">
                <div className="flex justify-between">
                  <span>总消息数</span>
                  <span className="font-semibold text-slate-700">42</span>
                </div>
                <div className="flex justify-between">
                  <span>联系人数</span>
                  <span className="font-semibold text-slate-700">5</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AI 自动化 */}
        <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-2xl hover:shadow-3xl transition-all duration-500 hover:scale-[1.02] hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-sm font-semibold text-slate-700">AI 自动化</CardTitle>
            <Bot className="h-6 w-6 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-3xl font-bold text-slate-900">5</div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">活跃会话</span>
                  <span className="text-slate-700 font-semibold">5/5</span>
                </div>
                {/* 彩色进度条 */}
                <div className="w-full bg-slate-200 rounded-full h-2.5">
                  <div className="bg-gradient-to-r from-purple-500 to-blue-500 h-2.5 rounded-full transition-all duration-1000 w-full"></div>
                </div>
                <div className="text-xs text-green-600 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  全部会话已启用 AI
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 最新活动 */}
        <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-2xl hover:shadow-3xl transition-all duration-500 hover:scale-[1.02] hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-sm font-semibold text-slate-700">最新活动</CardTitle>
            <Clock className="h-6 w-6 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-xl font-bold text-slate-900">2分钟前</div>
              <div className="text-xs text-slate-500 space-y-2">
                <div className="flex justify-between">
                  <span>详细时间</span>
                  <span className="font-semibold text-slate-700">09/29 14:41</span>
                </div>
                <div className="flex justify-between">
                  <span>冷却时间</span>
                  <span className="font-semibold text-slate-700">24h</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 自动化概览 */}
      <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-2xl">
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center">
              <Bot className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl text-slate-900">AI 自动化概览</CardTitle>
              <p className="text-slate-600 text-base">智能回复系统运行状态和配置信息</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-base font-semibold text-slate-700">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                系统状态
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">
                ✅ AI 自动回复系统已启动，默认对所有新对话启用智能回复功能。
                回复冷却时间：10 分钟。
              </p>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-base font-semibold text-slate-700">
                <MessageSquare className="h-5 w-5 text-blue-600" />
                活跃统计
              </div>
              <div className="space-y-2 text-sm text-slate-600">
                <div>AI 启用对话：<span className="font-semibold text-green-600">5</span></div>
                <div>人工接管：<span className="font-semibold text-amber-600">0</span></div>
                <div>总对话数：<span className="font-semibold text-slate-800">5</span></div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-base font-semibold text-slate-700">
                <Bot className="h-5 w-5 text-purple-600" />
                性能指标
              </div>
              <div className="space-y-2 text-sm text-slate-600">
                <div>自动化覆盖率</div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-slate-200 rounded-full h-3">
                    <div className="bg-gradient-to-r from-purple-500 to-blue-500 h-3 rounded-full transition-all duration-1000 w-full"></div>
                  </div>
                  <span className="text-sm font-semibold text-slate-700 min-w-[3rem]">100%</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 成功提示 */}
      <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 shadow-2xl mt-8">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="text-center space-y-6">
            <div className="mx-auto h-20 w-20 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="h-10 w-10 text-green-600" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-green-900">🎉 新界面显示成功！</h3>
              <p className="text-green-700 mt-2 text-base">
                如果您能看到这个页面的渐变背景和现代化卡片，说明新界面已经正常工作！
              </p>
              <div className="mt-4 space-y-2 text-sm text-green-600">
                <div>✅ 蓝色渐变背景</div>
                <div>✅ 半透明白色卡片</div>
                <div>✅ 悬停缩放动画</div>
                <div>✅ 彩色状态图标</div>
                <div>✅ 进度条可视化</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
