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
  const [uploadSpeed, setUploadSpeed] = useState(0); // MB/s
  const [fileSize, setFileSize] = useState(0); // 文件大小（MB）
  const [fileName, setFileName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const startTimeRef = useRef<number>(0);
  const lastProgressRef = useRef<{ time: number; loaded: number }>({ time: 0, loaded: 0 });

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0]; // 目前只支持单文件上传

    // ✅ WhatsApp 文件大小限制检查
    const fileSizeMB = file.size / (1024 * 1024);
    const fileType = file.type;
    
    let whatsappLimit = 100; // 默认文档限制
    let limitName = '文档';
    
    if (fileType.startsWith('image/')) {
      whatsappLimit = 16;
      limitName = '图片';
    } else if (fileType.startsWith('video/')) {
      whatsappLimit = 16;
      limitName = '视频';
    } else if (fileType.startsWith('audio/')) {
      whatsappLimit = 16;
      limitName = '音频';
    }
    
    if (fileSizeMB > whatsappLimit) {
      const error = new Error(
        `${limitName}文件过大（${fileSizeMB.toFixed(2)} MB）\n` +
        `WhatsApp 限制为 ${whatsappLimit} MB\n` +
        `请压缩后再上传`
      );
      onUploadError?.(error);
      alert(error.message);
      return;
    }

    // 验证文件大小（仅当设置了自定义限制时）
    if (maxSize !== Infinity && maxSize < whatsappLimit) {
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
      setFileName(file.name);
      setFileSize(file.size / (1024 * 1024)); // 转换为 MB
      startTimeRef.current = Date.now();
      lastProgressRef.current = { time: Date.now(), loaded: 0 };

      // ✅ 使用真实的上传进度
      const result = await api.media.upload(file, (progressPercent) => {
        setProgress(progressPercent);
        
        // 计算上传速度
        const now = Date.now();
        const loadedBytes = (file.size * progressPercent) / 100;
        const timeDiff = (now - lastProgressRef.current.time) / 1000; // 秒
        const bytesDiff = loadedBytes - lastProgressRef.current.loaded;
        
        if (timeDiff > 0.5) { // 每0.5秒更新一次速度
          const speedMBps = (bytesDiff / (1024 * 1024)) / timeDiff;
          setUploadSpeed(speedMBps);
          lastProgressRef.current = { time: now, loaded: loadedBytes };
        }
        
        console.log(`📤 上传进度: ${progressPercent}% | 速度: ${uploadSpeed.toFixed(2)} MB/s`);
      });

      console.log('✅ 上传成功:', result);
      onUploadComplete?.(result);

      // 重置状态
      setTimeout(() => {
        setUploading(false);
        setProgress(0);
        setUploadSpeed(0);
        setFileSize(0);
        setFileName('');
      }, 500);
    } catch (error: any) {
      console.error('❌ 上传失败:', error);
      onUploadError?.(error);
      alert('上传失败: ' + error.message);
      setUploading(false);
      setProgress(0);
      setUploadSpeed(0);
      setFileSize(0);
      setFileName('');
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
          <div style={{ color: WhatsAppColors.textSecondary, fontSize: '12px', lineHeight: '1.4' }}>
            支持图片、视频、音频和文档
            <br />
            <span style={{ fontSize: '11px', color: '#8696a0' }}>
              ⚠️ WhatsApp 限制: 图片/视频/音频≤16MB, 文档≤100MB
            </span>
          </div>
        </div>
      ) : (
        <div
          style={{
            padding: '20px',
            border: `1px solid ${WhatsAppColors.border}`,
            borderRadius: '8px',
            backgroundColor: WhatsAppColors.panelBackground,
          }}
        >
          {/* 文件名 */}
          <div style={{ 
            fontSize: '13px', 
            color: WhatsAppColors.textPrimary, 
            marginBottom: '8px',
            fontWeight: 500,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            📎 {fileName}
          </div>
          
          {/* 进度百分比 */}
          <div style={{ 
            fontSize: '24px', 
            color: WhatsAppColors.accent, 
            marginBottom: '10px',
            fontWeight: 'bold',
          }}>
            {progress}%
          </div>
          
          {/* 进度条 */}
          <div
            style={{
              width: '100%',
              height: '6px',
              backgroundColor: WhatsAppColors.border,
              borderRadius: '3px',
              overflow: 'hidden',
              marginBottom: '12px',
            }}
          >
            <div
              style={{
                width: `${progress}%`,
                height: '100%',
                backgroundColor: WhatsAppColors.accent,
                transition: 'width 0.2s ease-out',
                boxShadow: progress > 0 ? '0 0 10px rgba(0, 168, 132, 0.5)' : 'none',
              }}
            />
          </div>
          
          {/* 详细信息 */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            fontSize: '12px',
            color: WhatsAppColors.textSecondary,
          }}>
            <div>
              📦 {fileSize.toFixed(2)} MB
            </div>
            <div>
              ⚡ {uploadSpeed.toFixed(2)} MB/s
            </div>
            <div>
              ⏱️ {progress > 0 && uploadSpeed > 0 
                ? `${Math.ceil((fileSize * (100 - progress) / 100) / uploadSpeed)}秒` 
                : '计算中...'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

