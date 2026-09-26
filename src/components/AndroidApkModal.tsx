import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  Download,
  X,
  CheckCircle2,
  Share,
  Layers,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Terminal
} from 'lucide-react';
import { BustedLightbulbIcon } from './BustedLightbulbIcon';

interface AndroidApkModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AndroidApkModal: React.FC<AndroidApkModalProps> = ({
  isOpen,
  onClose
}) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handler);

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      alert(
        'To install Lights Out Tattoo on Android:\n1. Open Chrome menu (3 dots)\n2. Tap "Install app" or "Add to Home screen"\n\nOn iPhone/iPad: Tap the Share icon and select "Add to Home Screen".'
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-2xl bg-[#080d1a] border-2 border-cyan-400/60 shadow-[0_0_30px_rgba(0,240,255,0.3)] p-5 sm:p-7 my-6 text-left">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl bg-gray-900 border border-gray-700 text-gray-400 hover:text-white hover:border-cyan-400 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-cyan-950/80 border border-cyan-400 flex items-center justify-center shadow-[0_0_15px_#00f0ff]">
            <BustedLightbulbIcon size={28} glow={true} />
          </div>
          <div>
            <h3 className="font-heading font-black text-lg sm:text-xl text-white">
              MOBILE & ANDROID APK SETUP
            </h3>
            <p className="text-xs text-cyan-300 font-mono">
              Lights Out Tattoo • Standalone PWA & APK
            </p>
          </div>
        </div>

        {/* Install Option 1: Direct PWA WebAPK */}
        <div className="p-4 rounded-xl bg-[#09152b] border border-cyan-500/30 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="font-heading font-bold text-sm text-white flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-cyan-400" />
              <span>1-Tap Android WebAPK Installation</span>
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/40 font-bold">
              INSTANT
            </span>
          </div>
          <p className="text-xs text-gray-300 leading-relaxed mb-3">
            Installs directly to your phone's home screen with the custom Busted Lightbulb icon, high-voltage splash screen, and offline portfolio caching.
          </p>

          <button
            onClick={handleInstallClick}
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-black font-heading font-black text-xs uppercase tracking-wider hover:opacity-95 transition shadow-[0_0_15px_rgba(0,240,255,0.4)] flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>{isInstalled ? 'App Already Installed' : 'Install Lights Out to Phone'}</span>
          </button>
        </div>

        {/* Option 2: Native Android APK (Bubblewrap / Capacitor) */}
        <div className="p-4 rounded-xl bg-black/50 border border-gray-800 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="font-heading font-bold text-xs text-gray-200 flex items-center gap-2">
              <Terminal className="w-4 h-4 text-cyan-400" />
              <span>Native Android APK & Google Play (TWA / Bubblewrap)</span>
            </span>
            <span className="text-[10px] font-mono text-gray-400">DEV CLI</span>
          </div>

          <p className="text-[11px] text-gray-400 leading-relaxed">
            This app already contains a valid <code className="text-cyan-300">manifest.json</code>, service worker cache, and high-res vector icons. To bundle an <strong className="text-white">.apk</strong> or <strong className="text-white">.aab</strong> for Google Play Store:
          </p>

          <div className="p-2.5 rounded-lg bg-black font-mono text-[11px] text-cyan-300 border border-gray-800 select-all overflow-x-auto">
            <code>
              npm i -g @bubblewrap/cli<br />
              bubblewrap init --manifest=https://lightsouttattoo.site/manifest.json<br />
              bubblewrap build
            </code>
          </div>

          <div className="flex items-center gap-2 text-[10px] font-mono text-emerald-400 pt-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>PWA Manifest & Apple Touch Icons Ready in /public</span>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-gray-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-gray-900 text-gray-300 text-xs font-mono hover:text-white"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
