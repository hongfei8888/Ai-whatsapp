import { FastifyInstance } from 'fastify';
import * as mediaService from '../services/media-service';
import fs from 'fs';
import path from 'path';

export default async function mediaRoutes(fastify: FastifyInstance) {
  // 上传媒体文件
  fastify.post('/media/upload', async (request, reply) => {
    try {
      const data = await request.file();
      
      if (!data) {
        return reply.code(400).send({
          ok: false,
          code: 'NO_FILE',
          message: '没有上传文件',
        });
      }

      const result = await mediaService.handleFileUpload(data);

      return reply.send({
        ok: true,
        data: result,
      });
    } catch (error: any) {
      console.error('文件上传失败:', error);
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

