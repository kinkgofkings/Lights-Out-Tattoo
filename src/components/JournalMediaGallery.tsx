import React, { useState, useEffect } from 'react';
import { Film, Image as ImageIcon, X, ChevronLeft, ChevronRight, Maximize2, Play } from 'lucide-react';
import { JournalMediaItem } from '../types';
import { MediaRenderer } from './MediaRenderer';

interface JournalMediaGalleryProps {
  mediaItems?: JournalMediaItem[];
  mediaUrls?: string[];
  title?: string;
}

export const JournalMediaGallery: React.FC<JournalMediaGalleryProps> = ({
  mediaItems,
  mediaUrls,
  title = "Project Media & Session Visuals"
}) => {
  // Normalize items from either mediaItems or mediaUrls
  const allItems: JournalMediaItem[] = React.useMemo(() => {
    if (mediaItems && mediaItems.length > 0) {
      return mediaItems;
    }
    if (mediaUrls && mediaUrls.length > 0) {
      return mediaUrls.map((url, idx) => {
        const isVideo = url.startsWith('data:video/') || /\.(mp4|webm|mov|ogg|m4v)$/i.test(url);
        return {
          id: `media-url-${idx}`,
          url,
          type: isVideo ? 'video' : 'image',
          caption: undefined
        };
      });
    }
    return [];
  }, [mediaItems, mediaUrls]);

  const [activeLightboxIndex, setActiveLightboxIndex] = useState<number | null>(null);

  // Close lightbox on Escape key or navigate with Left/Right arrows
  useEffect(() => {
    if (activeLightboxIndex === null) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveLightboxIndex(null);
      } else if (e.key === 'ArrowLeft') {
        setActiveLightboxIndex(prev => (prev !== null && prev > 0 ? prev - 1 : allItems.length - 1));
      } else if (e.key === 'ArrowRight') {
        setActiveLightboxIndex(prev => (prev !== null && prev < allItems.length - 1 ? prev + 1 : 0));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeLightboxIndex, allItems.length]);

  if (!allItems || allItems.length === 0) {
    return null;
  }

  const imageCount = allItems.filter(i => i.type === 'image').length;
  const videoCount = allItems.filter(i => i.type === 'video').length;

  return (
    <div className="pt-6 border-t border-cyan-500/25 space-y-4">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-cyan-950/80 border border-cyan-500/40 text-cyan-400">
            <Film className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-heading font-black text-sm sm:text-base text-white tracking-wide">
              {title}
            </h4>
            <p className="text-[11px] font-mono text-gray-400">
              Reference planning, session clips, and progression breakdown
            </p>
          </div>
        </div>

        {/* Counter Pills */}
        <div className="flex items-center gap-2 text-[10px] font-mono">
          {imageCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 flex items-center gap-1">
              <ImageIcon className="w-3 h-3 text-cyan-400" />
              <span>{imageCount} {imageCount === 1 ? 'Photo' : 'Photos'}</span>
            </span>
          )}
          {videoCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-blue-950/80 border border-blue-500/40 text-blue-300 flex items-center gap-1">
              <Play className="w-3 h-3 text-blue-400" />
              <span>{videoCount} {videoCount === 1 ? 'Video' : 'Videos'}</span>
            </span>
          )}
        </div>
      </div>

      {/* Media Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {allItems.map((item, index) => {
          const isVideo = item.type === 'video' || item.url.startsWith('data:video/') || /\.(mp4|webm|mov|ogg|m4v)$/i.test(item.url);

          return (
            <div
              key={item.id || index}
              className="group flex flex-col rounded-xl overflow-hidden bg-[#050914] border border-cyan-500/30 hover:border-cyan-400 transition shadow-[0_0_15px_rgba(0,0,0,0.5)]"
            >
              {/* Media Preview Container */}
              <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
                {isVideo ? (
                  <div className="w-full h-full relative">
                    <MediaRenderer
                      src={item.url}
                      alt={item.caption || `Video clip ${index + 1}`}
                      className="w-full h-full object-cover"
                      controls={true}
                      autoPlay={false}
                      muted={false}
                    />
                    <div className="absolute top-2 left-2 pointer-events-none px-2 py-0.5 rounded bg-black/80 backdrop-blur-md border border-blue-400/50 text-[10px] font-mono text-blue-300 flex items-center gap-1">
                      <Play className="w-2.5 h-2.5 fill-current" />
                      <span>VIDEO</span>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setActiveLightboxIndex(index)}
                    className="w-full h-full text-left relative focus:outline-none block cursor-zoom-in"
                  >
                    <MediaRenderer
                      src={item.url}
                      alt={item.caption || `Project image ${index + 1}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/80 backdrop-blur-md border border-cyan-400/50 text-[10px] font-mono text-cyan-300 flex items-center gap-1">
                      <ImageIcon className="w-2.5 h-2.5" />
                      <span>PHOTO</span>
                    </div>
                    <div className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/70 backdrop-blur-md border border-cyan-400/40 text-cyan-300 opacity-0 group-hover:opacity-100 transition shadow">
                      <Maximize2 className="w-3.5 h-3.5" />
                    </div>
                  </button>
                )}
              </div>

              {/* Caption Bar */}
              {item.caption ? (
                <div className="p-2.5 bg-[#080d1a] border-t border-cyan-500/20 text-left">
                  <p className="text-xs font-mono text-gray-300 leading-snug line-clamp-2">
                    {item.caption}
                  </p>
                </div>
              ) : (
                <div className="px-2.5 py-1.5 bg-[#080d1a] border-t border-cyan-500/10 text-left">
                  <span className="text-[10px] font-mono text-gray-500">
                    Project Item #{index + 1}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Lightbox Modal for Fullscreen Image Viewing */}
      {activeLightboxIndex !== null && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-md p-3 sm:p-6"
          onClick={() => setActiveLightboxIndex(null)}
        >
          <div
            className="relative max-w-5xl max-h-[92vh] w-full flex flex-col items-center justify-center"
            onClick={e => e.stopPropagation()}
          >
            {/* Top Toolbar */}
            <div className="w-full flex items-center justify-between pb-3 text-cyan-400 font-mono text-xs">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg bg-cyan-950 border border-cyan-500/40 font-bold">
                  {activeLightboxIndex + 1} / {allItems.length}
                </span>
                {allItems[activeLightboxIndex].caption && (
                  <span className="text-gray-200 font-sans text-xs sm:text-sm line-clamp-1 max-w-md hidden sm:inline">
                    {allItems[activeLightboxIndex].caption}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveLightboxIndex(null)}
                  className="p-2 rounded-xl bg-gray-900 border border-cyan-500/40 text-cyan-300 hover:text-white hover:border-cyan-400 hover:bg-cyan-950 transition flex items-center gap-1"
                  title="Close lightbox (Esc)"
                >
                  <X className="w-5 h-5" />
                  <span className="text-[10px] hidden sm:inline">ESC</span>
                </button>
              </div>
            </div>

            {/* Media Body with Previous/Next Arrows */}
            <div className="relative w-full flex items-center justify-center overflow-hidden rounded-2xl border border-cyan-500/40 bg-black/90 shadow-[0_0_50px_rgba(0,240,255,0.25)]">
              {/* Prev Button */}
              {allItems.length > 1 && (
                <button
                  type="button"
                  onClick={() => setActiveLightboxIndex(prev => (prev !== null && prev > 0 ? prev - 1 : allItems.length - 1))}
                  className="absolute left-3 z-10 p-2.5 rounded-full bg-black/70 border border-cyan-500/40 text-cyan-300 hover:text-white hover:bg-cyan-950 transition"
                  title="Previous image"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
              )}

              {/* Media Content */}
              <div className="max-h-[75vh] flex items-center justify-center p-2">
                {allItems[activeLightboxIndex].type === 'video' || /\.(mp4|webm|mov|ogg|m4v)$/i.test(allItems[activeLightboxIndex].url) ? (
                  <MediaRenderer
                    src={allItems[activeLightboxIndex].url}
                    alt={allItems[activeLightboxIndex].caption || 'Video'}
                    className="max-h-[70vh] max-w-full rounded-lg object-contain"
                    controls={true}
                    autoPlay={true}
                    muted={false}
                  />
                ) : (
                  <MediaRenderer
                    src={allItems[activeLightboxIndex].url}
                    alt={allItems[activeLightboxIndex].caption || 'Image'}
                    className="max-h-[70vh] max-w-full rounded-lg object-contain"
                  />
                )}
              </div>

              {/* Next Button */}
              {allItems.length > 1 && (
                <button
                  type="button"
                  onClick={() => setActiveLightboxIndex(prev => (prev !== null && prev < allItems.length - 1 ? prev + 1 : 0))}
                  className="absolute right-3 z-10 p-2.5 rounded-full bg-black/70 border border-cyan-500/40 text-cyan-300 hover:text-white hover:bg-cyan-950 transition"
                  title="Next image"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              )}
            </div>

            {/* Bottom Caption Overlay */}
            {allItems[activeLightboxIndex].caption && (
              <div className="w-full mt-3 p-3 rounded-xl bg-[#080d1a] border border-cyan-500/30 text-center">
                <p className="text-xs sm:text-sm font-sans text-gray-200">
                  {allItems[activeLightboxIndex].caption}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
