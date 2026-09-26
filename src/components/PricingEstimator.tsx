import React, { useState, useMemo } from 'react';
import {
  Calculator,
  Percent,
  Sparkles,
  Layers,
  Clock,
  DollarSign,
  ShieldCheck,
  ArrowRight
} from 'lucide-react';
import { ArtistProfile } from '../types';

interface PricingEstimatorProps {
  profile: ArtistProfile;
  onProceedToBook: (details: {
    approximateSize: string;
    placement: string;
    isCoverUp: boolean;
    estimatedHours: number;
    estimatedPrice: number;
    finalPrice: number;
    discountAmount: number;
  }) => void;
}

export const PricingEstimator: React.FC<PricingEstimatorProps> = ({
  profile,
  onProceedToBook
}) => {
  const [selectedSize, setSelectedSize] = useState<'flash' | 'palm' | 'large' | 'half_sleeve' | 'full_sleeve'>('palm');
  const [styleComplexity, setStyleComplexity] = useState<'line' | 'realism' | 'coverup'>('realism');
  const [placement, setPlacement] = useState('Forearm');

  const sizeOptions = [
    {
      id: 'flash',
      name: 'Small Flash / Filler',
      desc: '2x2 to 3x3 in (Symbols, script, small skulls)',
      baseHours: 1.5,
      icon: '⚡'
    },
    {
      id: 'palm',
      name: 'Medium / Palm Size',
      desc: '4x4 to 5x5 in (Single portraits, animals, roses)',
      baseHours: 3.5,
      icon: '🦅'
    },
    {
      id: 'large',
      name: 'Large Statement',
      desc: '6x8 to 8x10 in (Outer forearm, calf, shoulder plate)',
      baseHours: 6.0,
      icon: '💀'
    },
    {
      id: 'half_sleeve',
      name: 'Half Sleeve / Chest Plate',
      desc: 'Comprehensive multi-element composition',
      baseHours: 10.0,
      icon: '🦾'
    },
    {
      id: 'full_sleeve',
      name: 'Full Sleeve / Full Back',
      desc: 'Monumental masterwork (multi-session project)',
      baseHours: 20.0,
      icon: '🏛️'
    }
  ];

  const complexityOptions = [
    { id: 'line', label: 'Classic Linework / Flash', multiplier: 1.0, desc: 'Bold outlines & soft flat shading' },
    { id: 'realism', label: 'Black & Grey Realism', multiplier: 1.2, desc: 'Hyper-detailed graywash textures & white highlights' },
    { id: 'coverup', label: 'Cover-Up Transformation', multiplier: 1.35, desc: 'Maximum pigment saturation & structural concealment' }
  ];

  const placements = [
    'Forearm',
    'Upper Arm / Bicep',
    'Calf / Shin',
    'Thigh Panel',
    'Chest Plate',
    'Full Back / Shoulder Blade',
    'Ribs / Sternum',
    'Neck / Hand'
  ];

  const calculation = useMemo(() => {
    const sizeConfig = sizeOptions.find(s => s.id === selectedSize) || sizeOptions[1];
    const compConfig = complexityOptions.find(c => c.id === styleComplexity) || complexityOptions[1];

    const estimatedHours = Math.round(sizeConfig.baseHours * compConfig.multiplier * 10) / 10;
    const basePrice = Math.round(estimatedHours * profile.hourlyRate);
    const discountAmount = Math.round(basePrice * (profile.onlineDiscountPercent / 100));
    const finalPrice = basePrice - discountAmount;

    return {
      sizeConfig,
      compConfig,
      estimatedHours,
      basePrice,
      discountAmount,
      finalPrice
    };
  }, [selectedSize, styleComplexity, profile]);

  const handleBookNow = () => {
    onProceedToBook({
      approximateSize: calculation.sizeConfig.name,
      placement,
      isCoverUp: styleComplexity === 'coverup',
      estimatedHours: calculation.estimatedHours,
      estimatedPrice: calculation.basePrice,
      finalPrice: calculation.finalPrice,
      discountAmount: calculation.discountAmount
    });
  };

  return (
    <div className="p-4 sm:p-6 rounded-2xl bg-[#080d1a] border-2 border-cyan-500/30 shadow-[0_0_30px_rgba(0,240,255,0.15)]">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-cyan-500/20 pb-4 mb-5">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 font-tech text-xs font-bold uppercase tracking-widest">
            <Calculator className="w-4 h-4 text-cyan-400" />
            <span>Transparent Pricing • Winchester VA</span>
          </div>
          <h3 className="font-heading font-black text-xl sm:text-2xl text-white mt-0.5">
            INTERACTIVE <span className="text-cyan-400">PRICING ESTIMATOR</span>
          </h3>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="px-2.5 py-1 rounded-lg bg-cyan-950 border border-cyan-400/40 text-cyan-300 font-bold">
            ${profile.hourlyRate} / Hour Flat
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-emerald-950 border border-emerald-400/40 text-emerald-300 font-bold animate-pulse">
            -{profile.onlineDiscountPercent}% Automatic Discount
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Controls: Size, Complexity, Placement (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* 1. Size Selection */}
          <div>
            <label className="block text-xs font-tech font-bold uppercase text-gray-300 tracking-wider mb-2">
              1. Select Tattoo Scope / Approximate Size
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {sizeOptions.map(size => {
                const isSelected = selectedSize === size.id;
                return (
                  <button
                    key={size.id}
                    type="button"
                    onClick={() => setSelectedSize(size.id as any)}
                    className={`p-3 rounded-xl text-left border transition-all ${
                      isSelected
                        ? 'bg-gradient-to-r from-cyan-950 to-blue-950 border-cyan-400 text-white shadow-[0_0_12px_rgba(0,240,255,0.3)]'
                        : 'bg-[#091122]/70 border-cyan-500/20 text-gray-300 hover:border-cyan-500/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-heading font-bold flex items-center gap-1.5">
                        <span>{size.icon}</span>
                        <span>{size.name}</span>
                      </span>
                      <span className="text-xs font-mono text-cyan-400">
                        ~{size.baseHours}h
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-400 mt-1 line-clamp-1">{size.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Style & Complexity */}
          <div>
            <label className="block text-xs font-tech font-bold uppercase text-gray-300 tracking-wider mb-2">
              2. Art Style & Shading Complexity
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {complexityOptions.map(comp => {
                const isSelected = styleComplexity === comp.id;
                return (
                  <button
                    key={comp.id}
                    type="button"
                    onClick={() => setStyleComplexity(comp.id as any)}
                    className={`p-2.5 rounded-xl text-left border transition-all ${
                      isSelected
                        ? 'bg-cyan-950 border-cyan-400 text-cyan-300 shadow-[0_0_10px_rgba(0,240,255,0.3)]'
                        : 'bg-[#091122]/70 border-cyan-500/20 text-gray-400 hover:border-cyan-500/40'
                    }`}
                  >
                    <div className="text-xs font-heading font-bold text-white mb-0.5">
                      {comp.label}
                    </div>
                    <p className="text-[10px] text-gray-400">{comp.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Placement */}
          <div>
            <label className="block text-xs font-tech font-bold uppercase text-gray-300 tracking-wider mb-2">
              3. Body Placement
            </label>
            <div className="flex flex-wrap gap-1.5">
              {placements.map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPlacement(p)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-mono transition ${
                    placement === p
                      ? 'bg-cyan-500 text-black font-bold shadow-[0_0_8px_#00f0ff]'
                      : 'bg-black/50 text-gray-400 border border-cyan-500/20 hover:border-cyan-400'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Breakdown & Lock-In Card (5 cols) */}
        <div className="lg:col-span-5 flex flex-col justify-between p-4 sm:p-5 rounded-2xl bg-gradient-to-b from-[#091326] to-[#060a14] border-2 border-cyan-400/50 shadow-[0_0_25px_rgba(0,240,255,0.2)]">
          <div>
            <div className="flex items-center justify-between text-xs font-mono text-cyan-400 border-b border-cyan-500/20 pb-2">
              <span>ESTIMATE BREAKDOWN</span>
              <span>TEX // WINCHESTER VA</span>
            </div>

            {/* Price Display */}
            <div className="my-4 text-center">
              <div className="text-xs text-gray-400 font-mono line-through">
                Regular Rate: ${calculation.basePrice}
              </div>
              <div className="flex items-center justify-center gap-1 font-heading font-black text-3xl sm:text-4xl text-white mt-1">
                <span className="text-cyan-400">$</span>
                <span>{calculation.finalPrice}</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 mt-1 rounded-full bg-emerald-950/80 border border-emerald-400/50 text-emerald-300 font-mono text-xs font-bold">
                <Percent className="w-3 h-3 text-emerald-400" />
                <span>You Save ${calculation.discountAmount} (15% Online Special)</span>
              </div>
            </div>

            {/* Line Items */}
            <div className="space-y-2 text-xs font-mono text-gray-300 border-t border-cyan-500/20 pt-3">
              <div className="flex justify-between">
                <span className="text-gray-400">Estimated Duration:</span>
                <span className="text-white font-bold">{calculation.estimatedHours} Hours</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Artist Rate:</span>
                <span className="text-white">${profile.hourlyRate} / hr</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Selected Placement:</span>
                <span className="text-cyan-300">{placement}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Style Specialization:</span>
                <span className="text-cyan-300">{calculation.compConfig.label}</span>
              </div>
              <div className="flex justify-between border-t border-gray-800 pt-2 text-cyan-200">
                <span>Required Deposit:</span>
                <span className="font-bold text-white">$200 (Nonrefundable)</span>
              </div>
            </div>
          </div>

          {/* Policy Callout */}
          <div className="p-2.5 rounded-xl bg-red-950/30 border border-red-500/40 text-[11px] font-mono text-red-200 space-y-1">
            <div className="flex items-center gap-1 font-bold text-red-300">
              <ShieldCheck className="w-3.5 h-3.5 text-red-400" />
              <span>Studio Deposit Policy:</span>
            </div>
            <p className="text-[10px] text-gray-300 leading-tight">
              A $200 security deposit locks your chair date. Missed appointments without notice forfeit your spot & deposit. Reschedules accepted with advance notice.
            </p>
          </div>

          <div className="mt-3 pt-2">
            <button
              onClick={handleBookNow}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 via-sky-400 to-blue-600 text-black font-heading font-black text-xs sm:text-sm uppercase tracking-wider hover:opacity-95 transition shadow-[0_0_20px_rgba(0,240,255,0.5)] flex items-center justify-center gap-2 active:scale-95"
            >
              <Sparkles className="w-4 h-4" />
              <span>Lock In -15% & Open Booking Form</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <p className="text-[10px] text-gray-400 text-center font-mono mt-2">
              $200 deposit locks spot & applies directly to final tattoo total.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
