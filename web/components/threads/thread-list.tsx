'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Trash2, RefreshCw } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EmptyState } from '@/components/EmptyState';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { MessageSquare } from 'lucide-react';
import type { ThreadListItem } from '@/lib/types';
import { api } from '@/lib/api';

interface ThreadListProps {
  threads: ThreadListItem[];
  onThreadDeleted?: () => void;
}

export function ThreadList({ threads, onThreadDeleted }: ThreadListProps) {
  const [deletingThread, setDeletingThread] = useState<string | null>(null);

  const handleDeleteThread = async (threadId: string) => {
    setDeletingThread(threadId);
    try {
      await api.deleteThread(threadId);
      if (onThreadDeleted) {
        onThreadDeleted();
      }
    } catch (error) {
      console.error('Failed to delete thread:', error);
      alert('删除对话失败：' + (error instanceof Error ? error.message : '未知错误'));
    } finally {
      setDeletingThread(null);
    }
  };

  // 过滤对话
  const allThreads = threads;
  const aiActiveThreads = threads.filter(thread => thread.aiEnabled);
  const manualThreads = threads.filter(thread => !thread.aiEnabled);

  const renderThreadTable = (threadList: ThreadListItem[]) => (
    <div className="overflow-hidden rounded-xl border bg-background">
      <Table>
        <TableHeader className="sticky top-0 bg-background">
          <TableRow>
            <TableHead>Contact</TableHead>
            <TableHead>AI Status</TableHead>
            <TableHead>Last human</TableHead>
            <TableHead>Last bot</TableHead>
            <TableHead className="text-right">Messages</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {threadList.map((thread) => (
            <TableRow key={thread.id} className="hover:bg-muted/50 transition-colors">
              <TableCell>
                <div className="flex flex-col">
                  <Link href={`/threads/${thread.id}`} className="font-medium text-primary hover:underline">
                    {thread.contact.name ?? thread.contact.phoneE164}
                  </Link>
                  <span className="text-xs text-muted-foreground">{thread.contact.phoneE164}</span>
                </div>
              </TableCell>
              <TableCell>
                {thread.aiEnabled ? (
                  <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    AI 活跃
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200">
                    AI 暂停
                  </Badge>
                )}
              </TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span className="text-sm">{formatShortDate(thread.lastHumanAt)}</span>
                  <span className="text-xs text-muted-foreground">{formatRelativeTime(thread.lastHumanAt)}</span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span className="text-sm">{formatShortDate(thread.lastBotAt)}</span>
                  <span className="text-xs text-muted-foreground">{formatRelativeTime(thread.lastBotAt)}</span>
                </div>
              </TableCell>
              <TableCell className="text-right text-sm text-muted-foreground">{thread.messagesCount}</TableCell>
              <TableCell className="text-right">
                <ConfirmDialog
                  trigger={
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={deletingThread === thread.id}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 rounded-full bg-white dark:bg-zinc-900 shadow hover:bg-accent transition"
                    >
                      <Trash2 className="h-4 w-4" />
                      {deletingThread === thread.id ? '删除中...' : '删除'}
                    </Button>
                  }
                  title="删除对话"
                  description="确定要删除这个对话吗？此操作不可撤销。"
                  confirmText="删除"
                  cancelText="取消"
                  variant="destructive"
                  onConfirm={() => handleDeleteThread(thread.id)}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {threadList.length === 0 && (
        <EmptyState
          icon={MessageSquare}
          title="暂无对话"
          description="还没有找到符合条件的对话记录"
        />
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">全部 ({allThreads.length})</TabsTrigger>
          <TabsTrigger value="ai-active">AI 活跃 ({aiActiveThreads.length})</TabsTrigger>
          <TabsTrigger value="manual">人工接管 ({manualThreads.length})</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="mt-6">
          {renderThreadTable(allThreads)}
        </TabsContent>
        
        <TabsContent value="ai-active" className="mt-6">
          {renderThreadTable(aiActiveThreads)}
        </TabsContent>
        
        <TabsContent value="manual" className="mt-6">
          {renderThreadTable(manualThreads)}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function formatShortDate(value: string | null): string {
  if (!value) return 'N/A';
  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function formatRelativeTime(value: string | null): string {
  if (!value) return 'N/A';
  const date = new Date(value);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return '刚刚';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}分钟前`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}小时前`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}天前`;
  return `${Math.floor(diffInSeconds / 2592000)}个月前`;
}
