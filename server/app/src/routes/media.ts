import { FastifyInstance } from 'fastify';
import * as mediaService from '../services/media-service';
import fs from 'fs';
import path from 'path';

export default async function mediaRoutes(fastify: FastifyInstance) {
  // 上传媒体文件
  fastify.post('/media/upload', async (request, reply) => {
    try {
      console.log('📤 收到文件上传请求');
      console.log('Content-Type:', request.headers['content-type']);
      console.log('X-Account-Id:', request.headers['x-account-id']);
      
      const data = await (request as any).file();
      
      console.log('文件数据:', data ? '接收到文件' : '未接收到文件');
      if (data) {
        console.log('文件名:', data.filename);
        console.log('MIME类型:', data.mimetype);
        console.log('字段名:', data.fieldname);
      }
      
      if (!data) {
        console.error('❌ 没有上传文件');
        return reply.code(400).send({
          ok: false,
          code: 'NO_FILE',
          message: '没有上传文件',
        });
      }

      const result = await mediaService.handleFileUpload(data);
      
      console.log('✅ 文件上传成功:', result.mediaFileName);

      return reply.send({
        ok: true,
        data: result,
      });
    } catch (error: any) {
      console.error('❌ 文件上传失败:', error);
      console.error('错误堆栈:', error.stack);
      return reply.code(500).send({
        ok: false,
        code: 'UPLOAD_FAILED',
        message: error.message || '文件上传失败',
      });
    }
  });

  // 获取媒体文件
  fastify.get('/media/files/:fileName', async (request, reply) => {
    try {
      const { fileName } = request.params as { fileName: string };
      
      const filePath = mediaService.getFilePath(fileName);
      const fileInfo = await mediaService.getFileInfo(fileName);

      if (!fileInfo.exists) {
        return reply.code(404).send({
          ok: false,
          code: 'FILE_NOT_FOUND',
          message: '文件不存在',
        });
      }

      // 返回文件流
      const stream = fs.createReadStream(filePath);
      return reply.type('application/octet-stream').send(stream);
    } catch (error: any) {
      console.error('获取文件失败:', error);
      return reply.code(500).send({
        ok: false,
        code: 'FILE_READ_FAILED',
        message: '读取文件失败',
      });
    }
  });

  // 获取缩略图
  fastify.get('/media/thumbnails/:fileName', async (request, reply) => {
    try {
      const { fileName } = request.params as { fileName: string };
      
      const thumbnailPath = mediaService.getThumbnailPath(fileName);
      
      // 检查缩略图是否存在
      if (!fs.existsSync(thumbnailPath)) {
        return reply.code(404).send({
          ok: false,
          code: 'THUMBNAIL_NOT_FOUND',
          message: '缩略图不存在',
        });
      }

      // 返回缩略图
      const stream = fs.createReadStream(thumbnailPath);
      return reply.type('image/jpeg').send(stream);
    } catch (error: any) {
      console.error('获取缩略图失败:', error);
      return reply.code(500).send({
        ok: false,
        code: 'THUMBNAIL_READ_FAILED',
        message: '读取缩略图失败',
      });
    }
  });

  // 删除媒体文件
  fastify.delete('/media/:fileName', async (request, reply) => {
    try {
      const { fileName } = request.params as { fileName: string };
      
      // 删除主文件
      await mediaService.deleteFile(fileName);
      
      // 删除缩略图（如果存在）
      const thumbnailFileName = `thumb-${fileName}`;
      await mediaService.deleteThumbnail(thumbnailFileName);

      return reply.send({
        ok: true,
        data: { message: '文件已删除' },
      });
    } catch (error: any) {
      console.error('删除文件失败:', error);
      return reply.code(500).send({
        ok: false,
        code: 'DELETE_FAILED',
        message: '删除文件失败',
      });
    }
  });

  // 获取文件信息
  fastify.get('/media/info/:fileName', async (request, reply) => {
    try {
      const { fileName } = request.params as { fileName: string };
      
      const fileInfo = await mediaService.getFileInfo(fileName);

      if (!fileInfo.exists) {
        return reply.code(404).send({
          ok: false,
          code: 'FILE_NOT_FOUND',
          message: '文件不存在',
        });
      }

      return reply.send({
        ok: true,
        data: {
          fileName,
          size: fileInfo.size,
          exists: fileInfo.exists,
        },
      });
    } catch (error: any) {
      console.error('获取文件信息失败:', error);
      return reply.code(500).send({
        ok: false,
        code: 'INFO_FAILED',
        message: '获取文件信息失败',
      });
    }
  });
}

