import React from 'react';
import {
  ShieldCheck,
  Award,
  Sparkles,
  MapPin,
  Phone,
  Mail,
  Flame,
  CheckCircle2,
  Clock,
  Zap,
  ExternalLink,
  Camera
} from 'lucide-react';
import { ArtistProfile } from '../types';
import { BustedLightbulbIcon } from './BustedLightbulbIcon';

interface AboutSectionProps {
  profile: ArtistProfile;
  onBookNow: () => void;
}

export const AboutSection: React.FC<AboutSectionProps> = ({
  profile,
  onBookNow
}) => {
  return (
    <section className="py-8 px-4 sm:px-6 max-w-5xl mx-auto" id="about-section">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-400/40 text-cyan-300 font-tech text-xs uppercase tracking-widest mb-2">
          <Flame className="w-3.5 h-3.5 text-cyan-400" />
          <span>20+ Years Dedicated Craftsmanship</span>
        </div>
        <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl font-black text-white">
          MEET ARTIST <span className="text-cyan-400">TEX</span>
        </h2>
        <p className="text-xs sm:text-sm text-gray-300 mt-1 max-w-xl mx-auto">
          Lead Artist & Owner of Lights Out Tattoo • Winchester, Virginia
        </p>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        {/* Left: Portrait & Visual Emblem */}
        <div className="md:col-span-5 flex flex-col items-center">
          <div className="relative w-full max-w-[320px] aspect-[4/5] rounded-2xl overflow-hidden border-2 border-cyan-400/60 shadow-[0_0_25px_rgba(0,240,255,0.25)] group">
            <img
              src={profile.avatarUrl}
              alt="Tex - Lead Tattoo Artist"
              className="w-full h-full object-cover filter contrast-110 saturate-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

            <div className="absolute bottom-3 left-3 right-3 text-left">
              <div className="flex items-center gap-2">
                <BustedLightbulbIcon size={24} glow={true} />
                <span className="font-heading font-black text-white text-base">
                  LIGHTS OUT TATTOO
                </span>
              </div>
              <p className="text-xs text-cyan-300 font-mono mt-0.5">
                Winchester VA • Over 20 Years Experience
              </p>
            </div>
          </div>
        </div>

        {/* Right: Artist Story & Credentials */}
        <div className="md:col-span-7 space-y-4 text-left">
          <div className="p-4 rounded-2xl bg-[#080d1a] border border-cyan-500/30 space-y-3">
            <h3 className="font-heading font-bold text-lg text-white">
              Precision Ink. Zero Gimmicks. Lifetime Art.
            </h3>
            <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
              With over two decades behind custom coil and rotary machines, Tex has established Lights Out Tattoo as Northern Shenandoah’s premier private destination for heavy black and grey realism and uncompromising cover-up work.
            </p>
            <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
              Whether you need to conceal a 15-year-old regretful tribal with rich photographic animal textures, or you’re building a monumental full sleeve with Greek mythology and mechanical voltage details, every appointment is custom-drafted to fit your anatomy.
            </p>
          </div>

          {/* Pillars */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-black/50 border border-cyan-500/20 flex items-start gap-2.5">
              <ShieldCheck className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-heading font-bold text-xs text-white">
                  Hospital-Grade Sanitation
                </h4>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  Single-use sterile cartridge needles, barrier wraps, and medical-grade disinfectants.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-black/50 border border-cyan-500/20 flex items-start gap-2.5">
              <Zap className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-heading font-bold text-xs text-white">
                  $100 / Hour Flat Rate
                </h4>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  No hidden chair fees. Fair, straightforward billing with -15% online discounts.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-black/50 border border-cyan-500/20 flex items-start gap-2.5">
              <Award className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-heading font-bold text-xs text-white">
                  100% Cover-Up Mastery
                </h4>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  Proven depth control to mask dark pigment without laser sessions.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-black/50 border border-cyan-500/20 flex items-start gap-2.5">
              <MapPin className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-heading font-bold text-xs text-white">
                  Northern Shenandoah Radius
                </h4>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  Conveniently situated in Winchester with easy highway access from WV, MD, and VA.
                </p>
              </div>
            </div>
          </div>

          {/* Contact Direct Strip */}
          <div className="p-3.5 rounded-xl bg-cyan-950/40 border border-cyan-400/30 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <a
                href={`tel:${profile.phone.replace(/[^0-9]/g, '')}`}
                className="flex items-center gap-1.5 text-cyan-300 hover:underline text-xs font-mono font-bold"
              >
                <Phone className="w-4 h-4 text-cyan-400" />
                <span>{profile.phone}</span>
              </a>
              <a
                href={`mailto:${profile.emailPrimary}`}
                className="flex items-center gap-1.5 text-gray-300 hover:text-cyan-300 text-xs font-mono"
              >
                <Mail className="w-4 h-4 text-cyan-400" />
                <span>{profile.emailPrimary}</span>
              </a>
            </div>

            <button
              onClick={onBookNow}
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-black font-heading font-bold text-xs uppercase tracking-wider hover:opacity-90 transition shadow-[0_0_12px_rgba(0,240,255,0.4)]"
            >
              Book with Tex (-15%)
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
