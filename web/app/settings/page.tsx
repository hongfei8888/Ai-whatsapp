'use client';

import { useState, useEffect } from 'react';
import WhatsAppLayout, { WhatsAppColors } from '@/components/layout/WhatsAppLayout';
import Sidebar from '@/components/layout/Sidebar';
import StatCard from '@/components/StatCard';
import { api } from '@/lib/api';

// 标签页类型
type TabType = 'basic' | 'ai' | 'translation' | 'stats' | 'data' | 'account';

const styles = {
  fullPanel: {
    display: 'flex',
    flexDirection: 'column' as const,
    height: '100%',
    backgroundColor: WhatsAppColors.background,
  },
  header: {
    padding: '30px 40px',
    borderBottom: `1px solid ${WhatsAppColors.border}`,
    backgroundColor: WhatsAppColors.panelBackground,
  },
  title: {
    fontSize: '32px',
    fontWeight: '700' as const,
    color: WhatsAppColors.textPrimary,
    marginBottom: '8px',
  },
  subtitle: {
    fontSize: '16px',
    color: WhatsAppColors.textSecondary,
  },
  tabsContainer: {
    display: 'flex',
    gap: '4px',
    padding: '0 40px',
    backgroundColor: WhatsAppColors.panelBackground,
    borderBottom: `1px solid ${WhatsAppColors.border}`,
    overflowX: 'auto' as const,
  },
  tab: {
    padding: '16px 24px',
    cursor: 'pointer',
    fontSize: '15px',
    fontWeight: '500' as const,
    color: WhatsAppColors.textSecondary,
    borderBottomWidth: '3px',
    borderBottomStyle: 'solid',
    borderBottomColor: 'transparent',
    transition: 'all 0.2s',
    whiteSpace: 'nowrap' as const,
    userSelect: 'none' as const,
  },
  tabActive: {
    color: WhatsAppColors.accent,
    borderBottomColor: WhatsAppColors.accent,
  },
  body: {
    flex: 1,
    overflowY: 'auto' as const,
    padding: '30px 40px',
  },
  section: {
    marginBottom: '32px',
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: '600' as const,
    color: WhatsAppColors.textPrimary,
    marginBottom: '16px',
  },
  card: {
    backgroundColor: WhatsAppColors.panelBackground,
    borderRadius: '12px',
    padding: '20px',
    border: `1px solid ${WhatsAppColors.border}`,
    marginBottom: '12px',
  },
  settingRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 0',
    borderBottom: `1px solid ${WhatsAppColors.border}`,
  },
  settingRowLast: {
    borderBottom: 'none',
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    fontSize: '15px',
    color: WhatsAppColors.textPrimary,
    fontWeight: '500' as const,
    marginBottom: '4px',
  },
  settingDesc: {
    fontSize: '13px',
    color: WhatsAppColors.textSecondary,
    lineHeight: '1.4',
  },
  input: {
    width: '200px',
    padding: '8px 12px',
    backgroundColor: WhatsAppColors.background,
    border: `1px solid ${WhatsAppColors.border}`,
    borderRadius: '8px',
    color: WhatsAppColors.textPrimary,
    fontSize: '14px',
    outline: 'none',
  },
  textarea: {
    width: '100%',
    minHeight: '150px',
    padding: '12px',
    backgroundColor: WhatsAppColors.background,
    border: `1px solid ${WhatsAppColors.border}`,
    borderRadius: '8px',
    color: WhatsAppColors.textPrimary,
    fontSize: '14px',
    outline: 'none',
    fontFamily: 'monospace',
    resize: 'vertical' as const,
  },
  select: {
    width: '200px',
    padding: '8px 12px',
    backgroundColor: WhatsAppColors.background,
    border: `1px solid ${WhatsAppColors.border}`,
    borderRadius: '8px',
    color: WhatsAppColors.textPrimary,
    fontSize: '14px',
    outline: 'none',
    cursor: 'pointer',
  },
  toggleSwitch: {
    width: '44px',
    height: '24px',
    borderRadius: '12px',
    position: 'relative' as const,
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  toggleKnob: {
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    backgroundColor: '#fff',
    position: 'absolute' as const,
    top: '2px',
    transition: 'left 0.2s',
  },
  slider: {
    width: '100%',
    maxWidth: '300px',
  },
  sliderValue: {
    display: 'inline-block',
    minWidth: '60px',
    textAlign: 'right' as const,
    fontSize: '14px',
    color: WhatsAppColors.textPrimary,
    fontWeight: '600' as const,
  },
  button: {
    padding: '10px 24px',
    backgroundColor: WhatsAppColors.accent,
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600' as const,
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  buttonSecondary: {
    backgroundColor: WhatsAppColors.background,
    color: WhatsAppColors.textPrimary,
    border: `1px solid ${WhatsAppColors.border}`,
  },
  buttonDanger: {
    backgroundColor: '#e74c3c',
  },
  buttonGroup: {
    display: 'flex',
    gap: '12px',
    marginTop: '20px',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '16px',
    marginBottom: '24px',
  },
  chartContainer: {
    backgroundColor: WhatsAppColors.panelBackground,
    borderRadius: '12px',
    padding: '20px',
    border: `1px solid ${WhatsAppColors.border}`,
    marginBottom: '16px',
  },
  chartTitle: {
    fontSize: '16px',
    fontWeight: '600' as const,
    color: WhatsAppColors.textPrimary,
    marginBottom: '16px',
  },
};

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('basic');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // 基础设置状态
  const [settings, setSettings] = useState<any>({
    aiEnabled: true,
    autoReply: true,
    cooldownHours: 24,
    perContactReplyCooldownMinutes: 10,
    maxMessagesPerDay: 100,
    maxMessagesPerHour: 20,
    notificationsEnabled: true,
    emailNotifications: false,
    translationEnabled: false,
    defaultTargetLanguage: 'zh',
    autoSyncContacts: false,
    debugMode: false,
  });
  
  // AI配置状态
  const [aiConfig, setAiConfig] = useState<any>({
    systemPrompt: '',
    temperature: 0.4,
    maxTokens: 384,
    minChars: 80,
    stylePreset: 'concise-cn',
  });
  
  // 统计数据状态
  const [stats, setStats] = useState<any>(null);
  const [messageStats, setMessageStats] = useState<any>(null);
  const [batchStats, setBatchStats] = useState<any>(null);
  const [translationStats, setTranslationStats] = useState<any>(null);
  const [knowledgeStats, setKnowledgeStats] = useState<any>(null);
  const [storageInfo, setStorageInfo] = useState<any>(null);
  
  // WhatsApp状态
  const [whatsappStatus, setWhatsappStatus] = useState<any>(null);

  useEffect(() => {
    loadSettings();
    loadAiConfig();
    loadWhatsappStatus();
  }, []);

  useEffect(() => {
    if (activeTab === 'stats') {
      loadStats();
    }
  }, [activeTab]);

  const loadSettings = async () => {
    try {
      const data = await api.settings.get();
      setSettings(data);
    } catch (error) {
      console.error('加载设置失败:', error);
    }
  };

  const loadAiConfig = async () => {
    try {
      const data = await api.getAiConfig();
      setAiConfig(data);
    } catch (error) {
      console.error('加载AI配置失败:', error);
    }
  };

  const loadWhatsappStatus = async () => {
    try {
      const data = await api.getStatus();
      setWhatsappStatus(data);
    } catch (error) {
      console.error('加载WhatsApp状态失败:', error);
    }
  };

  const loadStats = async () => {
    try {
    setLoading(true);
      const [overviewData, messagesData, batchData, translationData, knowledgeData, storageData] = await Promise.all([
        api.stats.overview(),
        api.stats.messages(),
        api.batch.stats(),
        api.translation.getStats(),
        api.knowledge.getStats(),
        api.data.storageInfo(),
      ]);
      
      setStats(overviewData);
      setMessageStats(messagesData);
      setBatchStats(batchData);
      setTranslationStats(translationData);
      setKnowledgeStats(knowledgeData);
      setStorageInfo(storageData);
    } catch (error) {
      console.error('加载统计数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      await api.settings.update(settings);
      alert('设置已保存！');
    } catch (error) {
      console.error('保存设置失败:', error);
      alert('保存失败，请重试');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAiConfig = async () => {
    setSaving(true);
    try {
      await api.updateAiConfig(aiConfig);
      alert('AI配置已保存！');
    } catch (error) {
      console.error('保存AI配置失败:', error);
      alert('保存失败，请重试');
    } finally {
      setSaving(false);
    }
  };

  const handleTestAi = async () => {
    try {
      const result = await api.testAiReply({
        user: '测试消息',
        context: []
      });
      alert(`AI测试回复：\n\n${result.reply}`);
    } catch (error) {
      console.error('AI测试失败:', error);
      alert('测试失败，请检查配置');
    }
  };

  const handleCleanup = async (types: string[], daysOld: number) => {
    if (!confirm(`确定要清理${daysOld}天前的数据吗？此操作不可撤销！`)) {
      return;
    }
    
    try {
      const result = await api.data.cleanup({ types, daysOld });
      alert(`清理完成！\n${JSON.stringify(result, null, 2)}`);
      if (activeTab === 'stats') {
        loadStats();
      }
    } catch (error) {
      console.error('清理失败:', error);
      alert('清理失败，请重试');
    }
  };

  const handleExport = async (types: string[], format: 'json' | 'csv' = 'json') => {
    try {
      const result = await api.data.export({ types, format });
      const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `export-${Date.now()}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('导出失败:', error);
      alert('导出失败，请重试');
    }
  };

  const handleLogout = async () => {
    if (!confirm('确定要退出登录吗？这将断开 WhatsApp 连接。')) {
      return;
    }
    
    try {
      await api.logout();
      alert('已退出登录');
      window.location.reload();
    } catch (error) {
      console.error('退出失败:', error);
      alert('退出失败，请重试');
    }
  };

  const renderBasicSettings = () => (
    <div>
      {/* AI 自动回复 */}
        <div style={styles.section}>
          <div style={styles.sectionTitle}>AI 自动回复</div>
          <div style={styles.card}>
            <div style={styles.settingRow}>
              <div style={styles.settingInfo}>
                <div style={styles.settingLabel}>启用 AI 自动回复</div>
              <div style={styles.settingDesc}>自动使用 AI 回复收到的消息</div>
              </div>
              <div
                style={{
                  ...styles.toggleSwitch,
                  backgroundColor: settings.aiEnabled ? WhatsAppColors.accent : WhatsAppColors.textSecondary,
                }}
                onClick={() => setSettings({ ...settings, aiEnabled: !settings.aiEnabled })}
              >
                <div
                  style={{
                    ...styles.toggleKnob,
                    left: settings.aiEnabled ? '22px' : '2px',
                  }}
                />
              </div>
            </div>

            <div style={{ ...styles.settingRow, ...styles.settingRowLast }}>
              <div style={styles.settingInfo}>
                <div style={styles.settingLabel}>自动回复</div>
              <div style={styles.settingDesc}>收到消息后自动回复</div>
              </div>
              <div
                style={{
                  ...styles.toggleSwitch,
                  backgroundColor: settings.autoReply ? WhatsAppColors.accent : WhatsAppColors.textSecondary,
                }}
                onClick={() => setSettings({ ...settings, autoReply: !settings.autoReply })}
              >
                <div
                  style={{
                    ...styles.toggleKnob,
                    left: settings.autoReply ? '22px' : '2px',
                  }}
                />
              </div>
            </div>
          </div>
        </div>

      {/* 冷却时间 */}
        <div style={styles.section}>
          <div style={styles.sectionTitle}>冷却时间</div>
          <div style={styles.card}>
            <div style={styles.settingRow}>
              <div style={styles.settingInfo}>
                <div style={styles.settingLabel}>全局冷却时间（小时）</div>
              <div style={styles.settingDesc}>联系人进入冷却后的等待时间</div>
              </div>
              <input
                type="number"
                value={settings.cooldownHours}
                onChange={(e) => setSettings({ ...settings, cooldownHours: parseInt(e.target.value) || 0 })}
                style={styles.input}
                min="0"
              max="168"
              />
            </div>

            <div style={{ ...styles.settingRow, ...styles.settingRowLast }}>
              <div style={styles.settingInfo}>
                <div style={styles.settingLabel}>单个联系人回复间隔（分钟）</div>
              <div style={styles.settingDesc}>每次自动回复之间的最小间隔</div>
              </div>
              <input
                type="number"
                value={settings.perContactReplyCooldownMinutes}
                onChange={(e) => setSettings({ ...settings, perContactReplyCooldownMinutes: parseInt(e.target.value) || 0 })}
                style={styles.input}
                min="0"
              max="1440"
              />
            </div>
          </div>
        </div>

      {/* 消息限制 */}
        <div style={styles.section}>
        <div style={styles.sectionTitle}>消息限制</div>
          <div style={styles.card}>
          <div style={styles.settingRow}>
              <div style={styles.settingInfo}>
                <div style={styles.settingLabel}>每日最大消息数</div>
              <div style={styles.settingDesc}>每天最多发送的消息数量（防止封号）</div>
              </div>
              <input
                type="number"
                value={settings.maxMessagesPerDay}
                onChange={(e) => setSettings({ ...settings, maxMessagesPerDay: parseInt(e.target.value) || 0 })}
                style={styles.input}
                min="0"
                max="1000"
              />
            </div>

          <div style={{ ...styles.settingRow, ...styles.settingRowLast }}>
            <div style={styles.settingInfo}>
              <div style={styles.settingLabel}>每小时最大消息数</div>
              <div style={styles.settingDesc}>每小时最多发送的消息数量</div>
            </div>
            <input
              type="number"
              value={settings.maxMessagesPerHour}
              onChange={(e) => setSettings({ ...settings, maxMessagesPerHour: parseInt(e.target.value) || 0 })}
              style={styles.input}
              min="0"
              max="100"
            />
          </div>
          </div>
        </div>

        {/* 通知设置 */}
        <div style={styles.section}>
          <div style={styles.sectionTitle}>通知</div>
          <div style={styles.card}>
          <div style={styles.settingRow}>
              <div style={styles.settingInfo}>
                <div style={styles.settingLabel}>启用通知</div>
              <div style={styles.settingDesc}>收到重要事件时显示通知</div>
              </div>
              <div
                style={{
                  ...styles.toggleSwitch,
                  backgroundColor: settings.notificationsEnabled ? WhatsAppColors.accent : WhatsAppColors.textSecondary,
                }}
                onClick={() => setSettings({ ...settings, notificationsEnabled: !settings.notificationsEnabled })}
              >
                <div
                  style={{
                    ...styles.toggleKnob,
                    left: settings.notificationsEnabled ? '22px' : '2px',
                  }}
                />
              </div>
            </div>

          <div style={{ ...styles.settingRow, ...styles.settingRowLast }}>
            <div style={styles.settingInfo}>
              <div style={styles.settingLabel}>邮件通知</div>
              <div style={styles.settingDesc}>通过邮件接收通知</div>
            </div>
            <div
              style={{
                ...styles.toggleSwitch,
                backgroundColor: settings.emailNotifications ? WhatsAppColors.accent : WhatsAppColors.textSecondary,
              }}
              onClick={() => setSettings({ ...settings, emailNotifications: !settings.emailNotifications })}
            >
              <div
                style={{
                  ...styles.toggleKnob,
                  left: settings.emailNotifications ? '22px' : '2px',
                }}
              />
            </div>
          </div>
          </div>
        </div>

        {/* 保存按钮 */}
        <div style={styles.buttonGroup}>
          <button
          style={styles.button}
          onClick={handleSaveSettings}
          disabled={saving}
          onMouseEnter={(e) => {
            if (!saving) {
              e.currentTarget.style.backgroundColor = WhatsAppColors.accentHover;
            }
          }}
          onMouseLeave={(e) => {
            if (!saving) {
              e.currentTarget.style.backgroundColor = WhatsAppColors.accent;
            }
          }}
        >
          {saving ? '保存中...' : '保存设置'}
        </button>
      </div>
    </div>
  );

  const renderAiConfig = () => (
    <div>
      {/* System Prompt */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>AI 提示词（System Prompt）</div>
        <div style={styles.card}>
          <textarea
            value={aiConfig.systemPrompt}
            onChange={(e) => setAiConfig({ ...aiConfig, systemPrompt: e.target.value })}
            style={styles.textarea}
            placeholder="输入系统提示词，定义 AI 的行为和回复风格..."
          />
        </div>
      </div>

      {/* Temperature */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>温度（Temperature）</div>
        <div style={styles.card}>
          <div style={styles.settingRow}>
            <div style={styles.settingInfo}>
              <div style={styles.settingLabel}>创造性</div>
              <div style={styles.settingDesc}>值越高，回复越有创造性但可能不够准确。推荐：0.3-0.7</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={aiConfig.temperature}
                onChange={(e) => setAiConfig({ ...aiConfig, temperature: parseFloat(e.target.value) })}
                style={styles.slider}
              />
              <span style={styles.sliderValue}>{aiConfig.temperature.toFixed(1)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Max Tokens */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>最大令牌数（Max Tokens）</div>
        <div style={styles.card}>
          <div style={styles.settingRow}>
            <div style={styles.settingInfo}>
              <div style={styles.settingLabel}>回复长度限制</div>
              <div style={styles.settingDesc}>控制 AI 回复的最大长度。推荐：256-512</div>
            </div>
            <input
              type="number"
              value={aiConfig.maxTokens}
              onChange={(e) => setAiConfig({ ...aiConfig, maxTokens: parseInt(e.target.value) || 128 })}
              style={styles.input}
              min="128"
              max="2048"
            />
          </div>
        </div>
      </div>

      {/* Min Chars */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>最小字符数（Min Chars）</div>
        <div style={styles.card}>
          <div style={styles.settingRow}>
            <div style={styles.settingInfo}>
              <div style={styles.settingLabel}>最小回复长度</div>
              <div style={styles.settingDesc}>AI 回复的最少字符数。推荐：50-100</div>
            </div>
            <input
              type="number"
              value={aiConfig.minChars}
              onChange={(e) => setAiConfig({ ...aiConfig, minChars: parseInt(e.target.value) || 20 })}
              style={styles.input}
              min="20"
              max="500"
            />
          </div>
        </div>
      </div>

      {/* Style Preset */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>风格预设</div>
        <div style={styles.card}>
          <div style={styles.settingRow}>
            <div style={styles.settingInfo}>
              <div style={styles.settingLabel}>回复风格</div>
              <div style={styles.settingDesc}>选择预定义的回复风格</div>
            </div>
            <select
              value={aiConfig.stylePreset}
              onChange={(e) => setAiConfig({ ...aiConfig, stylePreset: e.target.value })}
              style={styles.select}
            >
              <option value="concise-cn">简洁中文</option>
              <option value="professional">专业</option>
              <option value="friendly">友好</option>
              <option value="casual">随意</option>
            </select>
          </div>
        </div>
      </div>

      {/* 操作按钮 */}
      <div style={styles.buttonGroup}>
        <button
          style={styles.button}
          onClick={handleSaveAiConfig}
          disabled={saving}
          onMouseEnter={(e) => {
            if (!saving) {
              e.currentTarget.style.backgroundColor = WhatsAppColors.accentHover;
            }
          }}
          onMouseLeave={(e) => {
            if (!saving) {
              e.currentTarget.style.backgroundColor = WhatsAppColors.accent;
            }
          }}
        >
          {saving ? '保存中...' : '保存配置'}
        </button>
        
        <button
          style={{ ...styles.button, ...styles.buttonSecondary }}
          onClick={handleTestAi}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = WhatsAppColors.border;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = WhatsAppColors.background;
          }}
        >
          测试 AI
        </button>
      </div>
    </div>
  );

  const renderTranslationSettings = () => (
    <div>
      {/* 翻译开关 */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>翻译功能</div>
        <div style={styles.card}>
          <div style={styles.settingRow}>
            <div style={styles.settingInfo}>
              <div style={styles.settingLabel}>启用翻译</div>
              <div style={styles.settingDesc}>启用自动翻译功能</div>
            </div>
            <div
              style={{
                ...styles.toggleSwitch,
                backgroundColor: settings.translationEnabled ? WhatsAppColors.accent : WhatsAppColors.textSecondary,
              }}
              onClick={() => setSettings({ ...settings, translationEnabled: !settings.translationEnabled })}
            >
              <div
                style={{
                  ...styles.toggleKnob,
                  left: settings.translationEnabled ? '22px' : '2px',
                }}
              />
            </div>
          </div>

          <div style={{ ...styles.settingRow, ...styles.settingRowLast }}>
            <div style={styles.settingInfo}>
              <div style={styles.settingLabel}>默认目标语言</div>
              <div style={styles.settingDesc}>翻译的目标语言</div>
            </div>
            <select
              value={settings.defaultTargetLanguage}
              onChange={(e) => setSettings({ ...settings, defaultTargetLanguage: e.target.value })}
              style={styles.select}
            >
              <option value="zh">中文（简体）</option>
              <option value="zht">中文（繁体）</option>
              <option value="en">English</option>
              <option value="ja">日本語</option>
              <option value="ko">한국어</option>
            </select>
          </div>
        </div>
      </div>

      {/* 翻译统计 */}
      {translationStats && (
        <div style={styles.section}>
          <div style={styles.sectionTitle}>使用统计</div>
          <div style={styles.statsGrid}>
            <StatCard
              title="总翻译次数"
              value={translationStats.totalTranslations || 0}
              icon="🌐"
              color={WhatsAppColors.info}
            />
            <StatCard
              title="总使用次数"
              value={translationStats.totalUsage || 0}
              icon="📊"
              color={WhatsAppColors.accent}
            />
            <StatCard
              title="缓存命中率"
              value={`${Math.round((translationStats.totalUsage / Math.max(1, translationStats.totalTranslations) - 1) * 100)}%`}
              icon="💾"
              color={WhatsAppColors.success}
            />
          </div>
        </div>
      )}

      {/* 缓存管理 */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>缓存管理</div>
        <div style={styles.card}>
          <div style={styles.settingRow}>
            <div style={styles.settingInfo}>
              <div style={styles.settingLabel}>清理翻译缓存</div>
              <div style={styles.settingDesc}>清理指定天数前的低使用率翻译缓存</div>
            </div>
            <button
              style={{ ...styles.button, ...styles.buttonSecondary }}
              onClick={() => handleCleanup(['translations'], 90)}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = WhatsAppColors.border;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = WhatsAppColors.background;
              }}
            >
              清理 90 天前缓存
            </button>
          </div>
        </div>
      </div>

      {/* 保存按钮 */}
      <div style={styles.buttonGroup}>
        <button
          style={styles.button}
          onClick={handleSaveSettings}
          disabled={saving}
            onMouseEnter={(e) => {
            if (!saving) {
                e.currentTarget.style.backgroundColor = WhatsAppColors.accentHover;
              }
            }}
            onMouseLeave={(e) => {
            if (!saving) {
                e.currentTarget.style.backgroundColor = WhatsAppColors.accent;
              }
            }}
          >
          {saving ? '保存中...' : '保存设置'}
          </button>
      </div>
    </div>
  );

  const renderStats = () => {
    if (loading || !stats) {
      return <div style={{ textAlign: 'center', padding: '40px', color: WhatsAppColors.textSecondary }}>加载统计数据中...</div>;
    }

    return (
      <div>
        {/* 系统概览 */}
        <div style={styles.section}>
          <div style={styles.sectionTitle}>系统概览</div>
          <div style={styles.statsGrid}>
            <StatCard
              title="联系人总数"
              value={stats.contacts?.total || 0}
              subtitle={`活跃：${stats.contacts?.active || 0}`}
              icon="👥"
              color={WhatsAppColors.accent}
            />
            <StatCard
              title="消息总数"
              value={stats.messages?.total || 0}
              subtitle={`今日：${stats.messages?.today || 0}`}
              icon="💬"
              color={WhatsAppColors.info}
            />
            <StatCard
              title="模板总数"
              value={stats.templates?.total || 0}
              icon="📄"
              color={WhatsAppColors.warning}
            />
            <StatCard
              title="批量操作"
              value={stats.batchOperations?.total || 0}
              icon="⚡"
              color="#9b59b6"
            />
            <StatCard
              title="知识库条目"
              value={stats.knowledge?.total || 0}
              icon="💡"
              color="#e67e22"
            />
            <StatCard
              title="活跃会话"
              value={stats.threads?.total || 0}
              icon="🔄"
              color="#1abc9c"
            />
          </div>
        </div>

        {/* 消息统计 */}
        {messageStats && (
          <div style={styles.section}>
            <div style={styles.sectionTitle}>消息统计</div>
            <div style={styles.chartContainer}>
              <div style={styles.chartTitle}>今日消息</div>
              <div style={styles.statsGrid}>
                <StatCard
                  title="已发送"
                  value={messageStats.today?.sent || 0}
                  icon="📤"
                  color={WhatsAppColors.accent}
                />
                <StatCard
                  title="已接收"
                  value={messageStats.today?.received || 0}
                  icon="📥"
                  color={WhatsAppColors.info}
                />
                <StatCard
                  title="成功率"
                  value={`${messageStats.today?.successRate || 100}%`}
                  icon="✅"
                  color={WhatsAppColors.success}
                />
              </div>
            </div>

            {messageStats.weeklyTrend && (
              <div style={styles.chartContainer}>
                <div style={styles.chartTitle}>本周趋势</div>
                <div style={{ padding: '20px', fontSize: '14px', color: WhatsAppColors.textSecondary }}>
                  {messageStats.weeklyTrend.map((day: any) => (
                    <div key={day.date} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span>{day.date}</span>
                      <span style={{ fontWeight: '600', color: WhatsAppColors.textPrimary }}>{day.count} 条消息</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 批量操作统计 */}
        {batchStats && (
          <div style={styles.section}>
            <div style={styles.sectionTitle}>批量操作统计</div>
            <div style={styles.statsGrid}>
              <StatCard
                title="总操作数"
                value={batchStats.total || 0}
                icon="⚡"
                color="#9b59b6"
              />
              <StatCard
                title="已处理"
                value={batchStats.totalProcessed || 0}
                icon="✓"
                color={WhatsAppColors.success}
              />
              <StatCard
                title="成功率"
                value={`${batchStats.successRate || 0}%`}
                icon="📊"
                color={WhatsAppColors.accent}
              />
            </div>
          </div>
        )}

        {/* 存储信息 */}
        {storageInfo && (
          <div style={styles.section}>
            <div style={styles.sectionTitle}>存储信息</div>
            <div style={styles.card}>
              <div style={styles.settingRow}>
                <div style={styles.settingInfo}>
                  <div style={styles.settingLabel}>数据库大小</div>
                  <div style={styles.settingDesc}>{storageInfo.database?.sizeFormatted || '0 Bytes'}</div>
                </div>
              </div>
              <div style={{ ...styles.settingRow, ...styles.settingRowLast }}>
                <div style={styles.settingInfo}>
                  <div style={styles.settingLabel}>总记录数</div>
                  <div style={styles.settingDesc}>{storageInfo.total?.records || 0} 条记录</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderDataManagement = () => (
    <div>
      {/* 导出数据 */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>导出数据</div>
        <div style={styles.card}>
          <div style={styles.settingRow}>
            <div style={styles.settingInfo}>
              <div style={styles.settingLabel}>导出所有数据</div>
              <div style={styles.settingDesc}>导出联系人、消息、模板等数据</div>
            </div>
            <button
              style={{ ...styles.button, ...styles.buttonSecondary }}
              onClick={() => handleExport(['contacts', 'messages', 'templates', 'batches', 'knowledge'], 'json')}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = WhatsAppColors.border;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = WhatsAppColors.background;
              }}
            >
              导出为 JSON
            </button>
          </div>
          
          <div style={{ ...styles.settingRow, ...styles.settingRowLast }}>
            <div style={styles.settingInfo}>
              <div style={styles.settingLabel}>仅导出联系人</div>
              <div style={styles.settingDesc}>导出所有联系人数据</div>
            </div>
            <button
              style={{ ...styles.button, ...styles.buttonSecondary }}
              onClick={() => handleExport(['contacts'], 'json')}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = WhatsAppColors.border;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = WhatsAppColors.background;
              }}
            >
              导出联系人
            </button>
          </div>
        </div>
      </div>

      {/* 数据清理 */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>数据清理</div>
        <div style={styles.card}>
          <div style={styles.settingRow}>
            <div style={styles.settingInfo}>
              <div style={styles.settingLabel}>清理旧消息</div>
              <div style={styles.settingDesc}>删除 90 天前的消息记录</div>
            </div>
            <button
              style={{ ...styles.button, ...styles.buttonDanger }}
              onClick={() => handleCleanup(['messages'], 90)}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#c0392b';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#e74c3c';
              }}
            >
              清理消息
            </button>
          </div>
          
          <div style={{ ...styles.settingRow, ...styles.settingRowLast }}>
            <div style={styles.settingInfo}>
              <div style={styles.settingLabel}>清理批量操作记录</div>
              <div style={styles.settingDesc}>删除 30 天前完成或失败的批量操作</div>
            </div>
            <button
              style={{ ...styles.button, ...styles.buttonDanger }}
              onClick={() => handleCleanup(['batches'], 30)}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#c0392b';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#e74c3c';
              }}
            >
              清理记录
            </button>
          </div>
        </div>
      </div>

      {/* 存储信息 */}
      {storageInfo && (
        <div style={styles.section}>
          <div style={styles.sectionTitle}>存储详情</div>
          <div style={styles.card}>
            <div style={{ padding: '10px 0' }}>
              {Object.entries(storageInfo.tables || {}).map(([key, value]: [string, any]) => (
                <div key={key} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${WhatsAppColors.border}` }}>
                  <span style={{ fontSize: '14px', color: WhatsAppColors.textSecondary }}>{key}</span>
                  <span style={{ fontSize: '14px', fontWeight: '600', color: WhatsAppColors.textPrimary }}>{value} 条</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderAccountManagement = () => (
    <div>
      {/* WhatsApp 账号信息 */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>WhatsApp 账号</div>
        <div style={styles.card}>
          {whatsappStatus && (
            <>
              <div style={styles.settingRow}>
              <div style={styles.settingInfo}>
                  <div style={styles.settingLabel}>连接状态</div>
                <div style={styles.settingDesc}>
                    {whatsappStatus.connected ? (
                      <span style={{ color: WhatsAppColors.success, fontWeight: '600' }}>✓ 已连接</span>
                    ) : (
                      <span style={{ color: WhatsAppColors.danger, fontWeight: '600' }}>✗ 未连接</span>
                    )}
                  </div>
                </div>
              </div>
              
              {whatsappStatus.phoneNumber && (
                <div style={{ ...styles.settingRow, ...styles.settingRowLast }}>
                  <div style={styles.settingInfo}>
                    <div style={styles.settingLabel}>电话号码</div>
                    <div style={styles.settingDesc}>{whatsappStatus.phoneNumber}</div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* 重新登录 */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>重新登录</div>
        <div style={styles.card}>
          <div style={styles.settingRow}>
            <div style={styles.settingInfo}>
              <div style={styles.settingLabel}>重新连接 WhatsApp</div>
              <div style={styles.settingDesc}>断开当前连接并显示新的二维码</div>
            </div>
            <button
              style={{ ...styles.button, ...styles.buttonSecondary }}
              onClick={() => {
                if (confirm('确定要重新登录吗？')) {
                  window.location.href = '/';
                }
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = WhatsAppColors.border;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = WhatsAppColors.background;
              }}
            >
              重新登录
            </button>
          </div>
        </div>
      </div>

      {/* 危险操作 */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>危险操作</div>
        <div style={styles.card}>
          <div style={{ ...styles.settingRow, ...styles.settingRowLast }}>
            <div style={styles.settingInfo}>
              <div style={styles.settingLabel}>退出登录</div>
              <div style={styles.settingDesc}>断开 WhatsApp 连接并退出登录</div>
              </div>
              <button
              style={{ ...styles.button, ...styles.buttonDanger }}
                onClick={handleLogout}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#c0392b';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#e74c3c';
                }}
              >
                退出登录
              </button>
            </div>
          </div>
        </div>
    </div>
  );

  const mainContent = (
    <div style={styles.fullPanel}>
      <div style={styles.header}>
        <div style={styles.title}>设置</div>
        <div style={styles.subtitle}>配置系统参数和管理数据</div>
      </div>

      {/* 标签页导航 */}
      <div style={styles.tabsContainer}>
        {[
          { id: 'basic', label: '基础设置' },
          { id: 'ai', label: 'AI 配置' },
          { id: 'translation', label: '翻译设置' },
          { id: 'stats', label: '统计仪表板' },
          { id: 'data', label: '数据管理' },
          { id: 'account', label: '账号管理' },
        ].map((tab) => (
          <div
            key={tab.id}
            style={{
              ...styles.tab,
              ...(activeTab === tab.id ? styles.tabActive : {}),
            }}
            onClick={() => setActiveTab(tab.id as TabType)}
            onMouseEnter={(e) => {
              if (activeTab !== tab.id) {
                e.currentTarget.style.color = WhatsAppColors.textPrimary;
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== tab.id) {
                e.currentTarget.style.color = WhatsAppColors.textSecondary;
              }
            }}
          >
            {tab.label}
          </div>
        ))}
      </div>

      {/* 标签页内容 */}
      <div style={styles.body}>
        {activeTab === 'basic' && renderBasicSettings()}
        {activeTab === 'ai' && renderAiConfig()}
        {activeTab === 'translation' && renderTranslationSettings()}
        {activeTab === 'stats' && renderStats()}
        {activeTab === 'data' && renderDataManagement()}
        {activeTab === 'account' && renderAccountManagement()}
      </div>
    </div>
  );

  return (
    <WhatsAppLayout
      sidebar={<Sidebar />}
      mainContent={mainContent}
      hideListPanel={true}
    />
  );
}
