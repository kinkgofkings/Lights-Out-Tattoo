import React, { useEffect, useState } from 'react';
import { Lock, CheckCircle2, KeyRound, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { BustedLightbulbIcon } from './BustedLightbulbIcon';
import { AdminAuthSession } from '../types';
import { storageService } from '../services/storage';
import {
  tiktokService,
  TikTokStatusResponse,
  DEFAULT_STUDIO_SCOPES,
  APPROVED_STUDIO_CALLBACK_URIS,
  TIKTOK_SCOPE_PRESETS
} from '../services/tiktok';

interface AdminLoginGateProps {
  onLoginSuccess: (session: AdminAuthSession) => void;
  onCancel?: () => void;
}

export const AdminLoginGate: React.FC<AdminLoginGateProps> = ({
  onLoginSuccess,
  onCancel
}) => {
  const [authErrorMessage, setAuthErrorMessage] = useState('');
  const [isAuthenticatingTikTok, setIsAuthenticatingTikTok] = useState(false);
  const [tiktokStatus, setTiktokStatus] = useState<TikTokStatusResponse | null>(null);
  const [showPinMode, setShowPinMode] = useState(true);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [showPinDigits, setShowPinDigits] = useState(false);

  const currentHost = typeof window !== 'undefined' ? window.location.hostname : '';
  const isDevPreview = currentHost.includes('ais-dev');
  const isPrePreview = currentHost.includes('ais-pre');
  const defaultInitialUri = isDevPreview 
    ? 'https://ais-dev-rigzdibvuat6tjvdifupqh-473048529424.us-east1.run.app/oauth/callback'
    : isPrePreview
    ? 'https://ais-pre-rigzdibvuat6tjvdifupqh-473048529424.us-east1.run.app/oauth/callback'
    : 'https://lightsouttattoo.site/api/tiktok/callback';

  const [selectedRedirectUri, setSelectedRedirectUri] = useState<string>(defaultInitialUri);
  const [showRedirectOptions, setShowRedirectOptions] = useState<boolean>(false);
  const [selectedScopes, setSelectedScopes] = useState<string>('user.info.basic');
  const [showScopeOptions, setShowScopeOptions] = useState<boolean>(false);
  const [showTikTokSection, setShowTikTokSection] = useState<boolean>(false);

  useEffect(() => {
    tiktokService.getStatus().then(status => {
      setTiktokStatus(status);
      if (isDevPreview) {
        setSelectedRedirectUri('https://ais-dev-rigzdibvuat6tjvdifupqh-473048529424.us-east1.run.app/oauth/callback');
      } else if (isPrePreview) {
        setSelectedRedirectUri('https://ais-pre-rigzdibvuat6tjvdifupqh-473048529424.us-east1.run.app/oauth/callback');
      } else if (status?.redirectUri) {
        setSelectedRedirectUri(status.redirectUri);
      }
      // Keep approved live scope by default unless explicitly saved
      if (status?.scopes && !status.scopes.includes('video.list')) {
        setSelectedScopes(status.scopes);
      } else {
        setSelectedScopes('user.info.basic');
      }
    });
  }, [isDevPreview, isPrePreview]);

  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data?.type === 'TIKTOK_AUTH_SUCCESS' && e.data?.user) {
        const session: AdminAuthSession = {
          isAuthenticated: true,
          method: 'tiktok',
          username: e.data.user.username ? (e.data.user.username.startsWith('@') ? e.data.user.username : `@${e.data.user.username}`) : '@lightsouttattoo.site',
          displayName: e.data.user.displayName || 'The Dirty Texan',
          avatarUrl: e.data.user.avatarUrl || '/icon.png',
          verifiedArtist: true,
          loginTime: new Date().toISOString()
        };
        storageService.setAdminAuth(session);
        localStorage.setItem('lot_admin_session_v1', JSON.stringify(session));
        localStorage.setItem('lightsout_admin_session', JSON.stringify(session));
        onLoginSuccess(session);
        setIsAuthenticatingTikTok(false);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onLoginSuccess]);

  const handleTikTokOAuthLogin = async (forceNewAuth: boolean = false) => {
    setIsAuthenticatingTikTok(true);
    setAuthErrorMessage('');
    try {
      if (!forceNewAuth && tiktokStatus?.isConnected && tiktokStatus?.user) {
        const session: AdminAuthSession = {
          isAuthenticated: true,
          method: 'tiktok',
          username: tiktokStatus.user.username ? (tiktokStatus.user.username.startsWith('@') ? tiktokStatus.user.username : `@${tiktokStatus.user.username}`) : '@lightsouttattoo.site',
          displayName: tiktokStatus.user.displayName || 'The Dirty Texan',
          avatarUrl: tiktokStatus.user.avatarUrl || '/icon.png',
          verifiedArtist: true,
          loginTime: new Date().toISOString()
        };
        storageService.setAdminAuth(session);
        localStorage.setItem('lot_admin_session_v1', JSON.stringify(session));
        localStorage.setItem('lightsout_admin_session', JSON.stringify(session));
        onLoginSuccess(session);
        setIsAuthenticatingTikTok(false);
        return;
      }
      
      const uriToUse = isDevPreview 
        ? 'https://ais-dev-rigzdibvuat6tjvdifupqh-473048529424.us-east1.run.app/oauth/callback'
        : isPrePreview
        ? 'https://ais-pre-rigzdibvuat6tjvdifupqh-473048529424.us-east1.run.app/oauth/callback'
        : selectedRedirectUri || tiktokStatus?.redirectUri || 'https://lightsouttattoo.site/api/tiktok/callback';
      const returnUrl = window.location.href;
      const data = await tiktokService.getAuthUrl(uriToUse, selectedScopes, returnUrl);
      
      if (data.error || !data.authUrl) {
        throw new Error(data.error || 'Failed to generate TikTok authorization link.');
      }
      
      const isIframe = window !== window.parent;
      if (isIframe) {
        window.open(data.authUrl, '_blank');
      } else {
        const popup = window.open(data.authUrl, 'tiktok_oauth', 'width=620,height=750,menubar=no,toolbar=no');
        if (!popup || popup.closed || typeof popup.closed === 'undefined') {
          window.location.href = data.authUrl;
        }
      }
    } catch (err: any) {
      console.error(err);
      setAuthErrorMessage(err.message || 'Could not connect to TikTok.');
      setIsAuthenticatingTikTok(false);
    }
  };

  const handlePinSubmit = (e?: React.FormEvent, customCode?: string) => {
    if (e) e.preventDefault();
    setPinError('');
    const code = (customCode !== undefined ? customCode : pinInput).trim();
    const storedPin = storageService.getAdminPin().trim();
    
    // Valid if matches stored PIN (default 1234) or Tex master aliases
    if (code === storedPin || code === '1234' || code.toLowerCase() === 'tex' || code.toLowerCase() === 'admin') {
      const session: AdminAuthSession = {
        isAuthenticated: true,
        method: 'pin',
        username: '@lightsouttattoo.site',
        displayName: 'The Dirty Texan',
        avatarUrl: '/icon.png',
        verifiedArtist: true,
        loginTime: new Date().toISOString()
      };
      storageService.setAdminAuth(session);
      localStorage.setItem('lot_admin_session_v1', JSON.stringify(session));
      localStorage.setItem('lightsout_admin_session', JSON.stringify(session));
      onLoginSuccess(session);
    } else {
      setPinError(`Invalid Admin Code "${code}". Default is 1234.`);
    }
  };

  return (
    <div className="min-h-screen bg-[#050811] flex items-center justify-center p-4">
      <div className="max-w-md w-full relative">
        <div className="absolute inset-0 bg-cyan-500/10 blur-[80px] rounded-full pointer-events-none" />
        
        <div className="relative bg-[#081122]/95 backdrop-blur-xl border border-cyan-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl">
          <div className="flex flex-col items-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-cyan-950/50 border border-cyan-500/30 flex items-center justify-center mb-4 relative shadow-[0_0_20px_rgba(0,240,255,0.2)]">
              <BustedLightbulbIcon className="w-8 h-8 text-cyan-400" />
              <div className="absolute -bottom-1 -right-1 bg-cyan-500 rounded-full p-1 border-2 border-[#081122]">
                <Lock className="w-3 h-3 text-black" />
              </div>
            </div>
            
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-widest uppercase flex items-center gap-2 mb-2 text-center">
              LIGHTS OUT TATTOO
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 tracking-wider">SECURE</span>
            </h1>
            <p className="text-cyan-400 font-mono text-xs uppercase tracking-widest mb-1">STUDIO ADMIN ACCESS</p>
            <p className="text-xs text-gray-400 text-center max-w-xs">
              Lead Artist Tex • Enter Studio Admin Code to Unlock
            </p>
          </div>

          {authErrorMessage && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-950/40 border border-red-500/30 flex items-start gap-2.5 text-xs text-red-200">
              <span className="text-red-400 font-bold">!</span>
              <div>
                <p>{authErrorMessage}</p>
                <p className="mt-1 text-[11px] text-gray-400">
                  Use your <strong>Admin Code</strong> below to enter immediately.
                </p>
              </div>
            </div>
          )}

          {/* PRIMARY: Admin Code Login Form */}
          <form onSubmit={handlePinSubmit} className="space-y-4">
            <div className="p-4 rounded-2xl bg-[#060c18] border border-cyan-500/30 shadow-inner">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-mono uppercase text-gray-300 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-cyan-400" />
                  Studio Admin Code
                </label>
                <span className="text-[10px] font-mono text-cyan-400/80">Default: 1234</span>
              </div>

              <div className="relative">
                <input
                  type={showPinDigits ? 'text' : 'password'}
                  value={pinInput}
                  onChange={(e) => {
                    setPinInput(e.target.value);
                    if (pinError) setPinError('');
                  }}
                  placeholder="Enter code (1234)"
                  maxLength={16}
                  className="w-full bg-[#03060c] border border-cyan-500/40 rounded-xl px-4 py-3 text-white text-center text-xl tracking-widest font-mono focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 shadow-[0_0_15px_rgba(0,240,255,0.1)]"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPinDigits(!showPinDigits)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white p-1"
                  title={showPinDigits ? 'Hide code' : 'Show code'}
                >
                  {showPinDigits ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {pinError && (
                <p className="text-xs text-red-400 mt-2 text-center font-mono">{pinError}</p>
              )}

              {/* Quick Fill Button */}
              <div className="mt-3 flex items-center justify-between gap-2 pt-2 border-t border-cyan-500/10">
                <span className="text-[11px] text-gray-400">Quick Access:</span>
                <button
                  type="button"
                  onClick={() => {
                    setPinInput('1234');
                    handlePinSubmit(undefined, '1234');
                  }}
                  className="px-2.5 py-1 rounded-lg bg-cyan-950/60 hover:bg-cyan-900 border border-cyan-400/40 text-cyan-300 text-xs font-mono font-semibold transition flex items-center gap-1.5"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                  Quick Fill (1234) & Enter
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-black font-black tracking-wider uppercase rounded-xl transition flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,240,255,0.35)] active:scale-[0.99]"
            >
              <ShieldCheck className="w-4 h-4" />
              Unlock Studio Admin →
            </button>
          </form>

          {/* SECONDARY: TikTok Account OAuth Connection */}
          <div className="mt-6 pt-5 border-t border-cyan-500/20">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono text-gray-400 flex items-center gap-1.5">
                <i className="fa-brands fa-tiktok text-cyan-400"></i>
                OR AUTHENTICATE VIA TIKTOK
              </span>
              <button
                type="button"
                onClick={() => setShowTikTokSection(!showTikTokSection)}
                className="text-[11px] text-cyan-400 hover:underline font-mono"
              >
                {showTikTokSection ? 'Hide' : 'Show Options'}
              </button>
            </div>

            {showTikTokSection ? (
              <div className="space-y-3 animate-fade-in">
                <button
                  onClick={() => handleTikTokOAuthLogin(false)}
                  disabled={isAuthenticatingTikTok}
                  className="w-full relative group overflow-hidden rounded-2xl p-0.5 transition-all duration-300"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 via-blue-500 to-cyan-500 opacity-50 group-hover:opacity-100 transition-opacity" />
                  <div className="relative bg-black/90 rounded-2xl p-3.5 flex items-center gap-3">
                    <div className="w-10 h-10 flex-shrink-0 bg-zinc-900 rounded-xl flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
                      </svg>
                    </div>
                    
                    <div className="flex-1 text-left">
                      <h3 className="text-sm font-bold text-white mb-0.5 flex items-center gap-1.5">
                        {isAuthenticatingTikTok ? 'Connecting...' : 'Log In with TikTok'}
                        {tiktokStatus?.isConnected && <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />}
                      </h3>
                      <div className="text-[11px] text-gray-400">
                        {tiktokStatus?.user?.username ? (tiktokStatus.user.username.startsWith('@') ? tiktokStatus.user.username : `@${tiktokStatus.user.username}`) : '@lightsouttattoo.site'} • {tiktokStatus?.user?.displayName || 'The Dirty Texan'}
                      </div>
                    </div>
                    
                    <div className="px-2.5 py-1 rounded-lg bg-cyan-950/40 border border-cyan-500/30 text-cyan-400 text-xs font-medium group-hover:bg-cyan-500 group-hover:text-black transition-colors">
                      Connect →
                    </div>
                  </div>
                </button>

                {/* Redirect URI Selector (The 3 Approved Callback URIs) */}
                <div className="rounded-xl bg-black/40 border border-cyan-500/20 p-2.5 text-[11px] font-mono text-gray-400">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <span className="text-gray-400 font-sans text-xs">Approved Callback:</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowRedirectOptions(!showRedirectOptions)}
                      className="text-cyan-400 hover:text-cyan-300 underline text-[10px] font-sans"
                    >
                      {showRedirectOptions ? 'Hide' : 'Switch (4)'}
                    </button>
                  </div>
                  <div className="text-cyan-300 truncate mt-1 break-all select-all font-mono text-[10px] bg-cyan-950/30 p-1.5 rounded border border-cyan-500/20">
                    {selectedRedirectUri || tiktokStatus?.redirectUri || 'https://lightsouttattoo.site/api/tiktok/callback'}
                  </div>
                  {showRedirectOptions && (
                    <div className="mt-2 pt-2 border-t border-cyan-500/20 space-y-1">
                      <button
                        type="button"
                        onClick={() => setSelectedRedirectUri('https://ais-dev-rigzdibvuat6tjvdifupqh-473048529424.us-east1.run.app/oauth/callback')}
                        className={`w-full text-left px-2 py-1.5 rounded text-[10px] truncate transition ${selectedRedirectUri.includes('ais-dev') ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-500/50 font-bold' : 'bg-black/60 text-gray-400 hover:text-white border border-transparent'}`}
                      >
                        ⚡ Live Slot #6: AI Studio Dev Preview (Current Workspace)
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedRedirectUri('https://lightsouttattoo.site/api/tiktok/callback')}
                        className={`w-full text-left px-2 py-1.5 rounded text-[10px] truncate transition ${selectedRedirectUri === 'https://lightsouttattoo.site/api/tiktok/callback' ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-500/50 font-bold' : 'bg-black/60 text-gray-400 hover:text-white border border-transparent'}`}
                      >
                        🌐 Live Slot #9: lightsouttattoo.site/api/tiktok/callback (Custom Domain)
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedRedirectUri('https://www.lightsouttattoo.site/api/tiktok/callback')}
                        className={`w-full text-left px-2 py-1.5 rounded text-[10px] truncate transition ${selectedRedirectUri === 'https://www.lightsouttattoo.site/api/tiktok/callback' ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-500/50 font-bold' : 'bg-black/60 text-gray-400 hover:text-white border border-transparent'}`}
                      >
                        🌐 Live Slot #10: www.lightsouttattoo.site/api/tiktok/callback (WWW Domain)
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedRedirectUri('https://ais-pre-rigzdibvuat6tjvdifupqh-473048529424.us-east1.run.app/oauth/callback')}
                        className={`w-full text-left px-2 py-1.5 rounded text-[10px] truncate transition ${selectedRedirectUri.includes('ais-pre') ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-500/50 font-bold' : 'bg-black/60 text-gray-400 hover:text-white border border-transparent'}`}
                      >
                        🔗 Live Slot #8: AI Studio Shared Preview
                      </button>
                    </div>
                  )}
                </div>

                {/* Scope Preset Selector */}
                <div className="rounded-xl bg-black/40 border border-cyan-500/20 p-2.5 text-[11px] font-mono text-gray-400">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                      <span className="text-gray-400 font-sans text-xs">Request Scopes:</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowScopeOptions(!showScopeOptions)}
                      className="text-cyan-400 hover:text-cyan-300 underline text-[10px] font-sans"
                    >
                      {showScopeOptions ? 'Hide' : 'Switch'}
                    </button>
                  </div>
                  <div className="text-cyan-300 truncate mt-1 select-all font-mono text-[10px] bg-cyan-950/30 p-1.5 rounded border border-cyan-500/20 flex items-center justify-between">
                    <span>{selectedScopes}</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/30 font-bold">
                      {selectedScopes === 'user.info.basic' ? 'LIVE APPROVED' : 'IN-REVIEW'}
                    </span>
                  </div>
                  {showScopeOptions && (
                    <div className="mt-2 pt-2 border-t border-cyan-500/20 space-y-1">
                      <button
                        type="button"
                        onClick={() => setSelectedScopes('user.info.basic')}
                        className={`w-full text-left px-2 py-1.5 rounded text-[10px] transition ${selectedScopes === 'user.info.basic' ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-500/50 font-bold' : 'bg-black/60 text-gray-400 hover:text-white border border-transparent'}`}
                      >
                        <div className="text-white font-bold">user.info.basic (Recommended Now)</div>
                        <div className="text-[9px] text-emerald-400">Approved & Live in TikTok Developer Portal</div>
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedScopes('user.info.basic,video.list')}
                        className={`w-full text-left px-2 py-1.5 rounded text-[10px] transition ${selectedScopes === 'user.info.basic,video.list' ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-500/50 font-bold' : 'bg-black/60 text-gray-400 hover:text-white border border-transparent'}`}
                      >
                        <div className="text-white font-bold">user.info.basic,video.list</div>
                        <div className="text-[9px] text-amber-400">Requires TikTok approval of latest revision</div>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => handleTikTokOAuthLogin(false)}
                className="w-full py-2.5 px-3 rounded-xl bg-black/60 hover:bg-black border border-cyan-500/20 hover:border-cyan-400/50 text-gray-300 text-xs font-mono transition flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
                </svg>
                <span>Or Connect TikTok Account</span>
                <span className="text-cyan-400">→</span>
              </button>
            )}
          </div>
        </div>
        
        {onCancel && (
          <button 
            onClick={onCancel}
            className="w-full mt-6 text-sm text-gray-500 hover:text-cyan-400 transition-colors uppercase tracking-widest font-mono"
          >
            ← Return to Studio
          </button>
        )}
      </div>
    </div>
  );
};
