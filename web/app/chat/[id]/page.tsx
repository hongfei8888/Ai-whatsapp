'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import WhatsAppLayout, { WhatsAppColors } from '@/components/layout/WhatsAppLayout';
import Sidebar from '@/components/layout/Sidebar';
import { useWebSocket } from '@/lib/useWebSocket';
import KnowledgeSelector from '@/components/KnowledgeSelector';

// 新增：媒体组件
import MediaPreview from '@/components/media/MediaPreview';
import MediaUploader from '@/components/media/MediaUploader';

// 新增：消息操作组件
import QuotedMessage from '@/components/chat/QuotedMessage';
import MessageContextMenu, { getMessageMenuItems } from '@/components/chat/MessageContextMenu';
import MessageEditor from '@/components/chat/MessageEditor';
import ForwardDialog from '@/components/chat/ForwardDialog';

// 新增：聊天辅助组件
import MessageSearch from '@/components/chat/MessageSearch';
import ThreadLabels from '@/components/chat/ThreadLabels';

// 标记为动态路由，禁用静态生成
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

// WhatsApp Web 样式
const styles = {
  // 列表面板样式
  listHeader: {
    backgroundColor: WhatsAppColors.panelBackground,
    padding: '10px 16px',
    height: '60px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottom: `1px solid ${WhatsAppColors.border}`,
  },
  headerTitle: {
    color: WhatsAppColors.textPrimary,
    fontSize: '20px',
    fontWeight: '600' as const,
  },
  searchBar: {
    backgroundColor: WhatsAppColors.panelBackground,
    padding: '8px 12px',
    borderBottom: `1px solid ${WhatsAppColors.border}`,
  },
  searchInput: {
    width: '100%',
    backgroundColor: WhatsAppColors.inputBackground,
    border: 'none',
    borderRadius: '8px',
    padding: '8px 12px 8px 40px',
    color: WhatsAppColors.textPrimary,
    fontSize: '14px',
    outline: 'none',
  },
  chatList: {
    overflowY: 'auto' as const,
    flex: 1,
  },
  chatItem: {
    padding: '12px 16px',
    borderBottom: `1px solid ${WhatsAppColors.border}`,
    cursor: 'pointer',
    display: 'flex',
    gap: '12px',
    transition: 'background-color 0.2s',
  },
  chatItemActive: {
    backgroundColor: WhatsAppColors.selected,
  },
  chatAvatar: {
    width: '49px',
    height: '49px',
    borderRadius: '50%',
    backgroundColor: '#6b7c85',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    fontSize: '20px',
    fontWeight: '500' as const,
    flexShrink: 0,
  },
  chatInfo: {
    flex: 1,
    minWidth: 0,
  },
  chatName: {
    color: WhatsAppColors.textPrimary,
    fontSize: '16px',
    fontWeight: '400' as const,
    marginBottom: '3px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },
  chatLastMessage: {
    color: WhatsAppColors.textSecondary,
    fontSize: '14px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },
  chatTime: {
    color: WhatsAppColors.textSecondary,
    fontSize: '12px',
    flexShrink: 0,
  },
  // 聊天内容区样式
  chatHeader: {
    backgroundColor: WhatsAppColors.panelBackground,
    padding: '10px 16px',
    height: '60px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    borderBottom: `1px solid ${WhatsAppColors.border}`,
  },
  chatHeaderInfo: {
    flex: 1,
  },
  chatHeaderName: {
    color: WhatsAppColors.textPrimary,
    fontSize: '16px',
    fontWeight: '400' as const,
    marginBottom: '2px',
  },
  chatHeaderStatus: {
    color: WhatsAppColors.textSecondary,
    fontSize: '13px',
  },
  messagesArea: {
    flex: 1,
    overflowY: 'auto' as const,
    padding: '20px 8%',
    backgroundColor: '#efeae2',
    backgroundImage: 'linear-gradient(rgba(0,0,0,.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,.05) 1px, transparent 1px)',
    backgroundSize: '20px 20px',
  },
  dateSeparator: {
    textAlign: 'center' as const,
    margin: '20px 0 12px',
  },
  dateBadge: {
    display: 'inline-block',
    backgroundColor: 'rgba(225, 245, 254, 0.92)',
    color: '#54656f',
    padding: '5px 12px',
    borderRadius: '7.5px',
    fontSize: '12.5px',
    fontWeight: '500' as const,
    boxShadow: '0 1px 0.5px rgba(0,0,0,.13)',
  },
  messageGroup: {
    display: 'flex',
    marginBottom: '2px',
    gap: '8px',
  },
  messageGroupRight: {
    justifyContent: 'flex-end',
  },
  messageBubble: {
    maxWidth: '65%',
    padding: '6px 7px 8px 9px',
    borderRadius: '7.5px',
    position: 'relative' as const,
    wordBreak: 'break-word' as const,
    boxShadow: '0 1px 0.5px rgba(0,0,0,.13)',
  },
  messageBubbleReceived: {
    backgroundColor: '#ffffff',
    color: WhatsAppColors.textPrimary,
  },
  messageBubbleSent: {
    backgroundColor: '#d9fdd3',
    color: WhatsAppColors.textPrimary,
  },
  messageText: {
    fontSize: '14.2px',
    lineHeight: '19px',
    paddingRight: '50px', // 为时间和已读标记留出空间
    whiteSpace: 'pre-wrap' as const,
  },
  messageFooter: {
    position: 'absolute' as const,
    bottom: '4px',
    right: '7px',
    display: 'flex',
    alignItems: 'center',
    gap: '3px',
  },
  messageTime: {
    fontSize: '11px',
    color: '#667781',
  },
  messageStatus: {
    fontSize: '16px',
    color: '#53bdeb',
    lineHeight: '15px',
  },
  inputArea: {
    backgroundColor: WhatsAppColors.panelBackground,
    padding: '10px 16px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  iconButton: {
    width: '24px',
    height: '24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: WhatsAppColors.textSecondary,
    cursor: 'pointer',
    fontSize: '24px',
  },
  inputBox: {
    flex: 1,
    backgroundColor: WhatsAppColors.inputBackground,
    borderRadius: '8px',
    padding: '9px 12px',
    color: WhatsAppColors.textPrimary,
    fontSize: '15px',
    border: 'none',
    outline: 'none',
    resize: 'none' as const,
    minHeight: '20px',
    maxHeight: '100px',
  },
  sendButton: {
    width: '24px',
    height: '24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: WhatsAppColors.textSecondary,
    cursor: 'pointer',
    fontSize: '24px',
  },
  emojiPickerContainer: {
    position: 'absolute' as const,
    bottom: '70px',
    left: '16px',
    backgroundColor: WhatsAppColors.panelBackground,
    border: `1px solid ${WhatsAppColors.border}`,
    borderRadius: '8px',
    padding: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
    zIndex: 1000,
    maxWidth: '340px',
  },
  emojiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(8, 1fr)',
    gap: '8px',
    maxHeight: '240px',
    overflowY: 'auto' as const,
  },
  emojiItem: {
    fontSize: '24px',
    cursor: 'pointer',
    padding: '4px',
    textAlign: 'center' as const,
    borderRadius: '4px',
    transition: 'background-color 0.2s',
  },
  templatePickerContainer: {
    position: 'absolute' as const,
    bottom: '70px',
    left: '16px',
    right: '16px',
    backgroundColor: WhatsAppColors.panelBackground,
    border: `1px solid ${WhatsAppColors.border}`,
    borderRadius: '12px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
    zIndex: 1000,
    maxHeight: '400px',
    display: 'flex',
    flexDirection: 'column' as const,
  },
  templatePickerHeader: {
    padding: '12px 16px',
    borderBottom: `1px solid ${WhatsAppColors.border}`,
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  templatePickerSearch: {
    flex: 1,
    padding: '8px 12px',
    backgroundColor: WhatsAppColors.inputBackground,
    border: `1px solid ${WhatsAppColors.border}`,
    borderRadius: '6px',
    fontSize: '14px',
    color: WhatsAppColors.textPrimary,
    outline: 'none',
  },
  templatePickerList: {
    overflowY: 'auto' as const,
    maxHeight: '320px',
  },
  templatePickerItem: {
    padding: '12px 16px',
    borderBottom: `1px solid ${WhatsAppColors.border}`,
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  templatePickerItemName: {
    fontSize: '14px',
    fontWeight: '500' as const,
    color: WhatsAppColors.textPrimary,
    marginBottom: '4px',
  },
  templatePickerItemContent: {
    fontSize: '13px',
    color: WhatsAppColors.textSecondary,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },
};

// 常用表情列表
const COMMON_EMOJIS = [
  '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣',
  '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰',
  '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜',
  '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏',
  '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣',
  '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠',
  '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨',
  '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥',
  '😶', '😐', '😑', '😬', '🙄', '😯', '😦', '😧',
  '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐',
  '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '🤑',
  '🤠', '😈', '👿', '👹', '👺', '🤡', '💩', '👻',
  '💀', '☠️', '👽', '👾', '🤖', '🎃', '😺', '😸',
  '😹', '😻', '😼', '😽', '🙀', '😿', '😾', '👋',
  '🤚', '🖐', '✋', '🖖', '👌', '🤌', '🤏', '✌️',
  '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕',
  '👇', '☝️', '👍', '👎', '✊', '👊', '🤛', '🤜',
  '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️', '💅',
  '🤳', '💪', '🦾', '🦿', '🦵', '🦶', '👂', '🦻',
  '👃', '🧠', '🫀', '🫁', '🦷', '🦴', '👀', '👁',
  '👅', '👄', '💋', '🩸', '❤️', '🧡', '💛', '💚',
  '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕',
  '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️',
  '✝️', '☪️', '🕉', '☸️', '✡️', '🔯', '🕎', '☯️',
  '☦️', '🛐', '⛎', '♈', '♉', '♊', '♋', '♌',
  '♍', '♎', '♏', '♐', '♑', '♒', '♓', '🆔',
  '⚛️', '🉑', '☢️', '☣️', '📴', '📳', '🈶', '🈚',
  '🈸', '🈺', '🈷️', '✴️', '🆚', '💮', '🉐', '㊙️',
  '㊗️', '🈴', '🈵', '🈹', '🈲', '🅰️', '🅱️', '🆎',
  '🆑', '🅾️', '🆘', '❌', '⭕', '🛑', '⛔', '📛',
  '🚫', '💯', '💢', '♨️', '🚷', '🚯', '🚳', '🚱',
  '🔞', '📵', '🚭', '❗', '❕', '❓', '❔', '‼️',
];

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const threadId = params.id as string;
  const [threads, setThreads] = useState<any[]>([]);
  const [currentThread, setCurrentThread] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [showKnowledgeSelector, setShowKnowledgeSelector] = useState(false);
  const [templates, setTemplates] = useState<any[]>([]);
  const [templateSearch, setTemplateSearch] = useState('');
  const [autoTranslateEnabled, setAutoTranslateEnabled] = useState(false);
  const [translatingMessages, setTranslatingMessages] = useState<Set<string>>(new Set());
  
  // ✅ AI自动回复开关
  const [aiEnabled, setAiEnabled] = useState(false);
  
  // 新增：消息操作相关状态
  const [replyToMessage, setReplyToMessage] = useState<any | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  
  // 新增：对话框状态
  const [showForwardDialog, setShowForwardDialog] = useState(false);
  const [forwardMessage, setForwardMessage] = useState<any | null>(null);
  const [showMediaUploader, setShowMediaUploader] = useState(false);
  
  // 新增：UI 状态
  const [showSearch, setShowSearch] = useState(false);
  
  // 新增：右键菜单状态
  const [contextMenu, setContextMenu] = useState<{
    show: boolean;
    x: number;
    y: number;
    message: any;
  } | null>(null);
  
  // 新增：分页加载状态
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [loadingMoreMessages, setLoadingMoreMessages] = useState(false);
  
  // 新增：草稿自动保存定时器
  const draftSaveTimerRef = useRef<NodeJS.Timeout | undefined>(undefined);
  
  // ✅ 新增：滚动位置和新消息提示
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [newMessageCount, setNewMessageCount] = useState(0);
  const [lastReadMessageId, setLastReadMessageId] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadThreads();
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const templatesData = await api.getTemplates();
      // apiFetch 已经返回 payload.data，不需要再访问 .data 属性
      setTemplates(Array.isArray(templatesData) ? templatesData : []);
    } catch (error) {
      console.error('加载模版失败:', error);
      setTemplates([]);
    }
  };

  useEffect(() => {
    if (threadId) {
      loadThread(threadId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threadId]);

  // ✅ 监听滚动位置
  useEffect(() => {
    const messagesArea = messagesAreaRef.current;
    if (!messagesArea) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = messagesArea;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      setIsAtBottom(isNearBottom);
      
      // 如果滚动到底部，清除未读计数
      if (isNearBottom) {
        setNewMessageCount(0);
      }
    };

    messagesArea.addEventListener('scroll', handleScroll);
    return () => messagesArea.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    console.log('📊 [useEffect] 消息列表已更新，当前数量:', messages.length);
    // 始终立即滚动到底部（无动画）
    if (messages.length > 0 && isAtBottom) {
      scrollToBottom(true);
    } else if (messages.length > 0 && !isAtBottom) {
      // 如果不在底部，增加未读计数
      setNewMessageCount(prev => prev + 1);
    }
  }, [messages, isAtBottom]);
  
  // 新增：草稿自动保存
  useEffect(() => {
    if (!threadId || !inputText) return;
    
    // 清除之前的定时器
    if (draftSaveTimerRef.current) {
      clearTimeout(draftSaveTimerRef.current);
    }
    
    // 延迟保存草稿（防抖）
    draftSaveTimerRef.current = setTimeout(async () => {
      try {
        await api.threads.saveDraft(threadId, inputText);
        console.log('💾 草稿已保存');
      } catch (error) {
        console.error('保存草稿失败:', error);
      }
    }, 1000);
    
    return () => {
      if (draftSaveTimerRef.current) {
        clearTimeout(draftSaveTimerRef.current);
      }
    };
  }, [inputText, threadId]);

  const scrollToBottom = (instant = false) => {
    if (instant) {
      // 立即滚动到底部（初次加载时）
      messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
    } else {
      // 平滑滚动（新消息到来时）
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const loadThreads = useCallback(async () => {
    try {
      const data = await api.getThreads();
      setThreads(data.threads || []);
    } catch (error) {
      console.error('加载会话列表失败:', error);
    }
  }, []);

  // 智能合并消息（去重 + 排序）
  const mergeMessages = useCallback((existingMessages: any[], newMessages: any[]): any[] => {
    const messageMap = new Map<string, any>();
    
    // 先添加现有消息
    existingMessages.forEach(msg => messageMap.set(msg.id, msg));
    
    // 再添加新消息（会覆盖重复的）
    newMessages.forEach(msg => messageMap.set(msg.id, msg));
    
    // 转换为数组并按时间排序
    const merged = Array.from(messageMap.values()).sort((a, b) => {
      const timeA = new Date(a.createdAt).getTime();
      const timeB = new Date(b.createdAt).getTime();
      return timeA - timeB;
    });
    
    console.log('🔀 [mergeMessages] 合并完成:', {
      原有: existingMessages.length,
      新增: newMessages.length,
      合并后: merged.length,
    });
    
    return merged;
  }, []);

  const loadThread = useCallback(async (id: string) => {
    try {
      console.log('🔄 [loadThread] 开始加载会话:', id);
      setLoading(true);
      
      // 清空旧消息（避免显示上一个会话的消息）
      setMessages([]);
      
      const data = await api.getThreadMessages(id);
      console.log('🔄 [loadThread] 收到数据:', data);
      console.log('🔄 [loadThread] 消息数量:', data.messages?.length || 0);
      console.log('🔄 [loadThread] Contact 信息:', data.contact);
      console.log('🔄 [loadThread] 完整数据结构:', JSON.stringify(data, null, 2).substring(0, 500));
      
      // 显示最后 3 条消息的 ID 和内容，用于调试
      const msgs = data.messages || [];
      if (msgs.length > 0) {
        const last3 = msgs.slice(-3);
        console.log('🔄 [loadThread] 最后 3 条消息:', last3.map((m: any) => ({
          id: m.id.substring(0, 20) + '...',
          body: m.body,
          time: new Date(m.createdAt).toLocaleTimeString()
        })));
      }
      
      setCurrentThread(data);
      setAutoTranslateEnabled((data as any).autoTranslate || false);
      setAiEnabled((data as any).aiEnabled || false); // ✅ 读取AI开关状态
      
      // 直接设置新消息（不合并，因为已经清空）
      setMessages(data.messages || []);
      
      // 新增：加载草稿
      try {
        const draft = await api.threads.getDraft(id);
        if (draft?.draft) {
          setInputText(draft.draft);
          console.log('📝 [loadThread] 草稿已加载:', draft.draft.substring(0, 30));
        }
      } catch (error) {
        console.error('加载草稿失败:', error);
      }
      
      console.log('🔄 [loadThread] ✅ 状态已更新，消息已设置到 state');
      
      // ✅ 加载完成后立即滚动到底部
      setTimeout(() => scrollToBottom(true), 100);
      
    } catch (error) {
      console.error('❌ [loadThread] 加载会话消息失败:', error);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // 新增：加载更多历史消息
  const loadMoreMessages = useCallback(async () => {
    if (!threadId || loadingMoreMessages || !hasMoreMessages) return;
    
    try {
      setLoadingMoreMessages(true);
      
      // 获取最早的消息时间
      const oldestMessage = messages[0];
      const before = oldestMessage?.createdAt;
      
      // 使用新的分页 API
      const data = await api.getThreadMessagesMore(threadId, { 
        limit: 50, 
        before 
      });
      
      if (data.messages && data.messages.length > 0) {
        // 保存当前滚动位置
        const container = document.querySelector('[style*="overflowY"]') as HTMLDivElement;
        const oldScrollHeight = container?.scrollHeight || 0;
        
        // 添加历史消息到列表顶部
        setMessages((prev) => [...data.messages, ...prev]);
        setHasMoreMessages(data.hasMore || false);
        
        // 恢复滚动位置
        setTimeout(() => {
          if (container) {
            const newScrollHeight = container.scrollHeight;
            container.scrollTop = newScrollHeight - oldScrollHeight;
          }
        }, 0);
      } else {
        setHasMoreMessages(false);
      }
    } catch (error) {
      console.error('加载历史消息失败:', error);
    } finally {
      setLoadingMoreMessages(false);
    }
  }, [threadId, loadingMoreMessages, hasMoreMessages, messages]);

  // 新增：右键菜单处理
  const handleMessageContextMenu = useCallback((e: React.MouseEvent, message: any) => {
    e.preventDefault();
    setContextMenu({
      show: true,
      x: e.clientX,
      y: e.clientY,
      message,
    });
  }, []);

  // 新增：引用消息
  const handleReplyMessage = useCallback((message: any) => {
    setReplyToMessage(message);
    setContextMenu(null);
  }, []);

  // 新增：编辑消息
  const handleEditMessage = useCallback(async (messageId: string, newText: string) => {
    try {
      await api.messages.edit(messageId, newText);
      setEditingMessageId(null);
      console.log('✅ 消息已编辑');
    } catch (error) {
      console.error('编辑消息失败:', error);
      throw error;
    }
  }, []);

  // 新增：删除消息
  const handleDeleteMessage = useCallback(async (message: any) => {
    if (!confirm('确定要删除这条消息吗？')) return;
    
    try {
      await api.messages.delete(message.id);
      setContextMenu(null);
      console.log('✅ 消息已删除');
    } catch (error) {
      console.error('删除消息失败:', error);
      alert('删除失败，请重试');
    }
  }, []);

  // 新增：转发消息
  const handleForwardMessage = useCallback(async (threadIds: string[]) => {
    if (!forwardMessage) return;
    
    try {
      await api.messages.forward(forwardMessage.id, threadIds);
      setShowForwardDialog(false);
      setForwardMessage(null);
      setContextMenu(null);
      console.log(`✅ 消息已转发到 ${threadIds.length} 个会话`);
      alert(`消息已转发到 ${threadIds.length} 个会话`);
    } catch (error) {
      console.error('转发消息失败:', error);
      throw error;
    }
  }, [forwardMessage]);

  // 新增：标记星标
  const handleStarMessage = useCallback(async (message: any) => {
    try {
      await api.messages.star(message.id, !message.isStarred);
      setContextMenu(null);
      
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === message.id
            ? { ...msg, isStarred: !msg.isStarred }
            : msg
        )
      );
    } catch (error) {
      console.error('标记消息失败:', error);
      alert('操作失败，请重试');
    }
  }, []);

  // 新增：复制消息
  const handleCopyMessage = useCallback((message: any) => {
    if (message.text) {
      navigator.clipboard.writeText(message.text);
      alert('已复制到剪贴板');
      setContextMenu(null);
    }
  }, []);

  // 新增：媒体上传
  const handleMediaUpload = useCallback(async (result: any) => {
    if (!threadId || !currentThread?.contact?.phoneE164) {
      console.warn('⚠️ 无法发送媒体：', { 
        hasThreadId: !!threadId, 
        hasContact: !!currentThread?.contact,
        hasPhone: !!currentThread?.contact?.phoneE164 
      });
      return;
    }
    
    try {
      console.log('📤 开始发送媒体消息：', result);
      
      // 使用新的媒体消息 API（使用正确的字段名）
      await api.sendMediaMessage(
        currentThread.contact.phoneE164,
        result.mediaFileName || result.fileName, // 服务器文件名
        result.mediaType || result.type || 'image', // 媒体类型
        result.caption || '', // 标题
        result.originalFileName || result.fileName // 原始文件名（用于显示）
      );
      
      setShowMediaUploader(false);
      console.log('✅ 媒体文件已发送');
      
      // ✅ 不需要刷新消息列表，WebSocket 会实时推送新消息
      // 消息会通过 onNewMessage 回调自动添加到列表
    } catch (error) {
      console.error('发送媒体消息失败:', error);
      alert('发送失败：' + (error as any).message);
    }
  }, [threadId, currentThread]);

  // WebSocket 实时更新
  useWebSocket({
    onNewMessage: (message) => {
      console.log('📨 [聊天详情] 收到新消息:', message);
      console.log('📨 [聊天详情] 当前会话 ID:', threadId);
      console.log('📨 [聊天详情] 当前联系人号码:', currentThread?.contact?.phoneE164);
      console.log('📨 [聊天详情] 消息来源:', message.from);
      console.log('📨 [聊天详情] 消息发往:', message.to);
      console.log('📨 [聊天详情] 消息线程 ID:', message.threadId);
      
      // 检查消息是否属于当前会话
      // 统一格式化号码：移除 @c.us 和 + 号
      const normalizePhone = (phone: string | undefined) => {
        if (!phone) return '';
        return phone.replace('@c.us', '').replace('+', '');
      };
      
      const currentContactPhone = normalizePhone(currentThread?.contact?.phoneE164);
      const messageFromPhone = normalizePhone(message.from);
      const messageToPhone = normalizePhone(message.to);
      const threadPhone = normalizePhone(message.threadId);
      
      // 匹配逻辑：
      // 1. 接收消息时 (fromMe=false): message.from === currentContact
      // 2. 发送消息时 (fromMe=true): message.to === currentContact
      // 3. 或者 threadId 匹配
      const isCurrentThread = 
        messageFromPhone === currentContactPhone || 
        messageToPhone === currentContactPhone ||
        threadPhone === currentContactPhone;
      
      console.log('📨 [聊天详情] 号码比较:', {
        当前联系人: currentContactPhone,
        消息来源: messageFromPhone,
        消息发往: messageToPhone,
        线程ID: threadPhone,
        fromMe: message.fromMe,
        是否匹配: isCurrentThread
      });
      
      if (isCurrentThread) {
        console.log('📨 [聊天详情] ✅ 消息属于当前会话');
        
        // 🚀 立即将新消息添加到列表（实时显示）
        const newMessage = {
          id: message.id,
          body: message.body,
          text: message.body, // 兼容字段
          fromMe: message.fromMe,
          timestamp: message.timestamp,
          createdAt: new Date().toISOString(),
          type: message.type,
          // 媒体字段（如果是媒体消息）
          mediaUrl: message.mediaUrl || null,
          mediaType: message.mediaType || null,
          mediaMimeType: message.mediaMimeType || null,
          mediaSize: message.mediaSize || null,
          mediaFileName: message.mediaFileName || null,
          originalFileName: message.originalFileName || null, // 原始文件名
          thumbnailUrl: message.thumbnailUrl || null,
        };
        
        console.log('📨 [聊天详情] 💨 立即添加新消息到列表', {
          消息ID: newMessage.id,
          内容: newMessage.body,
          是否是我发的: newMessage.fromMe,
          类型: newMessage.type,
          有媒体: !!newMessage.mediaUrl,
        });
        setMessages(prev => {
          // 检查消息是否已存在（避免重复）
          const exists = prev.some(m => m.id === newMessage.id);
          if (exists) {
            console.log('📨 [聊天详情] ⚠️ 消息已存在，跳过');
            return prev;
          }
          const newList = [...prev, newMessage];
          console.log('📨 [聊天详情] ✅ 新消息已添加，总数:', newList.length);
          console.log('📨 [聊天详情] 📝 新消息详情:', {
            内容: newMessage.body,
            fromMe: newMessage.fromMe,
            添加前: prev.length,
            添加后: newList.length
          });
          return newList;
        });
        
        // ✅ 不需要重新加载消息，WebSocket 已实时添加
        // 重新加载会清空消息列表，导致刚添加的消息消失
        
        // 只刷新会话列表（更新最后消息时间等）
        loadThreads();
      } else {
        console.log('📨 [聊天详情] ⏭️ 消息不属于当前会话，跳过');
      }
    },
    // 新增：处理其他WebSocket事件
    onMessage: (wsMessage) => {
      const { type, data } = wsMessage;
      
      switch (type) {
        case 'message_edited':
          // 消息被编辑
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === data.messageId
                ? { ...msg, body: data.text, text: data.text, isEdited: true, editedAt: data.editedAt }
                : msg
            )
          );
          console.log('✏️ 消息已编辑:', data.messageId);
          break;
          
        case 'message_deleted':
          // 消息被删除
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === data.messageId
                ? { ...msg, isDeleted: true, deletedAt: data.deletedAt }
                : msg
            )
          );
          console.log('🗑️ 消息已删除:', data.messageId);
          break;
          
        case 'message_starred':
          // 消息星标状态改变
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === data.messageId
                ? { ...msg, isStarred: data.isStarred, starredAt: data.starredAt }
                : msg
            )
          );
          console.log('⭐ 消息星标更新:', data.messageId, data.isStarred);
          break;
          
        case 'message_read':
          // 消息已读
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === data.messageId
                ? { ...msg, readAt: data.readAt }
                : msg
            )
          );
          console.log('👁️ 消息已读:', data.messageId);
          break;
      }
    },
    
    onConnect: () => {
      console.log('🔌 [聊天详情] WebSocket 已连接');
    },
  });

  const handleSendMessage = async () => {
    if (!inputText.trim() || !currentThread || !currentThread.contact?.phoneE164) {
      console.warn('⚠️ 无法发送消息：', { 
        hasInputText: !!inputText.trim(), 
        hasThread: !!currentThread, 
        hasContact: !!currentThread?.contact,
        hasPhone: !!currentThread?.contact?.phoneE164 
      });
      return;
    }

    const messageText = inputText;
    // 立即清空输入框和引用（乐观更新）
    setInputText('');
    setShowEmojiPicker(false); // 关闭表情选择器

    try {
      // 新增：如果有引用消息，使用引用API
      if (replyToMessage) {
        await api.messages.reply({
          threadId,
          text: messageText,
          replyToId: replyToMessage.id,
        });
        setReplyToMessage(null); // 清除引用
      } else {
        await api.sendMessage(currentThread.contact.phoneE164, messageText);
      }
      
      // 新增：清除草稿
      if (threadId) {
        api.threads.saveDraft(threadId, '').catch(console.error);
      }
      
      // ✅ 不需要手动刷新，WebSocket 会实时推送消息
      // 消息会通过 onNewMessage 回调自动添加到列表
    } catch (error) {
      console.error('发送消息失败:', error);
      // 发送失败，恢复输入框内容
      setInputText(messageText);
      alert('发送失败，请重试');
    }
  };

  const handleEmojiClick = (emoji: string) => {
    setInputText((prev) => prev + emoji);
  };

  const handleTemplateClick = async (template: any) => {
    try {
      // 记录使用次数
      await api.useTemplate(template.id);
      
      // 渲染模版内容（替换变量）
      let content = template.content;
      
      // 自动填充变量
      if (template.variables && template.variables.length > 0 && currentThread?.contact) {
        const variables: Record<string, string> = {};
        
        // 填充常见变量
        if (template.variables.includes('name')) {
          variables.name = currentThread.contact.name || currentThread.contact.phoneE164;
        }
        if (template.variables.includes('phone')) {
          variables.phone = currentThread.contact.phoneE164;
        }
        if (template.variables.includes('date')) {
          variables.date = new Date().toLocaleDateString('zh-CN');
        }
        if (template.variables.includes('time')) {
          variables.time = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
        }
        
        // 渲染模版
        Object.entries(variables).forEach(([key, value]) => {
          content = content.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
        });
      }
      
      // 插入到输入框
      setInputText(content);
      setShowTemplatePicker(false);
    } catch (error) {
      console.error('使用模版失败:', error);
      // 即使失败也插入内容
      setInputText(template.content);
      setShowTemplatePicker(false);
    }
  };

  const handleKnowledgeSelect = async (knowledge: any) => {
    try {
      // 记录使用次数
      await api.knowledge.use(knowledge.id);
      
      // 插入知识库内容到输入框
      setInputText(knowledge.content);
      setShowKnowledgeSelector(false);
      setShowEmojiPicker(false);
      setShowTemplatePicker(false);
      
      console.log('✅ 知识库内容已插入:', knowledge.title);
    } catch (error) {
      console.error('使用知识库失败:', error);
      // 即使失败也插入内容
      setInputText(knowledge.content);
      setShowKnowledgeSelector(false);
    }
  };

  // 翻译单条消息
  const translateMessage = async (messageId: string) => {
    const message = messages.find(m => m.id === messageId);
    if (!message || !message.text) return;

    setTranslatingMessages(prev => new Set(prev).add(messageId));

    try {
      console.log('🌐 翻译消息:', message.text);
      const result = await api.translation.translate(message.text);
      
      // 更新消息
      setMessages(prev =>
        prev.map(m =>
          m.id === messageId
            ? { ...m, translatedText: result.translatedText }
            : m
        )
      );
      
      console.log('✅ 翻译成功:', result.translatedText);
    } catch (error) {
      console.error('❌ 翻译失败:', error);
      alert('翻译失败：' + (error instanceof Error ? error.message : '未知错误'));
    } finally {
      setTranslatingMessages(prev => {
        const next = new Set(prev);
        next.delete(messageId);
        return next;
      });
    }
  };

  // 切换自动翻译
  const toggleAutoTranslate = async () => {
    if (!currentThread) return;

    try {
      const newState = !autoTranslateEnabled;
      console.log('🌐 切换自动翻译:', newState);
      
      await api.translation.toggleAutoTranslate(threadId, newState);
      setAutoTranslateEnabled(newState);
      
      if (newState) {
        // 翻译所有未翻译的消息
        const untranslatedIds = messages
          .filter(m => m.text && !m.translatedText)
          .map(m => m.id);
        
        if (untranslatedIds.length > 0) {
          console.log('🌐 批量翻译现有消息:', untranslatedIds.length);
          try {
            const results = await api.translation.translateMessages(untranslatedIds);
            setMessages(results);
          } catch (error) {
            console.error('❌ 批量翻译失败:', error);
          }
        }
      }
      
      console.log('✅ 自动翻译已', newState ? '开启' : '关闭');
    } catch (error) {
      console.error('❌ 切换自动翻译失败:', error);
      alert('操作失败：' + (error instanceof Error ? error.message : '未知错误'));
    }
  };

  // ✅ 切换AI自动回复
  const toggleAi = async () => {
    if (!currentThread) return;

    try {
      const newState = !aiEnabled;
      console.log('🤖 切换AI自动回复:', newState);
      
      await api.setThreadAiEnabled(threadId, newState);
      setAiEnabled(newState);
      
      console.log('✅ AI自动回复已', newState ? '开启' : '关闭');
    } catch (error) {
      console.error('❌ 切换AI自动回复失败:', error);
      alert('操作失败：' + (error instanceof Error ? error.message : '未知错误'));
    }
  };

  // 翻译并发送
  const handleTranslateAndSend = async () => {
    if (!inputText.trim()) return;

    try {
      console.log('🌐 翻译并发送:', inputText);
      const result = await api.translation.translate(inputText);
      
      // 使用译文替换输入框内容
      setInputText(result.translatedText);
      
      // 延迟一点发送，让用户看到译文
      setTimeout(() => {
        handleSendMessage();
      }, 500);
    } catch (error) {
      console.error('❌ 翻译失败:', error);
      alert('翻译失败：' + (error instanceof Error ? error.message : '未知错误'));
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // 重置时间为 0 点以便比较日期
    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const yesterdayOnly = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());

    if (dateOnly.getTime() === todayOnly.getTime()) {
      return '今天';
    } else if (dateOnly.getTime() === yesterdayOnly.getTime()) {
      return '昨天';
    } else {
      return date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });
    }
  };

  // 按日期分组消息
  const groupMessagesByDate = (messages: any[]) => {
    const groups: { [key: string]: any[] } = {};
    messages.forEach((msg) => {
      const date = formatDate(msg.createdAt);
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(msg);
    });
    return groups;
  };

  const messageGroups = groupMessagesByDate(messages);

  const getInitials = (name: string) => {
    return name?.charAt(0)?.toUpperCase() || '?';
  };

  const filteredThreads = threads.filter(thread => {
    const name = thread.contact?.name || thread.contact?.phoneE164 || '';
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // 列表面板
  const listPanel = (
    <>
      <div style={styles.listHeader}>
        <div style={styles.headerTitle}>聊天</div>
      </div>

      <div style={styles.searchBar}>
        <div style={{ position: 'relative' }}>
          <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: WhatsAppColors.textSecondary }}>🔍</span>
          <input
            type="text"
            placeholder="搜索或开始新的聊天"
            style={styles.searchInput}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div style={styles.chatList}>
        {filteredThreads.map((thread) => (
          <div
            key={thread.id}
            style={{
              ...styles.chatItem,
              ...(thread.id === threadId ? styles.chatItemActive : {}),
            }}
            onMouseEnter={(e) => {
              if (thread.id !== threadId) {
                e.currentTarget.style.backgroundColor = WhatsAppColors.hover;
              }
            }}
            onMouseLeave={(e) => {
              if (thread.id !== threadId) {
                e.currentTarget.style.backgroundColor = 'transparent';
              }
            }}
            onClick={() => router.push(`/chat/${thread.id}`)}
          >
            {/* 头像 - 优先显示真实头像，否则显示首字母 */}
            {thread.contact?.avatarUrl ? (
              <img 
                src={thread.contact.avatarUrl} 
                alt={thread.contact?.name || thread.contact?.phoneE164}
                style={styles.chatAvatar}
                onError={(e) => {
                  // 如果头像加载失败，显示首字母
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling?.removeAttribute('style');
                }}
              />
            ) : (
              <div style={styles.chatAvatar}>
                {getInitials(thread.contact?.name || thread.contact?.phoneE164)}
              </div>
            )}
            
            <div style={styles.chatInfo}>
              <div style={styles.chatName}>
                {thread.contact?.name || thread.contact?.phoneE164}
              </div>
              <div style={styles.chatLastMessage}>
                {thread.lastMessage ? (
                  <>
                    {thread.lastMessage.fromMe && '✓ '}
                    {thread.lastMessage.body || '(媒体文件)'}
                  </>
                ) : '点击查看对话'}
              </div>
            </div>
            <div style={styles.chatTime}>
              {thread.latestMessageAt ? formatTime(thread.latestMessageAt) : ''}
            </div>
          </div>
        ))}
      </div>
    </>
  );

  // 聊天内容区
  const mainContent = currentThread ? (
    <>
      {/* 对话头部 */}
      <div style={styles.chatHeader}>
        <div style={styles.chatAvatar}>
          {getInitials(currentThread.contact?.name || currentThread.contact?.phoneE164)}
        </div>
        <div style={styles.chatHeaderInfo}>
          <div style={styles.chatHeaderName}>
            {currentThread.contact?.name || currentThread.contact?.phoneE164}
          </div>
          <div style={styles.chatHeaderStatus}>
            {currentThread.contact?.phoneE164}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {/* ✅ AI自动回复开关 */}
          <button
            onClick={toggleAi}
            style={{
              padding: '6px 12px',
              backgroundColor: aiEnabled ? WhatsAppColors.accent : 'transparent',
              color: aiEnabled ? '#fff' : WhatsAppColors.textPrimary,
              border: `1px solid ${aiEnabled ? WhatsAppColors.accent : WhatsAppColors.border}`,
              borderRadius: '16px',
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              transition: 'all 0.2s',
            }}
            title={aiEnabled ? '关闭AI自动回复' : '开启AI自动回复'}
          >
            🤖 {aiEnabled ? 'AI开' : 'AI关'}
          </button>
          {/* 自动翻译开关 */}
          <button
            onClick={toggleAutoTranslate}
            style={{
              padding: '6px 12px',
              backgroundColor: autoTranslateEnabled ? WhatsAppColors.accent : 'transparent',
              color: autoTranslateEnabled ? '#fff' : WhatsAppColors.textPrimary,
              border: `1px solid ${autoTranslateEnabled ? WhatsAppColors.accent : WhatsAppColors.border}`,
              borderRadius: '16px',
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              transition: 'all 0.2s',
            }}
            title={autoTranslateEnabled ? '关闭自动翻译' : '开启自动翻译'}
          >
            🌐 {autoTranslateEnabled ? '翻译开' : '翻译关'}
          </button>
          {/* 新增：搜索按钮 */}
          <span
            style={styles.iconButton}
            onClick={() => setShowSearch(!showSearch)}
            title="搜索消息"
          >
            🔍
          </span>
          <span style={styles.iconButton}>⋮</span>
        </div>
      </div>

      {/* 新增：消息搜索 */}
      {showSearch && (
        <MessageSearch
          threadId={threadId}
          onMessageClick={(messageId: string) => {
            console.log('跳转到搜索结果消息:', messageId);
            setShowSearch(false);
            // TODO: 滚动到指定消息
          }}
          onClose={() => setShowSearch(false)}
        />
      )}

      {/* 消息区域 */}
      <div 
        ref={messagesAreaRef}
        style={styles.messagesArea}
      >
        {loading ? (
          <div style={{ textAlign: 'center', color: WhatsAppColors.textSecondary, padding: '40px' }}>
            加载中...
          </div>
        ) : messages.length === 0 ? (
          <div style={{ textAlign: 'center', color: WhatsAppColors.textSecondary, padding: '40px' }}>
            暂无消息
          </div>
        ) : (
          <>
            {Object.entries(messageGroups).map(([date, msgs]: [string, any]) => (
              <div key={date}>
                {/* 日期分隔符 */}
                <div style={styles.dateSeparator}>
                  <div style={styles.dateBadge}>{date}</div>
                </div>
                
                {/* 该日期的所有消息 */}
                {msgs.map((message: any, index: number) => {
                  const isEditing = editingMessageId === message.id;
                  const isDeleted = message.isDeleted;
                  
                  return (
                    <div
                      key={message.id || index}
                      style={{
                        ...styles.messageGroup,
                        ...(message.fromMe ? styles.messageGroupRight : {}),
                      }}
                      onContextMenu={(e) => !isDeleted && handleMessageContextMenu(e, message)}
                    >
                      <div
                        style={{
                          ...styles.messageBubble,
                          ...(message.fromMe ? styles.messageBubbleSent : styles.messageBubbleReceived),
                          ...(isDeleted ? { opacity: 0.6 } : {}),
                        }}
                      >
                        {/* 新增：引用消息预览 */}
                        {message.replyTo && (
                          <QuotedMessage
                            message={message.replyTo}
                            onJumpTo={(messageId) => {
                              // TODO: 滚动到被引用的消息
                              console.log('跳转到消息:', messageId);
                            }}
                          />
                        )}
                        
                        {/* 新增：媒体内容 */}
                        {message.mediaUrl && (
                          <MediaPreview
                            mediaUrl={message.mediaUrl}
                            mediaType={message.mediaType}
                            mediaMimeType={message.mediaMimeType}
                            mediaFileName={message.mediaFileName}
                            originalFileName={message.originalFileName}
                            mediaSize={message.mediaSize}
                            thumbnailUrl={message.thumbnailUrl}
                            duration={message.duration}
                          />
                        )}
                        
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                          <div style={{ flex: 1 }}>
                            {/* 新增：编辑模式或显示模式 */}
                            {isEditing ? (
                              <MessageEditor
                                initialText={message.body || message.text || ''}
                                onSave={(newText) => handleEditMessage(message.id, newText)}
                                onCancel={() => setEditingMessageId(null)}
                              />
                            ) : isDeleted ? (
                              <div style={{ ...styles.messageText, fontStyle: 'italic', color: WhatsAppColors.textSecondary }}>
                                🗑️ 此消息已被删除
                              </div>
                            ) : (
                              <>
                                <div style={styles.messageText}>
                                  {message.body || message.text}
                                  {/* 新增：已编辑标记 */}
                                  {message.isEdited && (
                                    <span style={{ fontSize: '11px', color: WhatsAppColors.textSecondary, marginLeft: '6px' }}>
                                      (已编辑)
                                    </span>
                                  )}
                                  {/* 新增：星标标记 */}
                                  {message.isStarred && (
                                    <span style={{ marginLeft: '6px' }} title="已标记星标">
                                      ⭐
                                    </span>
                                  )}
                                </div>
                                {/* 翻译内容 */}
                                {message.translatedText && (
                                  <div style={{
                                    marginTop: '6px',
                                    padding: '8px',
                                    backgroundColor: 'rgba(0, 168, 132, 0.05)',
                                    borderLeft: `3px solid ${WhatsAppColors.accent}`,
                                    borderRadius: '4px',
                                    fontSize: '13px',
                                    color: WhatsAppColors.textSecondary,
                                    fontStyle: 'italic',
                                  }}>
                                    <span style={{ fontWeight: '600', color: WhatsAppColors.accent, marginRight: '4px' }}>
                                      🌐 译文：
                                    </span>
                                    {message.translatedText}
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                        <div style={{
                          ...styles.messageFooter,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}>
                          <span style={styles.messageTime}>
                            {formatTime(message.createdAt || message.timestamp)}
                          </span>
                          {message.fromMe && (
                            <span 
                              style={{
                                fontSize: '14px',
                                lineHeight: '15px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                color: message.readAt 
                                  ? '#53bdeb'  // 蓝色双勾表示已读
                                  : '#8696a0',  // 灰色表示已发送/已送达
                              }}
                              title={
                                message.readAt 
                                  ? '已读' 
                                  : message.deliveredAt 
                                    ? '已送达' 
                                    : '已发送'
                              }
                            >
                              {message.readAt || message.deliveredAt ? '✓✓' : '✓'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
        
        {/* ✅ 滚动到底部按钮 */}
        {!isAtBottom && (
          <button
            onClick={() => {
              scrollToBottom(false);
              setNewMessageCount(0);
            }}
            style={{
              position: 'absolute',
              bottom: '16px',
              right: '24px',
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              backgroundColor: WhatsAppColors.accent,
              color: 'white',
              border: 'none',
              boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
              zIndex: 100,
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
            title={newMessageCount > 0 ? `${newMessageCount} 条新消息` : '滚动到底部'}
          >
            {newMessageCount > 0 ? (
              <div style={{ position: 'relative' }}>
                ↓
                <div style={{
                  position: 'absolute',
                  top: '-8px',
                  right: '-8px',
                  backgroundColor: '#ff4444',
                  color: 'white',
                  borderRadius: '50%',
                  minWidth: '20px',
                  height: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  padding: '0 4px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                }}>
                  {newMessageCount > 99 ? '99+' : newMessageCount}
                </div>
              </div>
            ) : (
              '↓'
            )}
          </button>
        )}
        
        {/* ✅ 新消息提示 Toast */}
        {newMessageCount > 0 && !isAtBottom && (
          <div
            onClick={() => {
              scrollToBottom(false);
              setNewMessageCount(0);
            }}
            style={{
              position: 'absolute',
              bottom: '80px',
              left: '50%',
              transform: 'translateX(-50%)',
              backgroundColor: WhatsAppColors.accent,
              color: 'white',
              padding: '8px 20px',
              borderRadius: '20px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              zIndex: 99,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#008f6f';
              e.currentTarget.style.transform = 'translateX(-50%) translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = WhatsAppColors.accent;
              e.currentTarget.style.transform = 'translateX(-50%) translateY(0)';
            }}
          >
            <span style={{ fontSize: '16px' }}>📩</span>
            <span>{newMessageCount} 条新消息</span>
          </div>
        )}
      </div>

      {/* 输入区域 */}
      <div style={{ position: 'relative' }}>
        {/* 表情选择器 */}
        {showEmojiPicker && (
          <div style={styles.emojiPickerContainer}>
            <div style={styles.emojiGrid}>
              {COMMON_EMOJIS.map((emoji, index) => (
                <div
                  key={index}
                  style={styles.emojiItem}
                  onClick={() => handleEmojiClick(emoji)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = WhatsAppColors.hover;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  {emoji}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 模版选择器 */}
        {showTemplatePicker && (
          <div style={styles.templatePickerContainer}>
            <div style={styles.templatePickerHeader}>
              <input
                type="text"
                placeholder="搜索模版..."
                value={templateSearch}
                onChange={(e) => setTemplateSearch(e.target.value)}
                style={styles.templatePickerSearch}
              />
              <button
                onClick={() => setShowTemplatePicker(false)}
                style={{
                  padding: '8px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: WhatsAppColors.textSecondary,
                  fontSize: '16px',
                }}
              >
                ✕
              </button>
            </div>
            <div style={styles.templatePickerList}>
              {templates
                .filter(t => 
                  !templateSearch || 
                  t.name.toLowerCase().includes(templateSearch.toLowerCase()) ||
                  t.content.toLowerCase().includes(templateSearch.toLowerCase())
                )
                .map((template) => (
                  <div
                    key={template.id}
                    style={styles.templatePickerItem}
                    onClick={() => handleTemplateClick(template)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = WhatsAppColors.hover;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <div style={styles.templatePickerItemName}>
                      {template.name}
                      {template.category && (
                        <span style={{
                          marginLeft: '8px',
                          padding: '2px 6px',
                          backgroundColor: 'rgba(0, 168, 132, 0.15)',
                          color: WhatsAppColors.accent,
                          borderRadius: '8px',
                          fontSize: '11px',
                        }}>
                          {template.category}
                        </span>
                      )}
                    </div>
                    <div style={styles.templatePickerItemContent}>
                      {template.content}
                    </div>
                  </div>
                ))}
              {templates.filter(t => 
                !templateSearch || 
                t.name.toLowerCase().includes(templateSearch.toLowerCase()) ||
                t.content.toLowerCase().includes(templateSearch.toLowerCase())
              ).length === 0 && (
                <div style={{
                  padding: '32px 16px',
                  textAlign: 'center',
                  color: WhatsAppColors.textSecondary,
                }}>
                  {templateSearch ? '未找到匹配的模版' : '暂无模版，请先创建模版'}
                </div>
              )}
            </div>
          </div>
        )}

        {showKnowledgeSelector && (
          <KnowledgeSelector
            onSelect={handleKnowledgeSelect}
            onClose={() => setShowKnowledgeSelector(false)}
          />
        )}

        {/* 新增：引用消息预览 */}
        {replyToMessage && (
          <div style={{
            padding: '12px 16px',
            backgroundColor: WhatsAppColors.background,
            borderTop: `1px solid ${WhatsAppColors.border}`,
            borderLeft: `4px solid ${WhatsAppColors.accent}`,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '13px', fontWeight: '600', color: WhatsAppColors.accent, marginBottom: '4px' }}>
                  回复 {replyToMessage.fromMe ? '自己' : currentThread?.contact?.name || '对方'}
                </div>
                <div style={{ fontSize: '13px', color: WhatsAppColors.textSecondary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {replyToMessage.body || replyToMessage.text || '(媒体文件)'}
                </div>
              </div>
              <span
                style={{ cursor: 'pointer', fontSize: '20px', color: WhatsAppColors.textSecondary, marginLeft: '12px' }}
                onClick={() => setReplyToMessage(null)}
                title="取消引用"
              >
                ✕
              </span>
            </div>
          </div>
        )}

        <div style={styles.inputArea}>
          {/* 新增：附件按钮 */}
          <span 
            style={{...styles.iconButton, color: showMediaUploader ? WhatsAppColors.accent : WhatsAppColors.textSecondary}}
            onClick={() => setShowMediaUploader(true)}
            title="发送文件"
          >
            📎
          </span>
          <span 
            style={{...styles.iconButton, color: showEmojiPicker ? WhatsAppColors.accent : WhatsAppColors.textSecondary}}
            onClick={() => {
              setShowEmojiPicker(!showEmojiPicker);
              setShowTemplatePicker(false);
              setShowKnowledgeSelector(false);
            }}
          >
            😊
          </span>
          <span 
            style={{...styles.iconButton, color: showTemplatePicker ? WhatsAppColors.accent : WhatsAppColors.textSecondary}}
            onClick={() => {
              setShowTemplatePicker(!showTemplatePicker);
              setShowEmojiPicker(false);
              setShowKnowledgeSelector(false);
            }}
            title="使用模版"
          >
            📄
          </span>
          <span 
            style={{...styles.iconButton, color: showKnowledgeSelector ? WhatsAppColors.accent : WhatsAppColors.textSecondary}}
            onClick={() => {
              setShowKnowledgeSelector(!showKnowledgeSelector);
              setShowEmojiPicker(false);
              setShowTemplatePicker(false);
            }}
            title="知识库"
          >
            💡
          </span>
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder="输入消息"
            style={styles.inputBox}
            rows={1}
          />
          {inputText.trim() && (
            <button
              onClick={handleTranslateAndSend}
              style={{
                padding: '8px 12px',
                backgroundColor: WhatsAppColors.accent,
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                fontSize: '16px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
              title="翻译后发送"
            >
              🌐➤
            </button>
          )}
          {inputText.trim() ? (
            <span style={styles.sendButton} onClick={handleSendMessage}>
              ➤
            </span>
          ) : (
            <span style={styles.iconButton}>🎤</span>
          )}
        </div>
      </div>
    </>
  ) : null;

  return (
    <>
      <WhatsAppLayout
        sidebar={<Sidebar />}
        listPanel={listPanel}
        mainContent={mainContent}
      />
      
      {/* 新增：右键菜单 */}
      {contextMenu && contextMenu.show && (
        <>
          {/* 背景遮罩 */}
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 999,
            }}
            onClick={() => setContextMenu(null)}
          />
          {/* 菜单 */}
          <MessageContextMenu
            x={contextMenu.x}
            y={contextMenu.y}
            items={getMessageMenuItems(contextMenu.message, {
              onReply: () => handleReplyMessage(contextMenu.message),
              onEdit: () => {
                setEditingMessageId(contextMenu.message.id);
                setContextMenu(null);
              },
              onDelete: () => handleDeleteMessage(contextMenu.message),
              onForward: () => {
                setForwardMessage(contextMenu.message);
                setShowForwardDialog(true);
                setContextMenu(null);
              },
              onStar: () => handleStarMessage(contextMenu.message),
              onCopy: () => handleCopyMessage(contextMenu.message),
            })}
            onClose={() => setContextMenu(null)}
          />
        </>
      )}
      
      {/* 新增：转发对话框 */}
      {showForwardDialog && forwardMessage && (
        <ForwardDialog
          message={forwardMessage}
          onForward={handleForwardMessage}
          onClose={() => {
            setShowForwardDialog(false);
            setForwardMessage(null);
          }}
        />
      )}
      
      {/* 新增：媒体上传器 */}
      {showMediaUploader && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
          }}
          onClick={() => setShowMediaUploader(false)}
        >
          <div onClick={(e) => e.stopPropagation()}>
            <MediaUploader
              onUploadComplete={handleMediaUpload}
              onUploadError={(error) => {
                console.error('上传失败:', error);
                alert('上传失败：' + error.message);
                setShowMediaUploader(false);
              }}
            />
          </div>
        </div>
      )}
    </>
  );
}

