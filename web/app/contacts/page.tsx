'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

// 类型定义
interface ButtonProps {
  kind?: 'primary' | 'secondary' | 'ghost';
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  style?: React.CSSProperties;
  'aria-label'?: string;
}

interface Group {
  id: string;
  name: string;
  color: string;
  contactCount: number;
}

interface GroupManagerProps {
  groups: Group[];
  selectedGroup: string | null;
  onGroupSelect: (groupId: string | null) => void;
  onGroupCreate: (name: string, color: string) => void;
  onGroupEdit: (id: string, name: string, color: string) => void;
  onGroupDelete: (id: string) => void;
}

interface CardProps {
  children: React.ReactNode;
}

interface TagProps {
  text: string;
  tone?: 'success' | 'warn' | 'error' | 'info';
}

interface StatProps {
  label: string;
  value: string | number;
  hint: string;
  color: string;
}

interface ContactRowProps {
  contact: string;
  phone: string;
  cooldown: React.ReactNode;
  createdAt: string;
  source?: string;
  tags?: string[];
  onCopy: (phone: string) => void;
  onOutreach: (contact: string) => void;
  onDelete: (contact: string) => void;
  onSelect: (selected: boolean) => void;
  isSelected: boolean;
  showCheckbox: boolean;
}

// 内联样式组件
const Button = ({ kind = 'secondary', children, onClick, disabled, style, ...props }: ButtonProps) => {
  const baseStyle: React.CSSProperties = {
    padding: '8px 16px',
    borderRadius: '8px',
    border: '1px solid #E5E7EB',
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'all 0.2s',
    opacity: disabled ? 0.6 : 1,
    ...style,
  };

  const kindStyles = {
    primary: {
      backgroundColor: '#4F46E5',
      color: 'white',
      borderColor: '#4F46E5',
    },
    secondary: {
      backgroundColor: 'white',
      color: '#374151',
      borderColor: '#E5E7EB',
    },
    ghost: {
      backgroundColor: 'transparent',
      color: '#6B7280',
      borderColor: 'transparent',
    },
  };

  const currentStyle = { ...baseStyle, ...kindStyles[kind] };

  return (
    <button
      style={currentStyle}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

const Card = ({ children }: CardProps) => (
  <div
    style={{
      backgroundColor: 'white',
      borderRadius: '12px',
      padding: '20px',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      border: '1px solid #E5E7EB',
    }}
  >
    {children}
  </div>
);

const Tag = ({ text, tone = 'info' }: TagProps) => {
  const toneStyles = {
    success: { backgroundColor: '#D1FAE5', color: '#065F46', borderColor: '#10B981' },
    warn: { backgroundColor: '#FEF3C7', color: '#92400E', borderColor: '#F59E0B' },
    error: { backgroundColor: '#FEE2E2', color: '#991B1B', borderColor: '#EF4444' },
    info: { backgroundColor: '#DBEAFE', color: '#1E40AF', borderColor: '#3B82F6' },
  };

  return (
    <span
      style={{
        display: 'inline-block',
        padding: '4px 8px',
        borderRadius: '6px',
        fontSize: '12px',
        fontWeight: '500',
        border: '1px solid',
        ...toneStyles[tone],
      }}
    >
      {text}
    </span>
  );
};

// 分组管理组件
const GroupManager = ({ groups, selectedGroup, onGroupSelect, onGroupCreate, onGroupEdit, onGroupDelete }: GroupManagerProps) => {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState<{ id: string; name: string; color: string } | null>(null);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupColor, setNewGroupColor] = useState('#4F46E5');

  const groupColors = [
    '#4F46E5', '#059669', '#DC2626', '#D97706', '#7C3AED',
    '#DB2777', '#0891B2', '#CA8A04', '#16A34A', '#EA580C'
  ];

  const handleCreateGroup = () => {
    if (newGroupName.trim()) {
      onGroupCreate(newGroupName.trim(), newGroupColor);
      setNewGroupName('');
      setNewGroupColor('#4F46E5');
      setShowCreateDialog(false);
    }
  };

  const handleEditGroup = () => {
    if (showEditDialog && showEditDialog.name.trim()) {
      onGroupEdit(showEditDialog.id, showEditDialog.name.trim(), showEditDialog.color);
      setShowEditDialog(null);
    }
  };

  return (
    <Card>
      <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#111827' }}>分组管理</h3>
        <Button kind="primary" onClick={() => setShowCreateDialog(true)}>
          + 新建分组
        </Button>
      </div>

      {/* 分组列表 */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
        <Button
          kind={selectedGroup === null ? 'primary' : 'ghost'}
          onClick={() => onGroupSelect(null)}
          style={{ fontSize: '12px', padding: '6px 12px' }}
        >
          全部联系人 ({groups.reduce((sum, group) => sum + group.contactCount, 0)})
        </Button>
        {groups.map(group => (
          <div key={group.id} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Button
              kind={selectedGroup === group.id ? 'primary' : 'ghost'}
              onClick={() => onGroupSelect(group.id)}
              style={{ 
                fontSize: '12px', 
                padding: '6px 12px',
                backgroundColor: selectedGroup === group.id ? group.color : 'transparent',
                borderColor: group.color,
                color: selectedGroup === group.id ? 'white' : group.color
              }}
            >
              <span style={{ 
                display: 'inline-block', 
                width: '8px', 
                height: '8px', 
                borderRadius: '50%', 
                backgroundColor: group.color,
                marginRight: '6px'
              }} />
              {group.name} ({group.contactCount})
            </Button>
            <button
              onClick={() => setShowEditDialog({ id: group.id, name: group.name, color: group.color })}
              style={{
                padding: '4px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#6B7280',
                fontSize: '12px'
              }}
              title="编辑分组"
            >
              ✏️
            </button>
            <button
              onClick={() => onGroupDelete(group.id)}
              style={{
                padding: '4px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#DC2626',
                fontSize: '12px'
              }}
              title="删除分组"
            >
              🗑️
            </button>
          </div>
        ))}
      </div>

      {/* 创建分组对话框 */}
      {showCreateDialog && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '24px',
            width: '400px',
            maxWidth: '90vw'
          }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '600' }}>创建新分组</h3>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                分组名称
              </label>
              <input
                type="text"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="请输入分组名称"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid #E5E7EB',
                  fontSize: '14px',
                  outline: 'none'
                }}
              />
            </div>
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                分组颜色
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {groupColors.map(color => (
                  <button
                    key={color}
                    onClick={() => setNewGroupColor(color)}
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      backgroundColor: color,
                      border: newGroupColor === color ? '3px solid #111827' : '2px solid #E5E7EB',
                      cursor: 'pointer'
                    }}
                  />
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <Button kind="ghost" onClick={() => setShowCreateDialog(false)}>
                取消
              </Button>
              <Button kind="primary" onClick={handleCreateGroup}>
                创建
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 编辑分组对话框 */}
      {showEditDialog && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '24px',
            width: '400px',
            maxWidth: '90vw'
          }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '600' }}>编辑分组</h3>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                分组名称
              </label>
              <input
                type="text"
                value={showEditDialog.name}
                onChange={(e) => setShowEditDialog({ ...showEditDialog, name: e.target.value })}
                placeholder="请输入分组名称"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid #E5E7EB',
                  fontSize: '14px',
                  outline: 'none'
                }}
              />
            </div>
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                分组颜色
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {groupColors.map(color => (
                  <button
                    key={color}
                    onClick={() => setShowEditDialog({ ...showEditDialog, color })}
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      backgroundColor: color,
                      border: showEditDialog.color === color ? '3px solid #111827' : '2px solid #E5E7EB',
                      cursor: 'pointer'
                    }}
                  />
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <Button kind="ghost" onClick={() => setShowEditDialog(null)}>
                取消
              </Button>
              <Button kind="primary" onClick={handleEditGroup}>
                保存
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

const Stat = ({ label, value, hint, color }: StatProps) => (
  <div style={{ textAlign: 'center' }}>
    <div
      style={{
        fontSize: '32px',
        fontWeight: '700',
        color: color,
        marginBottom: '4px',
      }}
    >
      {value}
    </div>
    <div
      style={{
        fontSize: '14px',
        fontWeight: '600',
        color: '#111827',
        marginBottom: '2px',
      }}
    >
      {label}
    </div>
    <div
      style={{
        fontSize: '12px',
        color: '#6B7280',
      }}
    >
      {hint}
    </div>
  </div>
);

const ContactRow = ({ 
  contact, 
  phone, 
  cooldown, 
  createdAt, 
  source, 
  tags, 
  onCopy, 
  onOutreach, 
  onDelete, 
  onSelect, 
  isSelected, 
  showCheckbox 
}: ContactRowProps) => (
  <div
    style={{
      display: 'grid',
      gridTemplateColumns: showCheckbox ? 'auto 1fr auto' : '1fr auto',
      gap: '16px',
      padding: '16px',
      border: '1px solid #E5E7EB',
      borderRadius: '12px',
      backgroundColor: 'white',
      transition: 'all 0.2s',
      cursor: 'pointer',
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.backgroundColor = '#F8FAFF';
      e.currentTarget.style.borderColor = '#4F46E5';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.backgroundColor = 'white';
      e.currentTarget.style.borderColor = '#E5E7EB';
    }}
  >
    {showCheckbox && (
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => onSelect(e.target.checked)}
          style={{
            width: '16px',
            height: '16px',
            accentColor: '#4F46E5',
          }}
        />
      </div>
    )}
    <div style={{ flex: 1 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '8px',
        }}
      >
        <div
          style={{
            fontSize: '16px',
            fontWeight: '600',
            color: '#111827',
          }}
        >
          {contact}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              fontSize: '14px',
              color: '#6B7280',
            }}
          >
            {phone}
          </span>
          <button
            onClick={() => onCopy(phone)}
            style={{
              padding: '4px',
              border: 'none',
              backgroundColor: 'transparent',
              cursor: 'pointer',
              borderRadius: '4px',
            }}
            aria-label="复制电话号码"
          >
            📋
          </button>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          {source && (
            <span
              style={{
                fontSize: '12px',
                color: '#6B7280',
                backgroundColor: '#F3F4F6',
                padding: '2px 6px',
                borderRadius: '4px',
              }}
            >
              {source}
            </span>
          )}
          {tags && tags.length > 0 && (
            <span
              style={{
                fontSize: '12px',
                color: '#6B7280',
                backgroundColor: '#EEF2FF',
                padding: '2px 6px',
                borderRadius: '4px',
              }}
            >
              {tags.join(', ')}
            </span>
          )}
        </div>
      </div>
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <div>{cooldown}</div>
      <Button
        kind="primary"
        onClick={() => onOutreach(contact)}
        style={{ fontSize: '12px', padding: '6px 12px' }}
      >
        联系
      </Button>
      <Button
        kind="ghost" 
        onClick={() => onDelete(contact)}
        style={{ fontSize: '12px', padding: '6px 12px', color: '#DC2626' }}
      >
        删除
      </Button>
    </div>
  </div>
);

const LoadingSpinner = () => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px',
      color: '#6B7280',
    }}
  >
    <div
      style={{
        width: '32px',
        height: '32px',
        border: '3px solid #E5E7EB',
        borderTop: '3px solid #4F46E5',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
        marginBottom: '16px',
      }}
    />
    <p style={{ color: '#6B7280', fontSize: '14px' }}>加载中...</p>
  </div>
);

export default function ContactsInline() {
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set());
  const [showBatchActions, setShowBatchActions] = useState(false);
  
  // 分组相关状态
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [showBatchGroupDialog, setShowBatchGroupDialog] = useState(false);

  useEffect(() => {
    const fetchContacts = async () => {
      try {
        setLoading(true);
        const result = await api.getContacts();
        setContacts(result.contacts);
      } catch (error) {
        console.error('获取联系人失败:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchContacts();
  }, []);

  // 当联系人数据变化时，更新分组统计
  useEffect(() => {
    updateGroupStats();
  }, [contacts]);

  const handleSearch = (term: string) => {
    setSearchTerm(term);
  };

  const handleSelectContact = (contactId: string, selected: boolean) => {
    const newSelected = new Set(selectedContacts);
    if (selected) {
      newSelected.add(contactId);
    } else {
      newSelected.delete(contactId);
    }
    setSelectedContacts(newSelected);
    setShowBatchActions(newSelected.size > 0);
  };

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      const allIds = filteredContacts.map(c => c.id);
      setSelectedContacts(new Set(allIds));
      setShowBatchActions(allIds.length > 0);
    } else {
      setSelectedContacts(new Set());
      setShowBatchActions(false);
    }
  };

  const handleDeleteContact = async (contactName: string) => {
    if (!confirm(`确定要删除联系人 "${contactName}" 吗？`)) {
      return;
    }

    try {
      // 找到要删除的联系人
      const contactToDelete = contacts.find(c => c.name === contactName || c.phoneE164 === contactName);
      if (!contactToDelete) {
        alert('未找到要删除的联系人');
        return;
      }

      console.log('尝试删除联系人:', contactToDelete.id);
      await api.deleteContact(contactToDelete.id);
      console.log('删除联系人成功');
      
      // 更新本地状态
      setContacts(contacts.filter(c => c.id !== contactToDelete.id));
      setSelectedContacts(prev => {
        const newSet = new Set(prev);
        newSet.delete(contactToDelete.id);
        return newSet;
      });
      
      alert('联系人删除成功');
    } catch (error) {
      console.error('删除联系人失败:', error);
      console.error('错误详情:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      alert(`删除失败: ${error instanceof Error ? error.message : '未知错误'}，请重试`);
    }
  };

  const handleBatchDelete = async () => {
    if (!confirm(`确定要删除选中的 ${selectedContacts.size} 个联系人吗？`)) {
      return;
    }

    try {
      const deletePromises = Array.from(selectedContacts).map(contactId => 
        api.deleteContact(contactId)
      );
      
      await Promise.all(deletePromises);
      
      // 更新本地状态
      setContacts(contacts.filter(c => !selectedContacts.has(c.id)));
      setSelectedContacts(new Set());
      setShowBatchActions(false);
      
      alert(`成功删除 ${selectedContacts.size} 个联系人`);
    } catch (error) {
      console.error('批量删除失败:', error);
      alert('批量删除失败，请重试');
    }
  };

  const handleCopy = (phone: string) => {
    navigator.clipboard.writeText(phone);
    alert(`已复制: ${phone}`);
  };

  const handleOutreach = (contact: string) => {
    alert(`开始联系: ${contact}`);
  };

  const handleRefresh = async () => {
    try {
      setLoading(true);
      const result = await api.getContacts();
      setContacts(result.contacts);
    } catch (error) {
      console.error('刷新失败:', error);
      alert('刷新失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleSyncWhatsAppContacts = async () => {
    try {
      setLoading(true);
      const result = await api.syncWhatsAppContacts();
      alert(`同步完成！\n新增: ${result.result.added} 个联系人\n更新: ${result.result.updated} 个联系人\n总计: ${result.result.total} 个联系人`);
      await handleRefresh();
    } catch (error) {
      console.error('同步WhatsApp联系人失败:', error);
      alert('同步失败，请确保WhatsApp已连接');
    } finally {
      setLoading(false);
    }
  };

  const handleAddContact = () => {
    alert('添加联系人功能待实现');
  };

  // 分组相关处理函数
  const handleGroupCreate = async (name: string, color: string) => {
    try {
      // 创建新分组（暂时使用本地状态，后续可对接后端API）
      const newGroup: Group = {
        id: `group_${Date.now()}`,
        name,
        color,
        contactCount: 0
      };
      setGroups(prev => [...prev, newGroup]);
      alert(`分组 "${name}" 创建成功！`);
    } catch (error) {
      console.error('创建分组失败:', error);
      alert('创建分组失败，请重试');
    }
  };

  const handleGroupEdit = async (id: string, name: string, color: string) => {
    try {
      // 更新分组信息
      setGroups(prev => prev.map(group => 
        group.id === id ? { ...group, name, color } : group
      ));
      alert(`分组 "${name}" 更新成功！`);
    } catch (error) {
      console.error('更新分组失败:', error);
      alert('更新分组失败，请重试');
    }
  };

  const handleGroupDelete = async (id: string) => {
    const group = groups.find(g => g.id === id);
    if (!group) return;
    
    if (confirm(`确定要删除分组 "${group.name}" 吗？删除后该分组下的联系人将移动到"未分组"状态。`)) {
      try {
        // 删除分组
        setGroups(prev => prev.filter(g => g.id !== id));
        
        // 如果当前选中的是被删除的分组，则取消选择
        if (selectedGroup === id) {
          setSelectedGroup(null);
        }
        
        alert(`分组 "${group.name}" 删除成功！`);
      } catch (error) {
        console.error('删除分组失败:', error);
        alert('删除分组失败，请重试');
      }
    }
  };

  const handleGroupSelect = (groupId: string | null) => {
    setSelectedGroup(groupId);
    // 清空选择状态
    setSelectedContacts(new Set());
    setShowBatchActions(false);
  };

  const handleBatchGroup = async (groupId: string | null) => {
    try {
      if (selectedContacts.size === 0) {
        alert('请先选择要分组的联系人');
        return;
      }

      const selectedGroupData = groups.find(g => g.id === groupId);
      const groupName = selectedGroupData ? selectedGroupData.name : null;

      // 更新选中联系人的分组标签
      const updatedContacts = contacts.map(contact => {
        if (selectedContacts.has(contact.id)) {
          const currentTags = contact.tags || [];
          // 移除其他分组的标签
          const otherGroupTags = groups.map(g => g.name);
          const filteredTags = currentTags.filter((tag: string) => !otherGroupTags.includes(tag));
          
          // 添加新分组的标签（如果有的话）
          const newTags = groupName ? [...filteredTags, groupName] : filteredTags;
          
          return { ...contact, tags: newTags };
        }
        return contact;
      });

      setContacts(updatedContacts);
      setSelectedContacts(new Set());
      setShowBatchActions(false);
      setShowBatchGroupDialog(false);
      
      const message = groupName ? `已将 ${selectedContacts.size} 个联系人移动到分组 "${groupName}"` : `已移除 ${selectedContacts.size} 个联系人的分组`;
      alert(message);
    } catch (error) {
      console.error('批量分组失败:', error);
      alert('批量分组失败，请重试');
    }
  };

  // 根据分组过滤联系人
  const getGroupFilteredContacts = (contacts: any[]) => {
    if (!selectedGroup) return contacts;
    
    const selectedGroupData = groups.find(g => g.id === selectedGroup);
    if (!selectedGroupData) return contacts;
    
    return contacts.filter(contact => {
      const tags = contact.tags || [];
      return tags.includes(selectedGroupData.name);
    });
  };

  // 更新分组统计
  const updateGroupStats = () => {
    setGroups(prev => prev.map(group => {
      const count = contacts.filter(contact => {
        const tags = contact.tags || [];
        return tags.includes(group.name);
      }).length;
      return { ...group, contactCount: count };
    }));
  };

  // 过滤联系人 - 先按分组过滤，再按搜索词过滤
  const groupFilteredContacts = getGroupFilteredContacts(contacts);
  const filteredContacts = groupFilteredContacts.filter(contact => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (contact.name && contact.name.toLowerCase().includes(term)) ||
      (contact.phoneE164 && contact.phoneE164.includes(term)) ||
      (contact.source && contact.source.toLowerCase().includes(term)) ||
      (contact.tags && contact.tags.some((tag: string) => tag.toLowerCase().includes(term)))
    );
  });

  // 计算统计数据
  const totalContacts = contacts.length;
  const recentContacts = contacts.filter(c => {
    const createdAt = new Date(c.createdAt);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return createdAt > thirtyDaysAgo;
  }).length;
  const cooldownContacts = contacts.filter(c => c.cooldownRemainingSeconds && c.cooldownRemainingSeconds > 0).length;
  const whatsappContacts = contacts.filter(c => c.source === 'whatsapp_sync').length;

  const formatCooldown = (seconds: number | null) => {
    if (!seconds || seconds <= 0) {
      return <Tag text="可联系" tone="success" />;
    }
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return <Tag text={`${hours}小时后`} tone="warn" />;
    }
    return <Tag text={`${minutes}分钟后`} tone="warn" />;
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(to bottom, #EEF2FF, #FFFFFF)',
        padding: '24px',
      }}
    >
      {/* 页面头部 */}
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          marginBottom: '24px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            padding: '20px 24px',
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            border: '1px solid #E5E7EB',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#4F46E5' }} />
            <h1
              style={{
                fontSize: '24px',
                fontWeight: '600',
                color: '#111827',
                margin: 0,
              }}
            >
              联系人管理
            </h1>
            <Tag text="管理客户信息和自动化回复设置" tone="info" />
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button kind="ghost" onClick={handleRefresh} aria-label="刷新数据">
              🔄 刷新
            </Button>
            <Button kind="ghost" onClick={handleSyncWhatsAppContacts} disabled={loading} aria-label="同步WhatsApp联系人">
              📱 同步WhatsApp联系人
            </Button>
            <Button kind="primary" onClick={handleAddContact} aria-label="添加联系人">
              ➕ 添加联系人
            </Button>
          </div>
        </div>
      </div>

      {/* 主要内容 */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
        {/* 统计卡片 */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '16px',
            marginBottom: '24px',
          }}
        >
          <Card>
            <Stat label="联系人总数" value={totalContacts} hint="所有联系人" color="#4F46E5" />
          </Card>
          <Card>
            <Stat label="近30天新增" value={recentContacts} hint="最近活跃" color="#059669" />
          </Card>
          <Card>
            <Stat label="冷却中" value={cooldownContacts} hint="等待发送" color="#B45309" />
          </Card>
          <Card>
            <Stat label="WhatsApp同步" value={whatsappContacts} hint="WhatsApp导入" color="#2563EB" />
          </Card>
        </div>

        {/* 分组管理 */}
        <div style={{ marginBottom: '24px' }}>
          <GroupManager
            groups={groups}
            selectedGroup={selectedGroup}
            onGroupSelect={handleGroupSelect}
            onGroupCreate={handleGroupCreate}
            onGroupEdit={handleGroupEdit}
            onGroupDelete={handleGroupDelete}
          />
        </div>

        {/* 搜索和批量操作 */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  placeholder="搜索联系人（姓名、电话、来源、标签）..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  style={{
                    padding: '10px 16px 10px 40px',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    fontSize: '14px',
                    width: '320px',
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#4F46E5'}
                  onBlur={(e) => e.target.style.borderColor = '#E5E7EB'}
                />
                <div style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#6B7280',
                  fontSize: '16px'
                }}>
                  🔍
                </div>
                {searchTerm && (
                  <Button
                    kind="ghost"
                    onClick={() => handleSearch('')}
                    style={{ fontSize: '12px', padding: '6px 12px' }}
                  >
                    清除搜索
                  </Button>
                )}
              </div>
            </div>
            {showBatchActions && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '14px', color: '#6B7280' }}>
                  已选择 {selectedContacts.size} 个联系人
                </span>
                <Button kind="ghost" onClick={() => { setSelectedContacts(new Set()); setShowBatchActions(false); }} style={{ fontSize: '12px', padding: '6px 12px' }}>
                  取消选择
                </Button>
                <Button kind="secondary" onClick={handleBatchDelete} style={{ fontSize: '12px', padding: '6px 12px', color: '#DC2626' }}>
                  🗑️ 批量删除
                </Button>
                <Button kind="secondary" onClick={() => setShowBatchGroupDialog(true)} style={{ fontSize: '12px', padding: '6px 12px', color: '#4F46E5' }}>
                  🏷️ 批量分组
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* 联系人列表 */}
        <Card>
          <div
            style={{
              backgroundColor: '#F9FAFB',
              padding: '12px 16px',
              borderRadius: '8px',
              marginBottom: '16px',
            }}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: filteredContacts.length > 0 ? 'auto 1fr auto' : '1fr auto',
                gap: '16px',
                fontSize: '14px',
                fontWeight: '600',
                color: '#374151',
              }}
            >
              {filteredContacts.length > 0 && (
                <input
                  type="checkbox"
                  checked={selectedContacts.size === filteredContacts.length && filteredContacts.length > 0}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  style={{
                    width: '16px',
                    height: '16px',
                    accentColor: '#4F46E5',
                  }}
                />
              )}
              <span>联系信息</span>
              <span>状态与操作</span>
            </div>
          </div>
          <div>
            {loading ? (
              <LoadingSpinner />
            ) : filteredContacts.length > 0 ? (
              filteredContacts.map((contact) => (
                <ContactRow
                  key={contact.id}
                  contact={contact.name || '未知联系人'}
                  phone={contact.phoneE164}
                  cooldown={formatCooldown(contact.cooldownRemainingSeconds)}
                  createdAt={contact.createdAt}
                  source={contact.source}
                  tags={contact.tags}
                  onCopy={handleCopy}
                  onOutreach={handleOutreach}
                  onDelete={handleDeleteContact}
                  onSelect={(selected) => handleSelectContact(contact.id, selected)}
                  isSelected={selectedContacts.has(contact.id)}
                  showCheckbox={true}
                />
              ))
            ) : contacts.length > 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#6B7280' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
                <div style={{ fontSize: '16px', marginBottom: '8px' }}>没有找到匹配的联系人</div>
                <div style={{ fontSize: '14px', marginBottom: '20px' }}>尝试调整搜索条件或清除搜索</div>
                <Button kind="primary" onClick={() => handleSearch('')}>
                  清除搜索
                </Button>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px', color: '#6B7280' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>📇</div>
                <div style={{ fontSize: '16px', marginBottom: '8px' }}>暂无联系人</div>
                <div style={{ fontSize: '14px', marginBottom: '20px' }}>点击上方按钮添加第一个联系人</div>
                <Button kind="primary" onClick={handleAddContact}>
                  添加联系人
                </Button>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* 批量分组对话框 */}
      {showBatchGroupDialog && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '24px',
            width: '400px',
            maxWidth: '90vw'
          }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '600' }}>
              批量分组 ({selectedContacts.size} 个联系人)
            </h3>
            <p style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#6B7280' }}>
              选择要移动到哪个分组，或选择"未分组"移除分组标签
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
              <Button
                kind="ghost"
                onClick={() => handleBatchGroup(null)}
                style={{ 
                  textAlign: 'left', 
                  justifyContent: 'flex-start',
                  padding: '12px 16px',
                  border: '1px solid #E5E7EB',
                  backgroundColor: '#F9FAFB'
                }}
              >
                📂 未分组
              </Button>
              {groups.map(group => (
                <Button
                  key={group.id}
                  kind="ghost"
                  onClick={() => handleBatchGroup(group.id)}
                  style={{ 
                    textAlign: 'left', 
                    justifyContent: 'flex-start',
                    padding: '12px 16px',
                    border: '1px solid #E5E7EB',
                    backgroundColor: '#F9FAFB'
                  }}
                >
                  <span style={{ 
                    display: 'inline-block', 
                    width: '12px', 
                    height: '12px', 
                    borderRadius: '50%', 
                    backgroundColor: group.color,
                    marginRight: '8px'
                  }} />
                  {group.name} ({group.contactCount} 个联系人)
                </Button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <Button kind="ghost" onClick={() => setShowBatchGroupDialog(false)}>
                取消
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* CSS动画 */}
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
