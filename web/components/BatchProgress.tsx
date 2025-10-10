'use client';

import { WhatsAppColors } from './layout/WhatsAppLayout';

interface BatchProgressProps {
  batchId: string;
  status: string;
  progress: number;
  totalCount: number;
  processedCount: number;
  successCount: number;
  failedCount: number;
  onCancel?: () => void;
  logs?: Array<{ time: string; message: string; status: 'success' | 'error' | 'info' }>;
}

const styles = {
  container: {
    border: `1px solid ${WhatsAppColors.border}`,
    borderRadius: '8px',
    backgroundColor: WhatsAppColors.panelBackground,
    padding: '20px',
  },
  statusRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  statusText: {
    fontSize: '15px',
    fontWeight: '600' as const,
    color: WhatsAppColors.textPrimary,
  },
  cancelButton: {
    padding: '6px 16px',
    backgroundColor: WhatsAppColors.error,
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: '600' as const,
    cursor: 'pointer',
  },
  progressBarContainer: {
    width: '100%',
    height: '10px',
    backgroundColor: WhatsAppColors.inputBackground,
    borderRadius: '5px',
    overflow: 'hidden',
    marginBottom: '16px',
  },
  progressBar: {
    height: '100%',
    backgroundColor: WhatsAppColors.accent,
    transition: 'width 0.3s ease',
  },
  statsRow: {
    display: 'flex',
    justifyContent: 'space-around',
    marginBottom: '16px',
    padding: '16px',
    backgroundColor: WhatsAppColors.inputBackground,
    borderRadius: '8px',
  },
  statItem: {
    textAlign: 'center' as const,
  },
  statLabel: {
    fontSize: '12px',
    color: WhatsAppColors.textSecondary,
    marginBottom: '4px',
  },
  statValue: {
    fontSize: '20px',
    fontWeight: '700' as const,
    color: WhatsAppColors.textPrimary,
  },
  statValueSuccess: {
    color: WhatsAppColors.accent,
  },
  statValueError: {
    color: WhatsAppColors.error,
  },
  logsContainer: {
    maxHeight: '200px',
    overflowY: 'auto' as const,
    backgroundColor: WhatsAppColors.inputBackground,
    borderRadius: '8px',
    padding: '12px',
  },
  logsTitle: {
    fontSize: '13px',
    fontWeight: '600' as const,
    color: WhatsAppColors.textSecondary,
    marginBottom: '8px',
  },
  logItem: {
    fontSize: '12px',
    padding: '6px 0',
    borderBottom: `1px solid ${WhatsAppColors.border}`,
    display: 'flex',
    gap: '8px',
  },
  logTime: {
    color: WhatsAppColors.textSecondary,
    minWidth: '60px',
  },
  logMessage: {
    flex: 1,
  },
};

export default function BatchProgress({
  batchId,
  status,
  progress,
  totalCount,
  processedCount,
  successCount,
  failedCount,
  onCancel,
  logs = [],
}: BatchProgressProps) {
  const getStatusText = () => {
    switch (status) {
      case 'PENDING':
        return '等待处理...';
      case 'PROCESSING':
        return '正在处理...';
      case 'COMPLETED':
        return '✓ 已完成';
      case 'FAILED':
        return '✗ 失败';
      case 'CANCELLED':
        return '已取消';
      default:
        return status;
    }
  };

  const canCancel = status === 'PENDING' || status === 'PROCESSING';

  return (
    <div style={styles.container}>
      <div style={styles.statusRow}>
        <span style={styles.statusText}>{getStatusText()}</span>
        {canCancel && onCancel && (
          <button
            style={styles.cancelButton}
            onClick={onCancel}
            onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
            onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
          >
            取消操作
          </button>
        )}
      </div>

      <div style={styles.progressBarContainer}>
        <div style={{ ...styles.progressBar, width: `${progress}%` }} />
      </div>

      <div style={styles.statsRow}>
        <div style={styles.statItem}>
          <div style={styles.statLabel}>总数</div>
          <div style={styles.statValue}>{totalCount}</div>
        </div>
        <div style={styles.statItem}>
          <div style={styles.statLabel}>已处理</div>
          <div style={styles.statValue}>{processedCount}</div>
        </div>
        <div style={styles.statItem}>
          <div style={styles.statLabel}>成功</div>
          <div style={{ ...styles.statValue, ...styles.statValueSuccess }}>
            {successCount}
          </div>
        </div>
        <div style={styles.statItem}>
          <div style={styles.statLabel}>失败</div>
          <div style={{ ...styles.statValue, ...styles.statValueError }}>
            {failedCount}
          </div>
        </div>
      </div>

      {logs.length > 0 && (
        <div>
          <div style={styles.logsTitle}>实时日志</div>
          <div style={styles.logsContainer}>
            {logs.map((log, index) => (
              <div key={index} style={styles.logItem}>
                <span style={styles.logTime}>{log.time}</span>
                <span 
                  style={{
                    ...styles.logMessage,
                    color: log.status === 'success' 
                      ? WhatsAppColors.accent 
                      : log.status === 'error'
                      ? WhatsAppColors.error
                      : WhatsAppColors.textPrimary
                  }}
                >
                  {log.message}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

