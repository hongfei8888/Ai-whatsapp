'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { 
  MessageSquare, 
  User, 
  Clock, 
  Bot, 
  UserCircle,
  Search,
  Filter,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
// Select 组件暂时用原生 select 替代
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from '@/components/ui/select';

interface Thread {
  id: string;
  contact: {
    id: string;
    name?: string | null;
    phoneE164: string;
  };
  messagesCount: number;
  lastMessageAt?: string;
  lastMessage?: {
    body: string;
    fromMe: boolean;
  };
  aiEnabled: boolean;
  unreadCount?: number;
}

export default function ThreadsPage() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [filteredThreads, setFilteredThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'ai-enabled' | 'manual'>('all');
  const [refreshing, setRefreshing] = useState(false);

  const fetchThreads = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getThreads();
      const threadsList = data.threads || [];
      setThreads(threadsList);
      setFilteredThreads(threadsList);
    } catch (error) {
      console.error('获取会话失败:', error);
      setError(error instanceof Error ? error.message : '获取会话失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchThreads();
  }, []);

  useEffect(() => {
    let result = threads;

    // 应用搜索过滤
    if (searchQuery) {
      result = result.filter(
        (thread) =>
          thread.contact?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          thread.contact?.phoneE164?.includes(searchQuery)
      );
    }

    // 应用类型过滤
    if (filterType === 'ai-enabled') {
      result = result.filter((thread) => thread.aiEnabled);
    } else if (filterType === 'manual') {
      result = result.filter((thread) => !thread.aiEnabled);
    }

    setFilteredThreads(result);
  }, [searchQuery, filterType, threads]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchThreads();
    setRefreshing(false);
  };

  const handleToggleAI = async (threadId: string, currentState: boolean) => {
    try {
      await api.setThreadAiEnabled(threadId, !currentState);
      // 更新本地状态
      setThreads(threads.map(thread => 
        thread.id === threadId 
          ? { ...thread, aiEnabled: !currentState }
          : thread
      ));
    } catch (error) {
      console.error('切换AI状态失败:', error);
      alert('切换AI状态失败: ' + (error instanceof Error ? error.message : '未知错误'));
    }
  };

  const formatTime = (timestamp?: string) => {
    if (!timestamp) return '未知';
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;
    return date.toLocaleDateString('zh-CN');
  };

  if (loading && threads.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-muted-foreground" />
          <p className="text-muted-foreground">加载会话中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* 头部 */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">会话管理</h1>
          <p className="text-muted-foreground mt-1">
            查看和管理所有对话，控制 AI 自动回复
          </p>
        </div>
        <Button
          onClick={handleRefresh}
          disabled={refreshing}
          variant="outline"
          size="sm"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          刷新
        </Button>
      </div>

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总会话数</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{threads.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              所有对话总数
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI 接管</CardTitle>
            <Bot className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {threads.filter((t) => t.aiEnabled).length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              AI 自动回复中
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">人工处理</CardTitle>
            <UserCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {threads.filter((t) => !t.aiEnabled).length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              需要人工回复
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 搜索和过滤 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">筛选会话</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索联系人姓名或电话..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="relative w-full md:w-[200px]">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
                className="w-full h-10 pl-10 pr-4 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="all">全部会话</option>
                <option value="ai-enabled">AI 接管</option>
                <option value="manual">人工处理</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 会话列表 */}
      {error ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <p className="text-destructive mb-2">❌ {error}</p>
              <Button onClick={fetchThreads} variant="outline" size="sm">
                重试
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : filteredThreads.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">暂无会话</h3>
              <p className="text-muted-foreground">
                {searchQuery || filterType !== 'all'
                  ? '没有找到符合条件的会话'
                  : '还没有任何对话记录'}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredThreads.map((thread) => (
            <Card key={thread.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  {/* 左侧：联系人信息 */}
                  <div className="flex items-start gap-4 flex-1">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <User className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-lg truncate">
                          {thread.contact?.name || '未知联系人'}
                        </h3>
                        {thread.aiEnabled ? (
                          <Badge variant="default" className="gap-1">
                            <Bot className="h-3 w-3" />
                            AI
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="gap-1">
                            <UserCircle className="h-3 w-3" />
                            人工
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        📱 {thread.contact?.phoneE164 || '未知号码'}
                      </p>
                      {thread.lastMessage && (
                        <p className="text-sm text-muted-foreground truncate">
                          {thread.lastMessage.fromMe && '我: '}
                          {thread.lastMessage.body}
                        </p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <MessageSquare className="h-3 w-3" />
                          {thread.messagesCount || 0} 条消息
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatTime(thread.lastMessageAt)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 右侧：操作按钮 */}
                  <div className="flex flex-col items-end gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">AI 接管</span>
                      <Switch
                        checked={thread.aiEnabled}
                        onCheckedChange={() => handleToggleAI(thread.id, thread.aiEnabled)}
                      />
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <a href={`/debug-messages?threadId=${thread.id}`} target="_blank">
                        查看对话
                      </a>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* 页脚提示 */}
      {filteredThreads.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-sm text-muted-foreground">
              <p className="mb-2">
                💡 <strong>提示：</strong>启用 AI 接管后，系统将自动回复该联系人的消息
              </p>
              <p>
                对于重要客户或复杂问题，建议关闭 AI 接管，改用人工回复
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

