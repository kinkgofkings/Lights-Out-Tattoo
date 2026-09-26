import { MediaRenderer } from "./MediaRenderer";
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Clock,
  Tag,
  Sparkles,
  Layers,
  Trash2
} from 'lucide-react';
import { GalleryItem } from '../types';

interface LightboxModalProps {
  item: GalleryItem | null;
  items: GalleryItem[];
  isOpen: boolean;
  onClose: () => void;
  onSelect: (item: GalleryItem) => void;
  onBookSimilar: (item: GalleryItem) => void;
  isAdmin?: boolean;
  onDeleteItem?: (id: string) => void;
}

export const LightboxModal: React.FC<LightboxModalProps> = ({
  item,
  items,
  isOpen,
  onClose,
  onSelect,
  onBookSimilar,
  isAdmin = false,
  onDeleteItem
}) => {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [showBeforeAfter, setShowBeforeAfter] = useState(false); // For cover-ups
  const [beforeSplit, setBeforeSplit] = useState(50); // Slider percentage
  const [subImageIndex, setSubImageIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  useEffect(() => {
    // Reset zoom and view states when item changes
    setZoomLevel(1);
    setShowBeforeAfter(false);
    setBeforeSplit(50);
    setSubImageIndex(0);
  }, [item?.id]);

  // Lock background body scroll while modal is open
  useEffect(() => {
    if (isOpen) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, item, items]);

  if (!isOpen || !item) return null;

  const currentIndex = items.findIndex(i => i.id === item.id);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < items.length - 1;

  const handlePrev = () => {
    if (hasPrev) {
      onSelect(items[currentIndex - 1]);
    }
  };

  const handleNext = () => {
    if (hasNext) {
      onSelect(items[currentIndex + 1]);
    }
  };

  // Touch Swipe Handlers for Mobile with Horizontal vs Vertical Discrimination
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
    touchStartY.current = e.targetTouches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const endX = e.changedTouches[0].clientX;
    const endY = e.changedTouches[0].clientY;
    const diffX = touchStartX.current - endX;
    const diffY = touchStartY.current - endY;

    // Only swipe to next/previous photo if horizontal gesture is clearly dominant
    // This leaves natural vertical scrolling 100% unimpeded
    if (Math.abs(diffX) > Math.abs(diffY) * 1.5 && Math.abs(diffX) > 45) {
      if (diffX > 0 && hasNext) {
        handleNext();
      } else if (diffX < 0 && hasPrev) {
        handlePrev();
      }
    }
    touchStartX.current = null;
    touchStartY.current = null;
  };

  const toggleZoom = () => {
    setZoomLevel(prev => (prev === 1 ? 1.8 : 1));
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[70] overflow-y-auto bg-black/95 backdrop-blur-md"
      id="tattoo-lightbox"
    >
      {/* Sticky Top Bar Controls */}
      <div className="sticky top-0 z-40 w-full bg-[#050813]/90 backdrop-blur-md border-b border-cyan-500/30 px-3 py-2.5 sm:px-6 flex items-center justify-between shadow-[0_4px_20px_rgba(0,0,0,0.8)]">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs px-2.5 py-1 rounded-lg bg-cyan-950/90 border border-cyan-400/50 text-cyan-300 font-bold shadow-[0_0_10px_rgba(0,240,255,0.2)]">
            {currentIndex + 1} / {items.length}
          </span>
          <span className="font-heading text-xs uppercase tracking-wider text-gray-200 hidden sm:inline font-bold">
            {item.categoryLabel}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {item.beforeImageUrl && (
            <button
              onClick={() => setShowBeforeAfter(!showBeforeAfter)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition border ${
                showBeforeAfter
                  ? 'bg-cyan-500 text-black border-cyan-400 shadow-[0_0_12px_#00f0ff]'
                  : 'bg-cyan-950/80 text-cyan-300 border-cyan-500/40 hover:bg-cyan-900/80'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">{showBeforeAfter ? 'Standard View' : 'Before/After'}</span>
            </button>
          )}

          <button
            onClick={toggleZoom}
            className="p-2 rounded-lg bg-gray-900/90 border border-gray-700 hover:border-cyan-400 text-gray-300 hover:text-cyan-300 transition"
            title={zoomLevel === 1 ? 'Zoom In' : 'Zoom Out'}
          >
            {zoomLevel === 1 ? <ZoomIn className="w-4 h-4" /> : <ZoomOut className="w-4 h-4" />}
          </button>

          <button
            onClick={onClose}
            aria-label="Close Lightbox"
            className="p-2 rounded-lg bg-red-950/80 border border-red-500/60 hover:bg-red-900 text-red-300 hover:text-white transition shadow-[0_0_10px_rgba(255,0,0,0.3)]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Floating Previous & Next Navigation Arrows */}
      {hasPrev && (
        <button
          onClick={handlePrev}
          aria-label="Previous tattoo"
          className="fixed left-2 sm:left-6 top-1/2 -translate-y-1/2 z-40 p-2.5 sm:p-3 rounded-full bg-black/70 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-950 hover:border-cyan-400 transition shadow-[0_0_15px_rgba(0,240,255,0.4)]"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
      )}

      {hasNext && (
        <button
          onClick={handleNext}
          aria-label="Next tattoo"
          className="fixed right-2 sm:right-6 top-1/2 -translate-y-1/2 z-40 p-2.5 sm:p-3 rounded-full bg-black/70 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-950 hover:border-cyan-400 transition shadow-[0_0_15px_rgba(0,240,255,0.4)]"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      )}

      {/* Main Scrollable Content Area */}
      <div
        className="max-w-4xl mx-auto px-3 sm:px-6 py-4 flex flex-col items-center min-h-[calc(100vh-60px)] pb-24 sm:pb-16"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Image Container with Zoom & Cover-Up Split */}
        <div className="relative w-full flex items-center justify-center rounded-2xl border-2 border-cyan-500/40 bg-[#04060c] overflow-hidden shadow-[0_0_35px_rgba(0,240,255,0.15)] my-2">
          {showBeforeAfter && item.beforeImageUrl ? (
            /* Interactive Before/After Split Comparison */
            <div className="relative w-full h-[55vh] sm:h-[65vh] max-w-2xl select-none overflow-hidden">
              {/* After Image (Full Background) */}
              <img
                src={item.imageUrl}
                alt="After Cover-Up by Tex"
                className="absolute inset-0 w-full h-full object-contain"
              />
              {/* Before Image (Clipped Left Side) */}
              <div
                className="absolute inset-0 overflow-hidden"
                style={{ width: `${beforeSplit}%` }}
              >
                <img
                  src={item.beforeImageUrl}
                  alt="Original tattoo before cover-up"
                  className="absolute inset-0 w-full h-full object-contain max-w-none"
                  style={{ width: '100%', height: '100%' }}
                />
                <span className="absolute bottom-3 left-3 px-2 py-1 bg-red-950/80 border border-red-500/60 font-mono text-[11px] text-red-300 font-bold rounded">
                  BEFORE
                </span>
              </div>
              <span className="absolute bottom-3 right-3 px-2 py-1 bg-cyan-950/80 border border-cyan-500/60 font-mono text-[11px] text-cyan-300 font-bold rounded">
                AFTER (TEX)
              </span>

              {/* Slider Handle Divider */}
              <div
                className="absolute top-0 bottom-0 w-1 bg-cyan-400 shadow-[0_0_10px_#00f0ff] cursor-ew-resize flex items-center justify-center"
                style={{ left: `${beforeSplit}%` }}
              >
                <div className="w-7 h-7 rounded-full bg-black border-2 border-cyan-400 flex items-center justify-center text-cyan-400 text-xs font-mono">
                  ↔
                </div>
              </div>

              {/* Slider Touch / Drag overlay */}
              <input
                type="range"
                min="0"
                max="100"
                value={beforeSplit}
                onChange={e => setBeforeSplit(Number(e.target.value))}
                className="absolute inset-0 opacity-0 cursor-ew-resize w-full h-full"
              />
            </div>
          ) : (
            /* Standard Full High-Res Lightbox Image */
            <div className="w-full flex flex-col items-center justify-center overflow-auto p-1 sm:p-2">
              <MediaRenderer
                src={subImageIndex === 0 ? item.imageUrl : (item.additionalImages?.[subImageIndex - 1] || item.imageUrl)}
                alt={item.title}
                className="max-h-[60vh] sm:max-h-[70vh] w-auto max-w-full object-contain transition-transform duration-300 cursor-zoom-in rounded-xl"
                style={{ transform: `scale(${zoomLevel})` }}
                onClick={toggleZoom}
              />
              
              {/* Thumbnail Strip for multiple images */}
              {item.additionalImages && item.additionalImages.length > 0 && !showBeforeAfter && (
                <div className="flex gap-2 mt-4 overflow-x-auto max-w-full pb-2 scrollbar-thin px-2 justify-center">
                  <button
                    onClick={() => setSubImageIndex(0)}
                    className={`shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition ${subImageIndex === 0 ? 'border-cyan-400 opacity-100 shadow-[0_0_10px_#00f0ff]' : 'border-transparent opacity-50 hover:opacity-100'}`}
                  >
                    <MediaRenderer src={item.imageUrl} alt="Main" className="w-full h-full object-cover" />
                  </button>
                  {item.additionalImages.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSubImageIndex(idx + 1)}
                      className={`shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition ${subImageIndex === idx + 1 ? 'border-cyan-400 opacity-100 shadow-[0_0_10px_#00f0ff]' : 'border-transparent opacity-50 hover:opacity-100'}`}
                    >
                      <MediaRenderer src={img} alt={`Additional ${idx + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Scrollable Bottom Details Drawer */}
        <div className="w-full mt-3 p-4 sm:p-5 rounded-2xl bg-[#091122]/95 border-2 border-cyan-500/40 backdrop-blur-md text-left flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-[0_0_25px_rgba(0,240,255,0.2)]">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-heading font-black text-base sm:text-xl text-white">
                {item.title}
              </h3>
              {item.clientName && (
                <span className="px-2 py-0.5 rounded bg-emerald-900/60 text-emerald-300 border border-emerald-400/50 font-mono text-[10px] font-bold uppercase">
                  Client: {item.clientName}
                </span>
              )}
              {item.isCoverUp && (
                <span className="px-2 py-0.5 rounded bg-blue-900/80 text-cyan-300 border border-cyan-400/50 font-mono text-[10px] font-bold">
                  COVER-UP
                </span>
              )}
            </div>

            <p className="text-xs sm:text-sm text-gray-300 mt-2 leading-relaxed">
              {item.description}
            </p>

            <div className="flex flex-wrap items-center gap-2.5 mt-3 text-xs text-gray-300 font-mono">
              {item.placement && (
                <span className="flex items-center gap-1.5 text-cyan-300 font-semibold px-2.5 py-1 rounded-lg bg-cyan-950/60 border border-cyan-500/30">
                  <Tag className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{item.placement}</span>
                </span>
              )}
              {item.sessionHours && (
                <span className="flex items-center gap-1.5 text-gray-200 px-2.5 py-1 rounded-lg bg-black/60 border border-gray-700">
                  <Clock className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Approx {item.sessionHours} hrs @ $100/hr</span>
                </span>
              )}
              <span className="text-gray-400">• Winchester, VA (Tex)</span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0 w-full sm:w-auto">
            {isAdmin && onDeleteItem && (
              <button
                type="button"
                onClick={() => {
                  onDeleteItem(item.id);
                  onClose();
                }}
                className="flex items-center justify-center gap-1.5 px-3.5 py-3 rounded-xl bg-red-950/80 border border-red-500/60 text-red-400 hover:text-white hover:bg-red-900 transition text-xs font-mono shrink-0"
                title="Delete this piece from studio portfolio"
              >
                <Trash2 className="w-4 h-4" />
                <span className="hidden sm:inline">Delete Piece</span>
              </button>
            )}
            <button
              onClick={() => {
                onClose();
                onBookSimilar(item);
              }}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-black font-heading font-black text-xs uppercase tracking-wider hover:opacity-95 transition shadow-[0_0_20px_rgba(0,240,255,0.4)] active:scale-95"
            >
              <Sparkles className="w-4 h-4" />
              <span>Inquire Similar Piece</span>
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
