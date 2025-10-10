'use client';

import React, { useState, useRef, DragEvent } from 'react';
import { api } from '@/lib/api';

const WhatsAppColors = {
  accent: '#00a884',
  accentHover: '#008f6f',
  background: '#f0f2f5',
  panelBackground: '#ffffff',
  border: '#e9edef',
  textPrimary: '#111b21',
  textSecondary: '#667781',
};

interface MediaUploaderProps {
  onUploadComplete?: (result: any) => void;
  onUploadError?: (error: Error) => void;
  accept?: string;
  maxSize?: number; // MB，默认无限制
}

export default function MediaUploader({
  onUploadComplete,
  onUploadError,
  accept = 'image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.txt',
  maxSize = Infinity, // ✅ 无限制
}: MediaUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0]; // 目前只支持单文件上传

    // 验证文件大小（仅当设置了限制时）
    if (maxSize !== Infinity) {
      const maxSizeBytes = maxSize * 1024 * 1024;
      if (file.size > maxSizeBytes) {
        const error = new Error(`文件大小超过 ${maxSize}MB 限制`);
        onUploadError?.(error);
        alert(error.message);
        return;
      }
    }

    try {
      setUploading(true);
      setProgress(0);

      // 模拟进度（实际应该使用 XMLHttpRequest 或 fetch with progress）
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      const result = await api.media.upload(file);

      clearInterval(progressInterval);
      setProgress(100);

      console.log('上传成功:', result);
      onUploadComplete?.(result);

      // 重置状态
      setTimeout(() => {
        setUploading(false);
        setProgress(0);
      }, 500);
    } catch (error: any) {
      console.error('上传失败:', error);
      onUploadError?.(error);
      alert('上传失败: ' + error.message);
      setUploading(false);
      setProgress(0);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div>
      {/* 隐藏的文件输入 */}
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={(e) => handleFileSelect(e.target.files)}
        style={{ display: 'none' }}
      />

      {/* 拖拽区域或按钮 */}
      {!uploading ? (
        <div
          onClick={handleClick}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          style={{
            padding: '20px',
            border: `2px dashed ${dragOver ? WhatsAppColors.accent : WhatsAppColors.border}`,
            borderRadius: '8px',
            textAlign: 'center',
            cursor: 'pointer',
            backgroundColor: dragOver ? `${WhatsAppColors.accent}10` : WhatsAppColors.background,
            transition: 'all 0.2s',
          }}
        >
          <div style={{ fontSize: '40px', marginBottom: '10px' }}>📎</div>
          <div style={{ color: WhatsAppColors.textPrimary, fontSize: '14px', marginBottom: '5px' }}>
            点击选择文件或拖拽到这里
          </div>
          <div style={{ color: WhatsAppColors.textSecondary, fontSize: '12px' }}>
            支持图片、视频、音频和文档（最大 {maxSize}MB）
          </div>
        </div>
      ) : (
        <div
          style={{
            padding: '20px',
            border: `1px solid ${WhatsAppColors.border}`,
            borderRadius: '8px',
            textAlign: 'center',
            backgroundColor: WhatsAppColors.panelBackground,
          }}
        >
          <div style={{ fontSize: '14px', color: WhatsAppColors.textPrimary, marginBottom: '10px' }}>
            上传中... {progress}%
          </div>
          <div
            style={{
              width: '100%',
              height: '4px',
              backgroundColor: WhatsAppColors.border,
              borderRadius: '2px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${progress}%`,
                height: '100%',
                backgroundColor: WhatsAppColors.accent,
                transition: 'width 0.3s',
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

