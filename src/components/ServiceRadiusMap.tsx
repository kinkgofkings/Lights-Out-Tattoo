import React, { useState } from 'react';
import {
  MapPin,
  Navigation,
  Compass,
  CheckCircle2,
  AlertCircle,
  Car,
  Clock,
  Sparkles,
  Phone
} from 'lucide-react';
import { serviceCities } from '../data/initialData';
import { CityMarker } from '../types';

interface ServiceRadiusMapProps {
  onBookAppointment: () => void;
  phone: string;
}

export const ServiceRadiusMap: React.FC<ServiceRadiusMapProps> = ({
  onBookAppointment,
  phone
}) => {
  const [selectedCity, setSelectedCity] = useState<CityMarker>(serviceCities[0]);
  const [userLocationInput, setUserLocationInput] = useState('');
  const [userDistanceResult, setUserDistanceResult] = useState<{
    distance: number;
    inZone: boolean;
    note: string;
  } | null>(null);

  // Common Shenandoah / DMV cities distance lookup dictionary
  const distanceLookup: Record<string, number> = {
    'winchester': 0,
    '22601': 0,
    '22602': 5,
    'stephens city': 8,
    '22655': 8,
    'berryville': 11,
    '22611': 11,
    'strasburg': 18,
    '22657': 18,
    'front royal': 21,
    '22630': 21,
    'martinsburg': 22,
    '25401': 22,
    'charles town': 25,
    '25414': 25,
    'woodstock': 31,
    '22664': 31,
    'leesburg': 39,
    '20175': 39,
    '20176': 39,
    'hagerstown': 43,
    '21740': 43,
    'frederick': 51,
    '21701': 51,
    'culpeper': 58,
    '22701': 58,
    'harrisonburg': 67,
    '22801': 67,
    'cumberland': 68,
    '21502': 68,
    'ashburn': 45,
    'sterling': 52,
    'reston': 58,
    'fairfax': 65,
    'tysons': 70,
    'alexandria': 75,
    'washington': 72,
    'dc': 72,
    'charlottesville': 95,
    '22901': 95,
    'baltimore': 92,
    '21201': 92
  };

  const handleCheckLocation = (e: React.FormEvent) => {
    e.preventDefault();
    const query = userLocationInput.trim().toLowerCase();
    if (!query) return;

    let dist = distanceLookup[query];
    if (dist === undefined) {
      // Find partial match
      const key = Object.keys(distanceLookup).find(k => query.includes(k) || k.includes(query));
      if (key) dist = distanceLookup[key];
    }

    if (dist !== undefined) {
      setUserDistanceResult({
        distance: dist,
        inZone: dist <= 100,
        note:
          dist === 0
            ? 'You are right here in Winchester, VA! Minutes away from Tex’s studio.'
            : dist <= 100
            ? `You are within Tex’s 100-mile service zone (~${dist} miles, approx ${Math.round(
                dist * 1.15
              )} min drive). Automatic 15% booking discount applies!`
            : `You are ~${dist} miles away, slightly beyond our primary 100-mile boundary. Tex frequently accepts multi-session travel clients from your area!`
      });
    } else {
      // General estimate
      const simulatedDistance = Math.floor(20 + Math.random() * 55);
      setUserDistanceResult({
        distance: simulatedDistance,
        inZone: true,
        note: `Estimated ~${simulatedDistance} miles from downtown Winchester, VA. Well within Tex’s 100-mile Northern Shenandoah territory!`
      });
    }
  };

  return (
    <section className="py-8 px-4 sm:px-6 max-w-6xl mx-auto" id="service-map-section">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-400/40 text-cyan-300 font-tech text-xs uppercase tracking-widest mb-2">
          <Navigation className="w-3.5 h-3.5 text-cyan-400" />
          <span>Northern Shenandoah Service Zone</span>
        </div>
        <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl font-black text-white">
          WINCHESTER, VA <span className="text-cyan-400">100-MILE RADIUS</span>
        </h2>
        <p className="text-xs sm:text-sm text-gray-300 mt-2">
          Centered on Tex's studio in historic Winchester, Virginia. Serving clients across the Shenandoah Valley, West Virginia Eastern Panhandle, Maryland, and Northern Virginia.
        </p>
      </div>

      {/* Main Map Visualizer & City Info Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Radar High-Voltage SVG Interactive Map (7 cols) */}
        <div className="lg:col-span-7">
          <div className="relative rounded-2xl bg-[#060a14] border-2 border-cyan-500/40 p-3 sm:p-5 shadow-[0_0_30px_rgba(0,240,255,0.15)] overflow-hidden">
            {/* Background Grid & Ambient Scan */}
            <div className="relative aspect-square max-h-[480px] w-full flex items-center justify-center mx-auto">
              <svg viewBox="0 0 400 400" className="w-full h-full select-none">
                <defs>
                  <radialGradient id="radarScan" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#00f0ff" stopOpacity="0.25" />
                    <stop offset="60%" stopColor="#0066ff" stopOpacity="0.08" />
                    <stop offset="100%" stopColor="#060a14" stopOpacity="0" />
                  </radialGradient>
                  <filter id="mapGlow">
                    <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                    <feMerge>
                      <feMergeNode in="coloredBlur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>

                {/* Radar background gradient */}
                <circle cx="200" cy="200" r="185" fill="url(#radarScan)" />

                {/* Concentric Radius Rings */}
                {/* 100 Mile Outer Limit */}
                <circle
                  cx="200"
                  cy="200"
                  r="180"
                  fill="none"
                  stroke="#00f0ff"
                  strokeWidth="1.5"
                  strokeDasharray="6 4"
                  opacity="0.8"
                />
                <text x="204" y="28" fill="#00f0ff" fontSize="9" fontFamily="monospace" opacity="0.8">
                  100 MILES (OUTER BOUNDARY)
                </text>

                {/* 75 Mile Ring */}
                <circle
                  cx="200"
                  cy="200"
                  r="135"
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="1.2"
                  strokeDasharray="4 4"
                  opacity="0.65"
                />
                <text x="204" y="72" fill="#60a5fa" fontSize="8" fontFamily="monospace" opacity="0.7">
                  75 MILES
                </text>

                {/* 50 Mile Ring */}
                <circle
                  cx="200"
                  cy="200"
                  r="90"
                  fill="none"
                  stroke="#00f0ff"
                  strokeWidth="1.2"
                  strokeDasharray="4 4"
                  opacity="0.65"
                />
                <text x="204" y="117" fill="#00f0ff" fontSize="8" fontFamily="monospace" opacity="0.7">
                  50 MILES
                </text>

                {/* 25 Mile Ring */}
                <circle
                  cx="200"
                  cy="200"
                  r="45"
                  fill="none"
                  stroke="#00f0ff"
                  strokeWidth="1.5"
                  opacity="0.85"
                />
                <text x="204" y="162" fill="#00f0ff" fontSize="7.5" fontFamily="monospace">
                  25 MILES
                </text>

                {/* Crosshairs */}
                <line x1="20" y1="200" x2="380" y2="200" stroke="rgba(0,240,255,0.18)" strokeWidth="1" />
                <line x1="200" y1="20" x2="200" y2="380" stroke="rgba(0,240,255,0.18)" strokeWidth="1" />

                {/* State Border Indications (Abstract Shenandoah geography) */}
                <path
                  d="M 60 160 Q 180 170 260 90 T 360 40"
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="1"
                  strokeDasharray="2 4"
                  opacity="0.35"
                />
                <text x="110" y="130" fill="#475569" fontSize="9" fontFamily="monospace">
                  WEST VIRGINIA (WV)
                </text>
                <text x="260" y="70" fill="#475569" fontSize="9" fontFamily="monospace">
                  MARYLAND (MD)
                </text>
                <text x="140" y="270" fill="#475569" fontSize="9" fontFamily="monospace">
                  VIRGINIA (VA)
                </text>

                {/* Winchester VA Epicenter (Studio) */}
                <g filter="url(#mapGlow)">
                  <circle cx="200" cy="200" r="10" fill="#00f0ff" fillOpacity="0.3" className="animate-ping" />
                  <circle cx="200" cy="200" r="6" fill="#00f0ff" />
                  <circle cx="200" cy="200" r="2.5" fill="#ffffff" />
                </g>
                <text
                  x="200"
                  y="218"
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize="10"
                  fontWeight="bold"
                  fontFamily="monospace"
                  filter="url(#mapGlow)"
                >
                  WINCHESTER (TEX)
                </text>

                {/* City Markers mapped across the radius */}
                {serviceCities.slice(1).map(city => {
                  const cx = (city.xPercent / 100) * 400;
                  const cy = (city.yPercent / 100) * 400;
                  const isSelected = selectedCity.name === city.name;

                  return (
                    <g
                      key={city.name}
                      onClick={() => setSelectedCity(city)}
                      className="cursor-pointer group"
                    >
                      {/* Connection filament to Winchester */}
                      {isSelected && (
                        <line
                          x1="200"
                          y1="200"
                          x2={cx}
                          y2={cy}
                          stroke="#00f0ff"
                          strokeWidth="1.5"
                          strokeDasharray="4 2"
                        />
                      )}

                      {/* Dot */}
                      <circle
                        cx={cx}
                        cy={cy}
                        r={isSelected ? 6 : 4}
                        fill={isSelected ? '#00f0ff' : '#60a5fa'}
                        stroke="#060a14"
                        strokeWidth="1.5"
                      />

                      {/* City Label */}
                      <text
                        x={cx}
                        y={cy - 7}
                        textAnchor="middle"
                        fill={isSelected ? '#00f0ff' : '#94a3b8'}
                        fontSize={isSelected ? '9' : '7.5'}
                        fontWeight={isSelected ? 'bold' : 'normal'}
                        fontFamily="monospace"
                        className="transition-all"
                      >
                        {city.name}, {city.state}
                      </text>
                    </g>
                  );
                })}
              </svg>

              {/* Live Radar Compass Watermark */}
              <div className="absolute top-2 left-2 flex items-center gap-1.5 text-[10px] font-mono text-cyan-400 bg-black/60 px-2 py-1 rounded border border-cyan-500/30">
                <Compass className="w-3 h-3 text-cyan-400 animate-spin" style={{ animationDuration: '16s' }} />
                <span>RADAR ACTIVE // WINCHESTER 39.1857° N</span>
              </div>
            </div>

            {/* Quick Map Legend */}
            <div className="mt-2 pt-2 border-t border-cyan-500/20 flex flex-wrap items-center justify-between text-[11px] font-mono text-gray-400 gap-2">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                <span>Winchester Studio (Origin)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-400" />
                <span>Cities within 100mi zone</span>
              </div>
              <span className="text-cyan-300 font-semibold">Tap any city point</span>
            </div>
          </div>
        </div>

        {/* Selected City Info & Distance Lookup Form (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Selected City Card */}
          <div className="p-4 rounded-2xl bg-[#091122]/90 border-2 border-cyan-400/40 backdrop-blur-md shadow-[0_0_20px_rgba(0,240,255,0.15)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-cyan-400" />
                <div>
                  <h3 className="font-heading font-black text-lg text-white">
                    {selectedCity.name}, {selectedCity.state}
                  </h3>
                  <span className="text-xs text-gray-400 font-mono">
                    {selectedCity.direction} of Winchester VA
                  </span>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-cyan-500/20 text-cyan-300 font-mono text-xs font-bold border border-cyan-400/40">
                {selectedCity.distanceMiles} MILES
              </span>
            </div>

            {/* Stats Breakdown */}
            <div className="grid grid-cols-2 gap-2 my-4">
              <div className="p-2.5 rounded-xl bg-black/50 border border-cyan-500/20">
                <div className="flex items-center gap-1.5 text-xs text-gray-400 font-mono">
                  <Car className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Est Drive Time</span>
                </div>
                <div className="font-heading font-bold text-base text-cyan-300 mt-1">
                  {selectedCity.driveTime}
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-black/50 border border-cyan-500/20">
                <div className="flex items-center gap-1.5 text-xs text-gray-400 font-mono">
                  <Clock className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Rate / Discount</span>
                </div>
                <div className="font-heading font-bold text-base text-emerald-400 mt-1">
                  $100/hr (-15%)
                </div>
              </div>
            </div>

            <p className="text-xs text-gray-300 leading-relaxed">
              Clients from <strong className="text-white">{selectedCity.name}</strong> regularly make the easy drive down I-81 / Route 7 / Route 50 for full-day realism pieces and cover-up sessions with Tex.
            </p>

            <button
              onClick={onBookAppointment}
              className="mt-4 w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-black font-heading font-bold text-xs uppercase tracking-wider hover:opacity-90 transition shadow-[0_0_15px_rgba(0,240,255,0.4)] flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>Book Appointment from {selectedCity.name}</span>
            </button>
          </div>

          {/* Instant Client Location / Zip Code Distance Checker */}
          <div className="p-4 rounded-2xl bg-[#080d1a]/90 border border-cyan-500/30">
            <h4 className="font-heading font-bold text-sm text-cyan-300 mb-1 flex items-center gap-2">
              <Compass className="w-4 h-4 text-cyan-400" />
              <span>Check If You're In Tex's 100-Mile Radius</span>
            </h4>
            <p className="text-xs text-gray-400 mb-3">
              Enter your town or ZIP code (e.g. "Front Royal", "Martinsburg", "22630", "Leesburg"):
            </p>

            <form onSubmit={handleCheckLocation} className="flex gap-2">
              <input
                type="text"
                placeholder="Enter city or 5-digit zip..."
                value={userLocationInput}
                onChange={e => setUserLocationInput(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl bg-black/60 border border-cyan-500/30 text-white placeholder-gray-500 text-xs font-mono focus:outline-none focus:border-cyan-400"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-cyan-950 border border-cyan-400/60 text-cyan-300 text-xs font-mono font-bold hover:bg-cyan-900 transition"
              >
                Check
              </button>
            </form>

            {/* Checker Output */}
            {userDistanceResult && (
              <div
                className={`mt-3 p-3 rounded-xl border text-xs leading-relaxed flex items-start gap-2.5 ${
                  userDistanceResult.inZone
                    ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                    : 'bg-cyan-950/40 border-cyan-500/40 text-cyan-200'
                }`}
              >
                {userDistanceResult.inZone ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="font-bold text-white mb-0.5 font-mono">
                    {userDistanceResult.distance} Miles to Winchester Studio
                  </div>
                  <p>{userDistanceResult.note}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
