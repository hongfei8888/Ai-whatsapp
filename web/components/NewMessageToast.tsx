'use client';

import { useState, useEffect } from 'react';
import { WhatsAppColors } from '@/components/layout/WhatsAppLayout';

interface NewMessageToastProps {
  message: {
    from: string;
    body: string;
    timestamp: number;
  } | null;
  onClose: () => void;
}

const styles = {
  toast: {
    position: 'fixed' as const,
    top: '20px',
    right: '20px',
    backgroundColor: WhatsAppColors.panelBackground,
    borderRadius: '8px',
    padding: '12px 16px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    minWidth: '300px',
    maxWidth: '400px',
    zIndex: 9999,
    animation: 'slideIn 0.3s ease-out',
    border: `1px solid ${WhatsAppColors.border}`,
  },
  icon: {
    fontSize: '24px',
    flexShrink: 0,
  },
  content: {
    flex: 1,
    minWidth: 0,
  },
  from: {
    fontSize: '14px',
    fontWeight: '600' as const,
    color: WhatsAppColors.textPrimary,
    marginBottom: '4px',
  },
  message: {
    fontSize: '13px',
    color: WhatsAppColors.textSecondary,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },
  closeButton: {
    cursor: 'pointer',
    color: WhatsAppColors.textSecondary,
    fontSize: '18px',
    padding: '4px',
    flexShrink: 0,
  },
};

export default function NewMessageToast({ message, onClose }: NewMessageToastProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (message) {
      setIsVisible(true);
      // 5秒后自动关闭
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onClose, 300); // 等待动画完成后关闭
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [message, onClose]);

  if (!message || !isVisible) return null;

  return (
    <>
      <style jsx>{`
        @keyframes slideIn {
          from {
            transform: translateX(120%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        @keyframes slideOut {
          from {
            transform: translateX(0);
            opacity: 1;
          }
          to {
            transform: translateX(120%);
            opacity: 0;
          }
        }
      `}</style>
      <div 
        style={{
          ...styles.toast,
          animation: isVisible ? 'slideIn 0.3s ease-out' : 'slideOut 0.3s ease-in',
        }}
      >
        <div style={styles.icon}>💬</div>
        <div style={styles.content}>
          <div style={styles.from}>{message.from}</div>
          <div style={styles.message}>{message.body}</div>
        </div>
        <div 
          style={styles.closeButton}
          onClick={() => {
            setIsVisible(false);
            setTimeout(onClose, 300);
          }}
        >
          ✕
        </div>
      </div>
    </>
  );
}

