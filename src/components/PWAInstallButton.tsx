import React, { useState } from 'react';
import { usePWAInstall } from './usePWAInstall';
import { Download, Smartphone } from 'lucide-react';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <button
        onClick={install}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 px-4 py-3 text-sm font-bold text-white shadow-[0_0_15px_rgba(0,240,255,0.4)] hover:opacity-90 transition active:scale-95 my-4"
      >
        <Download className="w-5 h-5" />
        Install Official Studio App
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-gray-800 to-gray-700 border border-gray-600 px-4 py-3 text-sm font-bold text-white my-4 transition hover:bg-gray-700"
        >
          <Smartphone className="w-5 h-5 text-cyan-400" />
          Install App on iOS
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
            <div className="w-full max-w-sm rounded-xl bg-[#080d1a] border border-cyan-500/30 p-6 shadow-xl">
              <h3 className="text-lg font-black text-white flex items-center gap-2 mb-2 font-heading">
                <Smartphone className="text-cyan-400 w-5 h-5" />
                Install on iPhone
              </h3>
              <p className="mt-2 text-sm text-gray-300 font-sans">
                1. Tap the <strong>Share</strong> button at the bottom of your Safari browser.<br /><br />
                2. Scroll down and tap <strong>Add to Home Screen</strong>.
              </p>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-6 w-full rounded-lg bg-cyan-600 py-2.5 text-sm font-bold text-white hover:bg-cyan-500 transition"
              >
                Got it
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
