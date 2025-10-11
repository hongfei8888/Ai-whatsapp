'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from '@/lib/theme-context';
import { notificationManager } from '@/lib/notification-manager';
import { toast } from 'sonner';

interface AlertRule {
  id: string;
  name: string;
  enabled: boolean;
  threshold: number;
  description: string;
}

export default function AlertSettings() {
  const { colors } = useTheme();
  const [browserNotifications, setBrowserNotifications] = useState(false);
  const [notificationStatus, setNotificationStatus] = useState(notificationManager.getStatus());
  const [alertRules, setAlertRules] = useState<AlertRule[]>([
    {
      id: 'message-fail-rate',
      name: '消息失败率告警',
      enabled: true,
      threshold: 10,
      description: '当消息失败率超过阈值时发送告警',
    },
    {
      id: 'group-offline',
      name: '群组离线告警',
      enabled: true,
      threshold: 1,
      description: '当监控的群组离线时发送告警',
    },
    {
      id: 'batch-failed',
      name: '批量操作失败告警',
      enabled: false,
      threshold: 5,
      description: '当批量操作失败次数超过阈值时发送告警',
    },
    {
      id: 'whatsapp-disconnected',
      name: 'WhatsApp断线告警',
      enabled: true,
      threshold: 1,
      description: 'WhatsApp连接断开时立即发送告警',
    },
  ]);

  useEffect(() => {
    const status = notificationManager.getStatus();
    setNotificationStatus(status);
    setBrowserNotifications(status.enabled);
  }, []);

  const handleToggleBrowserNotifications = async () => {
    if (!browserNotifications) {
      const success = await notificationManager.enable();
      if (success) {
        setBrowserNotifications(true);
        setNotificationStatus(notificationManager.getStatus());
        toast.success('浏览器通知已启用');
        
        // 发送测试通知
        notificationManager.send({
          title: 'WhatsApp 自动化系统',
          body: '浏览器通知已成功启用！',
          priority: 'low',
        });
      } else {
        toast.error('无法启用浏览器通知，请检查浏览器权限');
      }
    } else {
      notificationManager.disable();
      setBrowserNotifications(false);
      setNotificationStatus(notificationManager.getStatus());
      toast.info('浏览器通知已禁用');
    }
  };

  const handleToggleRule = (ruleId: string) => {
    setAlertRules(rules =>
      rules.map(rule =>
        rule.id === ruleId ? { ...rule, enabled: !rule.enabled } : rule
      )
    );
    toast.success('告警规则已更新');
  };

  const handleThresholdChange = (ruleId: string, value: number) => {
    setAlertRules(rules =>
      rules.map(rule =>
        rule.id === ruleId ? { ...rule, threshold: value } : rule
      )
    );
  };

  const styles = {
    container: {
      backgroundColor: colors.panelBackground,
      borderRadius: '12px',
      padding: '20px',
      border: `1px solid ${colors.border}`,
    },
    header: {
      fontSize: '16px',
      fontWeight: '600' as const,
      color: colors.textPrimary,
      marginBottom: '16px',
    },
    section: {
      marginBottom: '24px',
    },
    sectionTitle: {
      fontSize: '14px',
      fontWeight: '600' as const,
      color: colors.textPrimary,
      marginBottom: '12px',
    },
    notificationToggle: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '16px',
      backgroundColor: colors.background,
      borderRadius: '8px',
      marginBottom: '12px',
    },
    toggleInfo: {
      flex: 1,
    },
    toggleLabel: {
      fontSize: '14px',
      fontWeight: '500' as const,
      color: colors.textPrimary,
      marginBottom: '4px',
    },
    toggleDesc: {
      fontSize: '12px',
      color: colors.textSecondary,
    },
    switch: {
      width: '48px',
      height: '24px',
      backgroundColor: browserNotifications ? colors.accent : colors.border,
      borderRadius: '12px',
      position: 'relative' as const,
      cursor: 'pointer',
      transition: 'background-color 0.3s',
    },
    switchKnob: {
      position: 'absolute' as const,
      top: '2px',
      left: browserNotifications ? '26px' : '2px',
      width: '20px',
      height: '20px',
      backgroundColor: '#fff',
      borderRadius: '50%',
      transition: 'left 0.3s',
    },
    statusBadge: {
      display: 'inline-block',
      padding: '4px 12px',
      borderRadius: '12px',
      fontSize: '11px',
      fontWeight: '600' as const,
      marginLeft: '8px',
    },
    statusGranted: {
      backgroundColor: 'rgba(0, 168, 132, 0.2)',
      color: colors.success,
    },
    statusDenied: {
      backgroundColor: 'rgba(231, 76, 60, 0.2)',
      color: colors.danger,
    },
    statusDefault: {
      backgroundColor: 'rgba(128, 128, 128, 0.2)',
      color: colors.textSecondary,
    },
    ruleList: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '12px',
    },
    ruleItem: {
      padding: '16px',
      backgroundColor: colors.background,
      borderRadius: '8px',
      border: `1px solid ${colors.border}`,
    },
    ruleHeader: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: '8px',
    },
    ruleName: {
      fontSize: '14px',
      fontWeight: '500' as const,
      color: colors.textPrimary,
    },
    ruleDesc: {
      fontSize: '12px',
      color: colors.textSecondary,
      marginBottom: '12px',
    },
    thresholdControl: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
    },
    thresholdLabel: {
      fontSize: '12px',
      color: colors.textSecondary,
    },
    thresholdInput: {
      width: '80px',
      padding: '6px 12px',
      border: `1px solid ${colors.border}`,
      borderRadius: '6px',
      fontSize: '13px',
      color: colors.textPrimary,
      backgroundColor: colors.panelBackground,
      outline: 'none',
    },
    testButton: {
      padding: '10px 20px',
      backgroundColor: colors.accent,
      color: '#fff',
      border: 'none',
      borderRadius: '8px',
      fontSize: '13px',
      fontWeight: '500' as const,
      cursor: 'pointer',
      transition: 'background-color 0.2s',
    },
  };

  const getStatusBadgeStyle = () => {
    if (notificationStatus.permission === 'granted') {
      return { ...styles.statusBadge, ...styles.statusGranted };
    }
    if (notificationStatus.permission === 'denied') {
      return { ...styles.statusBadge, ...styles.statusDenied };
    }
    return { ...styles.statusBadge, ...styles.statusDefault };
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>📢 告警设置</div>

      {/* 浏览器通知 */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>
          浏览器通知
          <span style={getStatusBadgeStyle()}>
            {notificationStatus.permission === 'granted' ? '已授权' :
             notificationStatus.permission === 'denied' ? '已拒绝' : '未授权'}
          </span>
        </div>

        <div style={styles.notificationToggle}>
          <div style={styles.toggleInfo}>
            <div style={styles.toggleLabel}>启用浏览器推送通知</div>
            <div style={styles.toggleDesc}>
              {notificationStatus.supported
                ? '接收重要事件的桌面通知'
                : '您的浏览器不支持通知功能'}
            </div>
          </div>
          <div
            style={styles.switch}
            onClick={handleToggleBrowserNotifications}
          >
            <div style={styles.switchKnob} />
          </div>
        </div>

        {browserNotifications && (
          <button
            style={styles.testButton}
            onClick={() => {
              notificationManager.send({
                title: 'WhatsApp 自动化系统',
                body: '这是一条测试通知 ✅',
                priority: 'low',
              });
              toast.success('测试通知已发送');
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = colors.accentHover;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = colors.accent;
            }}
          >
            发送测试通知
          </button>
        )}
      </div>

      {/* 告警规则 */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>告警规则</div>
        <div style={styles.ruleList}>
          {alertRules.map(rule => (
            <div key={rule.id} style={styles.ruleItem}>
              <div style={styles.ruleHeader}>
                <div style={styles.ruleName}>{rule.name}</div>
                <div
                  style={{
                    ...styles.switch,
                    width: '40px',
                    height: '20px',
                    backgroundColor: rule.enabled ? colors.accent : colors.border,
                  }}
                  onClick={() => handleToggleRule(rule.id)}
                >
                  <div
                    style={{
                      ...styles.switchKnob,
                      width: '16px',
                      height: '16px',
                      left: rule.enabled ? '22px' : '2px',
                    }}
                  />
                </div>
              </div>
              <div style={styles.ruleDesc}>{rule.description}</div>
              {rule.enabled && rule.threshold > 0 && (
                <div style={styles.thresholdControl}>
                  <span style={styles.thresholdLabel}>阈值：</span>
                  <input
                    type="number"
                    style={styles.thresholdInput}
                    value={rule.threshold}
                    onChange={(e) => handleThresholdChange(rule.id, parseInt(e.target.value) || 0)}
                    min="1"
                    max="100"
                  />
                  <span style={styles.thresholdLabel}>%</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

