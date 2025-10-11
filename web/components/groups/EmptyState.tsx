'use client';

interface EmptyStateProps {
  icon?: string;
  title: string;
  message: string;
  actionText?: string;
  onAction?: () => void;
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
    opacity: 0.6,
  },
  title: {
    fontSize: '20px',
    fontWeight: '600' as const,
    color: '#111b21',
    marginBottom: '12px',
  },
  message: {
    fontSize: '15px',
    color: '#667781',
    marginBottom: '24px',
    maxWidth: '400px',
    lineHeight: '1.5',
  },
  actionButton: {
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

export default function EmptyState({ 
  icon = '📭', 
  title, 
  message,
  actionText,
  onAction
}: EmptyStateProps) {
  return (
    <div style={styles.container}>
      <div style={styles.icon}>{icon}</div>
      <div style={styles.title}>{title}</div>
      <div style={styles.message}>{message}</div>
      {actionText && onAction && (
        <button
          style={styles.actionButton}
          onClick={onAction}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#00916d';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#00a884';
          }}
        >
          {actionText}
        </button>
      )}
    </div>
  );
}

