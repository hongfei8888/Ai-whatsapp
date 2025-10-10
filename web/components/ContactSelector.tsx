'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { WhatsAppColors } from './layout/WhatsAppLayout';
import AvatarCircle from './AvatarCircle';
import { api } from '@/lib/api';

interface Contact {
  id: string;
  phoneE164: string;
  name: string | null;
  tags?: string[];
  avatarUrl?: string | null;
  lastContactAt?: string | null;
  messageCount?: number;
  createdAt?: string;
}

interface ContactSelectorProps {
  selectedContacts: string[];
  onSelectionChange: (contactIds: string[]) => void;
  multiple?: boolean;
  showStats?: boolean;
  enableVirtualScroll?: boolean;
}

type QuickFilterType = 'all' | 'recent' | 'active' | 'tagged' | 'untagged';

const styles = {
  container: {
    border: `1px solid ${WhatsAppColors.border}`,
    borderRadius: '8px',
    backgroundColor: WhatsAppColors.panelBackground,
    display: 'flex',
    flexDirection: 'column' as const,
  },
  searchBar: {
    padding: '12px',
    borderBottom: `1px solid ${WhatsAppColors.border}`,
  },
  searchInput: {
    width: '100%',
    padding: '10px 12px',
    backgroundColor: WhatsAppColors.inputBackground,
    border: `1px solid ${WhatsAppColors.border}`,
    borderRadius: '6px',
    color: WhatsAppColors.textPrimary,
    fontSize: '14px',
    outline: 'none',
  },
  quickFilters: {
    padding: '12px',
    borderBottom: `1px solid ${WhatsAppColors.border}`,
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap' as const,
  },
  quickFilterButton: {
    padding: '6px 12px',
    backgroundColor: WhatsAppColors.inputBackground,
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: WhatsAppColors.border,
    borderRadius: '16px',
    fontSize: '13px',
    color: WhatsAppColors.textSecondary,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  quickFilterActive: {
    backgroundColor: WhatsAppColors.accent,
    color: '#fff',
    borderColor: WhatsAppColors.accent,
  },
  tagFilters: {
    padding: '12px',
    borderBottom: `1px solid ${WhatsAppColors.border}`,
  },
  tagFiltersTitle: {
    fontSize: '12px',
    color: WhatsAppColors.textSecondary,
    marginBottom: '8px',
    fontWeight: '600' as const,
  },
  tagFilterButtons: {
    display: 'flex',
    gap: '6px',
    flexWrap: 'wrap' as const,
  },
  tagButton: {
    padding: '4px 10px',
    backgroundColor: WhatsAppColors.inputBackground,
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: WhatsAppColors.border,
    borderRadius: '12px',
    fontSize: '12px',
    color: WhatsAppColors.textPrimary,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  toolbar: {
    padding: '10px 12px',
    borderBottom: `1px solid ${WhatsAppColors.border}`,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: WhatsAppColors.chatBackground,
  },
  toolbarLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  toolbarText: {
    fontSize: '13px',
    color: WhatsAppColors.textSecondary,
  },
  toolbarCount: {
    fontWeight: '600' as const,
    color: WhatsAppColors.accent,
  },
  toolbarLinks: {
    display: 'flex',
    gap: '12px',
  },
  toolbarLink: {
    fontSize: '13px',
    color: WhatsAppColors.accent,
    cursor: 'pointer',
    textDecoration: 'none',
  },
  contactList: {
    flex: 1,
    overflowY: 'auto' as const,
    maxHeight: '400px',
  },
  contactItem: {
    display: 'flex',
    alignItems: 'center',
    padding: '12px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    borderBottom: `1px solid ${WhatsAppColors.border}`,
  },
  checkbox: {
    marginRight: '12px',
    cursor: 'pointer',
    width: '18px',
    height: '18px',
  },
  contactInfo: {
    flex: 1,
    marginLeft: '12px',
    minWidth: 0,
  },
  contactHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '4px',
  },
  contactName: {
    fontSize: '15px',
    color: WhatsAppColors.textPrimary,
    fontWeight: '500' as const,
  },
  contactTags: {
    display: 'flex',
    gap: '4px',
    flexWrap: 'wrap' as const,
  },
  tag: {
    padding: '2px 6px',
    backgroundColor: 'rgba(0, 168, 132, 0.15)',
    color: WhatsAppColors.accent,
    borderRadius: '8px',
    fontSize: '11px',
    fontWeight: '500' as const,
  },
  contactPhone: {
    fontSize: '13px',
    color: WhatsAppColors.textSecondary,
  },
  contactStats: {
    fontSize: '12px',
    color: WhatsAppColors.textSecondary,
    marginTop: '4px',
    display: 'flex',
    gap: '12px',
  },
  selectedChips: {
    padding: '12px',
    borderTop: `1px solid ${WhatsAppColors.border}`,
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '8px',
    maxHeight: '120px',
    overflowY: 'auto' as const,
  },
  chip: {
    padding: '6px 10px',
    backgroundColor: WhatsAppColors.accent,
    color: '#fff',
    borderRadius: '16px',
    fontSize: '13px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  chipRemove: {
    cursor: 'pointer',
    fontWeight: 'bold' as const,
    fontSize: '16px',
  },
  emptyState: {
    padding: '60px 20px',
    textAlign: 'center' as const,
    color: WhatsAppColors.textSecondary,
  },
  emptyIcon: {
    fontSize: '48px',
    marginBottom: '16px',
  },
  emptyText: {
    fontSize: '15px',
    marginBottom: '8px',
  },
  emptySubtext: {
    fontSize: '13px',
    color: WhatsAppColors.textSecondary,
  },
  loadingState: {
    padding: '40px 20px',
    textAlign: 'center' as const,
    color: WhatsAppColors.textSecondary,
  },
};

export default function ContactSelector({ 
  selectedContacts, 
  onSelectionChange,
  multiple = true,
  showStats = true,
  enableVirtualScroll = true,
}: ContactSelectorProps) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [quickFilter, setQuickFilter] = useState<QuickFilterType>('all');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  
  // 搜索防抖
  const [debouncedSearch, setDebouncedSearch] = useState('');
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    loadContacts();
  }, []);
  
  // 键盘快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+A / Cmd+A - 全选
      if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        e.preventDefault();
        handleSelectAll();
      }
      // Esc - 清空选择
      if (e.key === 'Escape') {
        handleClearAll();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [contacts]);

  const loadContacts = async () => {
    try {
      setLoading(true);
      const response = await api.getContacts();
      
      // 后端返回 { contacts: [...] } 格式
      const contactsData = response?.contacts || response;
      const contactList = Array.isArray(contactsData) ? contactsData : [];
      
      console.log('[ContactSelector] 加载联系人:', {
        原始响应: response,
        提取的联系人数组: contactsData,
        联系人数量: contactList.length
      });
      
      setContacts(contactList.map((c: any) => ({
        id: c.id,
        phoneE164: c.phoneE164,
        name: c.name,
        tags: c.tags || [],
        avatarUrl: c.avatarUrl,
        lastContactAt: c.lastContactAt,
        messageCount: c.messageCount,
        createdAt: c.createdAt,
      })));
    } catch (error) {
      console.error('加载联系人失败:', error);
      setContacts([]);
    } finally {
      setLoading(false);
    }
  };

  // 提取所有可用标签
  const availableTags = useMemo(() => {
    const tagSet = new Set<string>();
    contacts.forEach(contact => {
      contact.tags?.forEach(tag => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  }, [contacts]);

  // 高级筛选逻辑
  const filteredContacts = useMemo(() => {
    let filtered = [...contacts];
    
    // 快捷筛选
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    switch (quickFilter) {
      case 'recent':
        filtered = filtered.filter(c => 
          c.lastContactAt && new Date(c.lastContactAt) > sevenDaysAgo
        );
        break;
      case 'active':
        filtered = filtered.filter(c => 
          c.lastContactAt && new Date(c.lastContactAt) > thirtyDaysAgo
        );
        break;
      case 'tagged':
        filtered = filtered.filter(c => c.tags && c.tags.length > 0);
        break;
      case 'untagged':
        filtered = filtered.filter(c => !c.tags || c.tags.length === 0);
        break;
    }
    
    // 标签筛选
    if (selectedTags.length > 0) {
      filtered = filtered.filter(c => 
        selectedTags.some(tag => c.tags?.includes(tag))
      );
    }
    
    // 搜索筛选
    if (debouncedSearch) {
      const query = debouncedSearch.toLowerCase();
      filtered = filtered.filter(contact => {
        const matchName = contact.name?.toLowerCase().includes(query);
        const matchPhone = contact.phoneE164.includes(query);
        const matchTags = contact.tags?.some(tag => tag.toLowerCase().includes(query));
        return matchName || matchPhone || matchTags;
      });
    }
    
    return filtered;
  }, [contacts, quickFilter, selectedTags, debouncedSearch]);

  const handleToggleContact = useCallback((contactId: string) => {
    if (multiple) {
      if (selectedContacts.includes(contactId)) {
        onSelectionChange(selectedContacts.filter(id => id !== contactId));
      } else {
        onSelectionChange([...selectedContacts, contactId]);
      }
    } else {
      onSelectionChange([contactId]);
    }
  }, [multiple, selectedContacts, onSelectionChange]);

  const handleSelectAll = useCallback(() => {
    onSelectionChange(filteredContacts.map(c => c.id));
  }, [filteredContacts, onSelectionChange]);

  const handleClearAll = useCallback(() => {
    onSelectionChange([]);
  }, [onSelectionChange]);
  
  const handleInverseSelection = useCallback(() => {
    const currentIds = new Set(selectedContacts);
    const newSelection = filteredContacts
      .filter(c => !currentIds.has(c.id))
      .map(c => c.id);
    onSelectionChange(newSelection);
  }, [filteredContacts, selectedContacts, onSelectionChange]);

  const handleToggleTag = useCallback((tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  }, []);

  const getContactById = (id: string) => contacts.find(c => c.id === id);
  
  const formatLastContact = (date: string | null | undefined) => {
    if (!date) return null;
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return '今天';
    if (days === 1) return '昨天';
    if (days < 7) return `${days}天前`;
    if (days < 30) return `${Math.floor(days / 7)}周前`;
    return `${Math.floor(days / 30)}月前`;
  };

  // 渲染联系人列表
  const renderContactList = () => {
    if (loading) {
      return (
        <div style={styles.loadingState}>
          <div style={{fontSize: '24px', marginBottom: '12px'}}>⏳</div>
          <div>加载联系人中...</div>
        </div>
      );
    }
    
    if (filteredContacts.length === 0) {
      return (
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>
            {searchQuery || selectedTags.length > 0 ? '🔍' : '👥'}
          </div>
          <div style={styles.emptyText}>
            {searchQuery || selectedTags.length > 0 
              ? '未找到匹配的联系人' 
              : '暂无联系人'}
          </div>
          <div style={styles.emptySubtext}>
            {searchQuery || selectedTags.length > 0
              ? '尝试修改搜索条件或筛选器'
              : '请先添加联系人'}
          </div>
        </div>
      );
    }
    
    // 渲染联系人列表（优化版：使用普通滚动）
    return (
      <div style={styles.contactList}>
        {filteredContacts.map((contact, index) => (
          <div
            key={contact.id}
            style={styles.contactItem}
            onClick={() => handleToggleContact(contact.id)}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = WhatsAppColors.hover;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            {multiple && (
              <input
                type="checkbox"
                checked={selectedContacts.includes(contact.id)}
                onChange={() => {}}
                style={styles.checkbox}
              />
            )}
            <AvatarCircle
              name={contact.name}
              phone={contact.phoneE164}
              avatarUrl={contact.avatarUrl}
              size={40}
            />
            <div style={styles.contactInfo}>
              <div style={styles.contactHeader}>
                <div style={styles.contactName}>
                  {contact.name || contact.phoneE164}
                </div>
                {contact.tags && contact.tags.length > 0 && (
                  <div style={styles.contactTags}>
                    {contact.tags.slice(0, 3).map(tag => (
                      <span key={tag} style={styles.tag}>{tag}</span>
                    ))}
                    {contact.tags.length > 3 && (
                      <span style={styles.tag}>+{contact.tags.length - 3}</span>
                    )}
                  </div>
                )}
              </div>
              {contact.name && (
                <div style={styles.contactPhone}>{contact.phoneE164}</div>
              )}
              {showStats && (contact.lastContactAt || contact.messageCount) && (
                <div style={styles.contactStats}>
                  {contact.lastContactAt && (
                    <span>📅 {formatLastContact(contact.lastContactAt)}</span>
                  )}
                  {contact.messageCount && (
                    <span>💬 {contact.messageCount} 条消息</span>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div style={styles.container}>
      {/* 搜索栏 */}
      <div style={styles.searchBar}>
        <input
          type="text"
          placeholder="🔍 搜索联系人姓名、手机号或标签..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={styles.searchInput}
        />
      </div>

      {/* 快捷筛选 */}
      <div style={styles.quickFilters}>
        {[
          { key: 'all' as const, label: '全部', icon: '📋' },
          { key: 'recent' as const, label: '最近联系', icon: '⏰' },
          { key: 'active' as const, label: '活跃用户', icon: '🔥' },
          { key: 'tagged' as const, label: '已标记', icon: '🏷️' },
          { key: 'untagged' as const, label: '未标记', icon: '📝' },
        ].map(filter => (
          <button
            key={filter.key}
            style={{
              ...styles.quickFilterButton,
              ...(quickFilter === filter.key ? styles.quickFilterActive : {}),
            }}
            onClick={() => setQuickFilter(filter.key)}
          >
            {filter.icon} {filter.label}
          </button>
        ))}
      </div>

      {/* 标签筛选器 */}
      {availableTags.length > 0 && (
        <div style={styles.tagFilters}>
          <div style={styles.tagFiltersTitle}>按标签筛选</div>
          <div style={styles.tagFilterButtons}>
            {availableTags.map(tag => (
              <button
                key={tag}
                style={{
                  ...styles.tagButton,
                  ...(selectedTags.includes(tag) ? {
                    backgroundColor: WhatsAppColors.accent,
                    color: '#fff',
                    borderColor: WhatsAppColors.accent,
                  } : {}),
                }}
                onClick={() => handleToggleTag(tag)}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 工具栏 */}
      {multiple && (
        <div style={styles.toolbar}>
          <div style={styles.toolbarLeft}>
            <span style={styles.toolbarText}>
              已选 <span style={styles.toolbarCount}>{selectedContacts.length}</span> / {filteredContacts.length}
            </span>
            {selectedContacts.length > 0 && (
              <span style={{fontSize: '13px', color: WhatsAppColors.textSecondary}}>
                (预计 {Math.ceil(selectedContacts.length / 10)} 分钟)
              </span>
            )}
          </div>
          <div style={styles.toolbarLinks}>
            <a style={styles.toolbarLink} onClick={handleSelectAll}>
              全选
            </a>
            <a style={styles.toolbarLink} onClick={handleInverseSelection}>
              反选
            </a>
            <a style={styles.toolbarLink} onClick={handleClearAll}>
              清空
            </a>
          </div>
        </div>
      )}

      {/* 联系人列表 */}
      {renderContactList()}

      {/* 已选联系人芯片 */}
      {multiple && selectedContacts.length > 0 && (
        <div style={styles.selectedChips}>
          {selectedContacts.map(id => {
            const contact = getContactById(id);
            if (!contact) return null;
            return (
              <div key={id} style={styles.chip}>
                <span>{contact.name || contact.phoneE164}</span>
                <span 
                  style={styles.chipRemove}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleContact(id);
                  }}
                >
                  ×
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
