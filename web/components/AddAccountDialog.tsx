"use client";

import { useEffect, useRef, useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter, 
  DialogClose 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { QrCode, Loader2, RefreshCcw, X } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";

type State = "UNINITIALIZED" | "NEED_QR" | "CONNECTING" | "ONLINE" | "OFFLINE";

interface AddAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function AddAccountDialog({ open, onOpenChange, onSuccess }: AddAccountDialogProps) {
  const [state, setState] = useState<State>("UNINITIALIZED");
  const [qr, setQr] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  // 停止轮询
  const stopPolling = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  // 开始登录流程
  const startLogin = async () => {
    try {
      setIsRefreshing(true);
      // 调用后端开始登录
      await api.startLogin();
      
      // 重置状态
      setQr(null);
      setState("NEED_QR");
      startTimeRef.current = Date.now();
      
      // 停止之前的轮询并开始新的轮询
      stopPolling();
      timerRef.current = setInterval(async () => {
        try {
          const data = await api.getQRCode();
          setState(data.state as State);
          
          if (data.qr) {
            setQr(data.qr);
          }
          
          // 检查是否超时（10分钟）
          if (Date.now() - startTimeRef.current > 10 * 60 * 1000) {
            stopPolling();
            setState("OFFLINE");
            toast.error("二维码已过期，请刷新重试");
            return;
          }
          
          // 登录成功处理
          if (data.state === "ONLINE") {
            stopPolling();
            toast.success("WhatsApp 账号登录成功！");
            onOpenChange(false);
            onSuccess?.();
          }
        } catch (error) {
          console.error("QR polling error:", error);
          // 忽略瞬时错误，继续轮询
        }
      }, 2000);
    } catch (error) {
      console.error("Failed to start login:", error);
      toast.error("启动登录失败，请重试");
      setState("OFFLINE");
    } finally {
      setIsRefreshing(false);
    }
  };

  // 刷新二维码
  const handleRefresh = async () => {
    await startLogin();
  };

  // 关闭弹窗处理
  const handleClose = (open: boolean) => {
    if (!open) {
      stopPolling();
      setState("UNINITIALIZED");
      setQr(null);
    }
    onOpenChange(open);
  };

  // 弹窗打开时自动开始登录
  useEffect(() => {
    if (open) {
      startLogin();
    }
    
    // 清理函数
    return () => {
      stopPolling();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // 获取状态Badge
  const getStateBadge = () => {
    const configs = {
      UNINITIALIZED: { variant: "secondary" as const, label: "未初始化", className: "bg-gray-100 text-gray-600" },
      NEED_QR: { variant: "outline" as const, label: "等待扫码", className: "border-blue-200 text-blue-600 bg-blue-50" },
      CONNECTING: { variant: "secondary" as const, label: "连接中", className: "bg-yellow-100 text-yellow-600" },
      ONLINE: { variant: "default" as const, label: "已在线", className: "bg-green-100 text-green-600" },
      OFFLINE: { variant: "destructive" as const, label: "已断开", className: "bg-red-100 text-red-600" }
    };

    const config = configs[state];
    return (
      <Badge variant={config.variant} className={config.className}>
        {config.label}
      </Badge>
    );
  };

  // 获取状态描述
  const getStateDescription = () => {
    switch (state) {
      case "NEED_QR":
        return "请使用手机WhatsApp扫描下方二维码进行登录";
      case "CONNECTING":
        return "二维码已扫描，正在建立连接...";
      case "ONLINE":
        return "登录成功！即将关闭弹窗";
      case "OFFLINE":
        return "连接失败或已断开，请尝试刷新二维码";
      default:
        return "正在初始化WhatsApp客户端...";
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md z-[100] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <div className="p-1.5 bg-blue-100 rounded-lg">
                <QrCode className="h-5 w-5 text-blue-600" />
              </div>
              扫码添加账号
            </DialogTitle>
            <DialogClose asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <X className="h-4 w-4" />
                <span className="sr-only">关闭</span>
              </Button>
            </DialogClose>
          </div>
          <DialogDescription>
            {getStateDescription()}
          </DialogDescription>
        </DialogHeader>

        {/* 二维码展示区域 */}
        <div className="w-full flex flex-col items-center gap-4 py-4">
          {/* 二维码容器 */}
          <div className="aspect-square w-[220px] md:w-[320px] rounded-xl border-2 border-dashed border-muted-foreground/20 bg-muted/30 flex items-center justify-center overflow-hidden relative">
            {qr ? (
              <img 
                src={qr} 
                alt="WhatsApp登录二维码" 
                className="w-full h-full object-contain p-2"
              />
            ) : state === "NEED_QR" || isRefreshing ? (
              <div className="w-full h-full p-4 flex flex-col items-center justify-center gap-3">
                <Skeleton className="w-full h-full rounded-lg" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-white/80 backdrop-blur-sm rounded-lg p-3 shadow-sm">
                    <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-3 text-muted-foreground">
                <QrCode className="h-12 w-12" />
                <p className="text-sm text-center">等待生成二维码...</p>
              </div>
            )}
          </div>

          {/* 状态指示器 */}
          <div className="flex items-center gap-2">
            {getStateBadge()}
            {(state === "CONNECTING" || isRefreshing) && (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </div>

          {/* 提示信息 */}
          {state === "NEED_QR" && qr && (
            <div className="text-center space-y-2 max-w-[280px]">
              <p className="text-sm text-muted-foreground">
                1. 打开手机WhatsApp
              </p>
              <p className="text-sm text-muted-foreground">
                2. 点击右上角"⋮" → "已连接的设备"
              </p>
              <p className="text-sm text-muted-foreground">
                3. 点击"连接设备"扫描二维码
              </p>
            </div>
          )}
        </div>

        {/* 底部操作按钮 */}
        <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:justify-end">
          <Button 
            variant="secondary" 
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="gap-2"
          >
            <RefreshCcw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? "刷新中..." : "刷新二维码"}
          </Button>
          <DialogClose asChild>
            <Button variant="outline">
              关闭
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
