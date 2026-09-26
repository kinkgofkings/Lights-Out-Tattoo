import React from 'react';
import { BustedLightbulbIcon } from './BustedLightbulbIcon';
import { Phone, MapPin, Sparkles, Droplets } from 'lucide-react';
import { ArtistProfile } from '../types';

interface HeaderProps {
  profile: ArtistProfile;
  onOpenMenu: () => void;
  onNavigate: (tab: string) => void;
  activeTab: string;
  isBlackAndGreyMode: boolean;
  onToggleMode: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  profile,
  onOpenMenu,
  onNavigate,
  activeTab,
  isBlackAndGreyMode,
  onToggleMode
}) => {
  return (
    <header
      id="main-top-navbar"
      className="sticky top-0 z-50 w-full bg-[#070b16]/95 backdrop-blur-md border-b border-cyan-500/20 px-2.5 sm:px-6 py-2 pr-4 sm:pr-6 shadow-[0_4px_20px_rgba(0,0,0,0.6)]"
      style={{ position: 'sticky', top: 0 }}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
        {/* Brand & Studio Identity */}
        <div
          onClick={() => onNavigate('home')}
          className="flex items-center gap-2 sm:gap-2.5 cursor-pointer group min-w-0 shrink"
          id="header-brand"
        >
          {/* Studio Emblem */}
          <div className="relative w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-600/30 border border-cyan-400/40 flex items-center justify-center shadow-[0_0_12px_rgba(0,240,255,0.3)] group-hover:border-cyan-400 transition-colors shrink-0">
            <BustedLightbulbIcon size={20} glow={true} />
          </div>

          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-heading font-black text-sm sm:text-lg tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-200 to-cyan-300 truncate">
                LIGHTS OUT
              </span>
              <span className="text-[9px] sm:text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 font-bold uppercase tracking-wider hidden sm:inline-block">
                TATTOO
              </span>
            </div>
            <div className="flex items-center gap-1 text-[10px] sm:text-[11px] text-gray-400 font-tech truncate">
              <MapPin className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-cyan-400 shrink-0" />
              <span className="truncate">Winchester, VA</span>
              <span className="hidden sm:inline text-gray-500">• 20+ Yrs Exp</span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          
          {/* Black & Grey Mode Toggle */}
          <button
            onClick={onToggleMode}
            title={isBlackAndGreyMode ? "Turn Lights On (Color Mode)" : "Turn Lights Out (Black & Grey Mode)"}
            className="p-1.5 sm:p-2 rounded-xl bg-gray-900 border border-gray-700 hover:border-gray-500 hover:bg-gray-800 transition active:scale-95 group shrink-0 flex items-center justify-center"
          >
            <Droplets className={`w-4 h-4 sm:w-5 sm:h-5 ${isBlackAndGreyMode ? 'text-gray-400' : 'text-gray-500 group-hover:text-gray-300'}`} />
          </button>

          {/* Quick Call Phone Button */}
          <a
            href={`tel:${profile.phone.replace(/[^0-9]/g, '')}`}
            className="flex items-center gap-1 px-2 py-1.5 sm:px-3 sm:py-1.5 rounded-lg bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 text-xs font-semibold hover:bg-cyan-900/50 hover:border-cyan-400 transition shadow-[0_0_8px_rgba(0,240,255,0.2)] shrink-0"
            title="Call Tex directly"
            id="header-phone-btn"
          >
            <Phone className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-cyan-400 animate-pulse shrink-0" />
            <span className="hidden md:inline font-mono">{profile.phone}</span>
            <span className="md:hidden font-mono text-[10px] sm:text-[11px]">Call</span>
          </a>

          {/* Quick Avatar Profile Button */}
          <button
            onClick={() => onNavigate('journal')}
            title="View Tex's Profile Wall & Studio Journal"
            className="relative w-7 h-7 sm:w-8 sm:h-8 rounded-full overflow-hidden border border-cyan-400/80 shadow-[0_0_10px_rgba(0,240,255,0.4)] group shrink-0 hover:scale-105 transition"
          >
            <img
              src={profile.avatarUrl}
              alt="Tex - Lead Artist"
              className="w-full h-full object-cover"
            />
          </button>

          {/* Booking Shortcut Button */}
          <button
            onClick={() => onNavigate('booking')}
            className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition shrink-0 ${
              activeTab === 'booking'
                ? 'bg-cyan-500 text-black shadow-[0_0_15px_rgba(0,240,255,0.6)]'
                : 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white hover:opacity-90'
            }`}
            id="header-booking-btn"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Book (-15%)</span>
          </button>

          {/* Busted Lightbulb Mobile Menu Icon (Top Right) */}
          <button
            onClick={onOpenMenu}
            aria-label="Open Studio Menu"
            id="mobile-menu-busted-bulb"
            className="relative p-1.5 sm:p-2 rounded-xl bg-cyan-950/70 border border-cyan-400/60 hover:border-cyan-300 hover:bg-cyan-900/80 transition shadow-[0_0_12px_rgba(0,240,255,0.35)] active:scale-95 group shrink-0 flex items-center justify-center"
          >
            <BustedLightbulbIcon size={22} glow={true} />
            <span className="sr-only">Open Menu</span>
            {/* Pulsing micro indicator */}
            <span className="absolute top-0.5 right-0.5 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};
