import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { FastifyRequest } from 'fastify';
import sharp from 'sharp';

// 媒体类型配置
export const MEDIA_CONFIG = {
  uploadDir: path.join(process.cwd(), 'uploads'),
  thumbnailDir: path.join(process.cwd(), 'uploads', 'thumbnails'),
  maxFileSize: {
    image: Infinity,      // ✅ 无限制
    document: Infinity,   // ✅ 无限制
    audio: Infinity,      // ✅ 无限制
    video: Infinity,      // ✅ 无限制
  },
  allowedMimeTypes: {
    image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    document: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'text/csv',
    ],
    audio: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4'],
    video: ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'],
  },
  thumbnailSize: {
    width: 300,
    height: 300,
  },
};

// 确保上传目录存在
export async function ensureUploadDirs() {
  await fs.mkdir(MEDIA_CONFIG.uploadDir, { recursive: true });
  await fs.mkdir(MEDIA_CONFIG.thumbnailDir, { recursive: true });
}

// 生成安全的文件名
export function generateSafeFileName(originalName: string): string {
  const ext = path.extname(originalName);
  const hash = crypto.randomBytes(16).toString('hex');
  const timestamp = Date.now();
  return `${timestamp}-${hash}${ext}`;
}

// 获取媒体类型
export function getMediaType(mimeType: string): string | null {
  for (const [type, mimes] of Object.entries(MEDIA_CONFIG.allowedMimeTypes)) {
    if (mimes.includes(mimeType)) {
      return type;
    }
  }
  return null;
}

// 验证文件大小
export function validateFileSize(size: number, mediaType: string): boolean {
  const maxSize = MEDIA_CONFIG.maxFileSize[mediaType as keyof typeof MEDIA_CONFIG.maxFileSize];
  return size <= maxSize;
}

// 保存文件
export async function saveFile(
  buffer: Buffer,
  originalName: string,
  mimeType: string
): Promise<{
  fileName: string;
  filePath: string;
  size: number;
  mediaType: string;
}> {
  await ensureUploadDirs();

  const mediaType = getMediaType(mimeType);
  if (!mediaType) {
    throw new Error(`不支持的文件类型: ${mimeType}`);
  }

  if (!validateFileSize(buffer.length, mediaType)) {
    const maxSize = MEDIA_CONFIG.maxFileSize[mediaType as keyof typeof MEDIA_CONFIG.maxFileSize];
    const maxSizeMB = maxSize === Infinity ? '无限制' : `${maxSize / (1024 * 1024)}MB`;
    throw new Error(`文件大小超过限制 (最大 ${maxSizeMB})`);
  }

  const fileName = generateSafeFileName(originalName);
  const filePath = path.join(MEDIA_CONFIG.uploadDir, fileName);

  await fs.writeFile(filePath, buffer);

  return {
    fileName,
    filePath,
    size: buffer.length,
    mediaType,
  };
}

// 生成缩略图（仅用于图片）
export async function generateThumbnail(
  sourceFilePath: string,
  thumbnailFileName: string
): Promise<string> {
  await ensureUploadDirs();

  const thumbnailPath = path.join(MEDIA_CONFIG.thumbnailDir, thumbnailFileName);

  await sharp(sourceFilePath)
    .resize(MEDIA_CONFIG.thumbnailSize.width, MEDIA_CONFIG.thumbnailSize.height, {
      fit: 'inside',
      withoutEnlargement: true,
    })
    .jpeg({ quality: 80 })
    .toFile(thumbnailPath);

  return thumbnailPath;
}

// 删除文件
export async function deleteFile(fileName: string): Promise<void> {
  const filePath = path.join(MEDIA_CONFIG.uploadDir, fileName);
  try {
    await fs.unlink(filePath);
  } catch (error) {
    console.error('删除文件失败:', error);
    // 文件可能不存在，忽略错误
  }
}

// 删除缩略图
export async function deleteThumbnail(thumbnailFileName: string): Promise<void> {
  const thumbnailPath = path.join(MEDIA_CONFIG.thumbnailDir, thumbnailFileName);
  try {
    await fs.unlink(thumbnailPath);
  } catch (error) {
    console.error('删除缩略图失败:', error);
  }
}

// 处理文件上传（流式处理，支持超大文件）
export async function handleFileUpload(data: any): Promise<{
  mediaUrl: string;
  mediaType: string;
  mediaMimeType: string;
  mediaSize: number;
  mediaFileName: string; // 服务器上的文件名
  originalFileName: string; // 原始文件名
  thumbnailUrl?: string;
  duration?: number;
}> {
  const file = data;
  
  if (!file) {
    throw new Error('没有上传文件');
  }

  const mimeType = file.mimetype;
  const originalName = file.filename;
  
  const mediaType = getMediaType(mimeType);
  if (!mediaType) {
    throw new Error(`不支持的文件类型: ${mimeType}`);
  }

  await ensureUploadDirs();
  
  const fileName = generateSafeFileName(originalName);
  const filePath = path.join(MEDIA_CONFIG.uploadDir, fileName);

  // ✅ 使用流式写入（支持超大文件，避免内存溢出）
  console.log(`📤 开始流式上传文件: ${originalName} -> ${fileName}`);
  
  const writeStream = require('fs').createWriteStream(filePath);
  
  await new Promise<void>((resolve, reject) => {
    file.file  // MultipartFile 的 stream
      .pipe(writeStream)
      .on('finish', () => {
        console.log(`✅ 文件写入完成: ${fileName}`);
        resolve();
      })
      .on('error', (err: Error) => {
        console.error(`❌ 文件写入失败: ${fileName}`, err);
        reject(err);
      });
  });

  // 获取文件大小
  const stats = await fs.stat(filePath);
  const size = stats.size;
  
  console.log(`📊 文件大小: ${(size / (1024 * 1024)).toFixed(2)} MB`);

  let thumbnailUrl: string | undefined;
  let duration: number | undefined;

  // ✅ 为小于 500MB 的图片生成缩略图（避免处理超大图片）
  if (mediaType === 'image' && size < 500 * 1024 * 1024) {
    try {
      console.log(`🖼️ 开始生成缩略图: ${fileName}`);
      const thumbnailFileName = `thumb-${fileName}`;
      await generateThumbnail(filePath, thumbnailFileName);
      thumbnailUrl = `/media/thumbnails/${thumbnailFileName}`;
      console.log(`✅ 缩略图生成成功: ${thumbnailFileName}`);
    } catch (error) {
      console.error('⚠️ 生成缩略图失败:', error);
      // 缩略图生成失败不影响主流程
    }
  } else if (mediaType === 'image') {
    console.log(`⏭️ 跳过缩略图生成（文件过大）: ${(size / (1024 * 1024)).toFixed(2)} MB`);
  }

  return {
    mediaUrl: `/media/files/${fileName}`,
    mediaType,
    mediaMimeType: mimeType,
    mediaSize: size,
    mediaFileName: fileName, // 服务器上的文件名（用于后续发送）
    originalFileName: originalName, // 原始文件名（用于显示）
    thumbnailUrl,
    duration,
  };
}

// 获取文件信息
export async function getFileInfo(fileName: string): Promise<{
  exists: boolean;
  size?: number;
  path?: string;
}> {
  const filePath = path.join(MEDIA_CONFIG.uploadDir, fileName);
  
  try {
    const stats = await fs.stat(filePath);
    return {
      exists: true,
      size: stats.size,
      path: filePath,
    };
  } catch (error) {
    return { exists: false };
  }
}

// 获取缩略图路径
export function getThumbnailPath(thumbnailFileName: string): string {
  return path.join(MEDIA_CONFIG.thumbnailDir, thumbnailFileName);
}

// 获取文件路径
export function getFilePath(fileName: string): string {
  return path.join(MEDIA_CONFIG.uploadDir, fileName);
}

