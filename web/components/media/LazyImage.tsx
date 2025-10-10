'use client';

import React, { useState, useEffect, useRef } from 'react';

interface LazyImageProps {
  src: string;
  alt?: string;
  thumbnail?: string;
  style?: React.CSSProperties;
  className?: string;
  onClick?: () => void;
}

/**
 * 懒加载图片组件
 * 使用 Intersection Observer API 实现图片懒加载
 * 支持缩略图预览，提升用户体验
 */
export default function LazyImage({ 
  src, 
  alt = '', 
  thumbnail, 
  style, 
  className,
  onClick 
}: LazyImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [inView, setInView] = useState(false);
  const [error, setError] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    // 使用 Intersection Observer 检测图片是否进入视口
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { 
        rootMargin: '100px', // 提前100px开始加载
        threshold: 0.01, // 只要有一点进入视口就触发
      }
    );
    
    if (imgRef.current) {
      observer.observe(imgRef.current);
    }
    
    return () => observer.disconnect();
  }, []);
  
  return (
    <div 
      ref={imgRef} 
      style={{ 
        position: 'relative', 
        overflow: 'hidden',
        backgroundColor: '#f0f2f5',
        ...style 
      }} 
      className={className}
      onClick={onClick}
    >
      {/* 缩略图或占位符 */}
      {!loaded && !error && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f0f2f5',
          }}
        >
          {thumbnail ? (
            <img 
              src={thumbnail} 
              alt={alt}
              style={{ 
                filter: 'blur(10px)', 
                width: '100%', 
                height: '100%',
                objectFit: 'cover',
              }} 
            />
          ) : (
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center',
              color: '#8696a0',
            }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor">
                <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
              </svg>
              <span style={{ marginTop: '8px', fontSize: '12px' }}>加载中...</span>
            </div>
          )}
        </div>
      )}
      
      {/* 加载失败占位符 */}
      {error && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f0f2f5',
            color: '#8696a0',
          }}
        >
          <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor">
            <path d="M21 5v6.59l-3-3.01-4 4.01-4-4-4 4-3-3.01V5c0-1.1.9-2 2-2h14c1.1 0 2 .9 2 2zm-3 6.42l3 3.01V19c0 1.1-.9 2-2 2H5c-1.1 0-2-.9-2-2v-6.58l3 2.99 4-4 4 4 4-3.99z"/>
            <path d="M0 0h24v24H0z" fill="none"/>
          </svg>
          <span style={{ marginTop: '8px', fontSize: '12px' }}>加载失败</span>
        </div>
      )}
      
      {/* 实际图片 */}
      {inView && !error && (
        <img
          src={src}
          alt={alt}
          onLoad={() => {
            setLoaded(true);
            console.log('✅ 图片加载完成:', src);
          }}
          onError={() => {
            setError(true);
            console.error('❌ 图片加载失败:', src);
          }}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: loaded ? 'block' : 'none',
            transition: 'opacity 0.3s ease-in-out',
            opacity: loaded ? 1 : 0,
          }}
        />
      )}
    </div>
  );
}

