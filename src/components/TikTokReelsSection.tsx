import React, { useState, useRef, useEffect } from 'react';
import {
  Play,
  Pause,
  Heart,
  MessageCircle,
  Share2,
  PlusCircle,
  Volume2,
  VolumeX,
  Sparkles,
  Flame,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Calendar,
  Image as ImageIcon,
  Calculator,
  Maximize2,
  X,
  Radio,
  Check,
  ExternalLink,
  Link as LinkIcon,
  Trash2,
  AlertCircle,
  Film
} from 'lucide-react';
import { TikTokReel } from '../types';
import { storageService } from '../services/storage';

interface TikTokReelsSectionProps {
  reels: TikTokReel[];
  onAddReelPrompt: () => void;
  onOpenStudioRecorder?: () => void;
  onNavigate?: (tab: string) => void;
}

// Only extract authentic TikTok video IDs (15-22 digits)
function extractTikTokVideoId(reel?: TikTokReel): string | null {
  if (!reel) return null;
  if (reel.videoId && /^\d{15,22}$/.test(reel.videoId)) {
    return reel.videoId;
  }
  const target = reel.embedLink || reel.tiktokUrl || reel.videoUrl || '';
  const match =
    target.match(/\/video\/(\d{15,22})/) ||
    target.match(/\/v2\/(\d{15,22})/) ||
    target.match(/embed\/(\d{15,22})/) ||
    target.match(/v\/(\d{15,22})/);
  if (match) return match[1];
  return null;
}

export const TikTokReelsSection: React.FC<TikTokReelsSectionProps> = ({
  reels: initialReels,
  onAddReelPrompt,
  onOpenStudioRecorder,
  onNavigate
}) => {
  // Live TikTok Feed State
  const [liveReels, setLiveReels] = useState<TikTokReel[]>([]);
  const [isLoadingLive, setIsLoadingLive] = useState(false);
  const [liveConnected, setLiveConnected] = useState(false);
  const [liveAccount, setLiveAccount] = useState<any>(null);

  // In-App Display & Pagination (Start by displaying the last 3 posted TikToks)
  const [visibleCount, setVisibleCount] = useState<number>(3);
  const [activeReelIndex, setActiveReelIndex] = useState(0);
  const [likesMap, setLikesMap] = useState<Record<string, number>>({});
  const [isLikedMap, setIsLikedMap] = useState<Record<string, boolean>>({});
  const [copiedLink, setCopiedLink] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [inAppInteractiveEmbed, setInAppInteractiveEmbed] = useState(false);
  const [isTheaterModalOpen, setIsTheaterModalOpen] = useState(false);
  const [statusNotification, setStatusNotification] = useState<string | null>(null);

  // Quick Paste TikTok URL Modal State
  const [isPasteModalOpen, setIsPasteModalOpen] = useState(false);
  const [pasteUrl, setPasteUrl] = useState('');
  const [isPulling, setIsPulling] = useState(false);
  const [pasteError, setPasteError] = useState<string | null>(null);

  // View Mode: Studio Reels Player vs Official Creator Embed
  const [viewMode, setViewMode] = useState<'player' | 'creator_embed'>('player');

  const videoRef = useRef<HTMLVideoElement | null>(null);

  const showToast = (msg: string) => {
    setStatusNotification(msg);
    setTimeout(() => setStatusNotification(null), 4000);
  };

  // Fetch live TikTok stream from authenticated backend API
  const fetchLiveTikTokFeed = async () => {
    setIsLoadingLive(true);
    try {
      const res = await fetch('/api/tiktok/videos');
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.videos) && data.videos.length > 0) {
          setLiveReels(data.videos);
          setLiveConnected(Boolean(data.liveConnected));
          if (data.user) setLiveAccount(data.user);
        }
      }
    } catch (err) {
      console.warn('Live TikTok feed sync status:', err);
    } finally {
      setIsLoadingLive(false);
    }
  };

  useEffect(() => {
    fetchLiveTikTokFeed();
  }, []);

  // One-click Phone Cache Invalidation: Wipes old dog video & re-syncs
  const handlePurgeAndSync = () => {
    try {
      storageService.purgeReelsCache();
      fetchLiveTikTokFeed();
      setActiveReelIndex(0);
      setInAppInteractiveEmbed(false);
      showToast('⚡ Device cache cleared! Synced with @lightsouttattoo.site.');
    } catch {
      showToast('Cache refreshed.');
    }
  };

  // Merge live streamed reels at the very top of the showcase
  const combinedReels: TikTokReel[] = React.useMemo(() => {
    const source = liveReels.length > 0 ? liveReels : initialReels;
    // Filter out any dog or mock video relics
    return source.filter(r => {
      const isDog = r.title?.toLowerCase().includes('scramble') ||
                    r.caption?.toLowerCase().includes('scout') ||
                    r.caption?.toLowerCase().includes('petsoftiktok') ||
                    r.videoId === '6718335390845095173';
      return !isDog;
    });
  }, [liveReels, initialReels]);

  // Constrain visible reels to current count (default 3)
  const visibleReels = combinedReels.slice(0, visibleCount);
  const currentReel = combinedReels[activeReelIndex] || combinedReels[0];
  const tikTokVideoId = extractTikTokVideoId(currentReel);

  // Check if current reel is a direct video file (mp4, webm, blob, /uploads/)
  const isDirectVideo = Boolean(
    currentReel?.videoUrl && (
      currentReel.videoUrl.startsWith('blob:') ||
      currentReel.videoUrl.startsWith('data:video') ||
      currentReel.videoUrl.startsWith('media://') ||
      currentReel.videoUrl.startsWith('/uploads/') ||
      currentReel.videoUrl.match(/\.(mp4|webm|ogg|mov|m4v)(\?.*)?$/i)
    )
  );

  // When active reel changes, play direct video if applicable
  useEffect(() => {
    if (isDirectVideo && videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    }
  }, [activeReelIndex, isDirectVideo]);

  const togglePlayPause = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
    }
    setIsMuted(!isMuted);
  };

  const handleLike = (id: string, initialLikes: number) => {
    const isLiked = !!isLikedMap[id];
    setIsLikedMap(prev => ({ ...prev, [id]: !isLiked }));
    setLikesMap(prev => ({
      ...prev,
      [id]: (prev[id] ?? initialLikes) + (isLiked ? -1 : 1)
    }));
  };

  const handleShare = () => {
    const shareTarget = currentReel?.tiktokUrl || ('https://www.tiktok.com/@lightsouttattoo.site');
    navigator.clipboard?.writeText(shareTarget);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
    showToast('Tattoo Reel Link copied to clipboard!');
  };

  const handleLoadMore = () => {
    setVisibleCount(prev => Math.min(prev + 3, combinedReels.length));
  };

  const handleShowLess = () => {
    setVisibleCount(3);
  };

  // Handle Quick Paste & Import of a Real TikTok Video Link
  const handleImportTikTokUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pasteUrl.trim()) return;

    setIsPulling(true);
    setPasteError(null);

    try {
      const res = await fetch('/api/tiktok/pull-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: pasteUrl.trim() })
      });

      const data = await res.json();
      if (data.success && data.reel) {
        // Save to storage
        storageService.addTikTokReel(data.reel);
        setLiveReels(prev => [data.reel, ...prev]);
        setActiveReelIndex(0);
        setInAppInteractiveEmbed(true);
        setPasteUrl('');
        setIsPasteModalOpen(false);
        showToast('🔥 Reel imported successfully!');
      } else {
        setPasteError(data.error || 'Failed to parse TikTok video. Please ensure the link is public.');
      }
    } catch (err: any) {
      setPasteError(err.message || 'Network error pulling TikTok video.');
    } finally {
      setIsPulling(false);
    }
  };

  return (
    <section className="py-6 px-3 sm:px-6 max-w-5xl mx-auto" id="tiktok-reels-section">
      {/* Toast Notification */}
      {statusNotification && (
        <div className="fixed top-20 right-4 z-[250] bg-cyan-950/95 border border-cyan-400 text-white px-4 py-2.5 rounded-xl shadow-[0_0_25px_rgba(0,240,255,0.4)] text-xs font-mono font-bold flex items-center gap-2 animate-bounce">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <span>{statusNotification}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs uppercase tracking-widest">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
            </span>
            <i className="fa-brands fa-tiktok text-cyan-400"></i>
            <span>Lights Out Tattoo Official TikTok Feed</span>
            {liveConnected && (
              <span className="px-2 py-0.5 rounded bg-emerald-950/90 border border-emerald-400 text-emerald-300 font-bold text-[10px]">
                LIVE SYNCED
              </span>
            )}
          </div>
          <h2 className="font-heading text-2xl sm:text-3xl font-black text-white mt-1">
            TIKTOK <span className="text-cyan-400">REELS SHOWCASE</span>
          </h2>
          <p className="text-xs sm:text-sm text-gray-300 mt-0.5">
            Watch in-progress realism needle work, stencil reveals, and fresh tattoo drops by Tex in Winchester, VA.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Quick Paste Video URL Button */}
          <button
            onClick={() => setIsPasteModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#fe2c55]/90 to-[#25f4ee]/90 text-white text-xs font-mono font-bold hover:brightness-110 transition shadow-[0_0_12px_rgba(254,44,85,0.3)]"
            title="Paste TikTok Video Link"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Paste Reel Link</span>
          </button>

          {/* Sync Live Button */}
          <button
            onClick={fetchLiveTikTokFeed}
            disabled={isLoadingLive}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-950/70 border border-cyan-400/40 text-cyan-300 text-xs font-mono font-bold hover:bg-cyan-900 transition"
            title="Refresh Live TikTok Feed"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingLive ? 'animate-spin text-cyan-400' : ''}`} />
            <span>{isLoadingLive ? 'Syncing...' : 'Sync Live'}</span>
          </button>

          {/* Purge Mobile Cache Button */}
          <button
            onClick={handlePurgeAndSync}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/70 border border-gray-700 hover:border-cyan-400 text-gray-300 hover:text-cyan-300 text-xs font-mono transition"
            title="Wipe stale cache from mobile/PWA browser"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Cache</span>
          </button>

          {onOpenStudioRecorder && (
            <button
              onClick={onOpenStudioRecorder}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-rose-950/90 to-purple-950/90 border border-rose-500/60 text-rose-200 text-xs font-mono font-bold hover:bg-rose-900 transition shadow-[0_0_12px_rgba(244,63,94,0.3)]"
            >
              <Radio className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
              <span>Studio REC</span>
            </button>
          )}
        </div>
      </div>

      {/* Creator Profile Bar */}
      <div className="mb-6 p-3 sm:p-4 rounded-2xl bg-gradient-to-r from-[#071326] via-[#050b18] to-[#0a1224] border border-cyan-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-[0_0_20px_rgba(0,240,255,0.08)]">
        <div className="flex items-center gap-3">
          <div className="relative shrink-0">
            <img
              src="/icon.png"
              alt="The Dirty Texan - Lights Out Tattoo"
              className="w-12 h-12 rounded-full object-cover border-2 border-cyan-400 p-0.5 bg-black"
            />
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-cyan-500 flex items-center justify-center text-black">
              <i className="fa-brands fa-tiktok text-[10px]"></i>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-heading font-black text-sm sm:text-base text-white">
                {liveAccount?.displayName || liveAccount?.display_name || 'The Dirty Texan'}
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-400/40 text-cyan-300 font-mono text-[11px] font-bold">
                @{liveAccount?.username || 'lightsouttattoo.site'}
              </span>
            </div>
            <p className="text-xs text-gray-300 italic font-serif mt-0.5">
              "{liveAccount?.bio || 'Lessons not learned in blood are soon forgotten'}"
            </p>
            <div className="flex items-center gap-3 mt-1 text-[11px] font-mono text-gray-400">
              <span className="text-cyan-300 font-bold">
                {liveAccount?.followers ? liveAccount.followers.toLocaleString() : '1,295'}{' '}
                <span className="text-gray-400 font-normal">Followers</span>
              </span>
              <span>•</span>
              <span className="text-cyan-300 font-bold">
                {liveAccount?.likes ? liveAccount.likes.toLocaleString() : '3,312'}{' '}
                <span className="text-gray-400 font-normal">Likes</span>
              </span>
              <span>•</span>
              <span className="text-gray-400">Winchester, VA</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <a
            href="https://www.tiktok.com/@lightsouttattoo.site?_r=1&_t=ZP-99sgWDIIL3X"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-gradient-to-r from-[#fe2c55] to-[#25f4ee] p-[1px] group transition hover:shadow-[0_0_15px_rgba(254,44,85,0.4)]"
          >
            <div className="px-3 py-1.5 rounded-[11px] bg-black group-hover:bg-transparent transition flex items-center justify-center gap-2 text-white font-heading font-bold text-xs">
              <i className="fa-brands fa-tiktok text-[#25f4ee] group-hover:text-white"></i>
              <span>Follow @lightsouttattoo.site</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-70 group-hover:opacity-100" />
            </div>
          </a>
        </div>
      </div>

      {/* Main Reels Theater / In-App Player */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
        {/* Featured Reel Player (9:16 Aspect Ratio) - 7 cols */}
        <div className="md:col-span-7 flex flex-col items-center">
          {currentReel && (
            <div className="relative w-full max-w-[340px] sm:max-w-[380px] aspect-[9/16] rounded-2xl bg-black border-2 border-cyan-400/60 shadow-[0_0_30px_rgba(0,240,255,0.25)] overflow-hidden flex flex-col justify-between p-3.5 group select-none">
              
              {/* Media Display: Direct Video vs In-App Embed vs Interactive Poster */}
              {isDirectVideo ? (
                <video
                  ref={videoRef}
                  src={currentReel.videoUrl}
                  poster={currentReel.thumbnailUrl}
                  playsInline
                  autoPlay
                  loop
                  muted={isMuted}
                  onClick={togglePlayPause}
                  className="absolute inset-0 w-full h-full object-cover cursor-pointer"
                />
              ) : inAppInteractiveEmbed && tikTokVideoId ? (
                /* IN-APP TIKTOK EMBED (Only when genuine video ID exists!) */
                <div className="absolute inset-0 w-full h-full bg-black overflow-hidden flex flex-col">
                  {/* Dismiss Embed Bar */}
                  <div className="relative z-30 p-2 bg-black/80 flex items-center justify-between text-xs font-mono text-cyan-300">
                    <span>TikTok Embed Player</span>
                    <button
                      onClick={() => setInAppInteractiveEmbed(false)}
                      className="px-2 py-0.5 rounded bg-cyan-950 border border-cyan-400 text-white"
                    >
                      Back to Poster
                    </button>
                  </div>
                  <iframe
                    key={`tiktok-embed-${tikTokVideoId}`}
                    src={`https://www.tiktok.com/embed/v2/${tikTokVideoId}`}
                    title={currentReel.title || 'TikTok Reel'}
                    className="w-full flex-1 border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                </div>
              ) : (
                /* Sleek Custom Studio Poster & Watch Controls (Never shows blank white screens!) */
                <div className="absolute inset-0 w-full h-full overflow-hidden">
                  <img
                    src={currentReel.thumbnailUrl}
                    alt={currentReel.caption}
                    className="w-full h-full object-cover filter contrast-110 brightness-90 group-hover:scale-105 transition-transform duration-700"
                  />
                  {/* Subtle Dark Gradient Overlay for optimal text legibility */}
                  <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/30 to-black/90 pointer-events-none" />

                  {/* Center Play & In-App Launch Actions */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center z-10">
                    <button
                      type="button"
                      onClick={() => {
                        if (isDirectVideo) {
                          togglePlayPause();
                        } else if (tikTokVideoId) {
                          setInAppInteractiveEmbed(true);
                        } else {
                          setIsPasteModalOpen(true);
                        }
                      }}
                      className="w-16 h-16 rounded-full bg-gradient-to-tr from-[#fe2c55] via-cyan-400 to-[#25f4ee] p-[2px] shadow-[0_0_30px_#00f0ff] hover:scale-110 transition-transform group/play cursor-pointer"
                    >
                      <div className="w-full h-full rounded-full bg-black/80 flex items-center justify-center text-white group-hover/play:bg-black/50 transition">
                        <Play className="w-7 h-7 fill-current ml-1 text-cyan-300" />
                      </div>
                    </button>

                    <div className="mt-4 flex flex-col items-center gap-2">
                      {tikTokVideoId ? (
                        <button
                          type="button"
                          onClick={() => setInAppInteractiveEmbed(true)}
                          className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-black font-heading font-black text-xs uppercase tracking-wide hover:brightness-110 transition shadow-[0_0_15px_rgba(0,240,255,0.4)] flex items-center gap-1.5 cursor-pointer"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>Play Video In-App</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setIsPasteModalOpen(true)}
                          className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#fe2c55] to-[#25f4ee] text-black font-heading font-black text-xs uppercase tracking-wide hover:brightness-110 transition shadow-lg flex items-center gap-1.5 cursor-pointer"
                        >
                          <PlusCircle className="w-3.5 h-3.5" />
                          <span>Link Real TikTok Video</span>
                        </button>
                      )}

                      {/* Optional external link to TikTok if client specifically wants to visit profile */}
                      <a
                        href={currentReel.tiktokUrl || 'https://www.tiktok.com/@lightsouttattoo.site'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] font-mono text-gray-400 hover:text-cyan-300 transition flex items-center gap-1 mt-1"
                      >
                        <span>Open on TikTok.com</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                </div>
              )}

              {/* Top Reel Info Strip */}
              <div className="relative z-20 flex items-center justify-between pointer-events-auto">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-cyan-500/30 border border-cyan-400 flex items-center justify-center">
                    <i className="fa-brands fa-tiktok text-cyan-300 text-xs"></i>
                  </div>
                  <div>
                    <div className="font-heading font-bold text-xs text-white">
                      The Dirty Texan
                    </div>
                    <div className="text-[10px] font-mono text-cyan-300">@lightsouttattoo.site</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {isDirectVideo && (
                    <button
                      onClick={toggleMute}
                      className="p-1.5 rounded-full bg-black/70 border border-cyan-400/40 text-cyan-300 hover:text-white transition"
                      title={isMuted ? 'Unmute' : 'Mute'}
                    >
                      {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />}
                    </button>
                  )}
                  <button
                    onClick={() => setIsTheaterModalOpen(true)}
                    className="p-1.5 rounded-full bg-black/70 border border-cyan-400/40 text-cyan-300 hover:text-white transition"
                    title="Fullscreen Theater"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                  </button>
                  <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-black/70 border border-cyan-500/40 text-cyan-300">
                    {currentReel.duration || '0:35'}
                  </span>
                </div>
              </div>

              {/* Right Vertical Action Rail */}
              <div className="absolute right-3 bottom-24 z-20 flex flex-col items-center gap-3.5 pointer-events-auto">
                {/* Like Button */}
                <button
                  onClick={() => handleLike(currentReel.id, currentReel.likes)}
                  className="flex flex-col items-center group/btn"
                >
                  <div
                    className={`p-2.5 rounded-full backdrop-blur-md border transition ${
                      isLikedMap[currentReel.id]
                        ? 'bg-rose-600 border-rose-400 text-white shadow-[0_0_15px_#f43f5e]'
                        : 'bg-black/70 border-gray-700 text-gray-200 group-hover/btn:border-cyan-400'
                    }`}
                  >
                    <Heart className={`w-5 h-5 ${isLikedMap[currentReel.id] ? 'fill-current' : ''}`} />
                  </div>
                  <span className="text-[10px] font-mono text-white font-bold mt-1">
                    {likesMap[currentReel.id] ?? currentReel.likes}
                  </span>
                </button>

                {/* Comment Counter */}
                <div className="flex flex-col items-center">
                  <div className="p-2.5 rounded-full bg-black/70 backdrop-blur-md border border-gray-700 text-gray-200">
                    <MessageCircle className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-mono text-white font-bold mt-1">
                    {currentReel.comments || 24}
                  </span>
                </div>

                {/* Share Link Button */}
                <button
                  onClick={handleShare}
                  title="Share Reel Link"
                  className={`p-2.5 rounded-full backdrop-blur-md border transition ${
                    copiedLink
                      ? 'bg-emerald-600 border-emerald-400 text-white'
                      : 'bg-black/70 border-gray-700 text-gray-200 hover:border-cyan-400'
                  }`}
                >
                  {copiedLink ? <Check className="w-5 h-5" /> : <Share2 className="w-5 h-5" />}
                </button>

                {/* Launch Directly on TikTok */}
                <a
                  href={currentReel.tiktokUrl || 'https://www.tiktok.com/@lightsouttattoo.site'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 rounded-full bg-black/70 backdrop-blur-md border border-cyan-400 text-[#25f4ee] hover:scale-110 transition shadow-md"
                  title="Open on TikTok"
                >
                  <i className="fa-brands fa-tiktok text-sm"></i>
                </a>
              </div>

              {/* Bottom Caption & Audio Strip */}
              <div className="relative z-20 pr-12 text-left pointer-events-auto">
                <h4 className="font-heading font-bold text-sm text-white line-clamp-1">
                  {currentReel.title}
                </h4>
                <p className="text-xs text-gray-200 mt-1 line-clamp-2">
                  {currentReel.caption}
                </p>
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {(currentReel.hashtags || ['lightsouttattoo', 'winchesterva', 'thedirtytexan']).map(t => (
                    <span key={t} className="text-[10px] font-mono text-cyan-300">
                      #{t.replace(/^#/, '')}
                    </span>
                  ))}
                </div>
                {currentReel.soundTitle && (
                  <div className="flex items-center gap-1.5 mt-2 text-[10px] font-mono text-gray-300">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
                    <span className="truncate">{currentReel.soundTitle}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Client Retention & Quick Conversion Action Strip */}
          <div className="w-full max-w-[340px] sm:max-w-[380px] mt-4 p-3 rounded-xl bg-[#080d1a] border border-cyan-500/40 shadow-lg space-y-2.5 text-left">
            <div className="flex items-center justify-between text-xs font-mono text-cyan-300">
              <span className="flex items-center gap-1.5 font-bold">
                <Flame className="w-3.5 h-3.5 text-rose-500" />
                <span>Love this tattoo style?</span>
              </span>
              <span className="text-[10px] text-gray-400">Tex's Studio • Winchester</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onNavigate && onNavigate('booking')}
                className="w-full py-2 px-2.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-black font-heading font-black text-xs uppercase tracking-wide hover:brightness-110 transition shadow-[0_0_10px_rgba(0,240,255,0.4)] flex items-center justify-center gap-1.5"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Book Tex (-15%)</span>
              </button>

              <button
                onClick={() => onNavigate && onNavigate('gallery')}
                className="w-full py-2 px-2.5 rounded-lg bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-400/50 text-cyan-300 font-mono text-xs font-bold transition flex items-center justify-center gap-1.5"
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>Real Gallery</span>
              </button>
            </div>
          </div>
        </div>

        {/* Dynamic In-Place Reels Feed (Showing the last 3 posted TikToks with Load More) - 5 cols */}
        <div className="md:col-span-5 space-y-3 text-left">
          <div className="flex items-center justify-between pb-2 border-b border-cyan-500/20 text-xs font-mono text-gray-400">
            <span className="flex items-center gap-1.5 text-cyan-300 font-bold">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>STUDIO FEED ({visibleReels.length} OF {combinedReels.length})</span>
            </span>
            <span className="text-[11px] text-gray-400">
              {liveConnected ? '⚡ Live Connected' : 'Studio Showcase'}
            </span>
          </div>

          {/* List of Visible Reels */}
          <div className="space-y-2.5">
            {visibleReels.map((reel, idx) => {
              const isSelected = activeReelIndex === idx;
              return (
                <div
                  key={reel.id || idx}
                  onClick={() => {
                    setActiveReelIndex(idx);
                    setInAppInteractiveEmbed(false);
                  }}
                  className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition ${
                    isSelected
                      ? 'bg-[#09152b] border-cyan-400 shadow-[0_0_15px_rgba(0,240,255,0.3)] ring-1 ring-cyan-400'
                      : 'bg-[#080d1a] border-cyan-500/20 hover:border-cyan-500/50'
                  }`}
                >
                  {/* Thumbnail */}
                  <div className="relative w-16 h-24 rounded-lg overflow-hidden bg-black shrink-0 border border-cyan-500/40">
                    <img
                      src={reel.thumbnailUrl}
                      alt={reel.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                      <div className="w-6 h-6 rounded-full bg-cyan-500/80 flex items-center justify-center text-black">
                        <Play className="w-3 h-3 fill-current ml-0.5" />
                      </div>
                    </div>
                    <div className="absolute bottom-1 right-1 px-1 rounded bg-black/80 text-[8px] font-mono text-cyan-300">
                      {reel.duration || '0:35'}
                    </div>
                  </div>

                  {/* Reel Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-heading font-bold text-xs text-white truncate">
                        {reel.title}
                      </span>
                    </div>

                    <p className="text-[11px] text-gray-300 line-clamp-2 mt-1 font-sans">
                      {reel.caption}
                    </p>

                    <div className="flex items-center gap-3 mt-2 text-[10px] font-mono text-gray-400">
                      <span className="flex items-center gap-1 text-rose-400">
                        <Heart className="w-3 h-3 fill-current" />
                        <span>{reel.likes}</span>
                      </span>
                      <span className="flex items-center gap-1 text-cyan-400">
                        <MessageCircle className="w-3 h-3" />
                        <span>{reel.comments || 12}</span>
                      </span>
                      <span className="text-gray-500">• Studio Reel</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Dynamic "Load More / Show Less" In-Place Controls */}
          <div className="pt-2 flex flex-col gap-2">
            {visibleCount < combinedReels.length && (
              <button
                onClick={handleLoadMore}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-950 to-blue-950 border border-cyan-400/50 hover:border-cyan-400 text-cyan-300 text-xs font-mono font-bold transition flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(0,240,255,0.15)] group"
              >
                <ChevronDown className="w-4 h-4 text-cyan-400 group-hover:translate-y-0.5 transition-transform" />
                <span>LOAD MORE REELS ({combinedReels.length - visibleCount} REMAINING)</span>
              </button>
            )}

            {visibleCount > 3 && (
              <button
                onClick={handleShowLess}
                className="w-full py-2 px-4 rounded-xl bg-black/60 border border-gray-800 hover:border-gray-700 text-gray-400 hover:text-white text-xs font-mono transition flex items-center justify-center gap-2"
              >
                <ChevronUp className="w-4 h-4" />
                <span>Show Top 3 Posted Reels</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Quick Paste TikTok Link Modal */}
      {isPasteModalOpen && (
        <div
          className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setIsPasteModalOpen(false)}
        >
          <div
            className="w-full max-w-lg bg-[#070e1c] border-2 border-cyan-400 rounded-2xl p-5 sm:p-6 shadow-[0_0_50px_rgba(0,240,255,0.3)] space-y-4 text-left"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <i className="fa-brands fa-tiktok text-cyan-400 text-lg"></i>
                <h3 className="font-heading font-black text-lg text-white">Import TikTok Video</h3>
              </div>
              <button
                onClick={() => setIsPasteModalOpen(false)}
                className="p-1.5 rounded-lg bg-gray-800 text-gray-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-gray-300">
              Paste the share link from any video on <span className="text-cyan-300 font-bold">@lightsouttattoo.site</span> (e.g. from the TikTok app: Share → Copy Link). The studio engine will automatically fetch the thumbnail, title, and video details.
            </p>

            <form onSubmit={handleImportTikTokUrl} className="space-y-3">
              <div>
                <label className="block text-xs font-mono text-cyan-300 mb-1">
                  TikTok Video URL:
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://www.tiktok.com/@lightsouttattoo.site/video/..."
                  value={pasteUrl}
                  onChange={e => setPasteUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-black border border-cyan-500/50 text-white font-mono text-xs focus:outline-none focus:border-cyan-400"
                />
              </div>

              {pasteError && (
                <div className="p-3 rounded-lg bg-rose-950/80 border border-rose-500 text-rose-200 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{pasteError}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPasteModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-black border border-gray-700 text-gray-300 font-mono text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPulling}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-black font-heading font-black text-xs uppercase tracking-wide hover:brightness-110 transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isPulling ? <RefreshCw className="w-4 h-4 animate-spin" /> : <PlusCircle className="w-4 h-4" />}
                  <span>{isPulling ? 'Importing Reel...' : 'Add to Showcase'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* In-App Theater / Fullscreen Modal */}
      {isTheaterModalOpen && currentReel && (
        <div
          className="fixed inset-0 z-[120] bg-black/95 backdrop-blur-md flex items-center justify-center p-3 sm:p-6"
          onClick={() => setIsTheaterModalOpen(false)}
        >
          <div
            className="relative w-full max-w-md aspect-[9/16] max-h-[90vh] bg-black rounded-2xl border-2 border-cyan-400 shadow-[0_0_50px_rgba(0,240,255,0.3)] overflow-hidden flex flex-col justify-between"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setIsTheaterModalOpen(false)}
              className="absolute top-3 right-3 z-30 p-2 rounded-full bg-black/80 border border-cyan-400 text-white hover:bg-cyan-900 transition"
            >
              <X className="w-5 h-5" />
            </button>

            {isDirectVideo ? (
              <video
                src={currentReel.videoUrl}
                controls
                autoPlay
                playsInline
                className="w-full h-full object-contain"
              />
            ) : tikTokVideoId ? (
              <iframe
                src={`https://www.tiktok.com/embed/v2/${tikTokVideoId}`}
                title={currentReel.title}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center">
                <img src={currentReel.thumbnailUrl} alt={currentReel.title} className="w-full h-full object-contain" />
                <a
                  href={currentReel.tiktokUrl || 'https://www.tiktok.com/@lightsouttattoo.site'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute bottom-6 px-4 py-2 rounded-xl bg-gradient-to-r from-[#fe2c55] to-[#25f4ee] text-black font-heading font-black text-xs uppercase flex items-center gap-2"
                >
                  <i className="fa-brands fa-tiktok"></i>
                  <span>Watch on TikTok</span>
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
};
