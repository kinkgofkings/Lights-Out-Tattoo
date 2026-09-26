import React from 'react';
import {
  X,
  MapPin,
  Calculator,
  MessageSquareQuote,
  Flame,
  Smartphone,
  ShieldCheck,
  Phone,
  Mail,
  ExternalLink,
  BookOpen,
  Camera,
  Info,
  Zap
} from 'lucide-react';
import { BustedLightbulbIcon } from './BustedLightbulbIcon';
import { ArtistProfile } from '../types';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  profile: ArtistProfile;
  isAdmin?: boolean;
  onNavigate: (tab: string) => void;
  onOpenApkModal: () => void;
  onTriggerSplash?: () => void;
}

export const MobileDrawer: React.FC<MobileDrawerProps> = ({
  isOpen,
  onClose,
  profile,
  isAdmin = false,
  onNavigate,
  onOpenApkModal,
  onTriggerSplash
}) => {
  if (!isOpen) return null;

  const handleNav = (tab: string) => {
    onNavigate(tab);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex justify-end">
      {/* Darkened backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <aside className="relative w-full max-w-sm h-full bg-[#070b16] border-l border-cyan-500/30 text-gray-200 shadow-[-10px_0_30px_rgba(0,240,255,0.2)] flex flex-col z-10 overflow-y-auto min-h-0">
        {/* Drawer Header */}
        <div className="p-4 border-b border-cyan-500/20 flex items-center justify-between bg-gradient-to-r from-cyan-950/40 to-[#070b16] shrink-0">
          <div className="flex items-center gap-3">
            <BustedLightbulbIcon size={28} glow={true} />
            <div>
              <h2 className="font-heading text-base font-bold tracking-wider text-cyan-300">
                LIGHTS OUT
              </h2>
              <p className="text-[11px] text-gray-400 font-tech">
                Winchester VA • High Voltage Studio
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close menu"
            className="p-2 rounded-lg bg-gray-900/80 border border-gray-700 text-gray-400 hover:text-cyan-400 hover:border-cyan-400 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tex Quick Profile Card - Tapping opens Tex's Profile Wall & Bio */}
        <button
          onClick={() => handleNav('journal')}
          className="p-3.5 mx-3 my-3 rounded-xl bg-cyan-950/40 border border-cyan-500/40 relative shrink-0 shadow-[0_0_15px_rgba(0,240,255,0.15)] text-left hover:bg-cyan-900/40 hover:border-cyan-400 transition group block"
          title="View Tex's Profile Wall & Articles"
        >
          <div className="flex items-center gap-3">
            <div className="relative shrink-0">
              <img
                src={profile.avatarUrl}
                alt={profile.artistName}
                className="w-13 h-13 sm:w-14 sm:h-14 rounded-full object-cover border-2 border-cyan-400 shadow-[0_0_12px_rgba(0,240,255,0.4)] block shrink-0 group-hover:scale-105 transition-transform"
                style={{ minWidth: '3.25rem', minHeight: '3.25rem' }}
              />
              <span className="absolute -bottom-1 -right-1 px-1.5 py-0.2 rounded-full bg-cyan-950 border border-cyan-400 text-[9px] font-mono font-bold text-cyan-300">
                WALL
              </span>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1">
                <h3 className="font-heading font-bold text-sm text-white truncate group-hover:text-cyan-300 transition-colors">
                  {profile.artistName}
                </h3>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 shrink-0">
                  {profile.experienceYears}+ Yrs
                </span>
              </div>
              <p className="text-xs text-cyan-400 font-medium truncate mt-0.5">
                Black & Grey Realism • Cover-Ups
              </p>
              <div className="mt-1 flex items-center gap-1.5 text-[10px] text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block shrink-0" />
                <span className="truncate">{profile.statusMessage}</span>
              </div>
            </div>
          </div>
        </button>

        {/* Navigation Shortcuts List */}
        <div className="px-3 py-2 space-y-1 font-medium text-sm flex-1 shrink-0">
          <div className="text-[11px] font-tech uppercase text-gray-400 tracking-wider px-3 py-1">
            Studio Navigation
          </div>

          <button
            onClick={() => handleNav('home')}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left hover:bg-cyan-950/50 hover:text-cyan-300 border border-transparent hover:border-cyan-500/30 transition"
          >
            <Flame className="w-4 h-4 text-cyan-400" />
            <span>Studio Overview & Bio</span>
          </button>

          <button
            onClick={() => handleNav('journal')}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left hover:bg-cyan-950/50 hover:text-cyan-300 border border-transparent hover:border-cyan-500/30 transition"
          >
            <div className="flex items-center gap-3">
              <BookOpen className="w-4 h-4 text-cyan-400" />
              <span>Tex's Profile Wall & Journal</span>
            </div>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-900/60 text-cyan-300 border border-cyan-500/30">
              Articles
            </span>
          </button>

          <button
            onClick={() => handleNav('gallery')}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left hover:bg-cyan-950/50 hover:text-cyan-300 border border-transparent hover:border-cyan-500/30 transition"
          >
            <div className="flex items-center gap-3">
              <Camera className="w-4 h-4 text-cyan-400" />
              <span>Realism & Cover-Up Gallery</span>
            </div>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-900/60 text-cyan-300 border border-cyan-500/30">
              80+ Works
            </span>
          </button>

          <button
            onClick={() => handleNav('booking')}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left hover:bg-cyan-950/50 hover:text-cyan-300 border border-transparent hover:border-cyan-500/30 transition"
          >
            <div className="flex items-center gap-3">
              <Calculator className="w-4 h-4 text-cyan-400" />
              <span>Pricing Estimator & Booking</span>
            </div>
            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-500/40">
              -15% OFF
            </span>
          </button>

          <button
            onClick={() => handleNav('pos')}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left bg-emerald-950/40 hover:bg-emerald-950/70 text-emerald-300 border border-emerald-500/40 transition"
          >
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-[#00D632] text-black font-heading font-black text-xs flex items-center justify-center shadow-[0_0_8px_#00D632]">
                $
              </div>
              <span className="font-heading font-bold text-xs tracking-wide">Pay Deposit via Cash App</span>
            </div>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-900/60 text-[#00D632] font-bold">
              {profile.cashAppHandle || '$LightsOutTattooTex'}
            </span>
          </button>

          <button
            onClick={() => handleNav('map')}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left hover:bg-cyan-950/50 hover:text-cyan-300 border border-transparent hover:border-cyan-500/30 transition"
          >
            <div className="flex items-center gap-3">
              <MapPin className="w-4 h-4 text-cyan-400" />
              <span>Shenandoah 100-Mile Map</span>
            </div>
            <span className="text-[10px] font-mono text-gray-400">Winchester</span>
          </button>

          <button
            onClick={() => handleNav('reels')}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left hover:bg-cyan-950/50 hover:text-cyan-300 border border-transparent hover:border-cyan-500/30 transition"
          >
            <i className="fa-brands fa-tiktok text-cyan-400 text-sm"></i>
            <span>TikTok Reels & Studio Videos</span>
          </button>

          <button
            onClick={() => handleNav('testimonials')}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left hover:bg-cyan-950/50 hover:text-cyan-300 border border-transparent hover:border-cyan-500/30 transition"
          >
            <MessageSquareQuote className="w-4 h-4 text-cyan-400" />
            <span>Client Reviews & Testimonials</span>
          </button>

          <button
            onClick={() => handleNav('about')}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left hover:bg-cyan-950/50 hover:text-cyan-300 border border-transparent hover:border-cyan-500/30 transition"
          >
            <Info className="w-4 h-4 text-cyan-400" />
            <span>About Artist Tex</span>
          </button>

          {/* Client-Facing Navigation Items End */}

          {/* If Tex / Admin is Authenticated, Show Exclusive Owner Tools */}
          {isAdmin ? (
            <div className="pt-3 mt-1 border-t border-cyan-500/30 space-y-1.5">
              <div className="px-3 py-1 flex items-center justify-between text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-wider bg-cyan-950/40 rounded-lg border border-cyan-500/20">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Owner Tools (Tex Only)</span>
                </div>
                <span className="text-emerald-400 font-bold">● Active</span>
              </div>

              {onTriggerSplash && (
                <button
                  onClick={() => {
                    onClose();
                    onTriggerSplash();
                  }}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left bg-cyan-950/40 hover:bg-cyan-950/80 text-cyan-300 border border-cyan-500/40 transition group shadow-[0_0_10px_rgba(0,240,255,0.15)]"
                >
                  <div className="flex items-center gap-3">
                    <Zap className="w-4 h-4 text-cyan-400 group-hover:animate-pulse" />
                    <span className="text-xs font-semibold">Matrix Live Splash Screen</span>
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-900/60 text-cyan-300 border border-cyan-400/40">
                    REPLAY
                  </span>
                </button>
              )}

              <button
                onClick={() => {
                  onClose();
                  onOpenApkModal();
                }}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left bg-gradient-to-r from-cyan-950/60 to-blue-950/60 text-cyan-300 border border-cyan-500/30 hover:border-cyan-400 transition"
              >
                <div className="flex items-center gap-3">
                  <Smartphone className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-semibold">Android APK & Gradle Setup</span>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
              </button>

              <button
                onClick={() => handleNav('tiktok-studio')}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left bg-gradient-to-r from-cyan-950/60 to-purple-950/60 text-cyan-300 border border-cyan-400/40 hover:border-cyan-400 transition shadow-[0_0_12px_rgba(0,240,255,0.15)]"
              >
                <div className="flex items-center gap-3">
                  <Camera className="w-4 h-4 text-cyan-400 animate-pulse" />
                  <span className="font-bold text-xs">TikTok Live Studio & Waivers</span>
                </div>
                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-rose-500 text-white font-bold">
                  REC
                </span>
              </button>

              <button
                onClick={() => handleNav('admin')}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left bg-blue-950/50 hover:bg-blue-900/60 text-cyan-300 border border-blue-500/40 transition"
              >
                <div className="flex items-center gap-3">
                  <ShieldCheck className="w-4 h-4 text-cyan-400" />
                  <span className="font-bold text-xs">Admin Studio Dashboard</span>
                </div>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                  TEX MODE
                </span>
              </button>
            </div>
          ) : (
            /* Public / Client Facing View: Subtle Studio Admin Link for Tex to unlock */
            <div className="pt-2 border-t border-gray-800/80">
              <button
                onClick={() => handleNav('admin')}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-left text-gray-400 hover:text-cyan-300 hover:bg-gray-900/60 transition text-xs font-mono group"
              >
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-gray-500 group-hover:text-cyan-400 transition-colors" />
                  <span>Studio Admin Portal</span>
                </div>
                <span className="text-[10px] text-gray-500 border border-gray-800 px-1.5 py-0.5 rounded bg-black/40">
                  PIN Required
                </span>
              </button>
            </div>
          )}
        </div>

        {/* Direct Contact Footer */}
        <div className="p-4 border-t border-cyan-500/20 bg-black/40 space-y-2 text-xs">
          <div className="text-[11px] font-tech uppercase text-gray-400 tracking-wider">
            Direct Contact
          </div>
          <a
            href={`tel:${profile.phone.replace(/[^0-9]/g, '')}`}
            className="flex items-center gap-2 text-cyan-300 hover:underline"
          >
            <Phone className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-mono">{profile.phone}</span>
          </a>
          <a
            href={`mailto:${profile.emailPrimary}`}
            className="flex items-center gap-2 text-gray-300 hover:text-cyan-300"
          >
            <Mail className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-mono truncate">{profile.emailPrimary}</span>
          </a>
          <a
            href={`mailto:${profile.emailGeneral}`}
            className="flex items-center gap-2 text-gray-400 hover:text-cyan-300"
          >
            <Mail className="w-3.5 h-3.5 text-blue-400" />
            <span className="font-mono truncate">{profile.emailGeneral}</span>
          </a>
          <div className="pt-2 text-[10px] text-gray-500 font-mono text-center">
            lightsouttattoo.site • Winchester, VA
          </div>
        </div>
      </aside>
    </div>
  );
};
