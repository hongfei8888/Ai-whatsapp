'use client';

import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Copy } from 'lucide-react';

import { api } from '@/lib/api';
import type { Contact } from '@/lib/types';
import { useToast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';

interface ContactsTableProps {
  initialContacts: Contact[];
}

const contactSchema = z.object({
  phoneE164: z
    .string()
    .trim()
    .min(5, 'Phone is required')
    .regex(/^\+?\d+$/, 'Must use E.164 format'),
  name: z
    .string()
    .trim()
    .max(80, 'Name is too long')
    .optional()
    .transform((value) => (value && value.length > 0 ? value : undefined)),
});

const outreachSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, 'Message is required')
    .max(1000, 'Message is too long'),
});

export function ContactsTable({ initialContacts }: ContactsTableProps) {
  const { toast } = useToast();
  const [contacts, setContacts] = useState(initialContacts);
  const [query, setQuery] = useState('');
  const [isRefreshing, setRefreshing] = useState(false);

  const refreshContacts = async () => {
    setRefreshing(true);
    try {
      const data = await api.getContacts();
      setContacts(data.contacts);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Refresh failed',
        description: error instanceof Error ? error.message : 'Unable to load contacts',
      });
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    setContacts(initialContacts);
  }, [initialContacts]);

  const filteredContacts = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    const dataset = [...contacts];
    dataset.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    if (!keyword) {
      return dataset;
    }
    return dataset.filter((contact) => {
      return (
        contact.phoneE164.toLowerCase().includes(keyword) ||
        (contact.name ? contact.name.toLowerCase().includes(keyword) : false)
      );
    });
  }, [contacts, query]);

  return (
    <div className="space-y-6">
      {/* 搜索和操作栏 */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="搜索姓名或电话号码"
            className="max-w-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={refreshContacts} 
            disabled={isRefreshing}
            className="rounded-full bg-white dark:bg-zinc-900 shadow hover:bg-accent p-2 transition"
          >
            {isRefreshing ? '刷新中...' : '刷新'}
          </Button>
          <AddContactDialog onCreated={refreshContacts} />
        </div>
      </div>
      
      {/* 表格 */}
      <div className="overflow-hidden rounded-xl border bg-background">
        <Table>
          <TableHeader className="sticky top-0 bg-background">
            <TableRow>
              <TableHead className="w-[160px]">Phone</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Cooldown</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredContacts.map((contact) => (
              <TableRow key={contact.id} className="hover:bg-muted/50 transition-colors">
                <TableCell className="font-mono text-sm">
                  <div className="flex items-center gap-2">
                    {contact.phoneE164}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(contact.phoneE164);
                        toast({
                          title: '已复制',
                          description: `电话号码 ${contact.phoneE164} 已复制到剪贴板`,
                        });
                      }}
                      className="h-6 w-6 p-0 rounded-full bg-white dark:bg-zinc-900 shadow hover:bg-accent transition"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </TableCell>
                <TableCell>{contact.name ?? 'N/A'}</TableCell>
                <TableCell>
                  {contact.cooldownRemainingSeconds ? (
                    <Badge variant="destructive" className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                      冷却中 {formatCooldown(contact.cooldownRemainingSeconds)}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                      就绪
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="text-sm">{formatDate(contact.createdAt)}</span>
                    <span className="text-xs text-muted-foreground">{formatRelativeTime(contact.createdAt)}</span>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <OutreachDialog
                    contact={contact}
                    onSent={refreshContacts}
                    disabled={Boolean(contact.cooldownRemainingSeconds)}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {filteredContacts.length === 0 && (
          <div className="mt-8 text-center p-8 bg-gray-50 dark:bg-gray-900/20 rounded-2xl">
            <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">📭</span>
            </div>
            <p className="text-lg font-medium text-gray-600 dark:text-gray-300 mb-2">暂无联系人</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">添加第一个联系人开始管理客户信息</p>
          </div>
        )}
      </div>
    </div>
  );
}

function formatDate(value: string | null): string {
  if (!value) return 'N/A';
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
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

function formatCooldown(seconds: number): string {
  if (seconds <= 0) return '0s';
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes === 0) {
    return `${remainingSeconds}s`;
  }
  return remainingSeconds === 0 ? `${minutes}m` : `${minutes}m ${remainingSeconds}s`;
}

interface AddContactDialogProps {
  onCreated: () => Promise<void> | void;
}

function AddContactDialog({ onCreated }: AddContactDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const form = useForm<z.infer<typeof contactSchema>>({
    resolver: zodResolver(contactSchema),
    defaultValues: { phoneE164: '', name: '' },
  });
  const isSubmitting = form.formState.isSubmitting;

  const handleSubmit = form.handleSubmit(async (values) => {
    try {
      await api.createContact(values);
      toast({ variant: 'success', title: 'Contact created', description: 'Contact has been added.' });
      form.reset();
      setOpen(false);
      await onCreated();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Failed to create contact',
        description: error instanceof Error ? error.message : 'Unable to create contact',
      });
    }
  });

  return (
    <Dialog open={open} onOpenChange={(next) => !isSubmitting && setOpen(next)}>
      <DialogTrigger asChild>
        <Button>Add Contact</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add new contact</DialogTitle>
          <DialogDescription>Provide an E.164 formatted phone number and optional name.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="phoneE164">Phone (E.164)</Label>
            <Input id="phoneE164" disabled={isSubmitting} {...form.register('phoneE164')} placeholder="+8613800138000" />
            {form.formState.errors.phoneE164 && (
              <p className="text-sm text-destructive">{form.formState.errors.phoneE164.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" disabled={isSubmitting} {...form.register('name')} placeholder="Optional" />
            {form.formState.errors.name && (
              <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
            )}
          </div>
          <DialogFooter className="pt-2">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface OutreachDialogProps {
  contact: Contact;
  onSent: () => Promise<void> | void;
  disabled: boolean;
}

function OutreachDialog({ contact, onSent, disabled }: OutreachDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const form = useForm<z.infer<typeof outreachSchema>>({
    resolver: zodResolver(outreachSchema),
    defaultValues: { content: '' },
  });
  const isSubmitting = form.formState.isSubmitting;

  const handleSubmit = form.handleSubmit(async (values) => {
    try {
      await api.sendOutreach(contact.id, values);
      toast({ variant: 'success', title: 'Outreach sent', description: 'First message sent successfully.' });
      form.reset();
      setOpen(false);
      await onSent();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Failed to send outreach',
        description: error instanceof Error ? error.message : 'Unable to send outreach message',
      });
    }
  });

  return (
    <Dialog open={open} onOpenChange={(next) => !isSubmitting && !disabled && setOpen(next)}>
      <DialogTrigger asChild>
        <Button variant="outline" disabled={disabled}>Outreach</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Send first message</DialogTitle>
          <DialogDescription>Manual outreach is required before automation can respond.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label>Recipient</Label>
            <p className="text-sm text-muted-foreground">{contact.phoneE164}</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="content">Message</Label>
            <Textarea
              id="content"
              rows={5}
              disabled={isSubmitting}
              {...form.register('content')}
              placeholder="Introduce yourself and invite the contact to reply."
            />
            {form.formState.errors.content && (
              <p className="text-sm text-destructive">{form.formState.errors.content.message}</p>
            )}
          </div>
          <DialogFooter className="pt-2">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Sending...' : 'Send'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
