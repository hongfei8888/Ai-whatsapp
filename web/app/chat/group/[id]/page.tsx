'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import WhatsAppLayout, { WhatsAppColors } from '@/components/layout/WhatsAppLayout';
import Sidebar from '@/components/layout/Sidebar';
import MediaUploader from '@/components/media/MediaUploader';
import { api } from '@/lib/api';
import { useWebSocket } from '@/lib/useWebSocket';

// 🎨 群组消息接口定义（包含媒体字段）
interface GroupMessage {
  id: string;
  groupId: string;
  messageId: string;
  fromPhone: string;
  fromName?: string | null;
  text?: string | null;
  mediaType?: string | null;
  mediaUrl?: string | null;
  mediaMimeType?: string | null;
  mediaFileName?: string | null;
  originalFileName?: string | null;
  thumbnailUrl?: string | null;
  createdAt: string;
  translatedText?: string;
}

// WhatsApp Web 样式
const styles = {
  chatHeader: {
    backgroundColor: WhatsAppColors.panelBackground,
    padding: '10px 16px',
    height: '60px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    borderBottom: `1px solid ${WhatsAppColors.border}`,
  },
  backButton: {
    background: 'none',
    border: 'none',
    color: WhatsAppColors.textPrimary,
    fontSize: '20px',
    cursor: 'pointer',
    padding: '4px',
  },
  chatAvatar: {
    width: '40px',
    height: '40px',
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
  chatHeaderInfo: {
    flex: 1,
    cursor: 'pointer',
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
    padding: '5px 12px',
    backgroundColor: '#fff',
    borderRadius: '8px',
    color: WhatsAppColors.textSecondary,
    fontSize: '12.5px',
    boxShadow: '0 1px 0.5px rgba(0,0,0,.13)',
  },
  messageRow: (isOwn: boolean) => ({
    display: 'flex',
    justifyContent: isOwn ? 'flex-end' : 'flex-start',
    marginBottom: '8px',
  }),
  messageBubble: (isOwn: boolean) => ({
    maxWidth: '65%',
    backgroundColor: isOwn ? '#d9fdd3' : '#fff',
    borderRadius: '8px',
    padding: '6px 7px 8px 9px',
    boxShadow: '0 1px 0.5px rgba(0,0,0,.13)',
    position: 'relative' as const,
  }),
  messageSender: {
    color: WhatsAppColors.accent,
    fontSize: '12.5px',
    fontWeight: '500' as const,
    marginBottom: '4px',
  },
  messageText: {
    color: WhatsAppColors.textPrimary,
    fontSize: '14.2px',
    lineHeight: '19px',
    whiteSpace: 'pre-wrap' as const,
    wordBreak: 'break-word' as const,
  },
  messageFooter: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: '4px',
    marginTop: '4px',
  },
  messageTime: {
    color: WhatsAppColors.textSecondary,
    fontSize: '11px',
  },
  translatedText: {
    marginTop: '6px',
    padding: '8px',
    backgroundColor: 'rgba(0, 168, 132, 0.1)',
    borderLeft: `3px solid ${WhatsAppColors.accent}`,
    borderRadius: '4px',
    fontSize: '13px',
    color: WhatsAppColors.textPrimary,
    fontStyle: 'italic' as const,
  },
  inputArea: {
    backgroundColor: WhatsAppColors.panelBackground,
    padding: '10px 16px',
    display: 'flex',
    alignItems: 'flex-end',
    gap: '10px',
    borderTop: `1px solid ${WhatsAppColors.border}`,
  },
  inputWrapper: {
    flex: 1,
    backgroundColor: WhatsAppColors.inputBackground,
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    padding: '9px 12px',
  },
  input: {
    flex: 1,
    border: 'none',
    outline: 'none',
    backgroundColor: 'transparent',
    color: WhatsAppColors.textPrimary,
    fontSize: '15px',
    resize: 'none' as const,
    maxHeight: '100px',
    lineHeight: '20px',
    fontFamily: 'inherit',
  },
  sendButton: {
    backgroundColor: 'transparent',
    border: 'none',
    color: WhatsAppColors.textSecondary,
    fontSize: '24px',
    cursor: 'pointer',
    padding: '4px 8px',
    transition: 'color 0.2s',
  },
  sendButtonActive: {
    color: WhatsAppColors.accent,
  },
  loadingState: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    color: WhatsAppColors.textSecondary,
    fontSize: '14px',
  },
  errorState: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    color: '#e74c3c',
    fontSize: '14px',
    gap: '12px',
  },
  retryButton: {
    padding: '8px 16px',
    backgroundColor: WhatsAppColors.accent,
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  headerActions: {
    display: 'flex',
    gap: '8px',
  },
  headerButton: {
    background: 'none',
    border: 'none',
    color: WhatsAppColors.textSecondary,
    fontSize: '20px',
    cursor: 'pointer',
    padding: '4px',
  },
  iconButton: {
    background: 'none',
    border: 'none',
    fontSize: '22px',
    cursor: 'pointer',
    padding: '4px 8px',
    transition: 'color 0.2s',
  },
  // 群组列表样式
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
  groupList: {
    overflowY: 'auto' as const,
    flex: 1,
  },
  groupItem: (active: boolean) => ({
    padding: '12px 16px',
    borderBottom: `1px solid ${WhatsAppColors.border}`,
    cursor: 'pointer',
    display: 'flex',
    gap: '12px',
    transition: 'background-color 0.2s',
    alignItems: 'center',
    backgroundColor: active ? WhatsAppColors.hover : 'transparent',
  }),
  groupAvatar: {
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
  groupInfo: {
    flex: 1,
    minWidth: 0,
  },
  groupName: {
    color: WhatsAppColors.textPrimary,
    fontSize: '16px',
    fontWeight: '400' as const,
    marginBottom: '3px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },
  groupMeta: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  groupMembers: {
    color: WhatsAppColors.textSecondary,
    fontSize: '13px',
  },
  groupTime: {
    color: WhatsAppColors.textSecondary,
    fontSize: '12px',
  },
  // 群组信息侧边栏样式
  infoSidebar: {
    width: '380px',
    height: '100%',
    backgroundColor: WhatsAppColors.background,
    borderLeft: `1px solid ${WhatsAppColors.border}`,
    display: 'flex',
    flexDirection: 'column' as const,
    overflow: 'hidden',
  },
  infoHeader: {
    backgroundColor: WhatsAppColors.panelBackground,
    padding: '20px 24px',
    borderBottom: `1px solid ${WhatsAppColors.border}`,
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  infoCloseButton: {
    background: 'none',
    border: 'none',
    color: WhatsAppColors.textSecondary,
    fontSize: '24px',
    cursor: 'pointer',
    padding: '0',
    width: '24px',
    height: '24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoTitle: {
    color: WhatsAppColors.textPrimary,
    fontSize: '19px',
    fontWeight: '500' as const,
    flex: 1,
  },
  infoContent: {
    flex: 1,
    overflowY: 'auto' as const,
  },
  infoSection: {
    backgroundColor: WhatsAppColors.panelBackground,
    marginBottom: '8px',
    padding: '16px 24px',
  },
  infoGroupProfile: {
    textAlign: 'center' as const,
    padding: '32px 24px',
    backgroundColor: WhatsAppColors.panelBackground,
    marginBottom: '8px',
  },
  infoGroupAvatar: {
    width: '200px',
    height: '200px',
    borderRadius: '50%',
    backgroundColor: '#6b7c85',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    fontSize: '80px',
    fontWeight: '500' as const,
    margin: '0 auto 16px',
  },
  infoGroupName: {
    color: WhatsAppColors.textPrimary,
    fontSize: '21px',
    fontWeight: '400' as const,
    marginBottom: '8px',
  },
  infoGroupDesc: {
    color: WhatsAppColors.textSecondary,
    fontSize: '14px',
  },
  infoSectionTitle: {
    color: WhatsAppColors.accent,
    fontSize: '14px',
    marginBottom: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  infoMembersList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
  },
  infoMemberItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',  // 增加点击区域
    cursor: 'pointer',
    borderRadius: '8px',
    transition: 'all 0.2s ease',
    userSelect: 'none' as const,  // 防止文字选中
    margin: '0 -16px',  // 扩展到边缘
  },
  infoMemberAvatar: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    backgroundColor: '#6b7c85',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    fontSize: '16px',
    fontWeight: '500' as const,
    flexShrink: 0,
    pointerEvents: 'none' as const,  // 🖱️ 不阻止父元素的点击事件
  },
  infoMemberInfo: {
    flex: 1,
    minWidth: 0,
    pointerEvents: 'none' as const,  // 🖱️ 不阻止父元素的点击事件
  },
  infoMemberName: {
    color: WhatsAppColors.textPrimary,
    fontSize: '16px',
    fontWeight: '400' as const,
    marginBottom: '2px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    pointerEvents: 'none' as const,  // 🖱️ 不阻止父元素的点击事件
    whiteSpace: 'nowrap' as const,
  },
  infoMemberPhone: {
    color: WhatsAppColors.textSecondary,
    fontSize: '13px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
    pointerEvents: 'none' as const,  // 🖱️ 不阻止父元素的点击事件
  },
  infoMemberBadge: {
    color: WhatsAppColors.textSecondary,
    fontSize: '12px',
    padding: '2px 8px',
    pointerEvents: 'none' as const,  // 🖱️ 不阻止父元素的点击事件
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: '10px',
  },
};

export default function GroupChatPage() {
  const router = useRouter();
  const params = useParams();
  const groupId = params.id as string;

  const [group, setGroup] = useState<any>(null);
  const [groups, setGroups] = useState<any[]>([]);  // 所有群组列表
  const [messages, setMessages] = useState<GroupMessage[]>([]);  // 🎨 使用 GroupMessage 类型
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [showMediaUploader, setShowMediaUploader] = useState(false);
  const [translatingMessages, setTranslatingMessages] = useState<Set<string>>(new Set());
  const [showEmoji, setShowEmoji] = useState(false);  // 🎨 表情选择器状态
  const emojiButtonRef = useRef<HTMLButtonElement>(null);  // 🎨 表情按钮引用
  const [searchQuery, setSearchQuery] = useState('');
  const [showGroupInfo, setShowGroupInfo] = useState(false);  // 控制群组信息侧边栏
  const [groupMembers, setGroupMembers] = useState<any[]>([]);  // 群组成员列表
  const [loadingMembers, setLoadingMembers] = useState(false);  // 成员列表加载状态
  const [previewImage, setPreviewImage] = useState<string | null>(null);  // 🖼️ 图片预览状态
  
  // 分页相关状态
  const [loadingMore, setLoadingMore] = useState(false);  // 是否正在加载更多
  const [hasMore, setHasMore] = useState(true);  // 是否还有更多消息
  const [offset, setOffset] = useState(0);  // 当前偏移量

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesAreaRef = useRef<HTMLDivElement>(null);  // 消息区域引用

  // 加载群组详情
  const loadGroupDetails = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.groups.getGroupDetails(groupId);
      setGroup(data);
    } catch (err: any) {
      console.error('加载群组详情失败:', err);
      setError(err.message || '加载失败');
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  // 加载群组消息（首次加载）
  const loadGroupMessages = useCallback(async () => {
    try {
      console.log('🔍 加载群组消息...', groupId);
      const pageSize = 50;  // 每页50条
      const data = await api.groups.getGroupMessages(groupId, { limit: pageSize, offset: 0 });
      console.log('✅ 群组消息数据:', data);
      console.log('✅ 消息数量:', data.messages?.length || 0);
      console.log('✅ 总消息数:', data.total || 0);
      
      // API 可能返回数组或对象，需要兼容处理
      const messagesList = Array.isArray(data) ? data : (data.messages || []);
      console.log('📋 解析后的消息列表:', messagesList.length, '条消息');
      
      // 反转消息顺序（后端返回的是 desc 排序，需要反转为 asc）
      const sortedMessages = [...messagesList].reverse();
      console.log('📋 排序后的消息:', sortedMessages.length, '条');
      
      setMessages(sortedMessages);
      setOffset(pageSize);
      
      // 判断是否还有更多消息
      const total = Array.isArray(data) ? messagesList.length : (data.total || 0);
      setHasMore(messagesList.length >= pageSize && sortedMessages.length < total);
      
      console.log('📊 分页状态:', { 
        loaded: sortedMessages.length, 
        total, 
        hasMore: messagesList.length >= pageSize && sortedMessages.length < total 
      });
    } catch (err: any) {
      console.error('❌ 加载群组消息失败:', err);
    }
  }, [groupId]);
  
  // 加载更多消息（滚动到顶部时）
  const loadMoreMessages = useCallback(async () => {
    if (loadingMore || !hasMore) {
      console.log('⏭️ 跳过加载更多:', { loadingMore, hasMore });
      return;
    }
    
    try {
      setLoadingMore(true);
      console.log('🔍 加载更多消息...', { offset });
      
      const pageSize = 50;
      const data = await api.groups.getGroupMessages(groupId, { limit: pageSize, offset });
      console.log('✅ 更多消息数据:', data);
      
      const messagesList = Array.isArray(data) ? data : (data.messages || []);
      console.log('📋 新加载的消息:', messagesList.length, '条');
      
      if (messagesList.length === 0) {
        console.log('✅ 没有更多消息了');
        setHasMore(false);
        return;
      }
      
      // 反转消息顺序
      const sortedNewMessages = [...messagesList].reverse();
      
      // 记录滚动位置
      const messagesArea = messagesAreaRef.current;
      const scrollHeightBefore = messagesArea?.scrollHeight || 0;
      const scrollTopBefore = messagesArea?.scrollTop || 0;
      
      // 将新消息添加到前面
      setMessages(prev => [...sortedNewMessages, ...prev]);
      setOffset(prev => prev + pageSize);
      
      // 判断是否还有更多
      const total = Array.isArray(data) ? messagesList.length : (data.total || 0);
      setHasMore(messagesList.length >= pageSize);
      
      console.log('📊 加载更多完成:', { 
        newMessages: sortedNewMessages.length,
        totalMessages: messages.length + sortedNewMessages.length,
        newOffset: offset + pageSize,
        hasMore: messagesList.length >= pageSize
      });
      
      // 恢复滚动位置（保持在原来的位置）
      setTimeout(() => {
        if (messagesArea) {
          const scrollHeightAfter = messagesArea.scrollHeight;
          messagesArea.scrollTop = scrollTopBefore + (scrollHeightAfter - scrollHeightBefore);
        }
      }, 0);
    } catch (err: any) {
      console.error('❌ 加载更多消息失败:', err);
    } finally {
      setLoadingMore(false);
    }
  }, [groupId, offset, loadingMore, hasMore, messages.length]);

  // 加载所有群组列表
  const loadGroups = useCallback(async () => {
    try {
      const data = await api.groups.list();
      setGroups(data.groups || []);
    } catch (err: any) {
      console.error('加载群组列表失败:', err);
    }
  }, []);

  // 加载群组成员列表
  const loadGroupMembers = useCallback(async () => {
    try {
      setLoadingMembers(true);
      console.log('🔍 加载群组成员...', groupId);
      const data = await api.groups.getGroupMembers(groupId);
      console.log('✅ 成员数据:', data);
      console.log('✅ 成员数据类型:', typeof data, Array.isArray(data));
      
      // API 可能返回数组或对象，需要兼容处理
      const members = Array.isArray(data) ? data : (data.members || []);
      console.log('📋 解析后的成员列表:', members);
      
      // 如果没有成员数据，尝试同步
      if (!members || members.length === 0) {
        console.log('⚠️ 没有成员数据，尝试同步...');
        try {
          await api.groups.syncGroupMembers(groupId);
          console.log('✅ 同步成功，重新加载...');
          const newData = await api.groups.getGroupMembers(groupId);
          const newMembers = Array.isArray(newData) ? newData : (newData.members || []);
          setGroupMembers(newMembers);
          console.log('📋 设置成员列表:', newMembers.length, '个成员');
        } catch (syncErr: any) {
          console.error('❌ 同步失败:', syncErr);
          setGroupMembers([]);
        }
      } else {
        setGroupMembers(members);
        console.log('📋 设置成员列表:', members.length, '个成员');
      }
    } catch (err: any) {
      console.error('❌ 加载群组成员失败:', err);
    } finally {
      setLoadingMembers(false);
    }
  }, [groupId]);

  useEffect(() => {
    loadGroupDetails();
    loadGroupMessages();
    loadGroups();
  }, [loadGroupDetails, loadGroupMessages, loadGroups]);

  // 滚动到底部
  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  useEffect(() => {
    // 首次加载时滚动到底部
    if (offset === 50) {  // 只在首次加载时滚动
      scrollToBottom();
    }
  }, [messages, scrollToBottom, offset]);
  
  // 监听滚动事件，滚动到顶部时加载更多
  useEffect(() => {
    const messagesArea = messagesAreaRef.current;
    if (!messagesArea) return;
    
    const handleScroll = () => {
      const { scrollTop } = messagesArea;
      
      // 滚动到顶部时加载更多（距离顶部小于100px）
      if (scrollTop < 100 && hasMore && !loadingMore) {
        console.log('📜 滚动到顶部，加载更多消息');
        loadMoreMessages();
      }
    };
    
    messagesArea.addEventListener('scroll', handleScroll);
    return () => messagesArea.removeEventListener('scroll', handleScroll);
  }, [hasMore, loadingMore, loadMoreMessages]);

  // WebSocket 实时更新
  useWebSocket({
    onGroupMessage: (message) => {
      console.log('📨 [群组聊天] 收到 WebSocket 群组消息:', message);
      console.log('📨 [群组聊天] 当前群组ID:', groupId);
      console.log('📨 [群组聊天] 消息群组ID:', message.groupId);
      
      // 刷新群组列表（更新最后消息时间）
      loadGroups();
      
      if (message.groupId === groupId) {
        console.log('✅ [群组聊天] 匹配！添加新消息到列表');
        
        // 不要重新加载所有消息，而是智能地添加新消息
        setMessages(prev => {
          // 检查消息是否已存在（通过 messageId）
          const exists = prev.some(m => m.messageId === message.messageId);
          if (exists) {
            console.log('📨 消息已存在，忽略');
            return prev;
          }

          // 移除临时消息（乐观更新）
          const withoutTemp = prev.filter(m => !m.id?.startsWith('temp-'));
          
          // 🎨 添加新消息（包含完整的媒体字段）
          const newMessage: GroupMessage = {
            id: message.messageId || String(Date.now()),
            groupId: message.groupId,
            messageId: message.messageId || '',
            fromPhone: message.from,
            fromName: message.from === 'me' ? '我' : (message.fromName || message.from),
            text: message.body || message.text,
            mediaType: message.mediaType,
            mediaUrl: message.mediaUrl,
            mediaMimeType: message.mediaMimeType,
            mediaFileName: message.mediaFileName,
            originalFileName: message.originalFileName,
            thumbnailUrl: message.thumbnailUrl,
            createdAt: new Date(message.timestamp || Date.now()).toISOString(),
          };
          
          console.log('✅ 新消息已添加到列表', newMessage);
          return [...withoutTemp, newMessage];
        });
        scrollToBottom();  // 🎨 自动滚动到底部
      } else {
        console.log('⏭️ [群组聊天] 不匹配，忽略');
      }
    },
  });

  // 🎨 表情选择器点击外部关闭
  useEffect(() => {
    if (!showEmoji) return;
    
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const isEmojiButton = target.closest('[data-emoji-container]');
      if (!isEmojiButton) {
        console.log('🔒 点击外部，关闭表情面板');
        setShowEmoji(false);
      }
    };

    // ✅ 延迟添加监听器，避免当前点击事件还在冒泡
    const timer = setTimeout(() => {
      document.addEventListener('click', handleClickOutside, true);
    }, 100);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('click', handleClickOutside, true);
    };
  }, [showEmoji]);

  // 🖼️ 监听 ESC 键关闭图片预览
  useEffect(() => {
    if (!previewImage) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setPreviewImage(null);
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [previewImage]);

  // 发送消息
  const handleSendMessage = async () => {
    if (!inputText.trim() || sending) return;

    const messageText = inputText.trim();
    setInputText('');
    setSending(true);

    // 乐观更新：立即在 UI 中显示消息
    const tempId = `temp-${Date.now()}`;
    const optimisticMessage = {
      id: tempId,
      groupId: groupId,
      messageId: tempId,
      fromPhone: 'me',
      fromName: '我',
      text: messageText,
      mediaType: 'chat',
      createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, optimisticMessage]);

    try {
      await api.groups.sendGroupMessage(groupId, messageText);
      console.log('✅ 消息发送成功，等待 WebSocket 更新');
    } catch (err: any) {
      console.error('❌ 发送消息失败:', err);
      alert('发送失败: ' + err.message);
      setInputText(messageText);
      setMessages(prev => prev.filter(m => m.id !== tempId));
    } finally {
      setSending(false);
    }
  };

  // 处理媒体文件上传
  const handleMediaUpload = async (result: any) => {
    // 🎨 乐观更新：立即在 UI 中显示媒体消息
    const tempId = `temp-${Date.now()}`;
    const optimisticMessage: GroupMessage = {
      id: tempId,
      groupId: groupId,
      messageId: tempId,
      fromPhone: 'me',
      fromName: '我',
      text: result.caption || `[${result.mediaType}]`,
      mediaType: result.mediaType,
      mediaUrl: `/media/files/${result.mediaFileName}`,
      mediaMimeType: null,
      mediaFileName: result.mediaFileName,
      originalFileName: result.originalFileName,
      thumbnailUrl: null,
      createdAt: new Date().toISOString(),
    };
    
    setMessages(prev => [...prev, optimisticMessage]);
    setShowMediaUploader(false);
    
    try {
      console.log('📎 开始发送群组媒体文件:', result);
      console.log('📋 传递参数:', {
        groupId,
        mediaFileName: result.mediaFileName,
        mediaType: result.mediaType,
        caption: result.caption,
        originalFileName: result.originalFileName,
      });
      
      const response = await api.groups.sendGroupMediaMessage(
        groupId,
        result.mediaFileName,      // ✅ 修复：使用 mediaFileName 而不是 fileName
        result.mediaType,
        result.caption,
        result.originalFileName
      );
      
      console.log('✅ 媒体文件已发送，等待 WebSocket 更新');
      console.log('📨 后端返回:', response);
      
      // ✅ WebSocket 会自动更新真实消息，临时消息会被替换
    } catch (error) {
      console.error('❌ 发送媒体文件失败:', error);
      alert('发送失败：' + (error instanceof Error ? error.message : '未知错误'));
      // ❌ 发送失败，移除乐观更新的消息
      setMessages(prev => prev.filter(m => m.id !== tempId));
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

  // 翻译并发送
  const handleTranslateAndSend = async () => {
    if (!inputText.trim()) return;

    try {
      console.log('🌐 翻译并发送:', inputText);
      const result = await api.translation.translate(inputText);
      
      setInputText(result.translatedText);
      
      setTimeout(() => {
        handleSendMessage();
      }, 300);
    } catch (error) {
      console.error('❌ 翻译失败:', error);
      alert('翻译失败：' + (error instanceof Error ? error.message : '未知错误'));
    }
  };

  // 处理键盘事件
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // 格式化时间（用于消息）
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  };

  // 格式化时间（用于群组列表）
  const formatListTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) {
      return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return '昨天';
    } else if (days < 7) {
      return `${days}天前`;
    } else {
      return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
    }
  };

  // 格式化日期分隔符
  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return '今天';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return '昨天';
    } else {
      return date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });
    }
  };

  // 获取首字母
  const getInitials = (name: string) => {
    return name?.charAt(0)?.toUpperCase() || '👥';
  };

  // 格式化电话号码
  const formatPhoneNumber = (phoneE164: string): string => {
    if (!phoneE164) return '';
    
    // 清理 WhatsApp ID 格式 (去除 @c.us, @s.whatsapp.net 等)
    let cleaned = phoneE164
      .replace('@c.us', '')
      .replace('@s.whatsapp.net', '')
      .replace('@g.us', '')
      .trim();
    
    // 如果不是以 + 开头，添加 +
    if (!cleaned.startsWith('+')) {
      cleaned = '+' + cleaned;
    }
    
    // 只保留数字和 + 号
    cleaned = cleaned.replace(/[^\d+]/g, '');
    
    // 格式化为可读格式
    // 根据号码长度和国家代码进行格式化
    
    if (cleaned.startsWith('+86') && cleaned.length === 14) {
      // 中国手机号: +86 139 8989 9978 (3+11位)
      return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6, 10)} ${cleaned.slice(10)}`;
    } else if (cleaned.startsWith('+1') && cleaned.length === 12) {
      // 美国/加拿大号码: +1 952 669 6359 (2+10位)
      return `${cleaned.slice(0, 2)} ${cleaned.slice(2, 5)} ${cleaned.slice(5, 8)} ${cleaned.slice(8)}`;
    } else if (cleaned.startsWith('+7') && cleaned.length === 12) {
      // 俄罗斯号码: +7 212 604 0121 (2+10位)
      return `${cleaned.slice(0, 2)} ${cleaned.slice(2, 5)} ${cleaned.slice(5, 8)} ${cleaned.slice(8)}`;
    } else if (cleaned.length > 12) {
      // 其他长号码: 通用格式（国家代码 + 每3位分组）
      const countryCode = cleaned.slice(0, -11);
      const number = cleaned.slice(-11);
      return `${countryCode} ${number.slice(0, 3)} ${number.slice(3, 6)} ${number.slice(6, 9)} ${number.slice(9)}`;
    } else if (cleaned.length > 10) {
      // 中等长度号码: 通用格式
      const countryCode = cleaned.slice(0, -10);
      const number = cleaned.slice(-10);
      return `${countryCode} ${number.slice(0, 3)} ${number.slice(3, 6)} ${number.slice(6)}`;
    }
    
    return cleaned;
  };

  // 点击发送者，跳转到单独聊天
  const handleContactClick = async (fromPhone: string, fromName: string) => {
    try {
      console.log('🔍 点击联系人 - 原始数据:', { fromPhone, fromName });
      
      // 如果是自己发送的，不处理
      if (fromPhone === 'me' || fromName === '我') {
        console.log('⏭️ 跳过自己的消息');
        return;
      }
      
      // 从 WhatsApp ID 中提取电话号码
      let phoneNumber = fromPhone
        .replace('@c.us', '')
        .replace('@s.whatsapp.net', '')
        .replace('@g.us', '');
      
      console.log('📞 提取的电话号码:', phoneNumber);
      
      // 尝试查找现有对话
      console.log('🔎 正在查找现有对话...');
      const threadsData = await api.getThreads();
      const cleanPhoneNumber = phoneNumber.replace(/[^0-9]/g, '');
      
      console.log('📋 可用对话数:', threadsData.threads?.length || 0);
      
      const existingThread = threadsData.threads?.find((t: any) => {
        if (!t.contact) return false;
        
        const contactPhone = t.contact.phoneE164 || t.contact.phone || '';
        const cleanContactPhone = contactPhone.replace(/[^0-9]/g, '');
        const contactId = t.contact.id || '';
        
        // 精确匹配电话号码或 WhatsApp ID
        const phoneMatch = cleanContactPhone === cleanPhoneNumber;
        const idMatch = contactId === fromPhone || contactId.includes(cleanPhoneNumber);
        
        if (phoneMatch || idMatch) {
          console.log('✅ 找到匹配:', {
            threadId: t.id,
            contactName: t.contact.name,
            contactPhone,
            match: phoneMatch ? 'phone' : 'id'
          });
        }
        
        return phoneMatch || idMatch;
      });
      
      if (existingThread) {
        console.log('➡️ 跳转到现有对话:', existingThread.id);
        router.push(`/chat/${existingThread.id}`);
      } else {
        console.log('🆕 创建新对话');
        router.push(`/chat?contact=${encodeURIComponent(fromPhone)}&name=${encodeURIComponent(fromName)}`);
      }
    } catch (error) {
      console.error('❌ 跳转失败:', error);
      alert('无法打开联系人聊天: ' + (error as Error).message);
    }
  };

  // 按日期分组消息
  const groupMessagesByDate = (messages: any[]) => {
    const groups: { [key: string]: any[] } = {};
    messages.forEach((msg) => {
      const dateKey = new Date(msg.createdAt).toDateString();
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(msg);
    });
    return groups;
  };

  // 过滤群组列表
  const filteredGroups = groups
    .filter(group => {
      const name = group.name || '';
      return name.toLowerCase().includes(searchQuery.toLowerCase());
    })
    .sort((a, b) => {
      const timeA = new Date(a.updatedAt || 0).getTime();
      const timeB = new Date(b.updatedAt || 0).getTime();
      return timeB - timeA;
    });

  // 群组列表面板
  const listPanel = (
    <>
      <div style={styles.listHeader}>
        <div style={styles.headerTitle}>群组聊天</div>
      </div>
      <div style={styles.searchBar}>
        <div style={{ position: 'relative' }}>
          <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: WhatsAppColors.textSecondary }}>
            🔍
          </div>
          <input
            style={styles.searchInput}
            type="text"
            placeholder="搜索群组..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      <div style={styles.groupList}>
        {filteredGroups.length === 0 ? (
          <div style={{ padding: '20px', textAlign: 'center', color: WhatsAppColors.textSecondary }}>
            暂无群组
          </div>
        ) : (
          filteredGroups.map((g) => (
            <div
              key={g.id}
              style={styles.groupItem(g.id === groupId)}
              onClick={() => router.push(`/chat/group/${g.id}`)}
              onMouseEnter={(e) => {
                if (g.id !== groupId) {
                  e.currentTarget.style.backgroundColor = WhatsAppColors.hover;
                }
              }}
              onMouseLeave={(e) => {
                if (g.id !== groupId) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              <div style={styles.groupAvatar}>
                {getInitials(g.name || '')}
              </div>
              <div style={styles.groupInfo}>
                <div style={styles.groupName}>{g.name || '未命名群组'}</div>
                <div style={styles.groupMeta}>
                  <div style={styles.groupMembers}>
                    {g.memberCount || 0} 位成员
                  </div>
                  {g.updatedAt && (
                    <div style={styles.groupTime}>
                      {formatListTime(g.updatedAt)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );

  // 主内容区
  const mainContent = (
    <>
      {/* 聊天头部 */}
      <div style={styles.chatHeader}>
        <button
          onClick={() => router.push('/chat')}
          style={{
            background: 'none',
            border: 'none',
            color: WhatsAppColors.textSecondary,
            fontSize: '20px',
            cursor: 'pointer',
            padding: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            transition: 'background-color 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
          title="返回聊天列表"
        >
          ←
        </button>
        <div style={styles.chatAvatar}>👥</div>
        <div style={styles.chatHeaderInfo} onClick={() => router.push(`/groups/manage?groupId=${groupId}`)}>
          <div style={styles.chatHeaderName}>{group?.name || '群组'}</div>
          <div style={styles.chatHeaderStatus}>
            {group?.memberCount || 0} 位成员
          </div>
        </div>
        <div style={styles.headerActions}>
          <button style={styles.headerButton} title="搜索">
            🔍
          </button>
          <button 
            style={styles.headerButton} 
            title="群组信息"
            onClick={() => {
              setShowGroupInfo(true);
              loadGroupMembers();
            }}
          >
            ⋮
          </button>
        </div>
      </div>

      {/* 消息区域 */}
      <div style={styles.messagesArea} ref={messagesAreaRef}>
        {loading ? (
          <div style={styles.loadingState}>加载中...</div>
        ) : error ? (
          <div style={styles.errorState}>
            <div>{error}</div>
            <button style={styles.retryButton} onClick={() => {
              loadGroupDetails();
              loadGroupMessages();
            }}>
              重试
            </button>
          </div>
        ) : messages.length === 0 ? (
          <div style={styles.loadingState}>暂无消息</div>
        ) : (
          <>
            {/* 加载更多提示 */}
            {loadingMore && (
              <div style={{
                textAlign: 'center',
                padding: '10px',
                color: WhatsAppColors.textSecondary,
                fontSize: '13px',
              }}>
                加载中...
              </div>
            )}
            {!loadingMore && hasMore && (
              <div style={{
                textAlign: 'center',
                padding: '10px',
                color: WhatsAppColors.textSecondary,
                fontSize: '13px',
              }}>
                向上滚动加载更多历史消息
              </div>
            )}
            {!hasMore && messages.length > 0 && (
              <div style={{
                textAlign: 'center',
                padding: '10px',
                color: WhatsAppColors.textSecondary,
                fontSize: '13px',
              }}>
                已加载全部消息
              </div>
            )}
            
            {Object.entries(groupMessagesByDate(messages)).map(([dateKey, msgs]) => (
              <div key={dateKey}>
                <div style={styles.dateSeparator}>
                  <div style={styles.dateBadge}>
                    {formatDate(msgs[0].createdAt)}
                  </div>
                </div>

                {msgs.map((message) => {
                  const isOwn = message.fromPhone === 'me' || 
                                message.fromName === '我' || 
                                message.fromPhone?.includes('自己') ||
                                message.id?.startsWith('temp-');
                  return (
                    <div key={message.id} style={styles.messageRow(isOwn)}>
                      <div style={styles.messageBubble(isOwn)}>
                        {!isOwn && (
                          <div 
                            style={{
                              ...styles.messageSender,
                              cursor: 'pointer',
                              textDecoration: 'none',
                            }}
                            onClick={() => handleContactClick(message.fromPhone, message.fromName)}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.textDecoration = 'underline';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.textDecoration = 'none';
                            }}
                            title="点击打开与此联系人的私聊"
                          >
                            {message.fromName || message.fromPhone || '未知'}
                          </div>
                        )}
                        
                        {/* 🎨 媒体预览 */}
                        {message.mediaUrl && message.mediaType && (
                          <div style={{ marginBottom: message.text ? '8px' : 0 }}>
                            {message.mediaType.startsWith('image') ? (
                              <img
                                src={message.thumbnailUrl ? `http://localhost:4000${message.thumbnailUrl}` : `http://localhost:4000${message.mediaUrl}`}
                                alt="图片消息"
                                style={{
                                  maxWidth: '300px',
                                  maxHeight: '300px',
                                  borderRadius: '8px',
                                  cursor: 'pointer',
                                  display: 'block',
                                }}
                                onClick={() => setPreviewImage(`http://localhost:4000${message.mediaUrl}`)}
                                title="点击查看原图"
                              />
                            ) : message.mediaType.startsWith('video') ? (
                              <video
                                src={`http://localhost:4000${message.mediaUrl}`}
                                controls
                                style={{
                                  maxWidth: '300px',
                                  maxHeight: '300px',
                                  borderRadius: '8px',
                                  display: 'block',
                                }}
                              />
                            ) : message.mediaType.startsWith('audio') ? (
                              <audio
                                src={`http://localhost:4000${message.mediaUrl}`}
                                controls
                                style={{
                                  maxWidth: '300px',
                                }}
                              />
                            ) : (
                              <div style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '8px', 
                                padding: '8px', 
                                backgroundColor: 'rgba(0,0,0,0.05)', 
                                borderRadius: '8px' 
                              }}>
                                <span style={{ fontSize: '24px' }}>📎</span>
                                <div>
                                  <div style={{ fontSize: '14px', fontWeight: 500 }}>
                                    {message.originalFileName || message.mediaFileName || '文件'}
                                  </div>
                                  <a
                                    href={`http://localhost:4000${message.mediaUrl}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{ fontSize: '12px', color: WhatsAppColors.accent }}
                                  >
                                    点击下载
                                  </a>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                        
                        {/* 🎨 文本消息 */}
                        {message.text && (
                          <div style={styles.messageText}>
                            {message.text}
                          </div>
                        )}
                        
                        {/* 🎨 翻译文本 */}
                        {message.translatedText && (
                          <div style={styles.translatedText}>
                            {message.translatedText}
                          </div>
                        )}
                        
                        <div style={styles.messageFooter}>
                          <span style={styles.messageTime}>
                            {formatTime(message.createdAt)}
                          </span>
                          {isOwn && <span style={{ marginLeft: '4px' }}>✓</span>}
                          {!isOwn && message.text && (
                            <button
                              style={{
                                ...styles.iconButton,
                                fontSize: '14px',
                                color: translatingMessages.has(message.id) ? WhatsAppColors.textSecondary : WhatsAppColors.accent,
                              }}
                              onClick={() => translateMessage(message.id)}
                              title="翻译"
                              disabled={translatingMessages.has(message.id)}
                            >
                              {translatingMessages.has(message.id) ? '...' : '🌐'}
                            </button>
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
      </div>

      {/* 输入区域 */}
      <div style={styles.inputArea}>
        {/* 🎨 表情按钮（修复后） */}
        <div style={{ position: 'relative', zIndex: 1000 }} data-emoji-container>
          <button
            ref={emojiButtonRef}
            style={{
              ...styles.sendButton,
              backgroundColor: showEmoji ? WhatsAppColors.hover : 'transparent',
            }}
            onClick={(e) => {
              e.stopPropagation();
              console.log('🔥 表情按钮点击, 当前状态:', showEmoji);
              setShowEmoji(!showEmoji);
            }}
            title="表情"
          >
            😊
          </button>

          {/* 🎨 表情选择器面板 */}
          {showEmoji && (
            <div
              style={{
                position: 'absolute',
                bottom: '50px',
                left: '0',
                backgroundColor: '#fff',
                border: `1px solid ${WhatsAppColors.border}`,
                borderRadius: '8px',
                padding: '12px',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                width: '320px',
                maxHeight: '300px',
                overflowY: 'auto',
                zIndex: 1001,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(8, 1fr)',
                gap: '4px',
              }}>
                {[
                  '😊', '😂', '❤️', '👍', '👎', '🙏', '😭', '😍',
                  '😘', '😎', '🤔', '😅', '😢', '😡', '🥰', '😇',
                  '🤗', '🤩', '😴', '😋', '😜', '🤪', '😏', '😬',
                  '🙄', '😶', '😐', '😑', '😯', '😮', '😲', '🥺',
                  '🥳', '😤', '😠', '🤬', '😈', '👹', '👺', '💀',
                  '☠️', '👻', '👽', '🤖', '💩', '😺', '😸', '😹',
                  '👋', '🤚', '✋', '🖐️', '👌', '✌️', '🤞', '🤝',
                  '💪', '🙌', '👏', '🤲', '🤝', '👐', '🙏', '✍️',
                ].map((emoji, index) => (
                  <button
                    key={index}
                    style={{
                      fontSize: '24px',
                      padding: '4px',
                      border: 'none',
                      background: 'none',
                      cursor: 'pointer',
                      borderRadius: '4px',
                      transition: 'background-color 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = WhatsAppColors.hover;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                    onClick={() => {
                      console.log('😊 添加表情:', emoji);
                      setInputText(prev => prev + emoji);
                      setShowEmoji(false);
                    }}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        <button
          style={{...styles.iconButton, color: showMediaUploader ? WhatsAppColors.accent : WhatsAppColors.textSecondary}}
          onClick={() => setShowMediaUploader(true)}
          title="发送文件"
        >
          📎
        </button>
        <div style={styles.inputWrapper}>
          <textarea
            ref={inputRef}
            style={styles.input}
            placeholder="输入消息"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
          />
        </div>
        <button
          style={styles.sendButton}
          onClick={handleTranslateAndSend}
          title="翻译后发送"
        >
          🌐➤
        </button>
        <button
          style={{
            ...styles.sendButton,
            ...(inputText.trim() ? styles.sendButtonActive : {}),
          }}
          onClick={handleSendMessage}
          disabled={!inputText.trim() || sending}
          title="发送"
        >
          {sending ? '⏳' : '➤'}
        </button>
      </div>

      {/* 媒体上传器 */}
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
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setShowMediaUploader(false)}
        >
          <div onClick={(e) => e.stopPropagation()}>
            <MediaUploader
              onUploadComplete={handleMediaUpload}
              onUploadError={(error) => {
                console.error('上传失败:', error);
                alert('上传失败：' + error);
                setShowMediaUploader(false);
              }}
            />
          </div>
        </div>
      )}
    </>
  );

  // 群组信息侧边栏
  const groupInfoSidebar = showGroupInfo && (
    <div style={styles.infoSidebar}>
      {/* 头部 */}
      <div style={styles.infoHeader}>
        <button 
          style={styles.infoCloseButton}
          onClick={() => setShowGroupInfo(false)}
          title="关闭"
        >
          ×
        </button>
        <div style={styles.infoTitle}>群组信息</div>
      </div>

      {/* 内容 */}
      <div style={styles.infoContent}>
        {/* 群组头像和名称 */}
        <div style={styles.infoGroupProfile}>
          <div style={styles.infoGroupAvatar}>
            {getInitials(group?.name || '')}
          </div>
          <div style={styles.infoGroupName}>{group?.name || '未命名群组'}</div>
          <div style={styles.infoGroupDesc}>
            群组 · {group?.memberCount || 0} 位成员
          </div>
        </div>

        {/* 群组描述 */}
        {group?.description && (
          <div style={styles.infoSection}>
            <div style={styles.infoSectionTitle}>群组描述</div>
            <div style={{ color: WhatsAppColors.textPrimary, fontSize: '14px', lineHeight: '1.5' }}>
              {group.description}
            </div>
          </div>
        )}

        {/* 成员列表 */}
        <div style={styles.infoSection}>
          <div style={styles.infoSectionTitle}>
            <span>{group?.memberCount || 0} 位成员</span>
          </div>
          <div style={styles.infoMembersList}>
            {loadingMembers ? (
              <div style={{ color: WhatsAppColors.textSecondary, fontSize: '14px', textAlign: 'center', padding: '20px 0' }}>
                加载中...
              </div>
            ) : groupMembers.length === 0 ? (
              <div style={{ color: WhatsAppColors.textSecondary, fontSize: '14px', textAlign: 'center', padding: '20px 0' }}>
                暂无成员信息
              </div>
            ) : (
              groupMembers.map((member: any) => (
                <div 
                  key={member.id || member.phoneE164}
                  style={styles.infoMemberItem}
                  onClick={async () => {
                    try {
                      console.log('🔍 点击成员:', member);
                      
                      // 🔍 尝试从多个地方提取电话号码
                      let phoneNumber = member.phoneE164 || member.phone || '';
                      let alternativePhone = member.displayName || '';  // displayName 可能包含真实号码
                      
                      console.log('📞 原始电话号码:', phoneNumber);
                      console.log('📞 备用号码（displayName）:', alternativePhone);
                      
                      // 清理 WhatsApp 后缀和非数字字符
                      phoneNumber = phoneNumber
                        .replace('@c.us', '')
                        .replace('@s.whatsapp.net', '')
                        .replace('@g.us', '')
                        .replace(/[^0-9+]/g, '')
                        .trim();
                      
                      alternativePhone = alternativePhone
                        .replace(/[^0-9+]/g, '')
                        .trim();
                      
                      console.log('📞 清理后的电话号码:', phoneNumber);
                      console.log('📞 清理后的备用号码:', alternativePhone);
                      
                      // 如果主号码为空或太短，尝试使用备用号码
                      if (!phoneNumber || phoneNumber.length < 10) {
                        console.log('⚠️ 主号码无效，使用备用号码');
                        phoneNumber = alternativePhone;
                      }
                      
                      if (!phoneNumber || phoneNumber.length < 10) {
                        console.error('❌ 电话号码为空或太短');
                        alert('无法获取该成员的电话号码');
                        return;
                      }
                      
                      // 关闭侧边栏
                      setShowGroupInfo(false);
                      
                      // 只保留数字部分用于匹配
                      const cleanPhoneNumber = phoneNumber.replace(/[^0-9]/g, '');
                      const cleanAlternativePhone = alternativePhone.replace(/[^0-9]/g, '');
                      console.log('🔢 纯数字号码:', cleanPhoneNumber);
                      console.log('🔢 备用纯数字号码:', cleanAlternativePhone);
                      
                      // 查找现有对话
                      console.log('🔎 查找现有对话...');
                      const threadsResponse = await api.getThreads();
                      console.log('📋 获取到对话列表:', threadsResponse);
                      
                      const threads = threadsResponse?.threads || [];
                      console.log('📊 对话数量:', threads.length);
                      console.log('📋 所有对话数据:', threads.map((t: any) => ({
                        id: t.id,
                        contactName: t.contact?.name,
                        contactPhone: t.contact?.phoneE164,
                      })));
                      
                      const existingThread = threads.find((t: any) => {
                        if (!t.contact) {
                          console.log('⚠️ 对话没有联系人:', t.id);
                          return false;
                        }
                        const contactPhone = t.contact.phoneE164 || t.contact.phone || '';
                        const contactName = t.contact.name || '';
                        const cleanContactPhone = contactPhone.replace(/[^0-9]/g, '');
                        const cleanContactName = contactName.replace(/[^0-9]/g, '');
                        
                        // 🔍 尝试多种匹配方式
                        const matchByPhone = cleanContactPhone === cleanPhoneNumber;
                        const matchByAlternative = cleanContactPhone === cleanAlternativePhone;
                        const matchByName = cleanContactName === cleanPhoneNumber;
                        const matchByNameAlternative = cleanContactName === cleanAlternativePhone;
                        
                        const isMatch = matchByPhone || matchByAlternative || matchByName || matchByNameAlternative;
                        
                        // 🔍 详细日志：显示每个对话的号码
                        console.log('🔍 检查对话:', {
                          threadId: t.id,
                          contactName,
                          contactPhone,  // 原始号码
                          cleanContactPhone,  // 清理后的号码
                          cleanContactName,  // 清理后的名称
                          cleanPhoneNumber,  // 主号码
                          cleanAlternativePhone,  // 备用号码
                          matchByPhone,
                          matchByAlternative,
                          matchByName,
                          matchByNameAlternative,
                          isMatch,  // 是否匹配
                        });
                        
                        if (isMatch) {
                          console.log('✅ 匹配成功！');
                        }
                        
                        return isMatch;
                      });
                      
                      if (existingThread) {
                        console.log('✅ 找到现有对话:', existingThread.id);
                        
                        // 🔐 通过后端 API 验证号码
                        console.log('🔐 正在验证号码...');
                        setShowGroupInfo(false);  // 提前关闭侧边栏
                        
                        try {
                          // 使用主号码验证
                          console.log('📞 准备验证号码:', phoneNumber);
                          const verifyResult = await api.contacts.verify(phoneNumber);
                          console.log('📊 验证结果:', verifyResult);
                          
                          if (!verifyResult.isValid) {
                            // 号码无效
                            const invalidMessage = `
⚠️ 号码验证失败

此号码不是有效的 WhatsApp 联系人：
📱 号码：${phoneNumber}

可能原因：
• 号码格式不正确
• 该号码未注册 WhatsApp
• 群组成员的号码信息不准确

建议：请确认该号码是否正确，或尝试通过其他方式联系。
                            `.trim();
                            
                            alert(invalidMessage);
                            return;
                          }
                          
                          // 号码有效，显示确认对话框
                          const contact = existingThread.contact;
                          const contactInfo = verifyResult.contactInfo;
                          
                          let verificationStatus = '';
                          if (verifyResult.existsInDb) {
                            verificationStatus = '✅ 数据库中的联系人';
                          } else if (verifyResult.existsInWhatsApp) {
                            verificationStatus = '✅ WhatsApp 验证通过';
                          }
                          
                          const verificationMessage = `
确认要打开与此联系人的对话吗？

📱 号码：${contactInfo?.phoneE164 || contact.phoneE164 || '未知'}
👤 名称：${contactInfo?.name || contact.name || '未设置'}
${verificationStatus}

⚠️ 请确认这是您要联系的人。
                          `.trim();
                          
                          if (confirm(verificationMessage)) {
                            console.log('✅ 用户确认，跳转到对话');
                            router.push(`/chat/${existingThread.id}`);
                          } else {
                            console.log('❌ 用户取消了跳转');
                          }
                        } catch (verifyError: any) {
                          console.error('❌ 验证失败:', verifyError);
                          
                          // 判断错误类型
                          if (verifyError.message?.includes('SERVICE_UNAVAILABLE')) {
                            alert('验证服务暂时不可用，请确保 WhatsApp 账号在线后重试');
                          } else if (verifyError.message?.includes('MISSING_ACCOUNT_ID')) {
                            alert('账号ID缺失，请刷新页面重试');
                          } else {
                            alert('验证号码时出错: ' + verifyError.message);
                          }
                        }
                      } else {
                        console.log('🆕 没有找到现有对话');
                        
                        // 显示详细信息
                        const infoMessage = `
未找到与此成员的对话。

群组成员信息：
📱 号码1：${phoneNumber}
📱 号码2：${alternativePhone}
👤 显示名称：${member.displayName || '未设置'}

💡 可能的原因：
1. 此成员的号码可能不准确
2. 您还未与此号码建立 WhatsApp 对话
3. 此号码可能不是有效的 WhatsApp 号码

建议：请先在 WhatsApp 应用中与该号码聊天，然后刷新联系人列表。
                        `.trim();
                        
                        alert(infoMessage);
                      }
                    } catch (error) {
                      console.error('❌ 跳转失败:', error);
                      alert('无法打开对话: ' + (error as Error).message);
                    }
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = WhatsAppColors.hover;
                    e.currentTarget.style.transform = 'scale(1.01)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  <div style={styles.infoMemberAvatar}>
                    {member.profilePicUrl ? (
                      <img
                        src={member.profilePicUrl}
                        alt={member.displayName || formatPhoneNumber(member.phoneE164)}
                        style={{
                          width: '100%',
                          height: '100%',
                          borderRadius: '50%',
                          objectFit: 'cover',
                          pointerEvents: 'none',  // 🖱️ 不阻止父元素的点击事件
                        }}
                        onError={(e) => {
                          // 头像加载失败，显示首字母
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.parentElement!.textContent = getInitials(member.displayName || member.phoneE164);
                        }}
                      />
                    ) : (
                      getInitials(member.displayName || member.phoneE164)
                    )}
                  </div>
                  <div style={styles.infoMemberInfo}>
                    <div style={styles.infoMemberName}>
                      {member.displayName || formatPhoneNumber(member.phoneE164) || '未知'}
                    </div>
                    <div style={styles.infoMemberPhone}>
                      {formatPhoneNumber(member.phoneE164)}
                    </div>
                  </div>
                  {(member.role === 'admin' || member.role === 'superadmin') && (
                    <div style={styles.infoMemberBadge}>管理员</div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* 媒体文件统计 */}
        <div style={styles.infoSection}>
          <div style={styles.infoSectionTitle}>
            <span>媒体、链接和文档</span>
            <span style={{ color: WhatsAppColors.textSecondary }}>➜</span>
          </div>
        </div>
      </div>
    </div>
  );

  // 包装后的主内容（包含聊天区域和群组信息侧边栏）
  const wrappedMainContent = (
    <div style={{ display: 'flex', height: '100%', width: '100%' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' as const }}>
        {mainContent}
      </div>
      {groupInfoSidebar}
    </div>
  );

  return (
    <>
      <WhatsAppLayout
        sidebar={<Sidebar />}
        listPanel={listPanel}
        mainContent={wrappedMainContent}
      />
      
      {/* 🖼️ 图片预览模态框 */}
      {previewImage && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'zoom-out',
          }}
          onClick={() => setPreviewImage(null)}
        >
          <div
            style={{
              position: 'relative',
              maxWidth: '95vw',
              maxHeight: '95vh',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={previewImage}
              alt="图片预览"
              style={{
                maxWidth: '100%',
                maxHeight: '95vh',
                objectFit: 'contain',
                borderRadius: '8px',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
              }}
            />
            
            {/* 关闭按钮 */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setPreviewImage(null);
              }}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                border: 'none',
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                color: '#000',
                fontSize: '24px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 1)';
                e.currentTarget.style.transform = 'scale(1.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
                e.currentTarget.style.transform = 'scale(1)';
              }}
              title="关闭预览 (ESC)"
            >
              ×
            </button>
            
            {/* 下载按钮 */}
            <a
              href={previewImage}
              download
              onClick={(e) => e.stopPropagation()}
              style={{
                position: 'absolute',
                bottom: '20px',
                right: '20px',
                padding: '12px 24px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: WhatsAppColors.accent,
                color: '#fff',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = WhatsAppColors.accentDark;
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = WhatsAppColors.accent;
                e.currentTarget.style.transform = 'translateY(0)';
              }}
              title="下载图片"
            >
              <span style={{ fontSize: '18px' }}>⬇️</span>
              <span>下载</span>
            </a>
          </div>
        </div>
      )}
    </>
  );
}
