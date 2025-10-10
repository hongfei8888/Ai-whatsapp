'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import WhatsAppLayout, { WhatsAppColors } from '@/components/layout/WhatsAppLayout';
import Sidebar from '@/components/layout/Sidebar';
import { api } from '@/lib/api';

const styles = {
  listHeader: {
    backgroundColor: WhatsAppColors.panelBackground,
    padding: '10px 16px',
    minHeight: '60px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
    borderBottom: `1px solid ${WhatsAppColors.border}`,
  },
  headerTop: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    color: WhatsAppColors.textPrimary,
    fontSize: '20px',
    fontWeight: '600' as const,
  },
  headerActions: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
  },
  addButton: {
    padding: '6px 12px',
    backgroundColor: WhatsAppColors.accent,
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500' as const,
    transition: 'background-color 0.2s',
  },
  toolbarRow: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
  },
  select: {
    padding: '6px 10px',
    backgroundColor: WhatsAppColors.inputBackground,
    border: `1px solid ${WhatsAppColors.border}`,
    borderRadius: '6px',
    color: WhatsAppColors.textPrimary,
    fontSize: '13px',
    cursor: 'pointer',
    outline: 'none',
  },
  statsRow: {
    display: 'flex',
    gap: '12px',
    fontSize: '13px',
    color: WhatsAppColors.textSecondary,
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
  contactList: {
    overflowY: 'auto' as const,
    flex: 1,
  },
  contactItem: {
    padding: '12px 16px',
    borderBottom: `1px solid ${WhatsAppColors.border}`,
    cursor: 'pointer',
    display: 'flex',
    gap: '12px',
    transition: 'background-color 0.2s',
  },
  contactAvatar: {
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
    objectFit: 'cover' as const,
  },
  contactInfo: {
    flex: 1,
    minWidth: 0,
  },
  contactName: {
    color: WhatsAppColors.textPrimary,
    fontSize: '16px',
    fontWeight: '400' as const,
    marginBottom: '3px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },
  contactPhone: {
    color: WhatsAppColors.textSecondary,
    fontSize: '14px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },
  detailPanel: {
    display: 'flex',
    flexDirection: 'column' as const,
    height: '100%',
  },
  detailHeader: {
    backgroundColor: WhatsAppColors.panelBackground,
    padding: '20px',
    borderBottom: `1px solid ${WhatsAppColors.border}`,
  },
  detailAvatar: {
    width: '120px',
    height: '120px',
    borderRadius: '50%',
    backgroundColor: '#6b7c85',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    fontSize: '48px',
    fontWeight: '500' as const,
    margin: '0 auto 20px',
    objectFit: 'cover' as const,
  },
  detailName: {
    fontSize: '28px',
    fontWeight: '600' as const,
    color: WhatsAppColors.textPrimary,
    textAlign: 'center' as const,
    marginBottom: '8px',
    cursor: 'pointer',
    padding: '4px 8px',
    borderRadius: '4px',
    transition: 'background-color 0.2s',
  },
  detailPhone: {
    fontSize: '16px',
    color: WhatsAppColors.textSecondary,
    textAlign: 'center' as const,
  },
  detailBody: {
    flex: 1,
    overflowY: 'auto' as const,
    padding: '20px',
  },
  infoSection: {
    marginBottom: '30px',
  },
  sectionTitle: {
    fontSize: '14px',
    color: WhatsAppColors.textSecondary,
    marginBottom: '12px',
    fontWeight: '600' as const,
    textTransform: 'uppercase' as const,
  },
  infoItem: {
    backgroundColor: WhatsAppColors.panelBackground,
    borderRadius: '8px',
    padding: '12px 16px',
    marginBottom: '8px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: '14px',
    color: WhatsAppColors.textSecondary,
  },
  infoValue: {
    fontSize: '14px',
    color: WhatsAppColors.textPrimary,
    fontWeight: '500' as const,
  },
  actionButton: {
    width: '100%',
    padding: '12px',
    backgroundColor: WhatsAppColors.accent,
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '15px',
    fontWeight: '600' as const,
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    marginBottom: '8px',
  },
  deleteButton: {
    backgroundColor: WhatsAppColors.error,
  },
  // 弹窗样式
  modalOverlay: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  modal: {
    backgroundColor: WhatsAppColors.panelBackground,
    borderRadius: '12px',
    padding: '24px',
    width: '90%',
    maxWidth: '400px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
  },
  modalTitle: {
    fontSize: '20px',
    fontWeight: '600' as const,
    color: WhatsAppColors.textPrimary,
    marginBottom: '20px',
  },
  formGroup: {
    marginBottom: '16px',
  },
  label: {
    display: 'block',
    fontSize: '14px',
    color: WhatsAppColors.textSecondary,
    marginBottom: '6px',
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    backgroundColor: WhatsAppColors.inputBackground,
    border: `1px solid ${WhatsAppColors.border}`,
    borderRadius: '8px',
    color: WhatsAppColors.textPrimary,
    fontSize: '15px',
    outline: 'none',
    boxSizing: 'border-box' as const,
  },
  modalActions: {
    display: 'flex',
    gap: '10px',
    marginTop: '20px',
  },
  modalButton: {
    flex: 1,
    padding: '10px',
    border: 'none',
    borderRadius: '8px',
    fontSize: '15px',
    fontWeight: '600' as const,
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  cancelButton: {
    backgroundColor: WhatsAppColors.inputBackground,
    color: WhatsAppColors.textPrimary,
  },
  confirmButton: {
    backgroundColor: WhatsAppColors.accent,
    color: '#fff',
  },
};

export default function ContactsPage() {
  const router = useRouter();
  const [contacts, setContacts] = useState<any[]>([]);
  const [threads, setThreads] = useState<any[]>([]);
  const [selectedContact, setSelectedContact] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'time'>('name');
  const [filterBy, setFilterBy] = useState<'all' | 'withChat' | 'withoutChat'>('all');
  
  // 弹窗状态
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [formData, setFormData] = useState({ phoneE164: '', name: '' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [contactsData, threadsData] = await Promise.all([
        api.getContacts(),
        api.getThreads()
      ]);
      setContacts(contactsData.contacts || []);
      setThreads(threadsData.threads || []);
    } catch (error) {
      console.error('加载数据失败:', error);
      setContacts([]);
      setThreads([]);
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name?.charAt(0)?.toUpperCase() || '?';
  };

  // 联系人增强：添加是否有对话的标记
  const enhancedContacts = contacts.map(contact => ({
    ...contact,
    hasThread: threads.some(t => t.contactId === contact.id),
    thread: threads.find(t => t.contactId === contact.id),
  }));

  // 筛选和排序
  const filteredContacts = enhancedContacts
    .filter(contact => {
      // 搜索过滤
      const name = contact.name || contact.phoneE164 || '';
      if (!name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      // 类型过滤
      if (filterBy === 'withChat') return contact.hasThread;
      if (filterBy === 'withoutChat') return !contact.hasThread;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'name') {
        return (a.name || a.phoneE164).localeCompare(b.name || b.phoneE164);
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  // 统计数据
  const stats = {
    total: contacts.length,
    withChat: enhancedContacts.filter(c => c.hasThread).length,
    withoutChat: enhancedContacts.filter(c => !c.hasThread).length,
  };

  const handleChatWith = async (contact: any) => {
    try {
      if (contact.thread) {
        // 已有对话，直接跳转
        router.push(`/chat/${contact.thread.id}`);
      } else {
        // 没有对话，先创建线程
        const result = await api.getOrCreateThread(contact.id);
        router.push(`/chat/${result.thread.id}`);
      }
    } catch (error) {
      console.error('跳转失败:', error);
      alert('无法打开对话，请重试');
    }
  };

  const handleAddContact = async () => {
    if (!formData.phoneE164) {
      alert('请输入手机号');
      return;
    }

    try {
      await api.createContact({
        phoneE164: formData.phoneE164,
        name: formData.name || undefined,
      });
      await loadData();
      setShowAddDialog(false);
      setFormData({ phoneE164: '', name: '' });
      alert('添加成功');
    } catch (error) {
      alert('添加失败：' + (error instanceof Error ? error.message : '未知错误'));
    }
  };

  const handleEditName = async () => {
    if (!selectedContact) return;

    try {
      await api.updateContact(selectedContact.id, {
        name: formData.name,
      });
      await loadData();
      // 更新选中的联系人
      setSelectedContact({ ...selectedContact, name: formData.name });
      setShowEditDialog(false);
      setFormData({ phoneE164: '', name: '' });
    } catch (error) {
      alert('更新失败：' + (error instanceof Error ? error.message : '未知错误'));
    }
  };

  const handleDeleteContact = async () => {
    if (!selectedContact) return;
    
    if (!confirm(`确定要删除联系人 "${selectedContact.name || selectedContact.phoneE164}" 吗？\n\n删除后将无法恢复！`)) {
      return;
    }

    try {
      await api.deleteContact(selectedContact.id);
      await loadData();
      setSelectedContact(null);
      alert('删除成功');
    } catch (error) {
      alert('删除失败：' + (error instanceof Error ? error.message : '未知错误'));
    }
  };

  // 列表面板
  const listPanel = (
    <>
      <div style={styles.listHeader}>
        {/* 顶部栏：标题和添加按钮 */}
        <div style={styles.headerTop}>
          <div style={styles.headerTitle}>联系人</div>
          <div style={styles.headerActions}>
            <button
              style={styles.addButton}
              onClick={() => setShowAddDialog(true)}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = WhatsAppColors.accentHover;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = WhatsAppColors.accent;
              }}
            >
              ➕ 添加
            </button>
          </div>
        </div>

        {/* 工具栏：排序和筛选 */}
        <div style={styles.toolbarRow}>
          <select
            style={styles.select}
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'name' | 'time')}
          >
            <option value="name">按名称排序</option>
            <option value="time">按时间排序</option>
          </select>
          
          <select
            style={styles.select}
            value={filterBy}
            onChange={(e) => setFilterBy(e.target.value as any)}
          >
            <option value="all">全部</option>
            <option value="withChat">有对话</option>
            <option value="withoutChat">无对话</option>
          </select>
        </div>

        {/* 统计信息 */}
        <div style={styles.statsRow}>
          <span>总计: {stats.total}</span>
          <span>•</span>
          <span>有对话: {stats.withChat}</span>
          <span>•</span>
          <span>无对话: {stats.withoutChat}</span>
        </div>
      </div>

      <div style={styles.searchBar}>
        <div style={{ position: 'relative' }}>
          <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: WhatsAppColors.textSecondary }}>🔍</span>
          <input
            type="text"
            placeholder="搜索联系人"
            style={styles.searchInput}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div style={styles.contactList}>
        {loading ? (
          <div style={{ padding: '20px', textAlign: 'center', color: WhatsAppColors.textSecondary }}>
            加载中...
          </div>
        ) : filteredContacts.length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: WhatsAppColors.textSecondary }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📇</div>
            <div style={{ fontSize: '16px', marginBottom: '8px', color: WhatsAppColors.textPrimary }}>
              {searchQuery ? '未找到匹配的联系人' : '暂无联系人'}
            </div>
            <div style={{ fontSize: '14px' }}>
              {!searchQuery && '点击右上角"添加"按钮添加新联系人'}
            </div>
          </div>
        ) : (
          filteredContacts.map((contact) => (
            <div
              key={contact.id}
              style={styles.contactItem}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = WhatsAppColors.hover;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
              onClick={() => setSelectedContact(contact)}
            >
              {/* 头像 - 优先显示真实头像 */}
              {contact.avatarUrl ? (
                <img 
                  src={contact.avatarUrl} 
                  alt={contact.name || contact.phoneE164}
                  style={styles.contactAvatar}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    const nextDiv = e.currentTarget.nextElementSibling as HTMLElement;
                    if (nextDiv) nextDiv.style.display = 'flex';
                  }}
                />
              ) : null}
              <div 
                style={{
                  ...styles.contactAvatar,
                  display: contact.avatarUrl ? 'none' : 'flex'
                }}
              >
                {getInitials(contact.name || contact.phoneE164)}
              </div>
              
              <div style={styles.contactInfo}>
                <div style={styles.contactName}>
                  {contact.name || '未命名'}
                  {contact.hasThread && <span style={{ marginLeft: '6px', color: WhatsAppColors.accent }}>💬</span>}
                </div>
                <div style={styles.contactPhone}>
                  {contact.phoneE164}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );

  // 详情面板
  const mainContent = selectedContact ? (
    <div style={styles.detailPanel}>
      <div style={styles.detailHeader}>
        {/* 大头像 */}
        {selectedContact.avatarUrl ? (
          <img 
            src={selectedContact.avatarUrl} 
            alt={selectedContact.name || selectedContact.phoneE164}
            style={styles.detailAvatar}
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              const nextDiv = e.currentTarget.nextElementSibling as HTMLElement;
              if (nextDiv) nextDiv.style.display = 'flex';
            }}
          />
        ) : null}
        <div 
          style={{
            ...styles.detailAvatar,
            display: selectedContact.avatarUrl ? 'none' : 'flex'
          }}
        >
          {getInitials(selectedContact.name || selectedContact.phoneE164)}
        </div>

        {/* 名称（可点击编辑） */}
        <div 
          style={styles.detailName}
          onClick={() => {
            setFormData({ phoneE164: selectedContact.phoneE164, name: selectedContact.name || '' });
            setShowEditDialog(true);
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = WhatsAppColors.hover;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
          title="点击编辑名称"
        >
          {selectedContact.name || '未命名'} ✏️
        </div>
        <div style={styles.detailPhone}>
          {selectedContact.phoneE164}
        </div>
      </div>

      <div style={styles.detailBody}>
        {/* 操作按钮 */}
        <div style={styles.infoSection}>
          <button
            style={styles.actionButton}
            onClick={() => handleChatWith(selectedContact)}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = WhatsAppColors.accentHover;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = WhatsAppColors.accent;
            }}
          >
            💬 {selectedContact.hasThread ? '打开对话' : '发送消息'}
          </button>
          
          <button
            style={{...styles.actionButton, ...styles.deleteButton}}
            onClick={handleDeleteContact}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '0.9';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '1';
            }}
          >
            🗑️ 删除联系人
          </button>
        </div>

        {/* 联系信息 */}
        <div style={styles.infoSection}>
          <div style={styles.sectionTitle}>联系信息</div>
          <div style={styles.infoItem}>
            <span style={styles.infoLabel}>手机号</span>
            <span style={styles.infoValue}>{selectedContact.phoneE164}</span>
          </div>
          {selectedContact.name && (
            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>名称</span>
              <span style={styles.infoValue}>{selectedContact.name}</span>
            </div>
          )}
          <div style={styles.infoItem}>
            <span style={styles.infoLabel}>对话状态</span>
            <span style={styles.infoValue}>
              {selectedContact.hasThread ? '✅ 有对话' : '⭕ 无对话'}
            </span>
          </div>
        </div>

        {/* 时间信息 */}
        <div style={styles.infoSection}>
          <div style={styles.sectionTitle}>时间信息</div>
          <div style={styles.infoItem}>
            <span style={styles.infoLabel}>添加时间</span>
            <span style={styles.infoValue}>
              {new Date(selectedContact.createdAt).toLocaleString('zh-CN')}
            </span>
          </div>
          <div style={styles.infoItem}>
            <span style={styles.infoLabel}>更新时间</span>
            <span style={styles.infoValue}>
              {new Date(selectedContact.updatedAt).toLocaleString('zh-CN')}
            </span>
          </div>
        </div>
      </div>
    </div>
  ) : (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      height: '100%',
      flexDirection: 'column',
      color: WhatsAppColors.textSecondary,
      gap: '16px'
    }}>
      <div style={{ fontSize: '64px' }}>👤</div>
      <div style={{ fontSize: '18px' }}>选择一个联系人查看详情</div>
    </div>
  );

  return (
    <>
      <WhatsAppLayout
        sidebar={<Sidebar />}
        listPanel={listPanel}
        mainContent={mainContent}
      />

      {/* 添加联系人弹窗 */}
      {showAddDialog && (
        <div style={styles.modalOverlay} onClick={() => setShowAddDialog(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalTitle}>添加联系人</div>
            
            <div style={styles.formGroup}>
              <label style={styles.label}>手机号 *</label>
              <input
                type="text"
                style={styles.input}
                placeholder="+8613800138000"
                value={formData.phoneE164}
                onChange={(e) => setFormData({...formData, phoneE164: e.target.value})}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>名称（可选）</label>
              <input
                type="text"
                style={styles.input}
                placeholder="张三"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>

            <div style={styles.modalActions}>
              <button
                style={{...styles.modalButton, ...styles.cancelButton}}
                onClick={() => {
                  setShowAddDialog(false);
                  setFormData({ phoneE164: '', name: '' });
                }}
              >
                取消
              </button>
              <button
                style={{...styles.modalButton, ...styles.confirmButton}}
                onClick={handleAddContact}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = WhatsAppColors.accentHover;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = WhatsAppColors.accent;
                }}
              >
                添加
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 编辑名称弹窗 */}
      {showEditDialog && (
        <div style={styles.modalOverlay} onClick={() => setShowEditDialog(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalTitle}>编辑联系人名称</div>
            
            <div style={styles.formGroup}>
              <label style={styles.label}>名称</label>
              <input
                type="text"
                style={styles.input}
                placeholder="输入名称"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                autoFocus
              />
            </div>

            <div style={styles.modalActions}>
              <button
                style={{...styles.modalButton, ...styles.cancelButton}}
                onClick={() => {
                  setShowEditDialog(false);
                  setFormData({ phoneE164: '', name: '' });
                }}
              >
                取消
              </button>
              <button
                style={{...styles.modalButton, ...styles.confirmButton}}
                onClick={handleEditName}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = WhatsAppColors.accentHover;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = WhatsAppColors.accent;
                }}
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
