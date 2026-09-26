import React from 'react';
import {
  Sparkles,
  ShieldCheck,
  MapPin,
  Flame,
  ArrowRight,
  Phone,
  Clock,
  Compass,
  Zap,
  Camera
} from 'lucide-react';
import { ArtistProfile } from '../types';

interface HeroSectionProps {
  profile: ArtistProfile;
  onNavigate: (tab: string) => void;
  isAdmin?: boolean;
  onUpdateStatus?: (status: ArtistProfile['liveStatus']) => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  profile,
  onNavigate,
  isAdmin = false,
  onUpdateStatus
}) => {
  const [showStatusMenu, setShowStatusMenu] = React.useState(false);

  const statusOptions: { status: ArtistProfile['liveStatus']; label: string; dotColor: string }[] = [
    { status: 'open_slots', label: 'Chair is Open: Book Now', dotColor: 'bg-emerald-400' },
    { status: 'in_chair', label: 'Live in the Chair', dotColor: 'bg-rose-400' },
    { status: 'designing', label: 'Designing Custom Work', dotColor: 'bg-purple-400' },
    { status: 'consulting', label: 'In Consultation', dotColor: 'bg-blue-400' },
    { status: 'studio_closed', label: 'Studio Closed', dotColor: 'bg-gray-400' }
  ];
  return (
    <section className="relative pt-4 pb-8 px-4 sm:px-6 overflow-hidden">
      {/* High Voltage Glow Backdrop Orbs */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-80 h-80 sm:w-[500px] sm:h-[500px] bg-cyan-500/10 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-40 right-4 w-60 h-60 bg-blue-600/10 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="max-w-6xl mx-auto">
        {/* Live Status Ticker Banner with Quick Switcher */}
        <div className="relative inline-block mb-5">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-950/80 border border-cyan-400/40 text-cyan-300 text-xs font-mono shadow-[0_0_15px_rgba(0,240,255,0.25)] flex-wrap">
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                profile.liveStatus === 'open_slots' ? 'bg-emerald-400' :
                profile.liveStatus === 'in_chair' ? 'bg-rose-400' :
                profile.liveStatus === 'designing' ? 'bg-purple-400' :
                profile.liveStatus === 'consulting' ? 'bg-blue-400' : 'bg-gray-400'
              }`}></span>
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                profile.liveStatus === 'open_slots' ? 'bg-emerald-500' :
                profile.liveStatus === 'in_chair' ? 'bg-rose-500' :
                profile.liveStatus === 'designing' ? 'bg-purple-500' :
                profile.liveStatus === 'consulting' ? 'bg-blue-500' : 'bg-gray-500'
              }`}></span>
            </span>

            <span className="font-bold text-white tracking-wide">
              {profile.liveStatus === 'open_slots' ? 'CHAIR IS OPEN' : 
               profile.liveStatus === 'in_chair' ? 'LIVE IN THE CHAIR' : 
               profile.liveStatus === 'designing' ? 'DESIGNING CUSTOM WORK' :
               profile.liveStatus === 'consulting' ? 'IN CONSULTATION' :
               profile.liveStatus === 'studio_closed' ? 'STUDIO CLOSED' : 
               'STUDIO OPEN'}
            </span>

            <span className="text-gray-500">•</span>
            <span className="text-cyan-300 truncate max-w-[220px] sm:max-w-none">
              {profile.statusMessage}
            </span>

            {/* Change Status trigger (for Tex / Admin) */}
            {isAdmin && onUpdateStatus ? (
              <button
                type="button"
                onClick={() => setShowStatusMenu(prev => !prev)}
                className="ml-1 px-2 py-0.5 rounded bg-cyan-900/80 border border-cyan-400/50 hover:bg-cyan-800 text-[10px] text-cyan-200 uppercase font-bold tracking-wider transition"
                title="Change studio status"
              >
                Change Status ▾
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onNavigate(profile.liveStatus === 'open_slots' ? 'booking' : 'admin')}
                className="ml-1 px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/50 hover:bg-emerald-900 text-[10px] text-emerald-300 font-bold uppercase tracking-wider transition"
              >
                {profile.liveStatus === 'open_slots' ? 'Book Now →' : 'Tex Status'}
              </button>
            )}
          </div>

          {/* Admin Live Status Dropdown Menu */}
          {showStatusMenu && isAdmin && onUpdateStatus && (
            <div className="absolute left-0 top-full mt-2 z-50 w-72 p-2 rounded-2xl bg-[#080e1c] border-2 border-cyan-400/80 shadow-[0_10px_30px_rgba(0,240,255,0.3)] backdrop-blur-xl">
              <div className="px-2 py-1.5 border-b border-cyan-500/20 text-[11px] font-mono text-cyan-400 font-bold uppercase tracking-wider">
                Select Studio Live Status
              </div>
              <div className="py-1 space-y-1">
                {statusOptions.map(opt => (
                  <button
                    key={opt.status}
                    type="button"
                    onClick={() => {
                      onUpdateStatus(opt.status);
                      setShowStatusMenu(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-mono text-left transition ${
                      profile.liveStatus === opt.status
                        ? 'bg-cyan-500 text-black font-bold'
                        : 'text-gray-300 hover:bg-cyan-950/60 hover:text-cyan-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${opt.dotColor}`} />
                      <span>{opt.label}</span>
                    </div>
                    {profile.liveStatus === opt.status && (
                      <span className="text-[10px] uppercase font-bold">Active</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Main Grid: Portrait & Bold Bio */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-center">
          {/* Hero Portrait with High-Voltage Frame */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center order-1 lg:order-2">
            <div className="relative group max-w-[320px] sm:max-w-[380px] w-full">
              {/* Outer Neon Glow Ring */}
              <div className="absolute -inset-1 bg-gradient-to-r from-cyan-400 via-blue-500 to-cyan-300 rounded-3xl blur-md opacity-70 group-hover:opacity-100 transition duration-500" />

              {/* Card Container */}
              <div className="relative rounded-2xl bg-[#080d1a] border-2 border-cyan-400/50 p-2 sm:p-2.5 overflow-hidden shadow-2xl">
                {/* Image */}
                <div className="relative aspect-[4/5] rounded-xl overflow-hidden bg-black">
                  <img
                    src={profile.avatarUrl}
                    alt={`${profile.artistName} - Lead Artist`}
                    className="w-full h-full object-cover object-center filter contrast-105 saturate-110 group-hover:scale-105 transition-transform duration-700"
                  />
                  {/* Cyberpunk Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#060913] via-transparent to-transparent opacity-80" />

                  {/* Corner Voltage Markers */}
                  <div className="absolute top-2 left-2 px-2 py-1 rounded bg-black/70 backdrop-blur-md border border-cyan-400/60 font-mono text-[10px] text-cyan-300">
                    TEX // LEAD ARTIST
                  </div>
                  <div className="absolute top-2 right-2 px-2 py-1 rounded bg-black/70 backdrop-blur-md border border-cyan-400/60 font-mono text-[10px] text-emerald-300 flex items-center gap-1">
                    <Zap className="w-3 h-3 text-cyan-400" />
                    <span>$100 / HR</span>
                  </div>

                  {/* Bottom Portrait Caption */}
                  <div className="absolute bottom-3 left-3 right-3 p-2.5 rounded-lg bg-black/80 backdrop-blur-md border border-cyan-500/30 text-left">
                    <div className="flex items-center justify-between">
                      <span className="font-heading font-black text-sm text-cyan-300 tracking-wide">
                        TEX • 20+ YRS
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-900/60 text-cyan-300 border border-cyan-400/30">
                        WINCHESTER, VA
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-300 line-clamp-1 mt-0.5">
                      Specialist in Black & Grey Realism & Cover-Ups
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Profile Wall Navigation Shortcut */}
            <button
              onClick={() => onNavigate('journal')}
              className="mt-3 inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-cyan-950/60 hover:bg-cyan-900/80 border border-cyan-400/40 text-cyan-300 text-xs font-mono transition shadow-[0_0_12px_rgba(0,240,255,0.15)]"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Tex's Profile Wall & Updates</span>
              <ArrowRight className="w-3 h-3 text-cyan-400" />
            </button>
          </div>

          {/* Hero Content & Bold Bio */}
          <div className="lg:col-span-7 space-y-5 text-left order-2 lg:order-1">
            {/* Title / Headline */}
            <div>
              <div className="flex items-center gap-2 text-cyan-400 font-tech font-bold text-xs sm:text-sm tracking-widest uppercase mb-1">
                <Flame className="w-4 h-4 text-cyan-400 animate-pulse" />
                <span>Northern Shenandoah Valley • Winchester, VA</span>
              </div>
              <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white leading-tight">
                LIGHTS OUT{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-500">
                  TATTOO
                </span>
              </h1>
              <p className="font-tech text-base sm:text-lg text-cyan-200/90 font-semibold tracking-wide mt-1">
                {profile.tagline}
              </p>
            </div>

            {/* Brief Bold Bio */}
            <div className="p-4 rounded-xl bg-[#091122]/80 border border-cyan-500/30 backdrop-blur-md shadow-[0_0_20px_rgba(0,240,255,0.1)] space-y-2">
              <p className="text-sm sm:text-base text-gray-200 leading-relaxed">
                <strong className="text-cyan-300">Over 20 years</strong> behind the machine. I don’t do generic ink. I specialize in{' '}
                <span className="text-white font-semibold underline decoration-cyan-400 underline-offset-4">
                  hyper-detailed black & grey realism
                </span>{' '}
                and guaranteed, seamless{' '}
                <span className="text-white font-semibold underline decoration-blue-400 underline-offset-4">
                  cover-ups
                </span>{' '}
                that make old, regretful tattoos vanish completely into dark art.
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                {profile.specialties.map(spec => (
                  <span
                    key={spec}
                    className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-cyan-950/60 text-cyan-300 border border-cyan-500/25"
                  >
                    #{spec}
                  </span>
                ))}
              </div>
            </div>

            {/* Rate & Automatic Discount Callout */}
            <div className="p-3.5 rounded-xl bg-gradient-to-r from-cyan-950/60 to-blue-950/60 border border-cyan-400/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-heading font-black text-xl text-white">
                    ${profile.hourlyRate}
                  </span>
                  <span className="text-xs text-gray-400 font-mono">/ hour flat rate</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 font-mono text-xs font-bold">
                    -{profile.onlineDiscountPercent}% APP SPECIAL
                  </span>
                </div>
                <p className="text-xs text-gray-300 mt-0.5">
                  Custom pieces quoted by size. Automatic discount applied when booked via this app!
                </p>
              </div>

              <button
                onClick={() => onNavigate('booking')}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-heading font-bold text-xs tracking-wider uppercase transition shadow-[0_0_15px_rgba(0,240,255,0.4)] whitespace-nowrap active:scale-95"
                id="hero-book-discount-btn"
              >
                Claim -15% & Book
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                onClick={() => onNavigate('gallery')}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-cyan-950/70 border border-cyan-400/50 hover:bg-cyan-900/60 text-cyan-300 font-bold text-sm transition shadow-[0_0_12px_rgba(0,240,255,0.2)] active:scale-95"
                id="hero-view-gallery-btn"
              >
                <span>Explore 80+ Works</span>
                <ArrowRight className="w-4 h-4 text-cyan-400" />
              </button>

              <button
                onClick={() => onNavigate('map')}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gray-900/80 border border-gray-700 hover:border-cyan-500 text-gray-200 text-sm font-semibold transition"
                id="hero-100mi-map-btn"
              >
                <Compass className="w-4 h-4 text-cyan-400" />
                <span>100-Mile Radius</span>
              </button>

              <a
                href={`tel:${profile.phone.replace(/[^0-9]/g, '')}`}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gray-900/80 border border-gray-700 hover:border-cyan-500 text-gray-200 text-sm font-semibold transition"
                id="hero-call-tex-btn"
              >
                <Phone className="w-4 h-4 text-cyan-400" />
                <span>{profile.phone}</span>
              </a>
            </div>

            {/* Credibility Stats Strip */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-cyan-500/20">
              <div className="p-2.5 rounded-lg bg-black/40 border border-cyan-500/20 text-center">
                <div className="font-heading font-black text-lg text-cyan-300">20+ YRS</div>
                <div className="text-[10px] text-gray-400 font-tech uppercase">Master Experience</div>
              </div>
              <div className="p-2.5 rounded-lg bg-black/40 border border-cyan-500/20 text-center">
                <div className="font-heading font-black text-lg text-cyan-300">100 MILES</div>
                <div className="text-[10px] text-gray-400 font-tech uppercase">Shenandoah Radius</div>
              </div>
              <div className="p-2.5 rounded-lg bg-black/40 border border-cyan-500/20 text-center">
                <div className="font-heading font-black text-lg text-emerald-400">100%</div>
                <div className="text-[10px] text-gray-400 font-tech uppercase">Cover-Up Success</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
