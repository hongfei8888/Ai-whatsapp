'use client';

import { useState, useEffect } from 'react';
import { Settings, Clock, MessageSquare, Bot, Shield, Save, AlertCircle, RefreshCw } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { api } from '@/lib/api';
import { useAccount } from '@/lib/account-context';

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const { currentAccountId } = useAccount();
  const [settings, setSettings] = useState({
    cooldownHours: 24,
    perContactCooldown: 10,
    aiEnabled: true,
    autoReplyEnabled: true,
    apiBaseUrl: 'http://localhost:4000',
    maxRetries: 3,
    debugMode: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; content: string } | null>(null);

  useEffect(() => {
    if (open) {
      loadSettings();
    }
  }, [open]);

  const loadSettings = async () => {
    if (!currentAccountId) {
      setMessage({ type: 'error', content: '请先选择账号' });
      return;
    }
    
    setIsLoading(true);
    try {
      const status = await api.accounts.getStatus(currentAccountId);
      setSettings(prev => ({
        ...prev,
        cooldownHours: status.cooldownHours || 24,
        perContactCooldown: status.perContactReplyCooldownMinutes || 10,
      }));
    } catch (error) {
      setMessage({ type: 'error', content: '加载设置失败' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setMessage(null);
    
    try {
      // 这里应该调用保存设置的API
      // await api.updateSettings(settings);
      await new Promise(resolve => setTimeout(resolve, 1000)); // 模拟API调用
      setMessage({ type: 'success', content: '设置保存成功' });
    } catch (error) {
      setMessage({ type: 'error', content: '保存设置失败' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setSettings({
      cooldownHours: 24,
      perContactCooldown: 10,
      aiEnabled: true,
      autoReplyEnabled: true,
      apiBaseUrl: 'http://localhost:4000',
      maxRetries: 3,
      debugMode: false
    });
    setMessage(null);
  };

  return (
    <Dialog open={open} onOpenChange={() => {
      // 🔒 禁止通过遮罩层或ESC键关闭 - 只能通过取消/关闭按钮
    }}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Settings className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold">系统设置</DialogTitle>
              <DialogDescription>
                配置 WhatsApp 自动回复系统的运行参数
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {/* 消息提示 */}
          {message && (
            <Alert className={message.type === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
              <AlertCircle className={`h-4 w-4 ${message.type === 'success' ? 'text-green-600' : 'text-red-600'}`} />
              <AlertDescription className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>
                {message.content}
              </AlertDescription>
            </Alert>
          )}

          {/* 自动回复设置 */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-purple-600" />
                <CardTitle>自动回复设置</CardTitle>
              </div>
              <CardDescription>
                配置AI自动回复的时间间隔和行为
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cooldownHours">全局冷却时间（小时）</Label>
                  <Input
                    id="cooldownHours"
                    type="number"
                    value={settings.cooldownHours}
                    onChange={(e) => setSettings(prev => ({ ...prev, cooldownHours: parseInt(e.target.value) || 0 }))}
                    className="w-full"
                  />
                  <p className="text-sm text-muted-foreground">
                    同一联系人在此时间内只会收到一次自动回复
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="perContactCooldown">单联系人冷却（分钟）</Label>
                  <Input
                    id="perContactCooldown"
                    type="number"
                    value={settings.perContactCooldown}
                    onChange={(e) => setSettings(prev => ({ ...prev, perContactCooldown: parseInt(e.target.value) || 0 }))}
                    className="w-full"
                  />
                  <p className="text-sm text-muted-foreground">
                    每个联系人的消息间隔时间
                  </p>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>启用AI自动回复</Label>
                    <p className="text-sm text-muted-foreground">
                      开启后系统将自动回复收到的消息
                    </p>
                  </div>
                  <Switch
                    checked={settings.aiEnabled}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, aiEnabled: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>自动回复功能</Label>
                    <p className="text-sm text-muted-foreground">
                      总开关，控制所有自动回复功能
                    </p>
                  </div>
                  <Switch
                    checked={settings.autoReplyEnabled}
                    onCheckedChange={(checked) => setSettings(prev => ({ ...prev, autoReplyEnabled: checked }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 系统配置 */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-green-600" />
                <CardTitle>系统配置</CardTitle>
              </div>
              <CardDescription>
                API连接和系统行为配置
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="apiBaseUrl">API基础URL</Label>
                  <Input
                    id="apiBaseUrl"
                    value={settings.apiBaseUrl}
                    onChange={(e) => setSettings(prev => ({ ...prev, apiBaseUrl: e.target.value }))}
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxRetries">最大重试次数</Label>
                  <Input
                    id="maxRetries"
                    type="number"
                    value={settings.maxRetries}
                    onChange={(e) => setSettings(prev => ({ ...prev, maxRetries: parseInt(e.target.value) || 0 }))}
                    className="w-full"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>调试模式</Label>
                  <p className="text-sm text-muted-foreground">
                    启用后将显示详细的调试信息
                  </p>
                </div>
                <Switch
                  checked={settings.debugMode}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, debugMode: checked }))}
                />
              </div>
            </CardContent>
          </Card>

          {/* 操作按钮 */}
          <div className="flex items-center justify-between pt-4">
            <Button variant="outline" onClick={handleReset}>
              重置默认值
            </Button>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                取消
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    保存中...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    保存设置
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
