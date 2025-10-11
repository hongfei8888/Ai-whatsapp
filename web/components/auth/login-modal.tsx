'use client';

import { useState, useEffect } from 'react';
import { X, RefreshCw, Smartphone, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { useAccount } from '@/lib/account-context';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess?: () => void;
}

type LoginState = 'UNINITIALIZED' | 'NEED_QR' | 'CONNECTING' | 'ONLINE' | 'OFFLINE';

export function LoginModal({ isOpen, onClose, onLoginSuccess }: LoginModalProps) {
  const { currentAccountId } = useAccount();
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [loginState, setLoginState] = useState<LoginState>('UNINITIALIZED');
  const [status, setStatus] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [phoneNumber, setPhoneNumber] = useState<string | null>(null);

  // 启动登录流程
  const startLogin = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      await api.startLogin();
      setLoginState('NEED_QR');
      // 开始轮询二维码
      pollQRCode();
    } catch (err) {
      setError(err instanceof Error ? err.message : '启动登录失败');
      setLoginState('OFFLINE');
    } finally {
      setIsLoading(false);
    }
  };

  // 轮询获取二维码和状态
  const pollQRCode = async () => {
    try {
      const response = await api.getQRCode();
      setQrCode(response.qr);
      setLoginState(response.state as LoginState);
      setStatus(response.status);

      // 如果状态是 ONLINE，登录成功
      if (response.state === 'ONLINE') {
        // 获取完整状态信息，包括手机号
        if (currentAccountId) {
          const fullStatus = await api.accounts.getStatus(currentAccountId);
          setPhoneNumber(fullStatus.phoneE164 || null);
        }
        
        setTimeout(() => {
          onLoginSuccess?.();
          onClose();
        }, 2000);
        return;
      }

      // 如果还在等待扫码或连接中，继续轮询
      if (response.state === 'NEED_QR' || response.state === 'CONNECTING') {
        setTimeout(pollQRCode, 2000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取二维码失败');
      setLoginState('OFFLINE');
    }
  };

  // Modal关闭时重置状态
  const handleClose = () => {
    setQrCode(null);
    setLoginState('UNINITIALIZED');
    setStatus('');
    setError(null);
    setPhoneNumber(null);
    onClose();
  };

  // 重新获取二维码
  const refreshQRCode = () => {
    pollQRCode();
  };

  useEffect(() => {
    if (isOpen && loginState === 'UNINITIALIZED' && currentAccountId) {
      // Modal打开时检查当前状态
      api.accounts.getStatus(currentAccountId).then((status) => {
        if (status.state === 'ONLINE') {
          setLoginState('ONLINE');
          setPhoneNumber(status.phoneE164 || null);
        } else if (status.state === 'NEED_QR') {
          setLoginState('NEED_QR');
          pollQRCode();
        } else {
          setLoginState('UNINITIALIZED');
        }
      }).catch(() => {
        setLoginState('UNINITIALIZED');
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 背景遮罩 */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
      />
      
      {/* Modal内容 */}
      <div className="relative w-full max-w-md mx-4">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Smartphone className="h-6 w-6" />
                <h2 className="text-xl font-bold">添加 WhatsApp 账号</h2>
              </div>
              <button
                onClick={handleClose}
                className="p-1 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {loginState === 'UNINITIALIZED' && (
              <div className="text-center">
                <div className="mb-6">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    <Smartphone className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">准备添加新账号</h3>
                  <p className="text-gray-600 text-sm">
                    点击下方按钮开始登录流程，我们将生成二维码供您扫描
                  </p>
                </div>
                <button
                  onClick={startLogin}
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-xl font-medium hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      启动中...
                    </>
                  ) : (
                    '开始登录'
                  )}
                </button>
              </div>
            )}

            {loginState === 'NEED_QR' && (
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">扫描二维码登录</h3>
                
                {qrCode ? (
                  <div className="mb-6">
                    <div className="bg-white border-2 border-gray-200 rounded-xl p-4 inline-block">
                      <img 
                        src={qrCode} 
                        alt="WhatsApp QR Code" 
                        className="w-48 h-48 mx-auto"
                      />
                    </div>
                    <div className="mt-4 flex items-center justify-center gap-2">
                      <button
                        onClick={refreshQRCode}
                        className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1"
                      >
                        <RefreshCw className="h-4 w-4" />
                        刷新二维码
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mb-6">
                    <div className="w-48 h-48 mx-auto bg-gray-100 rounded-xl flex items-center justify-center">
                      <Loader2 className="h-8 w-8 text-gray-400 animate-spin" />
                    </div>
                    <p className="text-gray-600 text-sm mt-4">正在生成二维码...</p>
                  </div>
                )}

                <div className="bg-blue-50 rounded-xl p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">操作步骤：</h4>
                  <ol className="text-sm text-gray-700 space-y-1 text-left">
                    <li>1. 打开手机上的 WhatsApp</li>
                    <li>2. 点击右上角的三个点 → 已连接的设备</li>
                    <li>3. 点击"连接设备"</li>
                    <li>4. 扫描上方二维码</li>
                  </ol>
                </div>
              </div>
            )}

            {loginState === 'CONNECTING' && (
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-yellow-100 rounded-full flex items-center justify-center">
                  <Loader2 className="h-8 w-8 text-yellow-600 animate-spin" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">正在连接...</h3>
                <p className="text-gray-600 text-sm">
                  二维码已扫描，正在建立连接，请稍候...
                </p>
              </div>
            )}

            {loginState === 'ONLINE' && (
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">登录成功！</h3>
                {phoneNumber && (
                  <p className="text-gray-600 text-sm mb-4">
                    账号：{phoneNumber}
                  </p>
                )}
                <p className="text-gray-600 text-sm">
                  WhatsApp 账号已成功连接，即将关闭此窗口...
                </p>
              </div>
            )}

            {error && (
              <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-4">
                <div className="flex items-center gap-2 text-red-700">
                  <AlertCircle className="h-5 w-5" />
                  <span className="font-medium">错误</span>
                </div>
                <p className="text-red-600 text-sm mt-1">{error}</p>
                <button
                  onClick={() => setError(null)}
                  className="mt-3 text-red-600 hover:text-red-700 text-sm underline"
                >
                  重试
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
