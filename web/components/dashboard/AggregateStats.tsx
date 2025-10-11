'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';
import { Users, MessageSquare, Activity, TrendingUp } from 'lucide-react';

interface AggregateStatsProps {
  className?: string;
}

export function AggregateStats({ className }: AggregateStatsProps) {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const data = await api.accounts.getAggregateStats();
      setStats(data);
    } catch (error) {
      console.error('加载聚合统计失败:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={className}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader>
                <div className="h-4 bg-muted rounded w-20 animate-pulse" />
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-16 animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className={className}>
      {/* 总览卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总账号数</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAccounts}</div>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="default" className="text-xs">{stats.onlineAccounts} 在线</Badge>
              <Badge variant="secondary" className="text-xs">{stats.offlineAccounts} 离线</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总消息数</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalMessages.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              所有账号的消息总和
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总联系人</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalContacts.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              所有账号的联系人总和
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">平均消息数</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalAccounts > 0
                ? Math.round(stats.totalMessages / stats.totalAccounts).toLocaleString()
                : 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              每个账号平均消息数
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 账号排行榜 */}
      <Card>
        <CardHeader>
          <CardTitle>账号消息排行</CardTitle>
          <CardDescription>按消息数量排序的账号列表</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {stats.accountStats.slice(0, 10).map((account: any, index: number) => (
              <div key={account.accountId} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-medium">{account.accountName}</div>
                    <div className="text-xs text-muted-foreground">
                      {account.contacts} 个联系人
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">{account.messages.toLocaleString()}</div>
                  <Badge variant={account.status === 'online' ? 'default' : 'secondary'} className="text-xs">
                    {account.status === 'online' ? '在线' : '离线'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

