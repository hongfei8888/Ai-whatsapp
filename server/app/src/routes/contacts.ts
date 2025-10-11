import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { logger } from '../logger';
import * as contactService from '../services/contact-service';

interface CreateContactBody {
  phoneE164: string;
  name?: string;
  consent?: boolean;
}

interface UpdateContactBody {
  name?: string;
  tags?: string[];
  consent?: boolean;
}

interface ContactParams {
  contactId: string;
}

/**
 * 联系人管理路由（多账号架构）
 */
export async function contactRoutes(app: FastifyInstance) {
  const { prisma } = app;

  /**
   * POST /contacts - 创建联系人
   * 需要通过中间件提供 accountId
   */
  app.post('/', async (request: FastifyRequest<{ Body: CreateContactBody }>, reply: FastifyReply) => {
    try {
      const accountId = (request as any).accountId;
      if (!accountId) {
        return reply.status(400).send({
          ok: false,
          code: 'MISSING_ACCOUNT_ID',
          message: 'Account ID is required',
        });
      }

      const { phoneE164, name, consent } = request.body;

      if (!phoneE164) {
        return reply.status(400).send({
          ok: false,
          code: 'MISSING_PHONE',
          message: 'Phone number is required',
        });
      }

      logger.info({ accountId, phoneE164, name }, 'Creating contact');

      const contact = await contactService.createContact(accountId, {
        phoneE164,
        name,
        consent,
      });

      logger.info({ accountId, contactId: contact.id }, 'Contact created successfully');

      return reply.send({
        ok: true,
        data: contact,
      });
    } catch (error: any) {
      if (error.message?.includes('already exists') || error.code === 'P2002') {
        logger.warn({ error }, 'Contact already exists');
        return reply.status(409).send({
          ok: false,
          code: 'CONTACT_EXISTS',
          message: 'Contact with this phone number already exists',
        });
      }

      logger.error({ error }, 'Failed to create contact');
      return reply.status(500).send({
        ok: false,
        code: 'CREATE_CONTACT_ERROR',
        message: error.message || 'Failed to create contact',
      });
    }
  });

  /**
   * POST /contacts/verify - 验证号码是否是有效的 WhatsApp 联系人
   * ⚠️ 必须在 /:contactId 路由之前注册，避免路由冲突
   */
  app.post('/verify', async (request: FastifyRequest<{ Body: { phoneE164: string } }>, reply: FastifyReply) => {
    try {
      const accountId = (request as any).accountId;
      if (!accountId) {
        return reply.status(400).send({
          ok: false,
          code: 'MISSING_ACCOUNT_ID',
          message: 'Account ID is required',
        });
      }

      const { phoneE164 } = request.body;

      if (!phoneE164) {
        return reply.status(400).send({
          ok: false,
          code: 'MISSING_PHONE',
          message: 'Phone number is required',
        });
      }

      logger.info({ accountId, phoneE164 }, '🔐 验证 WhatsApp 号码');

      // 1. 检查数据库中是否已存在此联系人
      const existingContact = await prisma.contact.findFirst({
        where: {
          accountId,
          phoneE164,
        },
      });

      if (existingContact) {
        logger.info({ accountId, phoneE164, contactId: existingContact.id }, '✅ 联系人已存在于数据库');
        return reply.send({
          ok: true,
          data: {
            isValid: true,
            existsInDb: true,
            contactInfo: {
              id: existingContact.id,
              phoneE164: existingContact.phoneE164,
              name: existingContact.name,
            },
          },
        });
      }

      // 2. 通过 WhatsApp API 验证号码
      const whatsappService = app.accountManager.getAccountService(accountId);
      
      if (!whatsappService) {
        logger.warn({ accountId }, '⚠️ WhatsApp 服务未就绪');
        return reply.status(503).send({
          ok: false,
          code: 'SERVICE_UNAVAILABLE',
          message: 'WhatsApp service is not available',
        });
      }

      try {
        // 清理号码格式
        let cleanNumber = phoneE164.replace(/[^0-9+]/g, '');
        if (!cleanNumber.startsWith('+')) {
          cleanNumber = '+' + cleanNumber.replace(/^\+/, '');
        }

        // 格式化为 WhatsApp ID 格式
        const whatsappId = cleanNumber.replace('+', '') + '@c.us';
        
        logger.info({ accountId, phoneE164, cleanNumber, whatsappId }, '🔍 通过 WPPConnect 验证号码');

        // 使用 WPPConnect 的 checkNumberStatus 或 getContact 方法
        const numberStatus = await (whatsappService as any).client.checkNumberStatus(whatsappId);
        
        logger.info({ accountId, phoneE164, numberStatus }, '📊 号码验证结果');

        if (numberStatus && numberStatus.numberExists) {
          // 号码有效，尝试获取联系人信息
          let contactInfo: any = {
            phoneE164: cleanNumber,
            name: null,
            profilePicUrl: null,
          };

          try {
            const contact = await (whatsappService as any).client.getContact(whatsappId);
            contactInfo.name = contact.name || contact.pushname || null;
            
            // 尝试获取头像
            try {
              const profilePic = await (whatsappService as any).client.getProfilePicFromServer(whatsappId);
              if (profilePic && profilePic.imgFull) {
                contactInfo.profilePicUrl = profilePic.imgFull;
              }
            } catch (picError) {
              logger.debug({ accountId, phoneE164, error: picError }, '⚠️ 获取头像失败');
            }
          } catch (contactError) {
            logger.debug({ accountId, phoneE164, error: contactError }, '⚠️ 获取联系人信息失败');
          }

          logger.info({ accountId, phoneE164, contactInfo }, '✅ 号码验证成功');

          return reply.send({
            ok: true,
            data: {
              isValid: true,
              existsInDb: false,
              existsInWhatsApp: true,
              contactInfo,
            },
          });
        } else {
          logger.info({ accountId, phoneE164 }, '❌ 号码不存在或无效');
          return reply.send({
            ok: true,
            data: {
              isValid: false,
              existsInDb: false,
              existsInWhatsApp: false,
              contactInfo: null,
            },
          });
        }
      } catch (whatsappError: any) {
        logger.error({ accountId, phoneE164, error: whatsappError }, '❌ WhatsApp 验证失败');
        return reply.status(500).send({
          ok: false,
          code: 'WHATSAPP_VERIFY_ERROR',
          message: 'Failed to verify number with WhatsApp: ' + whatsappError.message,
        });
      }
    } catch (error: any) {
      logger.error({ error }, '❌ 验证号码失败');
      return reply.status(500).send({
        ok: false,
        code: 'VERIFY_ERROR',
        message: 'Failed to verify contact: ' + error.message,
      });
    }
  });

  /**
   * GET /contacts - 获取联系人列表
   */
  app.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const accountId = (request as any).accountId;
      if (!accountId) {
        return reply.status(400).send({
          ok: false,
          code: 'MISSING_ACCOUNT_ID',
          message: 'Account ID is required',
        });
      }

      logger.info({ accountId }, 'Fetching contacts');

      const contacts = await contactService.listContacts(accountId);

      return reply.send({
        ok: true,
        data: contacts,
      });
    } catch (error) {
      logger.error({ error }, 'Failed to fetch contacts');
      return reply.status(500).send({
        ok: false,
        code: 'FETCH_CONTACTS_ERROR',
        message: 'Failed to fetch contacts',
      });
    }
  });

  /**
   * GET /contacts/:contactId - 获取单个联系人
   */
  app.get('/:contactId', async (request: FastifyRequest<{ Params: ContactParams }>, reply: FastifyReply) => {
    try {
      const accountId = (request as any).accountId;
      if (!accountId) {
        return reply.status(400).send({
          ok: false,
          code: 'MISSING_ACCOUNT_ID',
          message: 'Account ID is required',
        });
      }

      const { contactId } = request.params;

      logger.info({ accountId, contactId }, 'Fetching contact');

      const contact = await contactService.getContactById(accountId, contactId);

      if (!contact) {
        return reply.status(404).send({
          ok: false,
          code: 'CONTACT_NOT_FOUND',
          message: 'Contact not found',
        });
      }

      return reply.send({
        ok: true,
        data: contact,
      });
    } catch (error) {
      logger.error({ error }, 'Failed to fetch contact');
      return reply.status(500).send({
        ok: false,
        code: 'FETCH_CONTACT_ERROR',
        message: 'Failed to fetch contact',
      });
    }
  });

  /**
   * PATCH /contacts/:contactId - 更新联系人
   */
  app.patch('/:contactId', async (request: FastifyRequest<{ Params: ContactParams; Body: UpdateContactBody }>, reply: FastifyReply) => {
    try {
      const accountId = (request as any).accountId;
      if (!accountId) {
        return reply.status(400).send({
          ok: false,
          code: 'MISSING_ACCOUNT_ID',
          message: 'Account ID is required',
        });
      }

      const { contactId } = request.params;
      const { name, tags, consent } = request.body;

      logger.info({ accountId, contactId, updates: request.body }, 'Updating contact');

      // 更新联系人（updateContact内部会验证accountId）
      const contact = await contactService.updateContact(accountId, contactId, {
        name,
        tags,
        consent,
      });

      logger.info({ accountId, contactId }, 'Contact updated successfully');

      return reply.send({
        ok: true,
        data: contact,
      });
    } catch (error) {
      logger.error({ error }, 'Failed to update contact');
      return reply.status(500).send({
        ok: false,
        code: 'UPDATE_CONTACT_ERROR',
        message: 'Failed to update contact',
      });
    }
  });

  /**
   * DELETE /contacts/:contactId - 删除联系人
   */
  app.delete('/:contactId', async (request: FastifyRequest<{ Params: ContactParams }>, reply: FastifyReply) => {
    try {
      const accountId = (request as any).accountId;
      if (!accountId) {
        return reply.status(400).send({
          ok: false,
          code: 'MISSING_ACCOUNT_ID',
          message: 'Account ID is required',
        });
      }

      const { contactId } = request.params;

      logger.info({ accountId, contactId }, 'Deleting contact');

      // 删除联系人（deleteContact内部会验证accountId）
      await contactService.deleteContact(accountId, contactId);

      logger.info({ accountId, contactId }, 'Contact deleted successfully');

      return reply.send({
        ok: true,
        message: 'Contact deleted successfully',
      });
    } catch (error) {
      logger.error({ error }, 'Failed to delete contact');
      return reply.status(500).send({
        ok: false,
        code: 'DELETE_CONTACT_ERROR',
        message: 'Failed to delete contact',
      });
    }
  });
}


