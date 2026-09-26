import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  Calendar,
  ChevronRight,
  ShieldCheck,
  Zap,
  ArrowRight,
  Layers,
  HeartHandshake,
  Radio,
  X,
  Volume2,
  VolumeX,
  Eye
} from 'lucide-react';
import { BustedLightbulbIcon } from './BustedLightbulbIcon';
import { SplashScreenSettings, SplashScreenScene, ShowcasePhoto } from '../types';

interface MatrixSplashScreenProps {
  settings: SplashScreenSettings;
  onEnter: (destinationTab?: string) => void;
  isPreview?: boolean;
  onClosePreview?: () => void;
}

export const MatrixSplashScreen: React.FC<MatrixSplashScreenProps> = ({
  settings,
  onEnter,
  isPreview = false,
  onClosePreview
}) => {
  const [currentSceneIdx, setCurrentSceneIdx] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [activePhotoIdx, setActivePhotoIdx] = useState<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const scenes = settings.scenes && settings.scenes.length > 0 ? settings.scenes : [];
  const currentScene: SplashScreenScene | undefined = scenes[currentSceneIdx] || scenes[0];
  const photos = settings.showcasePhotos && settings.showcasePhotos.length > 0 ? settings.showcasePhotos : [];

  // Splitting photos into two columns for the dual-feed infinite stream
  const col1Photos = photos.filter((_, i) => i % 2 === 0);
  const col2Photos = photos.filter((_, i) => i % 2 !== 0);
  // Guarantee photos in both columns
  const finalCol1 = col1Photos.length > 0 ? col1Photos : photos;
  const finalCol2 = col2Photos.length > 0 ? col2Photos : photos;

  // Keyboard shortcut: Press Escape, Enter, or Space to instantly enter studio
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === 'Escape') {
        onEnter('home');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onEnter]);

  // Auto-advance scenes every 5.5 seconds unless user is hovering/interacting
  useEffect(() => {
    if (isPaused || scenes.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentSceneIdx(prev => (prev + 1) % scenes.length);
    }, 5500);
    return () => clearInterval(timer);
  }, [isPaused, scenes.length]);

  // HTML5 Canvas Electric Cyan Matrix Rain Engine
  useEffect(() => {
    if (!settings.showMatrixRain) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let width = 0;
    let height = 0;

    const chars = '01ｱｲｳｴｵｶｷｹｺｻｼｽｾｿﾀﾂﾃﾅﾆﾇﾈﾊﾋﾎﾏﾐﾑﾒﾔﾕﾗﾘﾜ987654321⚡💀⚔️';
    const fontSize = 14;
    let columns = 0;
    let drops: number[] = [];

    const handleResize = () => {
      const parent = containerRef.current || canvas.parentElement;
      if (!parent) return;
      width = parent.clientWidth;
      height = parent.clientHeight;
      canvas.width = width;
      canvas.height = height;
      columns = Math.floor(width / fontSize);
      drops = [];
      for (let i = 0; i < columns; i++) {
        drops[i] = Math.floor(Math.random() * -50);
      }
    };

    handleResize();
    const observer = new ResizeObserver(() => {
      requestAnimationFrame(() => {
        handleResize();
      });
    });
    if (containerRef.current) observer.observe(containerRef.current);

    // Matrix Rain Frame Loop
    const speedFactor = Math.max(1, Math.min(5, settings.matrixSpeed || 3));
    let frameCount = 0;

    const render = () => {
      frameCount++;
      const frameSkip = speedFactor === 1 ? 4 : speedFactor === 2 ? 3 : speedFactor === 3 ? 2 : 1;

      if (frameCount % frameSkip === 0) {
        // Semi-transparent fade trail
        ctx.fillStyle = 'rgba(4, 6, 12, 0.22)';
        ctx.fillRect(0, 0, width, height);

        ctx.font = `${fontSize}px monospace`;

        for (let i = 0; i < drops.length; i++) {
          const char = chars[Math.floor(Math.random() * chars.length)];
          const x = i * fontSize;
          const y = drops[i] * fontSize;

          // Electric cyan & white glowing drop heads
          const isGlowHead = Math.random() > 0.85;
          if (isGlowHead) {
            ctx.fillStyle = '#ffffff';
            ctx.shadowColor = '#00ffff';
            ctx.shadowBlur = 10;
          } else {
            ctx.fillStyle = '#00f0ff';
            ctx.shadowColor = '#00a3ff';
            ctx.shadowBlur = 4;
          }

          ctx.fillText(char, x, y);

          // Reset glow
          ctx.shadowBlur = 0;

          if (y > height && Math.random() > 0.975) {
            drops[i] = 0;
          }
          drops[i]++;
        }
      }

      animationId = requestAnimationFrame(render);
    };

    animationId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationId);
      observer.disconnect();
    };
  }, [settings.showMatrixRain, settings.matrixSpeed]);

  const handleCtaAction = (action: string) => {
    if (action === 'booking') {
      onEnter('booking');
    } else if (action === 'gallery') {
      onEnter('gallery');
    } else {
      onEnter('home');
    }
  };

  return (
    <div
      ref={containerRef}
      id="matrix-cyberpunk-splash"
      className={`relative select-none bg-[#03050c] text-white flex flex-col justify-between overflow-y-auto overflow-x-hidden ${
        isPreview
          ? 'w-full h-full min-h-[580px] rounded-2xl border-2 border-cyan-400/50 shadow-[0_0_30px_rgba(0,240,255,0.3)]'
          : 'w-full h-full min-h-screen'
      }`}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
      onClick={(e) => {
        // If user clicks on the backdrop canvas outside buttons, enter studio
        const target = e.target as HTMLElement;
        if (target.id === 'matrix-cyberpunk-splash' || target.tagName === 'CANVAS') {
          onEnter('home');
        }
      }}
    >
      {/* 1. DUAL-COLUMN SCROLLING SHOWCASE FEED */}
      {settings.showDualFeed && (
        <div
          className="absolute inset-0 pointer-events-none grid grid-cols-2 gap-3 sm:gap-6 px-3 sm:px-8 z-0 overflow-hidden"
          style={{ opacity: (settings.artworkVisibility || 65) / 100 }}
        >
          {/* Column 1 - Downward continuous scroll */}
          <div className="flex flex-col gap-4 animate-scroll-vertical-down">
            {[...finalCol1, ...finalCol1, ...finalCol1].map((photo, idx) => (
              <div
                key={`col1-${photo.id}-${idx}`}
                className="relative rounded-xl overflow-hidden border border-cyan-500/30 bg-[#0a1122]/90 shadow-[0_4px_20px_rgba(0,0,0,0.6)] group"
              >
                <img
                  src={photo.url}
                  alt={photo.caption}
                  className="w-full h-44 sm:h-64 object-cover filter saturate-125 contrast-110"
                  loading="eager"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80" />
                <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                  <span className="text-[10px] sm:text-xs font-mono font-bold text-cyan-300 truncate drop-shadow">
                    {photo.caption}
                  </span>
                  {photo.category && (
                    <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-cyan-950/80 border border-cyan-400/50 text-cyan-400">
                      {photo.category}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Column 2 - Upward continuous scroll */}
          <div className="flex flex-col gap-4 animate-scroll-vertical-up">
            {[...finalCol2, ...finalCol2, ...finalCol2].map((photo, idx) => (
              <div
                key={`col2-${photo.id}-${idx}`}
                className="relative rounded-xl overflow-hidden border border-cyan-500/30 bg-[#0a1122]/90 shadow-[0_4px_20px_rgba(0,0,0,0.6)] group"
              >
                <img
                  src={photo.url}
                  alt={photo.caption}
                  className="w-full h-44 sm:h-64 object-cover filter saturate-125 contrast-110"
                  loading="eager"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80" />
                <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                  <span className="text-[10px] sm:text-xs font-mono font-bold text-cyan-300 truncate drop-shadow">
                    {photo.caption}
                  </span>
                  {photo.category && (
                    <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-blue-950/80 border border-blue-400/50 text-blue-300">
                      {photo.category}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. HTML5 MATRIX RAIN CANVAS */}
      {settings.showMatrixRain && (
        <canvas
          ref={canvasRef}
          className="absolute inset-0 pointer-events-none z-10 opacity-70 mix-blend-screen"
        />
      )}

      {/* 3. SOFT RADIAL DARK OVERLAY (Ensures artwork visibility + pristine text contrast) */}
      <div
        className="absolute inset-0 pointer-events-none z-20"
        style={{
          background: `radial-gradient(ellipse at center, rgba(3, 7, 18, ${
            (settings.overlayDarkness || 35) / 100 * 0.8
          }) 0%, rgba(2, 4, 10, ${Math.min(0.97, ((settings.overlayDarkness || 35) / 100) + 0.4)}) 100%)`
        }}
      />

      {/* 4. SUBTLE CRT SCANLINES OVERLAY */}
      {settings.showScanlines && (
        <div
          className="absolute inset-0 pointer-events-none z-25 opacity-20"
          style={{
            backgroundImage:
              'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.7) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.04), rgba(0, 255, 0, 0.01), rgba(0, 0, 255, 0.04))',
            backgroundSize: '100% 4px, 6px 100%'
          }}
        />
      )}

      {/* 5. TOP BAR ACTIONS: Studio Emblem, Verified Artist & Direct Skip */}
      <header className="sticky top-0 z-40 p-2.5 sm:p-5 flex items-center justify-between bg-black/70 backdrop-blur-md border-b border-cyan-500/20">
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
          <div className="w-8 h-8 sm:w-11 sm:h-11 rounded-xl bg-black/80 border-2 border-cyan-400 flex items-center justify-center text-cyan-300 shadow-[0_0_15px_#00f0ff] shrink-0">
            <BustedLightbulbIcon size={22} glow={true} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="font-heading font-black text-xs sm:text-base tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-white to-cyan-200">
                LIGHTS OUT
              </span>
              <span className="text-[8px] sm:text-[9px] font-mono px-1.5 py-0.2 rounded bg-cyan-950 border border-cyan-400 text-cyan-300 font-bold shrink-0">
                TATTOO
              </span>
            </div>
            <p className="text-[9px] sm:text-[10px] font-tech text-cyan-300/80 flex items-center gap-1 min-w-0">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping shrink-0" />
              <span className="truncate">Winchester, VA • Lead Artist Tex</span>
            </p>
          </div>
        </div>
        {/* Action Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {isPreview && onClosePreview && (
            <button
              onClick={onClosePreview}
              className="p-2 rounded-xl bg-gray-900/90 border border-gray-700 text-gray-300 hover:text-white hover:border-red-500 transition"
              title="Close Preview"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={() => onEnter('home')}
            id="splash-skip-to-studio"
            className="flex items-center gap-1.5 sm:gap-2 px-3.5 py-1.5 sm:px-5 sm:py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-black text-xs sm:text-sm font-heading font-black tracking-wider transition shadow-[0_0_20px_rgba(0,240,255,0.9)] hover:scale-105 active:scale-95 shrink-0"
            title="Enter Lights Out Tattoo Studio"
          >
            <span>ENTER STUDIO</span>
            <ArrowRight className="w-4 h-4 text-black stroke-[3]" />
          </button>
        </div>
      </header>

      {/* 6. CENTER ANIMATED SCENE OVERLAYS (motion/react) */}
      <div className="relative z-30 flex-1 flex flex-col justify-center items-center px-3 sm:px-8 py-3 sm:py-6 max-w-4xl mx-auto w-full text-center">
        <AnimatePresence mode="wait">
          {currentScene && (
            <motion.div
              key={currentScene.id}
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.98 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className="space-y-2 sm:space-y-3.5 w-full flex flex-col items-center my-auto"
            >
              {/* Profile Avatar */}
              <div className="relative mb-3 sm:mb-5 mt-2 flex justify-center w-full">
                <div className="absolute inset-0 bg-cyan-400 rounded-full animate-pulse opacity-20 blur-xl scale-110" />
                <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-full overflow-hidden border-2 border-cyan-400 p-0.5 shadow-[0_0_25px_rgba(0,240,255,0.5)] relative z-10 bg-black">
                  <img 
                    src={settings.avatarUrl || 'https://images.unsplash.com/photo-1598371839696-5c5bb00bdc28?auto=format&fit=crop&w=300&q=80'} 
                    alt="Profile Avatar" 
                    className="w-full h-full object-cover rounded-full"
                  />
                </div>
              </div>

              {/* Scene Badge */}
              <div className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-black/80 border border-cyan-400/80 text-cyan-300 text-[9px] sm:text-xs font-mono font-bold tracking-wider shadow-[0_0_12px_rgba(0,240,255,0.3)]">
                <Zap className="w-3 h-3 text-cyan-400 animate-pulse" />
                <span>{currentScene.badge}</span>
              </div>

              {/* Scene Main Title */}
              <h1 className="font-heading font-black text-lg sm:text-3xl md:text-4xl text-white tracking-tight leading-tight uppercase max-w-3xl drop-shadow-[0_4px_25px_rgba(0,0,0,0.9)]">
                {currentScene.title}
              </h1>

              {/* Scene Subtitle */}
              <p className="font-tech text-xs sm:text-base md:text-lg text-gray-200 max-w-2xl leading-relaxed drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">
                {currentScene.subtitle}
              </p>

              {/* Bullet Points */}
              {currentScene.bulletPoints && currentScene.bulletPoints.length > 0 && (
                <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-1.5 sm:gap-3 pt-0.5 max-w-3xl">
                  {currentScene.bulletPoints.map((bullet, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/70 border border-cyan-500/40 text-left text-[11px] sm:text-xs font-mono text-cyan-200 backdrop-blur-sm shadow-[0_0_10px_rgba(0,0,0,0.5)]"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span>{bullet}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* High-Impact Interactive CTA Buttons */}
              <div className="pt-2 sm:pt-3 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3 w-full max-w-md">
                <button
                  onClick={() => handleCtaAction(currentScene.ctaAction)}
                  id="splash-primary-cta"
                  className="w-full sm:w-auto flex-1 px-5 py-2.5 sm:py-3 rounded-xl bg-gradient-to-r from-cyan-500 via-cyan-400 to-blue-500 text-black font-heading font-black text-xs sm:text-sm uppercase tracking-wider hover:opacity-95 transition transform active:scale-95 shadow-[0_0_20px_rgba(0,240,255,0.7)] flex items-center justify-center gap-2"
                >
                  <Zap className="w-3.5 h-3.5 fill-black" />
                  <span>{currentScene.ctaText}</span>
                </button>

                <button
                  onClick={() => onEnter('booking')}
                  id="splash-book-now-btn"
                  className="w-full sm:w-auto px-4 py-2.5 sm:py-3 rounded-xl bg-black/80 hover:bg-cyan-950 border border-cyan-400 text-cyan-300 font-mono font-bold text-xs uppercase tracking-wider transition flex items-center justify-center gap-1.5 shadow-[0_0_12px_rgba(0,240,255,0.3)]"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Book (-15%)</span>
                </button>
              </div>

              {/* Subtle tap to enter hint */}
              <p className="text-[10px] font-mono text-cyan-400/60 pt-0.5 cursor-pointer hover:text-cyan-300 transition" onClick={() => onEnter('home')}>
                [ Click anywhere or press Enter to skip to studio ]
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 7. BOTTOM BAR: Scene Navigation Dots & Quick Feature Shortcuts */}
      <footer className="sticky bottom-0 z-40 p-2 sm:p-3.5 flex flex-col sm:flex-row items-center justify-between gap-2 border-t border-cyan-500/20 bg-black/70 backdrop-blur-md">
        {/* Scene Indicator Dots */}
        <div className="flex items-center gap-2">
          {scenes.map((scene, idx) => (
            <button
              key={scene.id}
              onClick={() => setCurrentSceneIdx(idx)}
              className={`transition-all rounded-full ${
                currentSceneIdx === idx
                  ? 'w-7 h-2 bg-cyan-400 shadow-[0_0_10px_#00f0ff]'
                  : 'w-2 h-2 bg-gray-600 hover:bg-gray-400'
              }`}
              aria-label={`Jump to scene ${idx + 1}`}
            />
          ))}
          <span className="text-[10px] font-mono text-gray-400 ml-1.5">
            0{currentSceneIdx + 1} / 0{scenes.length}
          </span>
        </div>

        {/* Interactive Quick Links into Specific Studio Sections + Direct Enter Button */}
        <div className="flex items-center gap-2 sm:gap-3 text-xs font-mono">
          <button
            onClick={() => onEnter('gallery')}
            className="text-gray-300 hover:text-cyan-300 transition underline-offset-4 hover:underline text-[11px] sm:text-xs"
          >
            Flash Vault
          </button>
          <span className="text-gray-600">•</span>
          <button
            onClick={() => onEnter('reels')}
            className="text-gray-300 hover:text-cyan-300 transition underline-offset-4 hover:underline text-[11px] sm:text-xs"
          >
            TikTok Reels
          </button>
          <span className="text-gray-600">•</span>
          <button
            onClick={() => onEnter('map')}
            className="text-gray-300 hover:text-cyan-300 transition underline-offset-4 hover:underline text-[11px] sm:text-xs"
          >
            100-Mile Radius
          </button>
          <button
            onClick={() => onEnter('home')}
            className="ml-1 px-2.5 py-1 rounded-lg bg-cyan-950 border border-cyan-400 text-cyan-300 text-[11px] font-heading font-bold hover:bg-cyan-900 transition flex items-center gap-1 shadow-[0_0_10px_rgba(0,240,255,0.3)]"
          >
            <span>Enter App</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </footer>

      {/* Custom Keyframe Styles for Continuous Dual-Column Streaming */}
      <style>{`
        @keyframes scrollVerticalDown {
          0% { transform: translateY(-50%); }
          100% { transform: translateY(0%); }
        }
        @keyframes scrollVerticalUp {
          0% { transform: translateY(0%); }
          100% { transform: translateY(-50%); }
        }
        .animate-scroll-vertical-down {
          animation: scrollVerticalDown 45s linear infinite;
        }
        .animate-scroll-vertical-up {
          animation: scrollVerticalUp 45s linear infinite;
        }
        .animate-scroll-vertical-down:hover,
        .animate-scroll-vertical-up:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
};
