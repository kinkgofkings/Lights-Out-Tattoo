import React, { useEffect, useState } from 'react';
import { resolveMediaUrl } from '../services/mediaStore';

interface MediaRendererProps {
  src?: string;
  alt?: string;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
  autoPlay?: boolean;
  controls?: boolean;
  muted?: boolean;
  loading?: 'lazy' | 'eager';
}

export const MediaRenderer: React.FC<MediaRendererProps> = ({
  src,
  alt,
  className,
  style,
  onClick,
  autoPlay = true,
  controls = false,
  muted = true,
  loading = 'lazy'
}) => {
  const [resolvedSrc, setResolvedSrc] = useState<string | undefined>(undefined);

  useEffect(() => {
    let active = true;
    if (!src) {
      setResolvedSrc(undefined);
      return;
    }
    
    if (src.startsWith('media://')) {
      resolveMediaUrl(src).then(url => {
        if (active) setResolvedSrc(url);
      });
    } else {
      setResolvedSrc(src);
    }
    
    return () => {
      active = false;
    };
  }, [src]);

  if (!resolvedSrc) {
    return <div className={`animate-pulse bg-gray-800 ${className}`} style={style} />;
  }

  const isVideo = resolvedSrc.startsWith('data:video/') || 
    resolvedSrc.match(/\.(mp4|webm|ogg|mov|m4v)$/i) || 
    src?.match(/\.(mp4|webm|ogg|mov|m4v)$/i);

  if (isVideo) {
    return (
      <video
        src={resolvedSrc}
        className={className}
        style={style}
        onClick={onClick}
        autoPlay={autoPlay}
        controls={controls}
        loop
        muted={muted}
        playsInline
      />
    );
  }

  return (
    <img
      src={resolvedSrc}
      alt={alt}
      className={className}
      style={style}
      onClick={onClick}
      loading={loading}
    />
  );
};
