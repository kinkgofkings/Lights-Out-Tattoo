import React, { useState, useEffect } from 'react';
import {
  X,
  Send,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Eye,
  Lock,
  Globe,
  Share2,
  Copy,
  Check,
  ExternalLink,
  ShieldAlert
} from 'lucide-react';
import { JournalPost } from '../types';
import { tiktokService } from '../services/tiktok';
import { MediaRenderer } from './MediaRenderer';

interface ShareJournalToTikTokModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: JournalPost;
  onShowNotification?: (msg: string) => void;
}

export const ShareJournalToTikTokModal: React.FC<ShareJournalToTikTokModalProps> = ({
  isOpen,
  onClose,
  post,
  onShowNotification
}) => {
  const [caption, setCaption] = useState('');
  const [privacyLevel, setPrivacyLevel] = useState<'PUBLIC_TO_EVERYONE' | 'MUTUAL_FOLLOW_FRIENDS' | 'SELF_ONLY'>('PUBLIC_TO_EVERYONE');
  const [allowDuet, setAllowDuet] = useState(true);
  const [allowStitch, setAllowStitch] = useState(true);
  const [allowComments, setAllowComments] = useState(true);
  
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishResult, setPublishResult] = useState<{
    success: boolean;
    message?: string;
    postId?: string;
  } | null>(null);

  const [copiedLink, setCopiedLink] = useState(false);
  const [status, setStatus] = useState<any>(null);

  // Initialize caption and load status when opened
  useEffect(() => {
    if (isOpen && post) {
      const defaultTags = post.tags.map(t => `#${t.replace(/[^a-zA-Z0-9]/g, '')}`).join(' ');
      const studioTags = '#LightsOutTattoo #WinchesterVA #TexTattoo #BlackAndGreyRealism #TattooArt';
      const initialCaption = `📖 "${post.title}"\n\n${post.excerpt}\n\nRead more by Tex at Lights Out Tattoo in Winchester, VA.\n\n${defaultTags} ${studioTags}`.trim();
      setCaption(initialCaption);
      setPublishResult(null);

      // Check TikTok connection status
      tiktokService.getStatus().then(res => {
        if (res) {
          setStatus(res);
        }
      }).catch(() => {});
    }
  }, [isOpen, post]);

  // Keyboard shortcut: Escape key closes modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !post) return null;

  const handleShareToTikTok = async () => {
    setIsPublishing(true);
    setPublishResult(null);

    try {
      const payload = {
        title: post.title.substring(0, 150),
        caption: caption.substring(0, 500),
        privacyLevel,
        disableComment: !allowComments,
        disableDuet: !allowDuet,
        disableStitch: !allowStitch
      };

      const result = await tiktokService.publishVideo(payload);

      if (result.success) {
        const successMsg = result.message || 'Journal post shared straight to your TikTok profile queue!';
        setPublishResult({
          success: true,
          message: successMsg,
          postId: result.postId
        });
        if (onShowNotification) {
          onShowNotification(successMsg);
        }
      } else {
        setPublishResult({
          success: false,
          message: result.error || 'Failed to dispatch post to TikTok. Please check connection.'
        });
      }
    } catch (err: any) {
      setPublishResult({
        success: false,
        message: err.message || 'Error communicating with TikTok service.'
      });
    } finally {
      setIsPublishing(false);
    }
  };

  const handleCopyPostLink = () => {
    try {
      const url = window.location.origin + '?tab=journal&post=' + encodeURIComponent(post.id);
      navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
      if (onShowNotification) {
        onShowNotification('Journal link copied to clipboard!');
      }
    } catch (e) {
      // Fallback
    }
  };

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/90 backdrop-blur-md px-3.5 py-6 sm:px-6 sm:py-10 md:py-12 overflow-y-auto"
      onClick={(e) => {
        // Clicking backdrop closes modal
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="relative w-full max-w-xl max-h-[calc(100dvh-3.5rem)] sm:max-h-[calc(100dvh-5rem)] flex flex-col rounded-2xl bg-[#080e1c] border-2 border-cyan-400/70 shadow-[0_0_50px_rgba(0,240,255,0.3)] my-auto text-left overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky Modal Header with Title & ALWAYS-VISIBLE Close Button */}
        <div className="sticky top-0 z-20 flex items-center justify-between p-3.5 sm:p-5 bg-[#080e1c]/95 backdrop-blur-md border-b border-cyan-500/30 shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-400 to-blue-500 flex items-center justify-center text-black font-black shadow-[0_0_15px_#00f0ff] shrink-0">
              <i className="fa-brands fa-tiktok text-lg"></i>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-heading font-black text-sm sm:text-base text-white truncate">
                  SHARE JOURNAL TO TIKTOK
                </h3>
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-cyan-950 border border-cyan-400/40 text-cyan-300 font-bold shrink-0">
                  TEX PROFILE
                </span>
              </div>
              <p className="text-[11px] text-gray-400 font-mono truncate">
                Direct TikTok API integration for Lights Out Tattoo
              </p>
            </div>
          </div>

          {/* Close Button - Never hidden, high contrast, permanent access */}
          <button
            type="button"
            onClick={onClose}
            className="p-2 sm:p-2.5 rounded-xl bg-gray-900 border border-cyan-500/40 text-cyan-300 hover:text-white hover:border-cyan-400 hover:bg-cyan-950/80 transition shrink-0 ml-2 shadow-[0_0_10px_rgba(0,240,255,0.2)] flex items-center gap-1"
            title="Close modal (Esc)"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
            <span className="text-[10px] font-mono text-gray-400 hidden sm:inline">ESC</span>
          </button>
        </div>

        {/* Scrollable Modal Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1 overscroll-contain">
          {/* Post Preview Card */}
          <div className="p-3.5 rounded-xl bg-[#050914] border border-cyan-500/30 flex gap-3 items-start">
            {(post.imageUrl || (post.mediaItems && post.mediaItems.length > 0)) && (
              <div className="w-20 h-20 rounded-lg overflow-hidden border border-cyan-500/20 shrink-0 bg-black flex items-center justify-center">
                <MediaRenderer
                  src={post.imageUrl || post.mediaItems?.[0]?.url}
                  alt={post.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider font-bold">
                {post.category} • {post.readTime}
              </span>
              <h4 className="font-heading font-bold text-sm text-white line-clamp-1 mt-0.5">
                {post.title}
              </h4>
              <p className="text-xs text-gray-300 line-clamp-2 mt-1 font-sans">
                {post.excerpt}
              </p>
            </div>
          </div>

          {/* Account Connection Status Notice */}
          <div className="p-3 rounded-xl bg-black/60 border border-gray-800 flex items-center justify-between text-xs font-mono">
            <span className="text-gray-400">Target Profile:</span>
            <div className="flex items-center gap-2">
              {status?.isConnected ? (
                <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  {status.user?.username ? (status.user.username.startsWith('@') ? status.user.username : `@${status.user.username}`) : '@lightsouttattoo.site'} (Live Connected)
                </span>
              ) : (
                <span className="text-cyan-300 font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                  @lightsouttattoo.site (Direct API Ready)
                </span>
              )}
            </div>
          </div>

          {/* Caption & Hashtags Editor */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-mono">
              <label className="text-gray-300 font-bold flex items-center gap-1">
                <span>Post Caption & Tags (TikTok)</span>
              </label>
              <span className={`text-[11px] ${caption.length > 480 ? 'text-amber-400' : 'text-gray-400'}`}>
                {caption.length}/500
              </span>
            </div>
            <textarea
              rows={4}
              maxLength={500}
              value={caption}
              onChange={e => setCaption(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-black/80 border border-cyan-500/30 text-white text-xs font-mono outline-none focus:border-cyan-400 leading-relaxed resize-none"
              placeholder="Write your TikTok post caption..."
            />
          </div>

          {/* Privacy & Interactions Settings */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono text-gray-300 mb-1 font-bold">
                Privacy Level
              </label>
              <select
                value={privacyLevel}
                onChange={e => setPrivacyLevel(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl bg-black/80 border border-cyan-500/30 text-cyan-300 text-xs font-mono outline-none focus:border-cyan-400"
              >
                <option value="PUBLIC_TO_EVERYONE">Public (Everyone)</option>
                <option value="MUTUAL_FOLLOW_FRIENDS">Friends Only</option>
                <option value="SELF_ONLY">Private (Only Me)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono text-gray-300 mb-1 font-bold">
                TikTok Engagement
              </label>
              <div className="flex items-center gap-3 pt-2 text-xs font-mono text-gray-300">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allowComments}
                    onChange={e => setAllowComments(e.target.checked)}
                    className="rounded border-cyan-500/40 text-cyan-500 focus:ring-0"
                  />
                  <span>Comments</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allowDuet}
                    onChange={e => setAllowDuet(e.target.checked)}
                    className="rounded border-cyan-500/40 text-cyan-500 focus:ring-0"
                  />
                  <span>Duet</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allowStitch}
                    onChange={e => setAllowStitch(e.target.checked)}
                    className="rounded border-cyan-500/40 text-cyan-500 focus:ring-0"
                  />
                  <span>Stitch</span>
                </label>
              </div>
            </div>
          </div>

          {/* Result feedback */}
          {publishResult && (
            <div
              className={`p-3.5 rounded-xl border text-xs font-mono flex items-start gap-2.5 ${
                publishResult.success
                  ? 'bg-emerald-950/80 border-emerald-400 text-emerald-200'
                  : 'bg-rose-950/80 border-rose-400 text-rose-200'
              }`}
            >
              {publishResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              )}
              <div className="flex-1 space-y-1">
                <p className="font-bold">{publishResult.message}</p>
                {publishResult.postId && (
                  <p className="text-[11px] text-gray-300">
                    TikTok Dispatch ID: <code className="text-cyan-300">{publishResult.postId}</code>
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sticky Bottom Actions & Always-Accessible Close/Cancel Button */}
        <div className="sticky bottom-0 z-20 p-3 sm:p-4 bg-[#080e1c]/95 backdrop-blur-md border-t border-cyan-500/30 flex flex-col sm:flex-row items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-gray-900 border border-gray-700 text-gray-300 hover:text-white hover:border-gray-500 font-mono text-xs font-bold transition order-2 sm:order-1 shrink-0"
          >
            Close / Cancel
          </button>

          <div className="flex-1 w-full flex flex-col sm:flex-row items-center gap-2 order-1 sm:order-2">
            <button
              type="button"
              disabled={isPublishing}
              onClick={handleShareToTikTok}
              className="w-full sm:flex-1 py-2.5 sm:py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 text-black font-heading font-black text-xs uppercase tracking-wider hover:brightness-110 transition shadow-[0_0_20px_rgba(0,240,255,0.4)] flex items-center justify-center gap-2 disabled:opacity-50 shrink-0"
            >
              {isPublishing ? (
                <>
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                  <span>POSTING TO TIKTOK...</span>
                </>
              ) : (
                <>
                  <i className="fa-brands fa-tiktok text-sm"></i>
                  <span>SHARE STRAIGHT TO TIKTOK PROFILE</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleCopyPostLink}
              className="w-full sm:w-auto py-2.5 sm:py-3 px-4 rounded-xl bg-[#091326] border border-cyan-500/40 text-cyan-300 text-xs font-mono font-bold hover:bg-cyan-900 transition flex items-center justify-center gap-2 shrink-0"
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copiedLink ? 'Copied!' : 'Copy Link'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
