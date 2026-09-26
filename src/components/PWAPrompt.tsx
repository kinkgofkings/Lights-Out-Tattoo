import React, { useEffect, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { Download, RefreshCw } from 'lucide-react';

export const PWAPrompt: React.FC = () => {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered:', r);
    },
    onRegisterError(error) {
      console.log('SW registration error', error);
    },
  });

  const close = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
  };

  if (!offlineReady && !needRefresh) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 sm:left-auto sm:right-4 sm:w-80 z-50 p-4 rounded-xl bg-[#080d1a] border-2 border-cyan-500/50 shadow-[0_0_20px_rgba(0,240,255,0.2)] animate-slide-up">
      <div className="flex items-start gap-3">
        <div className="p-2 bg-cyan-950 rounded-lg text-cyan-400">
          {needRefresh ? <RefreshCw className="w-5 h-5 animate-spin-slow" /> : <Download className="w-5 h-5" />}
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-bold text-white font-heading">
            {needRefresh ? 'Update Available (OTA)' : 'App Ready for Offline'}
          </h4>
          <p className="text-xs text-gray-400 mt-1 mb-3">
            {needRefresh 
              ? 'A new version of Lights Out Tattoo is available. Download and restart to apply updates.' 
              : 'The app has been cached and is ready to work offline.'}
          </p>
          <div className="flex gap-2">
            {needRefresh && (
              <button
                onClick={() => updateServiceWorker(true)}
                className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-lg transition"
              >
                Update Now
              </button>
            )}
            <button
              onClick={close}
              className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-medium rounded-lg transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
