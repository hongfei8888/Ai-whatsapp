'use client';

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  icon?: string;
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 20px',
    textAlign: 'center' as const,
  },
  icon: {
    fontSize: '64px',
    marginBottom: '20px',
  },
  title: {
    fontSize: '20px',
    fontWeight: '600' as const,
    color: '#e74c3c',
    marginBottom: '12px',
  },
  message: {
    fontSize: '15px',
    color: '#667781',
    marginBottom: '24px',
    maxWidth: '400px',
    lineHeight: '1.5',
  },
  retryButton: {
    padding: '12px 24px',
    backgroundColor: '#00a884',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '15px',
    fontWeight: '600' as const,
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
};

export default function ErrorState({ 
  title = '加载失败', 
  message, 
  onRetry,
  icon = '⚠️'
}: ErrorStateProps) {
  return (
    <div style={styles.container}>
      <div style={styles.icon}>{icon}</div>
      <div style={styles.title}>{title}</div>
      <div style={styles.message}>{message}</div>
      {onRetry && (
        <button
          style={styles.retryButton}
          onClick={onRetry}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#00916d';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#00a884';
          }}
        >
          🔄 重试
        </button>
      )}
    </div>
  );
}

