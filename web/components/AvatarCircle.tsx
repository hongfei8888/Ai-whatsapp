'use client';

import { WhatsAppColors } from './layout/WhatsAppLayout';

interface AvatarCircleProps {
  name: string | null;
  phone: string;
  avatarUrl?: string | null;
  size?: number;
}

// 根据字符串生成一致的颜色
function generateColorFromString(str: string): string {
  const colors = [
    '#00a884', // WhatsApp green
    '#0088cc', // Blue
    '#8e44ad', // Purple
    '#e67e22', // Orange
    '#16a085', // Teal
    '#c0392b', // Red
    '#2980b9', // Dark blue
    '#27ae60', // Green
    '#d35400', // Dark orange
    '#8e44ad', // Purple
  ];
  
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  return colors[Math.abs(hash) % colors.length];
}

export default function AvatarCircle({ 
  name, 
  phone, 
  avatarUrl, 
  size = 40 
}: AvatarCircleProps) {
  const initial = name ? name[0].toUpperCase() : phone[0];
  const bgColor = generateColorFromString(phone);
  
  const styles = {
    avatar: {
      width: `${size}px`,
      height: `${size}px`,
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: `${size * 0.4}px`,
      fontWeight: '600' as const,
      color: '#fff',
      backgroundColor: bgColor,
      flexShrink: 0,
      overflow: 'hidden',
    },
    image: {
      width: '100%',
      height: '100%',
      objectFit: 'cover' as const,
    },
  };
  
  return (
    <div style={styles.avatar}>
      {avatarUrl ? (
        <img src={avatarUrl} alt={name || phone} style={styles.image} />
      ) : (
        initial
      )}
    </div>
  );
}

