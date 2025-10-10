'use client';

import React, { useState, useRef, useEffect } from 'react';

const WhatsAppColors = {
  accent: '#00a884',
  accentHover: '#008f6f',
  panelBackground: '#ffffff',
  border: '#e9edef',
  textPrimary: '#111b21',
  textSecondary: '#667781',
};

interface AudioPlayerProps {
  src: string;
  fileName?: string;
}

export default function AudioPlayer({ src, fileName }: AudioPlayerProps) {
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => setPlaying(false);

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (playing) {
      audio.pause();
    } else {
      audio.play();
    }
    setPlaying(!playing);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;

    const time = parseFloat(e.target.value);
    audio.currentTime = time;
    setCurrentTime(time);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;

    const vol = parseFloat(e.target.value);
    audio.volume = vol;
    setVolume(vol);
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div
      style={{
        padding: '12px',
        backgroundColor: WhatsAppColors.panelBackground,
        borderRadius: '8px',
        border: `1px solid ${WhatsAppColors.border}`,
      }}
    >
      <audio ref={audioRef} src={src} preload="metadata" />

      {/* 文件名 */}
      {fileName && (
        <div
          style={{
            fontSize: '13px',
            color: WhatsAppColors.textPrimary,
            marginBottom: '8px',
            fontWeight: '500',
          }}
        >
          🎵 {fileName}
        </div>
      )}

      {/* 播放控制 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
        <button
          onClick={togglePlay}
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            backgroundColor: WhatsAppColors.accent,
            color: '#fff',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '16px',
            flexShrink: 0,
          }}
        >
          {playing ? '⏸' : '▶'}
        </button>

        <div style={{ flex: 1 }}>
          {/* 进度条 */}
          <input
            type="range"
            min="0"
            max={duration || 0}
            value={currentTime}
            onChange={handleSeek}
            style={{
              width: '100%',
              height: '4px',
              cursor: 'pointer',
              accentColor: WhatsAppColors.accent,
            }}
          />
          {/* 时间显示 */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '11px',
              color: WhatsAppColors.textSecondary,
              marginTop: '4px',
            }}
          >
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
      </div>

      {/* 音量控制 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '14px' }}>🔊</span>
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={volume}
          onChange={handleVolumeChange}
          style={{
            width: '100px',
            height: '4px',
            cursor: 'pointer',
            accentColor: WhatsAppColors.accent,
          }}
        />
        <span style={{ fontSize: '11px', color: WhatsAppColors.textSecondary }}>
          {(volume * 100).toFixed(0)}%
        </span>
      </div>
    </div>
  );
}

