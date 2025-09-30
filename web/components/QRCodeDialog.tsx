'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import QRCode from 'qrcode';

import { api } from '@/lib/api';

interface QRCodeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  backgroundColor: 'rgba(0,0,0,0.5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
};

const dialogStyle: React.CSSProperties = {
  backgroundColor: '#FFFFFF',
  borderRadius: '16px',
  padding: '24px',
  width: 'min(360px, 90vw)',
  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  textAlign: 'center',
  fontFamily: '"PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Noto Sans CJK SC", sans-serif',
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

export default function QRCodeDialog({ isOpen, onClose, onSuccess }: QRCodeDialogProps) {
  const [qrImage, setQrImage] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('正在获取二维码…');
  const [isLoading, setIsLoading] = useState(false);

  const fetchQRCode = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await api.getQRCode();
      const statusText = [result.status, result.state].filter(Boolean).join(' / ');
      setStatus(statusText ? `状态: ${statusText}` : '等待二维码…');

      if (result.qr) {
        try {
          const dataUrl = await QRCode.toDataURL(result.qr, { margin: 1, width: 240 });
          setQrImage(dataUrl);
        } catch (encodeError) {
          console.error('Failed to encode QR string', encodeError);
          setQrImage(null);
        }
      } else {
        setQrImage(null);
      }

      if (result.status?.toUpperCase() === 'READY') {
        onSuccess?.();
        onClose();
      }
    } catch (error) {
      console.error('Failed to fetch QR code', error);
      const message = error instanceof Error ? error.message : String(error);
      setStatus(`获取二维码失败: ${message}`);
      setQrImage(null);
    } finally {
      setIsLoading(false);
    }
  }, [onClose, onSuccess]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    void fetchQRCode();
    const interval = setInterval(() => {
      void fetchQRCode();
    }, 4000);

    return () => clearInterval(interval);
  }, [fetchQRCode, isOpen]);

  if (!isOpen) {
    return null;
  }

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={dialogStyle} onClick={(event) => event.stopPropagation()}>
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
