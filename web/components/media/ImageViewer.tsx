'use client';

import React, { useState } from 'react';

const WhatsAppColors = {
  accent: '#00a884',
  panelBackground: '#ffffff',
  textPrimary: '#111b21',
  textSecondary: '#667781',
};

interface ImageViewerProps {
  src: string;
  alt?: string;
  thumbnail?: string;
  onClose?: () => void;
}

export default function ImageViewer({ src, alt, thumbnail, onClose }: ImageViewerProps) {
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [loading, setLoading] = useState(true);

  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setScale((prev) => Math.max(prev - 0.25, 0.5));
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleReset = () => {
    setScale(1);
    setRotation(0);
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
      }}
      onClick={onClose}
    >
      {/* 工具栏 */}
      <div
        style={{
          padding: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ color: '#fff', fontSize: '16px' }}>{alt || '图片预览'}</div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={handleZoomOut}
            style={{
              padding: '8px 16px',
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            缩小
          </button>
          <button
            onClick={handleZoomIn}
            style={{
              padding: '8px 16px',
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            放大
          </button>
          <button
            onClick={handleRotate}
            style={{
              padding: '8px 16px',
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            旋转
          </button>
          <button
            onClick={handleReset}
            style={{
              padding: '8px 16px',
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            重置
          </button>
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px',
              backgroundColor: WhatsAppColors.accent,
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            关闭
          </button>
        </div>
      </div>

      {/* 图片容器 */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {loading && (
          <div style={{ color: '#fff', fontSize: '14px' }}>加载中...</div>
        )}
        <img
          src={src}
          alt={alt}
          onLoad={() => setLoading(false)}
          onError={() => setLoading(false)}
          style={{
            maxWidth: '100%',
            maxHeight: '100%',
            objectFit: 'contain',
            transform: `scale(${scale}) rotate(${rotation}deg)`,
            transition: 'transform 0.3s',
            display: loading ? 'none' : 'block',
          }}
        />
      </div>

      {/* 比例显示 */}
      <div
        style={{
          padding: '12px',
          textAlign: 'center',
          color: '#fff',
          fontSize: '12px',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
        }}
      >
        缩放: {(scale * 100).toFixed(0)}% | 旋转: {rotation}°
      </div>
    </div>
  );
}

