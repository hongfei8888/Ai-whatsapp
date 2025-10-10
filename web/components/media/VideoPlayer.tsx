'use client';

import React, { useState, useRef } from 'react';

const WhatsAppColors = {
  accent: '#00a884',
  panelBackground: '#ffffff',
  border: '#e9edef',
  textPrimary: '#111b21',
  textSecondary: '#667781',
};

interface VideoPlayerProps {
  src: string;
  thumbnail?: string;
  fileName?: string;
}

export default function VideoPlayer({ src, thumbnail, fileName }: VideoPlayerProps) {
  const [playing, setPlaying] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (playing) {
      video.pause();
    } else {
      video.play();
    }
    setPlaying(!playing);
  };

  const handleVideoClick = () => {
    togglePlay();
  };

  return (
    <div
      style={{
        position: 'relative',
        maxWidth: '100%',
        backgroundColor: '#000',
        borderRadius: '8px',
        overflow: 'hidden',
      }}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(playing ? false : true)}
    >
      {/* 视频元素 */}
      <video
        ref={videoRef}
        src={src}
        poster={thumbnail}
        controls={false}
        onClick={handleVideoClick}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        style={{
          width: '100%',
          maxHeight: '400px',
          display: 'block',
          cursor: 'pointer',
        }}
      />

      {/* 播放按钮覆盖层 */}
      {!playing && (
        <div
          onClick={togglePlay}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'background-color 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(0, 168, 132, 0.9)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
          }}
        >
          <div
            style={{
              width: 0,
              height: 0,
              borderLeft: '20px solid #fff',
              borderTop: '12px solid transparent',
              borderBottom: '12px solid transparent',
              marginLeft: '4px',
            }}
          />
        </div>
      )}

      {/* 控制栏 */}
      {showControls && (
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: '12px',
            background: 'linear-gradient(to top, rgba(0, 0, 0, 0.7), transparent)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <button
            onClick={togglePlay}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: WhatsAppColors.accent,
              color: '#fff',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px',
            }}
          >
            {playing ? '⏸' : '▶'}
          </button>

          {fileName && (
            <div
              style={{
                flex: 1,
                fontSize: '13px',
                color: '#fff',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {fileName}
            </div>
          )}

          <a
            href={src}
            download={fileName}
            style={{
              padding: '6px 12px',
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              color: '#fff',
              borderRadius: '4px',
              textDecoration: 'none',
              fontSize: '12px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            下载
          </a>
        </div>
      )}
    </div>
  );
}

