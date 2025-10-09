'use client';

import { useState } from 'react';

import { toast } from 'sonner';
import { api } from '@/lib/api';
import type { ThreadWithMessages } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ThreadViewProps {
  initialThread: ThreadWithMessages;
}

export function ThreadView({ initialThread }: ThreadViewProps) {
  const [thread, setThread] = useState(initialThread);
  const [isMutating, setMutating] = useState(false);
  const [isRefreshing, setRefreshing] = useState(false);

  const handleTakeover = async () => {
    setMutating(true);
    try {
      const { thread: updated } = await api.takeoverThread(thread.id);
      setThread((prev) => ({ ...prev, ...updated }));
      toast.success('AI paused', { description: 'Automation is now disabled for this thread.' });
    } catch (error) {
      toast.error('Failed to pause AI', { 
        description: error instanceof Error ? error.message : 'Unable to pause automation'
      });
    } finally {
      setMutating(false);
    }
  };

  const handleRelease = async () => {
    setMutating(true);
    try {
      const { thread: updated } = await api.releaseThread(thread.id);
      setThread((prev) => ({ ...prev, ...updated }));
      toast.success('AI resumed', { description: 'Automation is active again.' });
    } catch (error) {
      toast.error('Failed to resume AI', {
        description: error instanceof Error ? error.message : 'Unable to resume automation'
      });
    } finally {
      setMutating(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const updated = await api.getThreadMessages(thread.id);
      setThread(updated);
    } catch (error) {
      toast.error('Failed to refresh messages', {
        description: error instanceof Error ? error.message : 'Unable to refresh messages'
      });
    } finally {
      setRefreshing(false);
    }
  };

  const contactCooldown = thread.contact.cooldownRemainingSeconds;

  return (
    <div className="grid gap-6 lg:grid-cols-[320px,1fr]">
      <Card>
        <CardHeader>
          <CardTitle>{thread.contact.name ?? thread.contact.phoneE164}</CardTitle>
          <CardDescription>{thread.contact.phoneE164}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <InfoRow label="AI status" value={thread.aiEnabled ? 'Active' : 'Paused'} badgeVariant={thread.aiEnabled ? 'default' : 'outline'} />
          <InfoRow label="Last human" value={formatDate(thread.lastHumanAt)} />
          <InfoRow label="Last bot" value={formatDate(thread.lastBotAt)} />
          <InfoRow label="Contact cooldown" value={contactCooldown ? `Cooling ${formatCooldown(contactCooldown)}` : 'Ready'} />
          <div className="flex flex-col gap-2 pt-4">
            <Button onClick={handleRefresh} variant="outline" disabled={isRefreshing}>
              {isRefreshing ? 'Refreshing...' : 'Refresh messages'}
            </Button>
            {thread.aiEnabled ? (
              <Button onClick={handleTakeover} variant="destructive" disabled={isMutating}>
                {isMutating ? 'Pausing...' : 'Pause automation'}
              </Button>
            ) : (
              <Button onClick={handleRelease} disabled={isMutating}>
                {isMutating ? 'Resuming...' : 'Resume automation'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
      <Card className="flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Messages</CardTitle>
            <CardDescription>Inbound and outbound logs</CardDescription>
          </div>
          <Badge variant="secondary">{thread.messages.length}</Badge>
        </CardHeader>
        <CardContent className="flex-1">
          <ScrollArea className="h-[520px]">
            <div className="space-y-4 pr-4">
              {thread.messages.map((message) => (
                <div
                  key={message.id}
                  className={
                    message.direction === 'OUT'
                      ? 'ml-auto max-w-[70%] rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground'
                      : 'max-w-[70%] rounded-lg bg-muted px-3 py-2 text-sm'
                  }
                >
                  <p className="whitespace-pre-wrap break-words">
                    {message.text ?? <span className="italic text-muted-foreground">(no text)</span>}
                  </p>
                  <p className="pt-1 text-right text-[10px] uppercase tracking-wide text-muted-foreground">
                    {message.direction === 'OUT' ? 'Sent' : 'Received'} · {formatDateTime(message.createdAt)}
                  </p>
                </div>
              ))}
              {thread.messages.length === 0 && (
                <p className="text-center text-sm text-muted-foreground">No messages yet.</p>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

function InfoRow({ label, value, badgeVariant }: { label: string; value: string; badgeVariant?: 'default' | 'outline' }) {
  if (badgeVariant) {
    return (
      <div className="flex items-center justify-between">
        <span>{label}</span>
        <Badge variant={badgeVariant}>{value}</Badge>
      </div>
    );
  }
  return (
    <div className="flex items-center justify-between">
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}

function formatDate(value: string | null): string {
  if (!value) return 'N/A';
  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function formatCooldown(seconds: number): string {
  if (seconds <= 0) return '0s';
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes === 0) {
    return `${remainingSeconds}s`;
  }
  return remainingSeconds === 0 ? `${minutes}m` : `${minutes}m ${remainingSeconds}s`;
}
