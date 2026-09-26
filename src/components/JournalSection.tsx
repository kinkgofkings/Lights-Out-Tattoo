import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Calendar,
  Clock,
  Tag,
  ArrowRight,
  PlusCircle,
  X,
  Share2,
  Sparkles,
  Phone,
  CalendarCheck,
  Check,
  Copy,
  ShieldCheck,
  Award,
  Video,
  Image as ImageIcon
} from 'lucide-react';
import { JournalPost, ArtistProfile } from '../types';
import { ShareJournalToTikTokModal } from './ShareJournalToTikTokModal';
import { MediaRenderer } from './MediaRenderer';
import { JournalMediaGallery } from './JournalMediaGallery';

interface JournalSectionProps {
  posts: JournalPost[];
  profile?: ArtistProfile;
  isAdmin?: boolean;
  onOpenAdminNewPost: () => void;
  onNavigate?: (tab: string) => void;
  onShowNotification?: (msg: string) => void;
}

export const JournalSection: React.FC<JournalSectionProps> = ({
  posts,
  profile,
  isAdmin = false,
  onOpenAdminNewPost,
  onNavigate,
  onShowNotification
}) => {
  const [selectedPost, setSelectedPost] = useState<JournalPost | null>(null);
  const [sharingPost, setSharingPost] = useState<JournalPost | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Keyboard shortcut: Escape key closes article reader
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedPost) {
        setSelectedPost(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedPost]);

  const handleShareArticle = (post: JournalPost) => {
    if (navigator.share) {
      navigator.share({
        title: `${post.title} | Lights Out Tattoo`,
        text: post.excerpt,
        url: window.location.href
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(`${window.location.origin} - ${post.title}`);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
      if (onShowNotification) onShowNotification('Article link copied to clipboard!');
    }
  };

  return (
    <section className="py-6 px-3 sm:px-6 max-w-5xl mx-auto space-y-8" id="journal-section">
      {/* Top Navigation */}
      {onNavigate && (
        <div className="flex items-center justify-between">
          <button
            onClick={() => onNavigate('home')}
            className="text-xs font-mono text-cyan-400 hover:underline flex items-center gap-1.5"
          >
            <span>←</span>
            <span>Back to Studio Overview</span>
          </button>
          <span className="text-[11px] font-mono text-gray-500">
            Winchester, VA • High Voltage Ink
          </span>
        </div>
      )}

      {/* Tex's Profile Wall Hero Card */}
      {profile && (
        <div className="rounded-2xl bg-gradient-to-r from-cyan-950/50 via-[#080d1a] to-blue-950/40 border-2 border-cyan-400/40 shadow-[0_0_30px_rgba(0,240,255,0.15)] p-5 sm:p-7 text-left">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
            {/* Portrait */}
            <div className="relative shrink-0">
              <img
                src={profile.avatarUrl}
                alt={profile.artistName}
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover border-2 border-cyan-400 shadow-[0_0_20px_rgba(0,240,255,0.4)]"
              />
              <div className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-400 text-cyan-300 font-mono text-[10px] font-black">
                {profile.experienceYears}+ YRS
              </div>
            </div>

            {/* Profile Info */}
            <div className="flex-1 space-y-2 text-center sm:text-left">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h1 className="font-heading font-black text-2xl sm:text-3xl text-white">
                  {profile.artistName}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 font-mono text-xs font-bold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Lead Artist & Studio Founder</span>
                </span>
              </div>

              <p className="text-xs sm:text-sm text-cyan-300 font-medium">
                Winchester, Virginia • Black & Grey Realism • No-Laser Cover-Ups
              </p>

              <p className="text-xs text-gray-300 leading-relaxed max-w-2xl">
                {profile.bio}
              </p>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-3">
                {onNavigate && (
                  <button
                    onClick={() => onNavigate('booking')}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-black font-heading font-black text-xs hover:brightness-110 transition shadow-md flex items-center gap-1.5"
                  >
                    <CalendarCheck className="w-3.5 h-3.5" />
                    <span>Book Custom Piece (-15% Promo)</span>
                  </button>
                )}
                <a
                  href={`tel:${profile.phone.replace(/[^0-9]/g, '')}`}
                  className="px-3.5 py-2 rounded-xl bg-black/60 border border-cyan-500/40 text-cyan-300 font-mono text-xs font-bold hover:bg-cyan-950 transition flex items-center gap-1.5"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Call {profile.phone}</span>
                </a>
                {onNavigate && (
                  <button
                    onClick={() => onNavigate('gallery')}
                    className="px-3.5 py-2 rounded-xl bg-gray-900 border border-gray-700 text-gray-300 font-mono text-xs hover:text-white transition"
                  >
                    View 80+ Tattoos
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 text-left">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 font-tech font-bold text-xs uppercase tracking-widest">
            <BookOpen className="w-4 h-4 text-cyan-400" />
            <span>Tex's Profile Wall & Studio Journal</span>
          </div>
          <h2 className="font-heading text-2xl sm:text-3xl font-black text-white mt-1">
            ARTIST <span className="text-cyan-400">ARTICLES & UPDATES</span>
          </h2>
          <p className="text-xs sm:text-sm text-gray-300 mt-0.5">
            Technical notes on cover-up science, black & grey needle depth, and tattoo culture from 20+ years in the chair.
          </p>
        </div>

        {/* Admin-only post writing button */}
        {isAdmin && (
          <button
            onClick={onOpenAdminNewPost}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-cyan-950/70 border border-cyan-400/40 text-cyan-300 hover:bg-cyan-900/80 text-xs font-mono font-bold transition shadow-[0_0_10px_rgba(0,240,255,0.2)] shrink-0"
          >
            <PlusCircle className="w-4 h-4 text-cyan-400" />
            <span>Write Post (Admin)</span>
          </button>
        )}
      </div>

      {/* Post Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 text-left">
        {posts.map(post => (
          <article
            key={post.id}
            onClick={() => setSelectedPost(post)}
            className="group rounded-2xl bg-[#080d1a] border border-cyan-500/25 overflow-hidden flex flex-col hover:border-cyan-400 hover:shadow-[0_0_20px_rgba(0,240,255,0.2)] transition duration-300 cursor-pointer"
          >
            {/* Header Image or Video */}
            {(post.imageUrl || (post.mediaItems && post.mediaItems.length > 0)) && (
              <div className="relative aspect-[16/9] overflow-hidden bg-black">
                <MediaRenderer
                  src={post.imageUrl || post.mediaItems?.[0]?.url}
                  alt={post.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/80 font-mono text-[10px] text-cyan-300 border border-cyan-500/40">
                  {post.category}
                </div>
                {post.mediaItems && post.mediaItems.length > 0 && (
                  <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-black/85 backdrop-blur-sm font-mono text-[10px] text-cyan-300 border border-cyan-500/40 flex items-center gap-1 shadow-md">
                    {post.mediaItems.some(m => m.type === 'video' || /\.(mp4|webm|mov|ogg|m4v)$/i.test(m.url)) ? (
                      <>
                        <Video className="w-3 h-3 text-cyan-400" />
                        <span>{post.mediaItems.length} media (video)</span>
                      </>
                    ) : (
                      <>
                        <ImageIcon className="w-3 h-3 text-cyan-400" />
                        <span>{post.mediaItems.length} photos</span>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Post Card Content */}
            <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center gap-3 text-[11px] font-mono text-gray-400 mb-1.5">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-cyan-400" />
                    <span>{post.date}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-cyan-400" />
                    <span>{post.readTime}</span>
                  </span>
                </div>

                <h3 className="font-heading font-bold text-base text-white group-hover:text-cyan-300 transition-colors line-clamp-2">
                  {post.title}
                </h3>

                <p className="text-xs text-gray-300 line-clamp-3 mt-2 leading-relaxed">
                  {post.excerpt}
                </p>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-cyan-500/15 text-xs font-mono text-cyan-400">
                <div className="flex flex-wrap gap-1">
                  {(post.tags || []).slice(0, 2).map(tag => (
                    <span key={tag} className="text-[10px] text-gray-400">
                      #{tag}
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isAdmin) {
                        setSharingPost(post);
                      } else {
                        handleShareArticle(post);
                      }
                    }}
                    className="p-1.5 rounded-lg bg-cyan-950/80 border border-cyan-400/40 text-cyan-300 hover:bg-cyan-900 transition flex items-center gap-1 text-[11px] font-bold"
                    title={isAdmin ? "Share to TikTok" : "Share Article"}
                  >
                    {isAdmin ? (
                      <>
                        <i className="fa-brands fa-tiktok text-xs"></i>
                        <span className="hidden sm:inline">TikTok</span>
                      </>
                    ) : (
                      <>
                        <Share2 className="w-3 h-3" />
                        <span className="hidden sm:inline">Share</span>
                      </>
                    )}
                  </button>
                  <span className="flex items-center gap-1 font-bold group-hover:translate-x-1 transition-transform">
                    <span>Read</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>

      {/* Full Article Reader Modal */}
      {selectedPost && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/90 backdrop-blur-md px-3.5 py-6 sm:px-6 sm:py-10 md:py-12 overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedPost(null);
          }}
        >
          <div
            className="relative w-full max-w-3xl max-h-[calc(100dvh-3.5rem)] sm:max-h-[calc(100dvh-5rem)] flex flex-col rounded-2xl bg-[#080d1a] border-2 border-cyan-400/60 shadow-[0_0_50px_rgba(0,240,255,0.25)] my-auto text-left overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Sticky Header with Title and Fixed Close Button */}
            <div className="sticky top-0 z-20 flex items-center justify-between p-3.5 sm:p-5 bg-[#080d1a]/95 backdrop-blur-md border-b border-cyan-500/30 shrink-0">
              <div className="flex items-center gap-2 min-w-0 pr-2">
                <span className="px-2 py-0.5 rounded bg-cyan-950 border border-cyan-500/40 text-[10px] font-mono text-cyan-400 uppercase font-bold shrink-0">
                  {selectedPost.category}
                </span>
                <span className="text-xs text-gray-500 font-mono hidden sm:inline">•</span>
                <span className="text-xs text-gray-400 font-mono hidden sm:inline">{selectedPost.readTime}</span>
                <span className="text-xs text-gray-500 font-mono hidden sm:inline">•</span>
                <span className="text-xs font-mono text-cyan-300 font-bold truncate">
                  {selectedPost.title}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setSelectedPost(null)}
                className="p-2 sm:p-2.5 rounded-xl bg-gray-900 border border-cyan-500/40 text-cyan-300 hover:text-white hover:border-cyan-400 hover:bg-cyan-950/80 transition shrink-0 ml-2 shadow-[0_0_10px_rgba(0,240,255,0.2)] flex items-center gap-1"
                title="Close article (Esc)"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
                <span className="text-[10px] font-mono text-gray-400 hidden sm:inline">ESC</span>
              </button>
            </div>

            {/* Scrollable Article Body */}
            <div className="p-4 sm:p-7 overflow-y-auto space-y-5 flex-1 overscroll-contain">
              {/* Post Meta */}
              <div className="flex flex-wrap items-center gap-2.5 text-xs font-mono text-cyan-400">
                <span className="px-2 py-0.5 rounded bg-cyan-950 border border-cyan-500/40 font-bold">
                  {selectedPost.category}
                </span>
                <span>{selectedPost.date}</span>
                <span>•</span>
                <span>{selectedPost.readTime}</span>
                <span>•</span>
                <span className="text-gray-400">By {selectedPost.author}</span>
              </div>

              <h2 className="font-heading font-black text-xl sm:text-3xl text-white leading-tight">
                {selectedPost.title}
              </h2>

              {selectedPost.imageUrl && (
                <div className="w-full max-h-[420px] rounded-xl overflow-hidden border border-cyan-500/30 bg-black flex items-center justify-center">
                  <MediaRenderer
                    src={selectedPost.imageUrl}
                    alt={selectedPost.title}
                    className="w-full h-full max-h-[420px] object-cover"
                    controls={true}
                    autoPlay={false}
                    muted={false}
                  />
                </div>
              )}

              {/* Article Content Render */}
              <div className="text-sm sm:text-base text-gray-200 leading-relaxed space-y-4 font-sans whitespace-pre-line">
                {selectedPost.content}
              </div>

              {/* Project Media & Planning Visuals Gallery (Multiple Images & Videos) */}
              <JournalMediaGallery
                mediaItems={selectedPost.mediaItems}
                mediaUrls={selectedPost.mediaUrls}
                title="Project Planning & Session Visuals"
              />

              {/* Tags Strip */}
              {selectedPost.tags && selectedPost.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-4 border-t border-cyan-500/20">
                  {selectedPost.tags.map(t => (
                    <span
                      key={t}
                      className="text-xs font-mono text-cyan-300 bg-cyan-950/70 border border-cyan-500/30 px-2.5 py-1 rounded-lg"
                    >
                      #{t}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Sticky Bottom Actions & Close Button */}
            <div className="sticky bottom-0 z-20 p-3 sm:p-4 bg-[#080d1a]/95 backdrop-blur-md border-t border-cyan-500/30 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setSelectedPost(null)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-gray-900 border border-gray-700 text-gray-300 hover:text-white hover:border-gray-500 font-mono text-xs font-bold transition order-2 sm:order-1"
              >
                ← Back / Close Article
              </button>

              {isAdmin ? (
                <button
                  type="button"
                  onClick={() => setSharingPost(selectedPost)}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 text-black font-heading font-black text-xs hover:brightness-110 transition shadow-[0_0_15px_rgba(0,240,255,0.4)] flex items-center justify-center gap-2 order-1 sm:order-2 shrink-0"
                >
                  <i className="fa-brands fa-tiktok text-sm"></i>
                  <span>SHARE TO TIKTOK PROFILE</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleShareArticle(selectedPost)}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-cyan-950 border border-cyan-400/50 text-cyan-300 hover:bg-cyan-900 font-mono text-xs font-bold transition flex items-center justify-center gap-2 order-1 sm:order-2 shrink-0"
                >
                  {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
                  <span>{copiedLink ? 'Link Copied!' : 'Share This Article'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Share Journal Post to TikTok Modal (Admin Only) */}
      {sharingPost && isAdmin && (
        <ShareJournalToTikTokModal
          isOpen={Boolean(sharingPost)}
          onClose={() => setSharingPost(null)}
          post={sharingPost}
          onShowNotification={onShowNotification}
        />
      )}
    </section>
  );
};

