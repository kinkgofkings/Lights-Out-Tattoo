import React from 'react';
import {
  Flame,
  Camera,
  CalendarCheck,
  Video,
  BookOpen,
  ShieldCheck,
  MapPin
} from 'lucide-react';

interface BottomAppBarProps {
  activeTab: string;
  isAdmin?: boolean;
  onNavigate: (tab: string) => void;
}

export const BottomAppBar: React.FC<BottomAppBarProps> = ({
  activeTab,
  isAdmin = false,
  onNavigate
}) => {
  const tabs = [
    { id: 'home', label: 'Studio', icon: Flame },
    { id: 'gallery', label: 'Gallery', icon: Camera, badge: '80+' },
    { id: 'booking', label: 'Book', icon: CalendarCheck, badge: '-15%', highlight: true },
    { id: 'map', label: '100mi Map', icon: MapPin },
    { id: 'reels', label: 'Reels', icon: Video },
    { id: 'journal', label: 'Journal', icon: BookOpen },
    ...(isAdmin ? [{ id: 'admin', label: 'Admin', icon: ShieldCheck }] : [])
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-[100] bg-[#060913]/95 backdrop-blur-lg border-t border-cyan-500/25 px-1 py-1.5 shadow-[0_-8px_25px_rgba(0,240,255,0.15)] pb-[max(0.375rem,env(safe-area-inset-bottom))]"
      id="bottom-locked-appbar"
    >
      <div className="max-w-xl mx-auto flex items-center justify-around">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onNavigate(tab.id)}
              className={`relative flex flex-col items-center justify-center py-1 px-1.5 sm:px-2.5 rounded-xl transition-all duration-200 group ${
                isActive
                  ? 'text-cyan-300 font-bold'
                  : 'text-gray-400 hover:text-cyan-400 font-medium'
              } ${tab.highlight && !isActive ? 'text-cyan-400' : ''}`}
              id={`nav-tab-${tab.id}`}
            >
              {/* Active Indicator Top Glow Line */}
              {isActive && (
                <div className="absolute -top-1.5 w-6 h-1 rounded-full bg-cyan-400 shadow-[0_0_8px_#00f0ff]" />
              )}

              {/* Icon Container with Badge */}
              <div
                className={`relative p-1 rounded-lg transition-transform duration-200 group-hover:scale-110 ${
                  isActive
                    ? 'bg-cyan-950/80 border border-cyan-400/50 shadow-[0_0_10px_rgba(0,240,255,0.4)]'
                    : tab.highlight
                    ? 'bg-cyan-950/40 border border-cyan-500/30'
                    : ''
                }`}
              >
                <Icon className={`w-4 h-4 sm:w-4.5 sm:h-4.5 ${isActive ? 'text-cyan-300' : ''}`} />

                {/* Badge if present */}
                {tab.badge && (
                  <span
                    className={`absolute -top-2 -right-2 text-[8px] sm:text-[9px] font-mono font-black px-1 rounded-full border leading-tight ${
                      tab.badge.startsWith('-')
                        ? 'bg-emerald-500 text-black border-emerald-300 animate-pulse'
                        : 'bg-cyan-600 text-white border-cyan-300'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </div>

              {/* Tab Label */}
              <span className="text-[10px] sm:text-[11px] tracking-tight mt-0.5 whitespace-nowrap">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
