'use client';

import React, { useState } from 'react';
import ImageViewer from './ImageViewer';
import AudioPlayer from './AudioPlayer';
import VideoPlayer from './VideoPlayer';

const WhatsAppColors = {
  accent: '#00a884',
  panelBackground: '#ffffff',
  border: '#e9edef',
  textPrimary: '#111b21',
  textSecondary: '#667781',
};

// API 基础 URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

// 将相对路径转换为完整 URL
const toFullUrl = (path: string | undefined): string | undefined => {
  if (!path) return undefined;
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path; // 已经是完整 URL
  }
  return `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
};

interface MediaPreviewProps {
  mediaUrl: string;
  mediaType: 'image' | 'document' | 'audio' | 'video';
  mediaMimeType?: string;
  mediaFileName?: string;
  originalFileName?: string; // 原始文件名（用于显示）
  mediaSize?: number;
  thumbnailUrl?: string;
  duration?: number;
}

export default function MediaPreview({
  mediaUrl,
  mediaType,
  mediaMimeType,
  mediaFileName,
  originalFileName,
  mediaSize,
  thumbnailUrl,
  duration,
}: MediaPreviewProps) {
  // 优先使用原始文件名，如果没有则使用服务器文件名
  const displayFileName = originalFileName || mediaFileName;
  const [showImageViewer, setShowImageViewer] = useState(false);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getFileIcon = (mimeType?: string) => {
    if (!mimeType) return '📄';
    if (mimeType.includes('pdf')) return '📕';
    if (mimeType.includes('word')) return '📘';
    if (mimeType.includes('excel') || mimeType.includes('sheet')) return '📗';
    if (mimeType.includes('text')) return '📝';
    return '📄';
  };

  // 图片预览
  if (mediaType === 'image') {
    return (
      <>
        <div
          onClick={() => setShowImageViewer(true)}
          style={{
            position: 'relative',
            maxWidth: '300px',
            cursor: 'pointer',
            borderRadius: '8px',
            overflow: 'hidden',
          }}
        >
          <img
            src={toFullUrl(thumbnailUrl) || toFullUrl(mediaUrl)}
            alt={displayFileName}
            style={{
              width: '100%',
              maxHeight: '300px',
              objectFit: 'cover',
              display: 'block',
            }}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              // 使用灰色占位符 (1x1 像素的灰色 PNG，base64 编码)
              target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="300"%3E%3Crect width="300" height="300" fill="%23f0f2f5"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="Arial" font-size="24" fill="%23667781"%3E📷 图片加载失败%3C/text%3E%3C/svg%3E';
              target.style.backgroundColor = '#f0f2f5';
            }}
          />
          {mediaSize && (
            <div
              style={{
                position: 'absolute',
                bottom: '8px',
                right: '8px',
                padding: '4px 8px',
                backgroundColor: 'rgba(0, 0, 0, 0.6)',
                color: '#fff',
                fontSize: '11px',
                borderRadius: '4px',
              }}
            >
              {formatFileSize(mediaSize)}
            </div>
          )}
        </div>

        {showImageViewer && (
          <ImageViewer
            src={toFullUrl(mediaUrl) || mediaUrl}
            alt={displayFileName}
            thumbnail={toFullUrl(thumbnailUrl)}
            onClose={() => setShowImageViewer(false)}
          />
        )}
      </>
    );
  }

  // 音频播放器
  if (mediaType === 'audio') {
    return <AudioPlayer src={toFullUrl(mediaUrl) || mediaUrl} fileName={displayFileName} />;
  }

  // 视频播放器
  if (mediaType === 'video') {
    return <VideoPlayer src={toFullUrl(mediaUrl) || mediaUrl} thumbnail={toFullUrl(thumbnailUrl)} fileName={displayFileName} />;
  }

  // 文档预览
  if (mediaType === 'document') {
    return (
      <div
        style={{
          padding: '12px 16px',
          backgroundColor: WhatsAppColors.panelBackground,
          borderRadius: '8px',
          border: `1px solid ${WhatsAppColors.border}`,
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          maxWidth: '300px',
        }}
      >
        <div style={{ fontSize: '32px', flexShrink: 0 }}>
          {getFileIcon(mediaMimeType)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: '14px',
              color: WhatsAppColors.textPrimary,
              fontWeight: '500',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {displayFileName || '文档'}
          </div>
          {mediaSize && (
            <div style={{ fontSize: '12px', color: WhatsAppColors.textSecondary, marginTop: '2px' }}>
              {formatFileSize(mediaSize)}
            </div>
          )}
        </div>
        <a
          href={toFullUrl(mediaUrl) || mediaUrl}
          download={displayFileName}
          style={{
            padding: '8px 16px',
            backgroundColor: WhatsAppColors.accent,
            color: '#fff',
            borderRadius: '6px',
            textDecoration: 'none',
            fontSize: '13px',
            fontWeight: '500',
            flexShrink: 0,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          下载
        </a>
      </div>
    );
  }

  // 未知类型
  return (
    <div
      style={{
        padding: '12px',
        backgroundColor: WhatsAppColors.panelBackground,
        borderRadius: '8px',
        border: `1px solid ${WhatsAppColors.border}`,
        textAlign: 'center',
        color: WhatsAppColors.textSecondary,
      }}
    >
      不支持的媒体类型
    </div>
  );
}

