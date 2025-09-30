'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Plus, Phone } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { api } from '@/lib/api';

const formSchema = z.object({
  phoneE164: z.string()
    .min(1, '请输入手机号')
    .regex(/^\+[1-9]\d{1,14}$/, '请输入有效的国际格式手机号 (如: +8613800138000)'),
  name: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface AddContactDialogProps {
  onSuccess?: () => void;
  trigger?: React.ReactNode;
}

export function AddContactDialog({ onSuccess, trigger }: AddContactDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      phoneE164: '',
      name: '',
    },
  });

  const onSubmit = async (values: FormValues) => {
    setIsLoading(true);
    try {
      await api.addContact(values);
      toast.success('联系人添加成功');
      setOpen(false);
      form.reset();
      onSuccess?.();
    } catch (error) {
      toast.error('添加联系人失败: ' + (error instanceof Error ? error.message : '未知错误'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            添加联系人
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-100 rounded-lg">
              <Phone className="h-4 w-4 text-blue-600" />
            </div>
            添加联系人
          </DialogTitle>
          <DialogDescription>
            请输入联系人的手机号码，支持国际格式 (如: +8613800138000)
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="phoneE164"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>手机号 *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="+8613800138000"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    请使用国际格式 (+国家代码+号码)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>姓名 (可选)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="联系人姓名"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                取消
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? '添加中...' : '添加联系人'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
