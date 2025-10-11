'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import QRCode from 'qrcode';

import { api } from '@/lib/api';

interface QRCodeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  accountId: string | null;
}

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  backgroundColor: 'rgba(0,0,0,0.85)',
  backdropFilter: 'blur(8px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 9998,
};

const dialogStyle: React.CSSProperties = {
  backgroundColor: '#FFFFFF',
  borderRadius: '16px',
  padding: '24px',
  width: 'min(360px, 90vw)',
  boxShadow: '0 30px 60px -15px rgba(0, 0, 0, 0.6), 0 0 0 2px rgba(0, 0, 0, 0.12)',
  border: '2px solid rgba(0, 0, 0, 0.08)',
  textAlign: 'center',
  fontFamily: '"PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Noto Sans CJK SC", sans-serif',
  position: 'relative',
  zIndex: 9999,
  opacity: 1,
};

const qrPlaceholderStyle: React.CSSProperties = {
  width: 220,
  height: 220,
  borderRadius: '12px',
  border: '2px dashed #D1D5DB',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#6B7280',
  gap: 8,
  margin: '0 auto 16px',
};

export default function QRCodeDialog({ isOpen, onClose, onSuccess, accountId }: QRCodeDialogProps) {
  const [qrImage, setQrImage] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('正在获取二维码…');
  const [isLoading, setIsLoading] = useState(false);

  const fetchQRCode = useCallback(async () => {
    if (!accountId) {
      setStatus('账号ID不存在');
      return;
    }
    
    setIsLoading(true);
    try {
      const result = await api.accounts.getQRCode(accountId);
      const statusText = result.qr ? '待扫码' : '等待二维码…';
      setStatus(statusText);

      if (result.qr) {
        try {
          const dataUrl = await QRCode.toDataURL(result.qr, { margin: 1, width: 240 });
          setQrImage(dataUrl);
          setStatus('请使用手机 WhatsApp 扫描二维码');
        } catch (encodeError) {
          console.error('Failed to encode QR string', encodeError);
          setQrImage(null);
          setStatus('二维码生成失败');
        }
      } else {
        setQrImage(null);
        // 检查账号状态
        try {
          const statusResult = await api.accounts.getStatus(accountId);
          if (statusResult.status === 'online') {
            setStatus('✅ 账号已登录！');
            setTimeout(() => {
              onSuccess?.();
              onClose();
            }, 1500);
          } else {
            setStatus('正在初始化 WhatsApp 客户端...');
          }
        } catch (err) {
          setStatus('正在初始化 WhatsApp 客户端...');
        }
      }
    } catch (error) {
      console.error('Failed to fetch QR code', error);
      const message = error instanceof Error ? error.message : String(error);
      setStatus(`获取二维码失败: ${message}`);
      setQrImage(null);
    } finally {
      setIsLoading(false);
    }
  }, [accountId, onClose, onSuccess]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    let interval: NodeJS.Timeout | null = null;
    let isActive = true;

    const pollQRCode = async () => {
      if (!isActive) return;
      
      try {
        await fetchQRCode();
        // 继续轮询（除非组件已卸载或对话框关闭）
        if (isActive && isOpen) {
          interval = setTimeout(pollQRCode, 4000);
        }
      } catch (error) {
        console.error('QR polling error:', error);
        // 出错后也继续轮询，但间隔更长
        if (isActive && isOpen) {
          interval = setTimeout(pollQRCode, 8000);
        }
      }
    };

    void pollQRCode();

    return () => {
      isActive = false;
      if (interval) {
        clearTimeout(interval);
      }
    };
  }, [fetchQRCode, isOpen]);

  if (!isOpen) {
    return null;
  }

  return (
    <div style={overlayStyle}>
      <div style={dialogStyle}>
        <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#111827', marginBottom: 16 }}>WhatsApp 登录</h2>
        <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: 16 }}>{status}</p>

        {qrImage ? (
          <img
            src={qrImage}
            alt="WhatsApp QR Code"
            style={{ width: 220, height: 220, borderRadius: '12px', border: '1px solid #E5E7EB', marginBottom: 16 }}
          />
        ) : (
          <div style={qrPlaceholderStyle}>
            <span style={{ fontSize: 28 }}>{isLoading ? '🔄' : '📱'}</span>
            <span>{isLoading ? '正在生成二维码…' : '等待二维码生成'}</span>
            <span style={{ fontSize: 12 }}>请稍候几秒钟</span>
          </div>
        )}

        <p style={{ fontSize: '14px', color: '#374151', marginBottom: 20 }}>请使用 WhatsApp 扫描二维码完成登录</p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
          <button
            type="button"
            onClick={() => void fetchQRCode()}
            disabled={isLoading}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: '#4F46E5',
              color: '#FFFFFF',
              fontSize: '14px',
              fontWeight: 500,
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.7 : 1,
            }}
          >
            {isLoading ? '刷新中…' : '刷新二维码'}
          </button>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: '1px solid #D1D5DB',
              backgroundColor: '#F3F4F6',
              color: '#374151',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
}
