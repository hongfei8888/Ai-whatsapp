'use client';

interface SkeletonCardProps {
  type?: 'list' | 'card' | 'stat';
  count?: number;
}

const styles = {
  skeletonCard: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '20px',
    border: '1px solid #e9edef',
    marginBottom: '12px',
  },
  skeletonBar: {
    height: '12px',
    backgroundColor: '#f0f2f5',
    borderRadius: '6px',
    marginBottom: '8px',
    animation: 'pulse 1.5s ease-in-out infinite',
  },
  skeletonStatCard: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '24px',
    border: '1px solid #e9edef',
  },
  skeletonListItem: {
    backgroundColor: '#ffffff',
    padding: '16px',
    borderBottom: '1px solid #e9edef',
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
  },
  skeletonCircle: {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    backgroundColor: '#f0f2f5',
    flexShrink: 0,
    animation: 'pulse 1.5s ease-in-out infinite',
  },
  skeletonContent: {
    flex: 1,
  },
};

export default function SkeletonCard({ type = 'card', count = 1 }: SkeletonCardProps) {
  const renderSkeleton = () => {
    switch (type) {
      case 'stat':
        return (
          <div style={styles.skeletonStatCard}>
            <div style={{...styles.skeletonBar, width: '40%', marginBottom: '12px'}}></div>
            <div style={{...styles.skeletonBar, width: '60%', height: '32px', marginBottom: '8px'}}></div>
            <div style={{...styles.skeletonBar, width: '50%', height: '10px'}}></div>
          </div>
        );
      
      case 'list':
        return (
          <div style={styles.skeletonListItem}>
            <div style={styles.skeletonCircle}></div>
            <div style={styles.skeletonContent}>
              <div style={{...styles.skeletonBar, width: '60%', marginBottom: '8px'}}></div>
              <div style={{...styles.skeletonBar, width: '40%', height: '10px'}}></div>
            </div>
          </div>
        );
      
      default:
        return (
          <div style={styles.skeletonCard}>
            <div style={{...styles.skeletonBar, width: '70%', marginBottom: '12px'}}></div>
            <div style={{...styles.skeletonBar, width: '50%', marginBottom: '8px'}}></div>
            <div style={{...styles.skeletonBar, width: '90%', height: '10px'}}></div>
          </div>
        );
    }
  };

  return (
    <>
      <style jsx global>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i}>{renderSkeleton()}</div>
      ))}
    </>
  );
}

