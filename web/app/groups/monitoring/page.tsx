'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import WhatsAppLayout from '@/components/layout/WhatsAppLayout';
import Sidebar from '@/components/layout/Sidebar';
import GroupsNavigation from '@/components/groups/Navigation';
import EmptyState from '@/components/groups/EmptyState';
import SkeletonCard from '@/components/groups/SkeletonCard';
import { api } from '@/lib/api';
import { useWebSocket } from '@/lib/useWebSocket';

const THEME_COLOR = '#00a884';
const BG_COLOR = '#f0f2f5';
const WHITE = '#ffffff';
const BORDER_COLOR = '#e9edef';
const TEXT_PRIMARY = '#111b21';
const TEXT_SECONDARY = '#667781';

interface GroupMessage {
  id: string;
  groupId: string;
  messageId: string;
  fromPhone: string;
  fromName?: string | null;
  text?: string | null;
  mediaType?: string | null;
  keywords?: string[];
  createdAt: string;
}

interface WhatsAppGroup {
  id: string;
  groupId: string;
  name: string;
  memberCount: number;
  isMonitoring: boolean;
  keywords?: string[];
}

interface GroupMember {
  id: string;
  phoneE164: string;
  displayName?: string | null;
  messageCount: number;
  lastMessageAt?: string | null;
}

export default function MonitoringPage() {
  const router = useRouter();
  const [groups, setGroups] = useState<WhatsAppGroup[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [activeMembers, setActiveMembers] = useState<GroupMember[]>([]);
  const [loading, setLoading] = useState(true);
  
  // 筛选条件
  const [searchFrom, setSearchFrom] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // 设置对话框
  const [showSettings, setShowSettings] = useState(false);
  const [currentGroup, setCurrentGroup] = useState<WhatsAppGroup | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [keywordsText, setKeywordsText] = useState('');

  // WebSocket 实时更新
  useWebSocket({
    onGroupMessage: (data) => {
      if (data.groupId === selectedGroupId) {
        // 刷新消息列表
        loadMessages();
      }
    },
  });

  // 加载群组列表
  const loadGroups = async () => {
    try {
      const response = await api.groups.list({ limit: 100 });
      setGroups(response.groups || []);
      
      // 默认选中第一个群组
      if (!selectedGroupId && response.groups && response.groups.length > 0) {
        setSelectedGroupId(response.groups[0].id);
      }
    } catch (error) {
      console.error('加载群组失败:', error);
    }
  };

  // 加载消息列表
  const loadMessages = useCallback(async () => {
    if (!selectedGroupId) return;
    
    try {
      setLoading(true);
      const response = await api.groups.getGroupMessages(selectedGroupId, {
        fromPhone: searchFrom || undefined,
        keyword: searchKeyword || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        limit: 100,
      });
      setMessages(response.messages || []);
    } catch (error) {
      console.error('加载消息失败:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedGroupId, searchFrom, searchKeyword, startDate, endDate]);

  // 加载活跃用户
  const loadActiveMembers = useCallback(async () => {
    if (!selectedGroupId) return;
    
    try {
      const response = await api.groups.getGroupMembers(selectedGroupId, {
        isActive: true,
        limit: 10,
      });
      setActiveMembers(response.members || []);
    } catch (error) {
      console.error('加载活跃用户失败:', error);
    }
  }, [selectedGroupId]);

  useEffect(() => {
    loadGroups();
  }, []);

  useEffect(() => {
    if (selectedGroupId) {
      loadMessages();
      loadActiveMembers();
    }
  }, [selectedGroupId, loadMessages, loadActiveMembers]);

  // 打开设置对话框
  const handleOpenSettings = (group: WhatsAppGroup) => {
    setCurrentGroup(group);
    setIsMonitoring(group.isMonitoring);
    setKeywordsText((group.keywords || []).join('\n'));
    setShowSettings(true);
  };

  // 保存设置
  const handleSaveSettings = async () => {
    if (!currentGroup) return;
    
    try {
      const keywords = keywordsText
        .split('\n')
        .map(k => k.trim())
        .filter(Boolean);
      
      await api.groups.updateGroupSettings(currentGroup.id, {
        isMonitoring,
        keywords,
      });
      
      alert('设置已保存');
      setShowSettings(false);
      loadGroups();
    } catch (error: any) {
      alert('保存设置失败：' + error.message);
    }
  };

  // 格式化时间
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const selectedGroup = groups.find(g => g.id === selectedGroupId);

  return (
    <WhatsAppLayout
      sidebar={<Sidebar />}
      mainContent={
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: WHITE }}>
        {/* 顶部导航标签 */}
        <GroupsNavigation />

        {/* 内容区域 */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {/* 左侧：消息列表 */}
          <div style={{ flex: 3, display: 'flex', flexDirection: 'column', borderRight: `1px solid ${BORDER_COLOR}` }}>
            {/* 筛选工具栏 */}
            <div
              style={{
                padding: '16px',
                display: 'flex',
                flexWrap: 'wrap',
                gap: '12px',
                borderBottom: `1px solid ${BORDER_COLOR}`,
                backgroundColor: WHITE,
              }}
            >
              <select
                value={selectedGroupId}
                onChange={(e) => setSelectedGroupId(e.target.value)}
                style={{
                  padding: '8px 12px',
                  border: `1px solid ${BORDER_COLOR}`,
                  borderRadius: '8px',
                  fontSize: '14px',
                  backgroundColor: WHITE,
                  cursor: 'pointer',
                  minWidth: '200px',
                }}
              >
                <option value="">选择群组</option>
                {groups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name} ({group.memberCount} 人)
                  </option>
                ))}
              </select>

              <input
                type="text"
                placeholder="发送人"
                value={searchFrom}
                onChange={(e) => setSearchFrom(e.target.value)}
                style={{
                  padding: '8px 12px',
                  border: `1px solid ${BORDER_COLOR}`,
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none',
                  minWidth: '150px',
                }}
              />

              <input
                type="text"
                placeholder="关键词"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                style={{
                  padding: '8px 12px',
                  border: `1px solid ${BORDER_COLOR}`,
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none',
                  minWidth: '150px',
                }}
              />

              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                style={{
                  padding: '8px 12px',
                  border: `1px solid ${BORDER_COLOR}`,
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none',
                }}
              />

              <span style={{ display: 'flex', alignItems: 'center', color: TEXT_SECONDARY }}>至</span>

              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                style={{
                  padding: '8px 12px',
                  border: `1px solid ${BORDER_COLOR}`,
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none',
                }}
              />

              <button
                onClick={loadMessages}
                style={{
                  padding: '8px 16px',
                  backgroundColor: THEME_COLOR,
                  border: 'none',
                  borderRadius: '8px',
                  color: WHITE,
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                }}
              >
                🔍 搜索
              </button>

              {selectedGroup && (
                <button
                  onClick={() => handleOpenSettings(selectedGroup)}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: WHITE,
                    border: `1px solid ${BORDER_COLOR}`,
                    borderRadius: '8px',
                    color: TEXT_PRIMARY,
                    fontSize: '14px',
                    cursor: 'pointer',
                  }}
                >
                  ⚙️ 监控设置
                </button>
              )}
            </div>

            {/* 消息列表 */}
            <div style={{ flex: 1, overflowY: 'auto', backgroundColor: BG_COLOR }}>
              {loading ? (
                <div style={{ padding: '48px', textAlign: 'center', color: TEXT_SECONDARY }}>
                  加载中...
                </div>
              ) : !selectedGroupId ? (
                <div style={{ padding: '48px', textAlign: 'center', color: TEXT_SECONDARY }}>
                  请选择一个群组
                </div>
              ) : messages.length === 0 ? (
                <div style={{ padding: '48px', textAlign: 'center', color: TEXT_SECONDARY }}>
                  暂无消息
                </div>
              ) : (
                <div style={{ padding: '16px' }}>
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      style={{
                        backgroundColor: WHITE,
                        padding: '16px',
                        borderRadius: '8px',
                        marginBottom: '12px',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <div>
                          <span style={{ fontWeight: '600', color: TEXT_PRIMARY }}>
                            {message.fromName || message.fromPhone}
                          </span>
                          {message.keywords && message.keywords.length > 0 && (
                            <span
                              style={{
                                marginLeft: '8px',
                                padding: '2px 8px',
                                backgroundColor: '#fef3cd',
                                color: '#856404',
                                borderRadius: '4px',
                                fontSize: '12px',
                              }}
                            >
                              🔔 关键词命中
                            </span>
                          )}
                        </div>
                        <span style={{ fontSize: '13px', color: TEXT_SECONDARY }}>
                          {formatTime(message.createdAt)}
                        </span>
                      </div>
                      
                      {message.text && (
                        <div style={{ color: TEXT_PRIMARY, fontSize: '14px', marginTop: '8px' }}>
                          {message.text}
                        </div>
                      )}

                      {message.mediaType && (
                        <div
                          style={{
                            marginTop: '8px',
                            padding: '8px',
                            backgroundColor: BG_COLOR,
                            borderRadius: '6px',
                            fontSize: '13px',
                            color: TEXT_SECONDARY,
                          }}
                        >
                          📎 {message.mediaType}
                        </div>
                      )}

                      {message.keywords && message.keywords.length > 0 && (
                        <div style={{ marginTop: '8px', fontSize: '12px', color: TEXT_SECONDARY }}>
                          命中关键词: {message.keywords.join(', ')}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 右侧：活跃用户排行榜 */}
          <div style={{ width: '300px', display: 'flex', flexDirection: 'column', backgroundColor: WHITE }}>
            <div
              style={{
                padding: '16px',
                borderBottom: `1px solid ${BORDER_COLOR}`,
                fontWeight: '600',
                fontSize: '16px',
                color: TEXT_PRIMARY,
              }}
            >
              🏆 活跃用户排行榜
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
              {activeMembers.length === 0 ? (
                <div style={{ textAlign: 'center', color: TEXT_SECONDARY, marginTop: '24px' }}>
                  暂无数据
                </div>
              ) : (
                activeMembers.map((member, index) => (
                  <div
                    key={member.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '12px',
                      marginBottom: '8px',
                      backgroundColor: index < 3 ? '#fff4e5' : BG_COLOR,
                      borderRadius: '8px',
                      border: index < 3 ? `1px solid #ffd666` : 'none',
                    }}
                  >
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        backgroundColor: index === 0 ? '#ffd700' : index === 1 ? '#c0c0c0' : index === 2 ? '#cd7f32' : BORDER_COLOR,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: '600',
                        fontSize: '14px',
                        color: index < 3 ? WHITE : TEXT_SECONDARY,
                        marginRight: '12px',
                      }}
                    >
                      {index + 1}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '500', fontSize: '14px', color: TEXT_PRIMARY }}>
                        {member.displayName || member.phoneE164}
                      </div>
                      <div style={{ fontSize: '12px', color: TEXT_SECONDARY, marginTop: '2px' }}>
                        {member.messageCount} 条消息
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* 设置对话框 */}
        {showSettings && currentGroup && (
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
          onClick={() => setShowSettings(false)}
        >
          <div
            style={{
              backgroundColor: WHITE,
              borderRadius: '12px',
              padding: '24px',
              width: '500px',
              maxHeight: '80vh',
              overflow: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ margin: '0 0 20px 0', fontSize: '20px', color: TEXT_PRIMARY }}>
              群消息监控设置 - {currentGroup.name}
            </h2>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={isMonitoring}
                  onChange={(e) => setIsMonitoring(e.target.checked)}
                  style={{ marginRight: '8px', width: '16px', height: '16px' }}
                />
                <span style={{ fontSize: '14px', fontWeight: '500', color: TEXT_PRIMARY }}>
                  开启消息监控
                </span>
              </label>
              <div style={{ fontSize: '12px', color: TEXT_SECONDARY, marginTop: '4px', marginLeft: '24px' }}>
                开启后将实时记录所有群消息到数据库
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: TEXT_PRIMARY }}>
                关键词监控（每行一个）
              </label>
              <textarea
                value={keywordsText}
                onChange={(e) => setKeywordsText(e.target.value)}
                placeholder="例如：&#10;优惠&#10;促销&#10;活动"
                rows={6}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: `1px solid ${BORDER_COLOR}`,
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box',
                  fontFamily: 'monospace',
                }}
              />
              <div style={{ fontSize: '12px', color: TEXT_SECONDARY, marginTop: '4px' }}>
                当群消息包含这些关键词时会被特别标记
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowSettings(false)}
                style={{
                  padding: '10px 20px',
                  backgroundColor: WHITE,
                  border: `1px solid ${BORDER_COLOR}`,
                  borderRadius: '8px',
                  fontSize: '14px',
                  cursor: 'pointer',
                  color: TEXT_PRIMARY,
                }}
              >
                取消
              </button>
              <button
                onClick={handleSaveSettings}
                style={{
                  padding: '10px 20px',
                  backgroundColor: THEME_COLOR,
                  border: 'none',
                  borderRadius: '8px',
                  color: WHITE,
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                }}
              >
                保存设置
              </button>
            </div>
          </div>
        </div>
        )}
      </div>
      }
      hideListPanel={true}
    />
  );
}
