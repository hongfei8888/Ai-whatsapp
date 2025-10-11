'use client';

import { useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

import { api } from '@/lib/api';
import type { AiConfig } from '@/lib/types';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';

const styleOptions = [
  { value: 'concise-cn', label: '精简专业' },
  { value: 'sales-cn', label: '销售友好' },
  { value: 'support-cn', label: '客服关怀' },
] as const;

const DEFAULT_PROMPT = `
你是 WhatsApp 智能客服助手：
- 语言：中文简体，友好、专业。
- 长度：优先 80-160 字；多问题可到 240 字，最多 6 句。
- 结构：先直答，再给 1–2 条可操作建议；需要信息时给明确追问。
- 禁止：夸大承诺（如“百分百保证/永久有效/官方合作”）、价格猜测、收集隐私。
- 不确定时：说“我记录下来了，会尽快为你确认具体细节。”
- 可用变量：{{user_name}}、{{brand}}、{{working_hours}}，若未提供则忽略。
只输出正文文本。
`.trim();

const aiConfigFormSchema = z.object({
  systemPrompt: z.string().min(40).max(4000),
  maxTokens: z.number().int().min(128).max(2048),
  temperature: z.number().min(0).max(1),
  minChars: z.number().int().min(20).max(600),
  stylePreset: z.enum(['concise-cn', 'sales-cn', 'support-cn']),
});

type AiConfigFormValues = z.infer<typeof aiConfigFormSchema>;

const toFormValues = (config: AiConfig): AiConfigFormValues => ({
  systemPrompt: config.systemPrompt,
  maxTokens: config.maxTokens,
  temperature: Number(config.temperature),
  minChars: config.minChars,
  stylePreset: config.stylePreset,
});

interface AiConfigCardProps {
  initialConfig: AiConfig;
}

export function AiConfigCard({ initialConfig }: AiConfigCardProps) {
  const { toast } = useToast();
  const [snapshot, setSnapshot] = useState(initialConfig);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testOpen, setTestOpen] = useState(false);
  const [testInput, setTestInput] = useState('');
  const [testReply, setTestReply] = useState<string | null>(null);

  const form = useForm<AiConfigFormValues>({
    resolver: zodResolver(aiConfigFormSchema),
    defaultValues: toFormValues(initialConfig),
    mode: 'onChange',
  });

  useEffect(() => {
    form.reset(toFormValues(snapshot));
  }, [snapshot, form]);

  const systemPrompt = form.watch('systemPrompt');
  const promptLength = systemPrompt?.length ?? 0;

  const dirty = form.formState.isDirty;

  const handleSave = form.handleSubmit(async (values) => {
    setIsSaving(true);
    try {
      const updated = await api.updateAiConfig(values);
      setSnapshot(updated);
      form.reset(toFormValues(updated));
      toast({ variant: 'success', title: '保存成功', description: 'AI 回复配置已更新。' });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: '保存失败',
        description: error instanceof Error ? error.message : '无法保存 AI 配置',
      });
    } finally {
      setIsSaving(false);
    }
  });

  const handleRestore = () => {
    form.reset(toFormValues(snapshot));
    setTestReply(null);
  };

  const handleResetPrompt = () => {
    form.setValue('systemPrompt', DEFAULT_PROMPT, { shouldDirty: true, shouldTouch: true });
  };

  const handleTest = async () => {
    if (!testInput.trim()) {
      toast({ variant: 'destructive', title: '请输入测试内容' });
      return;
    }
    setIsTesting(true);
    setTestReply(null);
    try {
      const { reply } = await api.testAi({ user: testInput.trim() });
      setTestReply(reply);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: '测试失败',
        description: error instanceof Error ? error.message : '无法生成测试回复',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const temperatureValue = form.watch('temperature');
  const maxTokensMarks = useMemo(() => [128, 256, 384, 512, 768, 1024, 1536, 2048], []);

  return (
    <div className="modern-card glass-effect rounded-3xl p-8 hover-lift animate-slide-in-up">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
            <span className="text-white text-xl">🤖</span>
          </div>
          <div className="space-y-1">
            <h2 className="text-2xl font-bold gradient-text">AI 回复配置</h2>
            <p className="text-gray-600 dark:text-gray-300">调优系统提示、长度设定与模型参数，改善 DeepSeek 自动回复效果</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={testOpen} onOpenChange={() => {
            // 🔒 禁止通过遮罩层或ESC键关闭
          }}>
            <DialogTrigger asChild>
              <Button variant="outline">试一试</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>快速测试</DialogTitle>
                <DialogDescription>输入用户消息，调用当前配置进行一次临时回复，不会写入对话。</DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <Textarea
                  value={testInput}
                  onChange={(event) => setTestInput(event.target.value)}
                  placeholder="例如：请介绍下你们的服务和收费？"
                  rows={5}
                />
                {testReply && (
                  <div className="rounded-lg border bg-muted/40 p-3 text-sm leading-relaxed">
                    {testReply}
                  </div>
                )}
              </div>
              <DialogFooter className="flex items-center justify-between">
                <Button variant="outline" onClick={() => {
                  setTestOpen(false);
                  setTestInput('');
                  setTestReply(null);
                }}>
                  关闭
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setTestReply(null)} disabled={isTesting}>
                    清空结果
                  </Button>
                  <Button onClick={handleTest} disabled={isTesting}>
                    {isTesting ? '生成中…' : '生成回复'}
                  </Button>
                </div>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Button variant="ghost" onClick={handleResetPrompt}>重置为默认</Button>
        </div>
      </div>
      
      <div className="relative space-y-8">
        <form
          className="space-y-6"
          onSubmit={(event) => {
            event.preventDefault();
            void handleSave();
          }}
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="systemPrompt">系统提示词</Label>
              <Textarea
                id="systemPrompt"
                rows={8}
                className="font-mono"
                {...form.register('systemPrompt')}
              />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>建议 80–160 字，必要时 240 字以内</span>
                <span>{promptLength}/4000</span>
              </div>
              {form.formState.errors.systemPrompt && (
                <p className="text-sm text-destructive">{form.formState.errors.systemPrompt.message}</p>
              )}
            </div>

            <Controller
              control={form.control}
              name="maxTokens"
              render={({ field }) => (
                <div className="space-y-2">
                  <Label>最大 tokens</Label>
                  <div className="flex flex-col gap-3">
                    <Slider
                      value={[field.value]}
                      min={128}
                      max={2048}
                      step={16}
                      onValueChange={([value]) => field.onChange(value)}
                    />
                    <div className="flex items-center gap-3">
                      <Input
                        type="number"
                        value={field.value}
                        min={128}
                        max={2048}
                        onChange={(event) => {
                          const next = Number(event.target.value || 0);
                          field.onChange(next);
                        }}
                      />
                      <div className="flex-1 text-xs text-muted-foreground">
                        {maxTokensMarks.map((mark) => (
                          <span key={mark} className="inline-block w-12 text-center">{mark}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                  {form.formState.errors.maxTokens && (
                    <p className="text-sm text-destructive">{form.formState.errors.maxTokens.message}</p>
                  )}
                </div>
              )}
            />

            <Controller
              control={form.control}
              name="temperature"
              render={({ field }) => (
                <div className="space-y-2">
                  <Label>Temperature</Label>
                  <div className="flex items-center gap-3">
                    <Slider
                      value={[field.value]}
                      min={0}
                      max={1}
                      step={0.1}
                      onValueChange={([value]) => field.onChange(Number(value.toFixed(2)))}
                    />
                    <Input
                      type="number"
                      value={temperatureValue}
                      min={0}
                      max={1}
                      step="0.1"
                      onChange={(event) => {
                        const next = Number(event.target.value);
                        field.onChange(Number.isNaN(next) ? 0 : next);
                      }}
                    />
                  </div>
                  {form.formState.errors.temperature && (
                    <p className="text-sm text-destructive">{form.formState.errors.temperature.message}</p>
                  )}
                </div>
              )}
            />

            <div className="space-y-2">
              <Label htmlFor="minChars">最小字数</Label>
              <Input
                id="minChars"
                type="number"
                min={20}
                max={600}
                {...form.register('minChars', { valueAsNumber: true })}
              />
              {form.formState.errors.minChars && (
                <p className="text-sm text-destructive">{form.formState.errors.minChars.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="stylePreset">语气与风格</Label>
              <select
                id="stylePreset"
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                {...form.register('stylePreset')}
              >
                {styleOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">当前仅影响语气提示，后续可扩展更多预设。</p>
            </div>
          </div>
        </form>

        {dirty && (
          <div className="sticky bottom-4 left-0 right-0 mt-6 rounded-xl border bg-background/80 p-4 shadow-sm backdrop-blur">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <span className="text-sm text-muted-foreground">有未保存更改</span>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={handleRestore} disabled={isSaving}>
                  还原
                </Button>
                <Button onClick={() => void handleSave()} disabled={isSaving}>
                  {isSaving ? '保存中…' : '保存更改'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
