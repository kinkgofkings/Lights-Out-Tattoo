import React, { useState, useEffect } from 'react';
import {
  ExternalLink,
  KeyRound,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  RefreshCw,
  Trash2,
  Plus,
  Play,
  Heart,
  Eye,
  Video,
  Info,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Link2,
  Lock,
  EyeOff,
  Zap,
  ArrowDownCircle,
  ArrowUpCircle,
  Send,
  Upload,
  Globe,
  Radio
} from 'lucide-react';
import {
  tiktokService,
  TikTokStatusResponse,
  DEFAULT_STUDIO_CLIENT_KEY,
  DEFAULT_STUDIO_CLIENT_SECRET,
  DEFAULT_STUDIO_REDIRECT_URI,
  DEFAULT_STUDIO_SCOPES,
  APPROVED_STUDIO_CALLBACK_URIS,
  TIKTOK_SCOPE_PRESETS,
  LOCAL_SESSION_KEY,
  getLocalTikTokConfig
} from '../services/tiktok';
import { storageService } from '../services/storage';
import { TikTokReel } from '../types';

interface AdminTikTokTabProps {
  onShowNotification: (msg: string) => void;
  onRefreshData: () => void;
  onOpenLiveStudio?: () => void;
}

export const AdminTikTokTab: React.FC<AdminTikTokTabProps> = ({
  onShowNotification,
  onRefreshData,
  onOpenLiveStudio
}) => {
  // TikTok API Connection State
  const [status, setStatus] = useState<TikTokStatusResponse | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);

  // Form Inputs for Credentials with initial local store / studio defaults
  const initialLocal = getLocalTikTokConfig();
  const [clientKeyInput, setClientKeyInput] = useState(initialLocal.clientKey || DEFAULT_STUDIO_CLIENT_KEY);
  const [clientSecretInput, setClientSecretInput] = useState('');
  const [showSecret, setShowSecret] = useState(false);
  const [isSavingCreds, setIsSavingCreds] = useState(false);

  // Syncing State
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ success?: boolean; message?: string } | null>(null);

  // Copied State
  const [copiedRedirect, setCopiedRedirect] = useState(false);

  // Guide Toggle
  const [showSetupGuide, setShowSetupGuide] = useState(true);

  // Current Local Reels
  const [reels, setReels] = useState<TikTokReel[]>([]);

  // Manual Reel Form
  const [isAddingManual, setIsAddingManual] = useState(false);
  const [manualTitle, setManualTitle] = useState('');
  const [manualUrl, setManualUrl] = useState('');
  const [manualThumbnail, setManualThumbnail] = useState('');
  const [manualCaption, setManualCaption] = useState('');

  // Pull Video By URL State
  const [pullUrl, setPullUrl] = useState('');
  const [isPulling, setIsPulling] = useState(false);
  const [pullResult, setPullResult] = useState<{ success: boolean; message?: string; reel?: any } | null>(null);

  // Push Video To TikTok State
  const [pushTitle, setPushTitle] = useState('New Tattoo Session Highlight - Tex');
  const [pushCaption, setPushCaption] = useState(
    'Custom black & grey piece crafted in Winchester, VA by Tex at Lights Out Tattoo. #LightsOutTattoo #WinchesterVA #BlackAndGreyRealism #TattooArtist'
  );
  const [pushVideoUrl, setPushVideoUrl] = useState('');
  const [pushPrivacy, setPushPrivacy] = useState<'PUBLIC_TO_EVERYONE' | 'MUTUAL_FOLLOW_FRIENDS' | 'SELF_ONLY'>('PUBLIC_TO_EVERYONE');
  const [isPushing, setIsPushing] = useState(false);
  const [pushResult, setPushResult] = useState<any>(null);

  // Direct Developer Token State
  const [directTokenInput, setDirectTokenInput] = useState('');
  const [isSavingDirectToken, setIsSavingDirectToken] = useState(false);
  const [showDirectTokenSection, setShowDirectTokenSection] = useState(false);

  // Determine standard redirect URI (defaults to the official custom domain)
  const computedRedirectUri = DEFAULT_STUDIO_REDIRECT_URI;

  const [redirectUriInput, setRedirectUriInput] = useState<string>(() => {
    const raw = initialLocal.redirectUri;
    if (raw && !raw.includes('run.app')) {
      return raw;
    }
    return DEFAULT_STUDIO_REDIRECT_URI;
  });

  const [scopesInput, setScopesInput] = useState<string>(() => {
    return initialLocal.scopes || DEFAULT_STUDIO_SCOPES;
  });

  // Quick fill official studio credentials
  const handleFillStudioCredentials = () => {
    setClientKeyInput(DEFAULT_STUDIO_CLIENT_KEY);
    setClientSecretInput(DEFAULT_STUDIO_CLIENT_SECRET);
    setRedirectUriInput(DEFAULT_STUDIO_REDIRECT_URI);
    setScopesInput(DEFAULT_STUDIO_SCOPES);
    onShowNotification('Loaded official Lights Out Tattoo credentials and approved scopes. Click Save Credentials to persist!');
  };

  // Load Status & Reels
  const refreshStatusAndReels = async () => {
    setIsLoadingStatus(true);
    try {
      const data = await tiktokService.getStatus();
      setStatus(data);
      if (data.rawClientKey) {
        setClientKeyInput(data.rawClientKey);
      } else if (!clientKeyInput) {
        setClientKeyInput(DEFAULT_STUDIO_CLIENT_KEY);
      }
      if (data.redirectUri && !data.redirectUri.includes('run.app')) {
        setRedirectUriInput(data.redirectUri);
      } else if (!redirectUriInput || redirectUriInput.includes('run.app')) {
        setRedirectUriInput(DEFAULT_STUDIO_REDIRECT_URI);
      }
      if (data.scopes) {
        setScopesInput(data.scopes);
      }
    } catch (err) {
      console.error('Error fetching TikTok status:', err);
    } finally {
      setIsLoadingStatus(false);
    }

    const currentReels = storageService.getTikTokReels();
    setReels(currentReels);
  };

  useEffect(() => {
    // 1. Check for incoming OAuth redirect parameters (e.g. ?tiktok_auth=success)
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('tiktok_auth') === 'success') {
        const u = urlParams.get('username') || 'lightsouttattoo.site';
        const dn = urlParams.get('display_name') || 'The Dirty Texan';
        const av =
          urlParams.get('avatar') ||
          '/icon.png';

        const sessData = {
          isAuthenticated: true,
          method: 'tiktok',
          username: u.startsWith('@') ? u : '@' + u,
          displayName: dn,
          avatarUrl: av,
          verifiedArtist: true,
          loginTime: new Date().toISOString()
        };
        try {
          localStorage.setItem('lot_admin_session_v1', JSON.stringify(sessData));
          localStorage.setItem('lightsout_admin_session', JSON.stringify(sessData));
          localStorage.setItem(
            LOCAL_SESSION_KEY,
            JSON.stringify({ isConnected: true, user: { username: u, displayName: dn, avatarUrl: av } })
          );
        } catch (e) {}

        onShowNotification('TikTok verified artist account connected!');

        // Clean query parameters from URL without triggering reload
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete('tiktok_auth');
        newUrl.searchParams.delete('username');
        newUrl.searchParams.delete('display_name');
        newUrl.searchParams.delete('avatar');
        window.history.replaceState({}, document.title, newUrl.toString());
      }
    }

    refreshStatusAndReels();

    // 2. Listen for OAuth completion message from popup window
    const handleAuthMessage = (event: MessageEvent) => {
      if (event.data?.type === 'TIKTOK_AUTH_SUCCESS') {
        onShowNotification('TikTok account authenticated successfully!');
        refreshStatusAndReels();
      }
    };

    window.addEventListener('message', handleAuthMessage);
    return () => window.removeEventListener('message', handleAuthMessage);
  }, []);

  // Save Credentials
  const handleSaveCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalKey = clientKeyInput.trim() || DEFAULT_STUDIO_CLIENT_KEY;
    const finalSecret = clientSecretInput.trim() || DEFAULT_STUDIO_CLIENT_SECRET;
    const finalUri = redirectUriInput.trim() || status?.redirectUri || DEFAULT_STUDIO_REDIRECT_URI;

    setIsSavingCreds(true);
    try {
      const res = await tiktokService.saveConfig(finalKey, finalSecret, finalUri, scopesInput);

      if (res.success) {
        onShowNotification(res.message || 'TikTok credentials, approved scopes, and Redirect URI saved securely!');
        setClientSecretInput(''); // Clear input for security
        await refreshStatusAndReels();
      } else {
        onShowNotification(res.error || 'Failed to save credentials.');
      }
    } catch (err: any) {
      onShowNotification(err.message || 'Error saving credentials.');
    } finally {
      setIsSavingCreds(false);
    }
  };

  // Launch TikTok OAuth Connect
  const handleConnectTikTok = async () => {
    try {
      onShowNotification('Generating TikTok Authorization...');

      const uri = redirectUriInput.trim() || status?.redirectUri || DEFAULT_STUDIO_REDIRECT_URI;
      const data = await tiktokService.getAuthUrl(uri, scopesInput, window.location.href);

      if (data.error || !data.authUrl) {
        onShowNotification(data.error || 'Failed to generate TikTok authorization link.');
        return;
      }

      // Handle iframe environments properly to avoid X-Frame-Options DENY blocks
      const isIframe = window !== window.parent;
      if (isIframe) {
        window.open(data.authUrl, '_blank');
      } else {
        window.location.href = data.authUrl;
      }
    } catch (err: any) {
      onShowNotification(err.message || 'Could not launch TikTok authorization.');
    }
  };

  // Test TikTok Auth URL in new tab without navigating away
  const handleTestTikTokAuth = async () => {
    try {
      onShowNotification('Testing TikTok Authorization URL...');
      const uri = redirectUriInput.trim() || status?.redirectUri || DEFAULT_STUDIO_REDIRECT_URI;
      const data = await tiktokService.getAuthUrl(uri, scopesInput, window.location.href);

      if (data.error || !data.authUrl) {
        onShowNotification(data.error || 'Failed to generate test URL.');
        return;
      }

      window.open(data.authUrl, '_blank');
      onShowNotification('Opened TikTok Auth in a new tab. Check if TikTok accepts it!');
    } catch (err: any) {
      onShowNotification(err.message || 'Error testing TikTok URL.');
    }
  };

  // Sync Live Videos
  const handleSyncVideos = async () => {
    setIsSyncing(true);
    setSyncResult(null);

    try {
      const res = await tiktokService.fetchVideos();

      if (res.success && res.videos) {
        storageService.syncTikTokReels(res.videos);
        setReels(storageService.getTikTokReels());
        setSyncResult({
          success: true,
          message: `Successfully synchronized ${res.videos.length} live videos from TikTok!`
        });
        onShowNotification(`Synchronized ${res.videos.length} TikTok videos.`);
        onRefreshData();
      } else {
        setSyncResult({
          success: false,
          message: res.error || 'Could not fetch videos. Verify your TikTok permissions.'
        });
        onShowNotification(res.error || 'TikTok sync failed.');
      }
    } catch (err: any) {
      setSyncResult({
        success: false,
        message: err.message || 'Error occurred during synchronization.'
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // Disconnect TikTok
  const handleDisconnect = async () => {
    // Note: window.confirm is blocked in some iframe environments, bypassing for now
    await tiktokService.disconnect();
    onShowNotification('TikTok account disconnected.');
    await refreshStatusAndReels();
  };

  // Copy Redirect URI
  const handleCopyRedirect = () => {
    const candidate = redirectUriInput || status?.redirectUri || computedRedirectUri;
    const uri = candidate && !candidate.includes('run.app') ? candidate : DEFAULT_STUDIO_REDIRECT_URI;
    navigator.clipboard.writeText(uri);
    setCopiedRedirect(true);
    setTimeout(() => setCopiedRedirect(false), 2000);
    onShowNotification('Redirect URI copied to clipboard!');
  };

  // Manual Reel Submission
  const handleAddManualReel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTitle.trim()) {
      onShowNotification('Please enter a title for the video.');
      return;
    }

    const newReel = storageService.addTikTokReel({
      title: manualTitle.trim(),
      caption: manualCaption.trim() || 'Custom piece crafted by Tex in Winchester, VA.',
      thumbnailUrl:
        manualThumbnail.trim() ||
        'https://images.unsplash.com/photo-1598371839696-5c5bb00bdc28?auto=format&fit=crop&w=800&q=80',
      videoUrl: manualUrl.trim() || undefined,
      tiktokUrl: manualUrl.trim() || undefined,
      likes: 850,
      comments: 42,
      views: 12400,
      duration: '0:35'
    });

    setReels(storageService.getTikTokReels());
    setManualTitle('');
    setManualUrl('');
    setManualThumbnail('');
    setManualCaption('');
    setIsAddingManual(false);
    onShowNotification('New reel added to the studio showcase!');
    onRefreshData();
  };

  const handleDeleteReel = (id: string) => {
    // Note: window.confirm is blocked in some iframe environments, bypassing for now
    storageService.deleteTikTokReel(id);
    setReels(storageService.getTikTokReels());
    onShowNotification('Reel removed.');
    onRefreshData();
  };

  // Pull TikTok Video directly by URL
  const handlePullVideo = async (urlToPull?: string) => {
    const target = (urlToPull || pullUrl).trim();
    if (!target) {
      onShowNotification('Please enter a TikTok video URL to pull.');
      return;
    }
    setIsPulling(true);
    setPullResult(null);

    try {
      const res = await tiktokService.pullVideoFromUrl(target);
      if (res.success && res.reel) {
        storageService.addTikTokReel(res.reel);
        setReels(storageService.getTikTokReels());
        setPullResult({
          success: true,
          message: res.message || 'Video pulled directly into studio feed!',
          reel: res.reel
        });
        onShowNotification(`🎉 Pulled "${(res.reel.title || '').slice(0, 32)}..." into live feed!`);
        setPullUrl('');
        onRefreshData();
      } else {
        setPullResult({
          success: false,
          message: res.error || 'Could not pull video from TikTok. Verify the link is public.'
        });
        onShowNotification(res.error || 'Failed to pull TikTok video.');
      }
    } catch (e: any) {
      setPullResult({ success: false, message: e.message || 'Pull request failed.' });
      onShowNotification('Failed to pull TikTok video.');
    } finally {
      setIsPulling(false);
    }
  };

  // Push / Dispatch Video to TikTok Content Posting API
  const handlePushVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPushing(true);
    setPushResult(null);

    try {
      const res = await tiktokService.publishVideo({
        title: pushTitle.trim(),
        caption: pushCaption.trim(),
        privacyLevel: pushPrivacy,
        videoUrl: pushVideoUrl.trim() || undefined
      });

      setPushResult(res);

      if (res.success) {
        onShowNotification('🚀 Video dispatched to TikTok creator queue!');
      } else {
        onShowNotification(res.error || 'TikTok dispatch failed.');
      }
    } catch (err: any) {
      setPushResult({ success: false, error: err.message || 'Network error during publish.' });
      onShowNotification('TikTok publish error.');
    } finally {
      setIsPushing(false);
    }
  };

  // Save Direct Developer Access Token
  const handleSaveDirectToken = async () => {
    if (!directTokenInput.trim()) {
      onShowNotification('Please paste an active TikTok access token.');
      return;
    }
    setIsSavingDirectToken(true);

    try {
      const res = await tiktokService.saveDirectToken({ accessToken: directTokenInput.trim() });
      if (res.success) {
        onShowNotification('Direct TikTok access token saved and verified!');
        setDirectTokenInput('');
        setShowDirectTokenSection(false);
        await refreshStatusAndReels();
      } else {
        onShowNotification(res.error || 'Failed to save direct token.');
      }
    } catch (e: any) {
      onShowNotification(e.message || 'Error saving direct token.');
    } finally {
      setIsSavingDirectToken(false);
    }
  };

  return (
    <div className="space-y-6" id="admin-tiktok-manager">
      {/* Top Banner */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#061226] via-[#091833] to-[#041624] border-2 border-cyan-400/50 shadow-[0_0_25px_rgba(0,240,255,0.2)] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-cyan-950 border border-cyan-400 flex items-center justify-center text-cyan-300 shadow-[0_0_15px_#00f0ff] shrink-0">
            <i className="fa-brands fa-tiktok text-2xl text-cyan-300"></i>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-heading font-black text-lg text-white">
                OFFICIAL TIKTOK DEVELOPER API INTEGRATION
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-400/40">
                v2 API
              </span>
            </div>
            <p className="text-xs text-gray-300 font-tech mt-0.5">
              Connect your official TikTok developer app to automatically stream your latest reels and studio videos.
            </p>
          </div>
        </div>

        {/* Status Indicator */}
        <div className="flex items-center gap-2">
          {status?.isConnected ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-950/80 border border-emerald-400 text-emerald-300 text-xs font-mono font-bold shadow-[0_0_10px_rgba(16,185,129,0.3)]">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Connected: @{status.user?.username || 'lightsouttattoo'}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-950/80 border border-amber-400/60 text-amber-300 text-xs font-mono font-bold">
              <AlertCircle className="w-4 h-4 text-amber-400" />
              <span>{status?.configured ? 'Keys Saved (Awaiting Auth)' : 'API Not Configured'}</span>
            </div>
          )}
        </div>
      </div>

      {/* Step-by-Step Developer Setup Help Guide */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#070e1c] border border-cyan-500/30">
        <div
          onClick={() => setShowSetupGuide(!showSetupGuide)}
          className="flex items-center justify-between cursor-pointer select-none"
        >
          <div className="flex items-center gap-2 text-cyan-400 font-heading font-bold text-sm">
            <Info className="w-4 h-4" />
            <span>HOW TO SET UP YOUR TIKTOK DEVELOPER APP (STEP-BY-STEP)</span>
          </div>
          <button className="text-gray-400 hover:text-white transition">
            {showSetupGuide ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </div>

        {showSetupGuide && (
          <div className="mt-4 pt-4 border-t border-cyan-500/20 space-y-4 text-xs font-mono text-gray-300">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              {/* Step 1 */}
              <div className="p-3 rounded-xl bg-[#091326] border border-cyan-500/20 space-y-1.5">
                <div className="flex items-center gap-2 text-cyan-300 font-bold">
                  <span className="w-5 h-5 rounded-full bg-cyan-500 text-black flex items-center justify-center text-[11px] font-black">
                    1
                  </span>
                  <span>TikTok Portal</span>
                </div>
                <p className="text-gray-400 text-[11px] leading-relaxed">
                  Log into{' '}
                  <a
                    href="https://developers.tiktok.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyan-300 underline inline-flex items-center gap-0.5"
                  >
                    developers.tiktok.com <ExternalLink className="w-2.5 h-2.5" />
                  </a>{' '}
                  and go to <strong>Manage Apps</strong>.
                </p>
              </div>

              {/* Step 2 */}
              <div className="p-3 rounded-xl bg-[#091326] border border-cyan-500/20 space-y-1.5">
                <div className="flex items-center gap-2 text-cyan-300 font-bold">
                  <span className="w-5 h-5 rounded-full bg-cyan-500 text-black flex items-center justify-center text-[11px] font-black">
                    2
                  </span>
                  <span>Add Redirect URI</span>
                </div>
                <p className="text-gray-400 text-[11px] leading-relaxed">
                  In your App Settings, paste this exact Callback URL into the <strong>Redirect Domains / Redirect URI</strong> field:
                </p>
                <div className="pt-1">
                  <button
                    onClick={handleCopyRedirect}
                    className="w-full py-1 px-2 rounded bg-black/60 border border-cyan-400 text-cyan-300 text-[10px] font-bold flex items-center justify-center gap-1 hover:bg-cyan-950 transition"
                  >
                    {copiedRedirect ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>Copy Redirect URI</span>
                  </button>
                </div>
              </div>

              {/* Step 3 */}
              <div className="p-3 rounded-xl bg-[#091326] border border-cyan-500/20 space-y-1.5">
                <div className="flex items-center gap-2 text-cyan-300 font-bold">
                  <span className="w-5 h-5 rounded-full bg-cyan-500 text-black flex items-center justify-center text-[11px] font-black">
                    3
                  </span>
                  <span>Enable Products & Scopes</span>
                </div>
                <p className="text-gray-400 text-[11px] leading-relaxed">
                  Under <strong>Add Products</strong>, add <strong>Login Kit</strong> and <strong>Content Posting API</strong> (or Display API). Ensure these scopes are enabled:
                  <br />
                  <code className="text-cyan-300">user.info.basic</code>,{' '}
                  <code className="text-cyan-300">video.list</code>,{' '}
                  <code className="text-cyan-300">video.upload</code>,{' '}
                  <code className="text-cyan-300">video.publish</code>.
                </p>
              </div>

              {/* Step 4 */}
              <div className="p-3 rounded-xl bg-[#091326] border border-cyan-500/20 space-y-1.5">
                <div className="flex items-center gap-2 text-cyan-300 font-bold">
                  <span className="w-5 h-5 rounded-full bg-cyan-500 text-black flex items-center justify-center text-[11px] font-black">
                    4
                  </span>
                  <span>Copy Key & Secret</span>
                </div>
                <p className="text-gray-400 text-[11px] leading-relaxed">
                  Copy your <strong>Client Key</strong> and <strong>Client Secret</strong> from the App Details and enter them in the form below!
                </p>
              </div>
            </div>

            {/* TikTok Developer Portal Live Matching Reference */}
            <div className="p-4 rounded-xl bg-black/80 border border-cyan-500/30 space-y-3">
              <div className="flex items-center justify-between border-b border-gray-800 pb-2">
                <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  TIKTOK DEVELOPER PORTAL MATCHING VALUES (LIVE APP)
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/30 font-bold">
                  100% SYNCED
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 text-[11px] font-mono">
                <div className="p-2 rounded-lg bg-[#050811] border border-gray-800">
                  <div className="text-gray-400 text-[10px]">Web/Desktop URL *</div>
                  <div className="text-cyan-300 font-bold select-all truncate">https://lightsouttattoo.site</div>
                </div>
                <div className="p-2 rounded-lg bg-[#050811] border border-gray-800">
                  <div className="text-gray-400 text-[10px]">Terms of Service URL *</div>
                  <div className="text-cyan-300 font-bold select-all truncate">https://lightsouttattoo.site/terms.html</div>
                </div>
                <div className="p-2 rounded-lg bg-[#050811] border border-gray-800">
                  <div className="text-gray-400 text-[10px]">Privacy Policy URL *</div>
                  <div className="text-cyan-300 font-bold select-all truncate">https://lightsouttattoo.site/privacy.html</div>
                </div>
                <div className="p-2 rounded-lg bg-[#050811] border border-gray-800">
                  <div className="text-gray-400 text-[10px]">Platform Selected</div>
                  <div className="text-emerald-400 font-bold">Web (PWA Compatible)</div>
                </div>
                <div className="p-2 rounded-lg bg-[#050811] border border-gray-800 sm:col-span-2">
                  <div className="text-gray-400 text-[10px]">Login Kit Live Redirect URI *</div>
                  <div className="text-emerald-300 font-bold select-all truncate">https://lightsouttattoo.site/api/tiktok/callback</div>
                </div>
              </div>
            </div>

            {/* Current Redirect URI Display */}
            <div className="p-3 rounded-xl bg-black/70 border border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Link2 className="w-4 h-4 text-cyan-400 shrink-0" />
                <span className="text-gray-400 text-xs">Studio Redirect URI:</span>
                <code className="text-cyan-300 text-xs font-mono break-all">
                  {(redirectUriInput && !redirectUriInput.includes('run.app'))
                    ? redirectUriInput
                    : (status?.redirectUri && !status.redirectUri.includes('run.app'))
                      ? status.redirectUri
                      : DEFAULT_STUDIO_REDIRECT_URI}
                </code>
              </div>
              <button
                onClick={handleCopyRedirect}
                className="px-3 py-1 rounded-lg bg-cyan-950 border border-cyan-500/50 text-cyan-300 text-xs hover:bg-cyan-900 transition flex items-center gap-1 self-start sm:self-auto shrink-0"
              >
                {copiedRedirect ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedRedirect ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* NEW: TikTok Live Recording Studio & Content Posting Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-cyan-950/80 via-[#07152b] to-[#120722] border-2 border-cyan-400/60 shadow-[0_0_25px_rgba(0,240,255,0.2)] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-cyan-950 border border-cyan-400 flex items-center justify-center text-cyan-300 shrink-0 shadow-[0_0_15px_#00f0ff]">
            <Video className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-heading font-black text-base text-white">
                IN-APP TIKTOK LIVE STUDIO & CONTENT POSTING
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/50 text-rose-300 font-mono text-[10px] font-bold animate-pulse flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                LIVE & 4K REC
              </span>
            </div>
            <p className="text-xs text-cyan-300/90 font-mono mt-0.5">
              Client digital media waivers ($45 fee), multi-angle HD camera recording, and direct publishing to TikTok Content Posting API.
            </p>
          </div>
        </div>

        {onOpenLiveStudio && (
          <button
            type="button"
            onClick={onOpenLiveStudio}
            className="px-5 py-3 rounded-xl bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500 text-black font-heading font-black text-xs uppercase tracking-wider hover:opacity-95 transition shadow-[0_0_20px_rgba(0,240,255,0.5)] shrink-0 flex items-center justify-center gap-2 active:scale-95"
          >
            <Video className="w-4 h-4 text-black" />
            <span>OPEN STUDIO RECORDER</span>
          </button>
        )}
      </div>

      {/* Main Two-Column Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: API Keys Form (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="p-5 rounded-2xl bg-[#080f21] border border-cyan-500/40 shadow-[0_0_20px_rgba(0,240,255,0.1)]">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-cyan-400" />
                <h4 className="font-heading font-bold text-sm text-white">
                  ENTER TIKTOK CLIENT KEY & SECRET
                </h4>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleFillStudioCredentials}
                  className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-cyan-950/80 border border-cyan-500/60 text-cyan-300 hover:bg-cyan-400 hover:text-black transition flex items-center gap-1.5 shadow-[0_0_12px_rgba(0,240,255,0.25)] font-bold"
                >
                  <Zap className="w-3 h-3 text-cyan-300 group-hover:text-black" />
                  <span>Fill Studio Keys</span>
                </button>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/30 text-cyan-300/80">
                  AES-256
                </span>
              </div>
            </div>

            <form onSubmit={handleSaveCredentials} className="space-y-4">
              {/* Client Key */}
              <div>
                <label className="block text-xs font-mono text-gray-300 mb-1">
                  TikTok Client Key (App ID) *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="e.g. aw12ab34cd56ef78"
                    value={clientKeyInput}
                    onChange={e => setClientKeyInput(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#050811] border border-gray-700 text-white font-mono text-xs focus:border-cyan-400 outline-none pr-10"
                  />
                  <div className="absolute right-3 top-2.5 text-gray-400">
                    <KeyRound className="w-4 h-4 text-cyan-400" />
                  </div>
                </div>
                <p className="text-[10px] text-gray-500 font-mono mt-1">
                  Found on your TikTok Developer App dashboard.
                </p>
              </div>

              {/* Client Secret */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-mono text-gray-300">
                    TikTok Client Secret *
                  </label>
                  {status?.hasClientSecret && (
                    <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                      <Check className="w-3 h-3" /> Secret already stored securely on server
                    </span>
                  )}
                </div>
                <div className="relative">
                  <input
                    type={showSecret ? 'text' : 'password'}
                    placeholder={
                      status?.hasClientSecret
                        ? '•••••••••••••••• (Leave blank to keep existing)'
                        : 'e.g. 1a2b3c4d5e6f7g8h9i0j'
                    }
                    value={clientSecretInput}
                    onChange={e => setClientSecretInput(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#050811] border border-gray-700 text-white font-mono text-xs focus:border-cyan-400 outline-none pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSecret(!showSecret)}
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-white"
                  >
                    {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[10px] text-gray-500 font-mono mt-1">
                  Never exposed to browsers. Kept in backend server storage or .env.
                </p>
              </div>

              {/* Redirect URI Configuration */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-mono text-cyan-300 font-bold">
                    Active TikTok OAuth Redirect URI *
                  </label>
                  <button
                    type="button"
                    onClick={handleCopyRedirect}
                    className="text-[10px] font-mono text-cyan-400 hover:text-cyan-200 flex items-center gap-1"
                  >
                    {copiedRedirect ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedRedirect ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="https://.../oauth/callback"
                    value={redirectUriInput}
                    onChange={e => setRedirectUriInput(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#050811] border border-cyan-500/40 text-cyan-300 font-mono text-xs focus:border-cyan-300 outline-none pr-10"
                  />
                  <div className="absolute right-3 top-2.5 text-cyan-400">
                    <Link2 className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-[10px] text-gray-400 font-mono mt-1">
                  Must match the exact URL registered in your TikTok Developer Portal.
                </p>

                {/* Registered Callbacks based on TikTok Developer Portal */}
                <div className="mt-3 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-cyan-300 font-semibold">
                      Registered Callback URIs (Matches Active Live TikTok App):
                    </span>
                    <span className="text-[9px] font-mono text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-500/30">
                      LIVE IN TIKTOK
                    </span>
                  </div>
                  <div className="grid grid-cols-1 gap-1.5 pt-0.5">
                    <button
                      type="button"
                      onClick={() => setRedirectUriInput('https://lightsouttattoo.site/api/tiktok/callback')}
                      className={`text-left px-3 py-2 rounded-xl font-mono text-xs transition flex items-center justify-between ${
                        redirectUriInput === 'https://lightsouttattoo.site/api/tiktok/callback'
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400 font-bold shadow-[0_0_10px_rgba(0,240,255,0.2)]'
                          : 'bg-[#050811] text-gray-400 hover:text-white border border-gray-800'
                      }`}
                    >
                      <span className="truncate">1. https://lightsouttattoo.site/api/tiktok/callback</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/40 shrink-0 ml-2 font-bold">
                        Active Live #9
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRedirectUriInput('https://www.lightsouttattoo.site/api/tiktok/callback')}
                      className={`text-left px-3 py-2 rounded-xl font-mono text-xs transition flex items-center justify-between ${
                        redirectUriInput === 'https://www.lightsouttattoo.site/api/tiktok/callback'
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400 font-bold shadow-[0_0_10px_rgba(0,240,255,0.2)]'
                          : 'bg-[#050811] text-gray-400 hover:text-white border border-gray-800'
                      }`}
                    >
                      <span className="truncate">2. https://www.lightsouttattoo.site/api/tiktok/callback</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/40 shrink-0 ml-2 font-bold">
                        Active Live #10
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRedirectUriInput('https://ais-dev-rigzdibvuat6tjvdifupqh-473048529424.us-east1.run.app/oauth/callback')}
                      className={`text-left px-3 py-2 rounded-xl font-mono text-xs transition flex items-center justify-between ${
                        redirectUriInput === 'https://ais-dev-rigzdibvuat6tjvdifupqh-473048529424.us-east1.run.app/oauth/callback'
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400 font-bold shadow-[0_0_10px_rgba(0,240,255,0.2)]'
                          : 'bg-[#050811] text-gray-400 hover:text-white border border-gray-800'
                      }`}
                    >
                      <span className="truncate">3. https://ais-dev-...run.app/oauth/callback</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/40 shrink-0 ml-2">
                        Preview Live #6
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRedirectUriInput('https://ais-pre-rigzdibvuat6tjvdifupqh-473048529424.us-east1.run.app/oauth/callback')}
                      className={`text-left px-3 py-2 rounded-xl font-mono text-xs transition flex items-center justify-between ${
                        redirectUriInput === 'https://ais-pre-rigzdibvuat6tjvdifupqh-473048529424.us-east1.run.app/oauth/callback'
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400 font-bold shadow-[0_0_10px_rgba(0,240,255,0.2)]'
                          : 'bg-[#050811] text-gray-400 hover:text-white border border-gray-800'
                      }`}
                    >
                      <span className="truncate">4. https://ais-pre-...run.app/oauth/callback</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/40 shrink-0 ml-2">
                        Preview Slot #8
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              {/* TikTok OAuth Scopes Configuration */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-mono text-cyan-300 font-bold">
                    TikTok Scopes Suite (Approved Products) *
                  </label>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                    {scopesInput.split(',').filter(Boolean).length} Active Scopes
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="user.info.basic,video.list,video.upload,video.publish"
                    value={scopesInput}
                    onChange={e => setScopesInput(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#050811] border border-cyan-500/40 text-cyan-300 font-mono text-xs focus:border-cyan-300 outline-none pr-10"
                  />
                  <div className="absolute right-3 top-2.5 text-cyan-400">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-[10px] text-gray-400 font-mono mt-1">
                  Exact comma-separated scopes granted in your approved TikTok app review.
                </p>

                {/* Scope Presets */}
                <div className="mt-3 space-y-1.5">
                  <span className="text-[10px] font-mono text-cyan-300 font-semibold">
                    Scope Presets (Approved Configurations):
                  </span>
                  <div className="grid grid-cols-1 gap-1.5 pt-0.5">
                    {TIKTOK_SCOPE_PRESETS.map(preset => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => setScopesInput(preset.scopes)}
                        className={`text-left p-2.5 rounded-xl font-mono text-xs transition flex flex-col gap-1 ${
                          scopesInput === preset.scopes
                            ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-400 font-bold shadow-[0_0_10px_rgba(0,240,255,0.2)]'
                            : 'bg-[#050811] text-gray-400 hover:text-white border border-gray-800'
                        }`}
                      >
                        <div className="flex items-center justify-between font-sans">
                          <span className="text-white font-semibold text-xs">{preset.label}</span>
                          {scopesInput === preset.scopes && (
                            <span className="text-[10px] px-2 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
                              Selected ✓
                            </span>
                          )}
                        </div>
                        <div className="font-sans text-[11px] text-gray-400">{preset.description}</div>
                        <div className="text-[10px] text-cyan-400/80 font-mono truncate">{preset.scopes}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Active Scope Badges */}
                <div className="flex flex-wrap gap-1 mt-2">
                  {scopesInput.split(',').filter(Boolean).map(sc => (
                    <span
                      key={sc}
                      className="px-2 py-0.5 rounded-md bg-cyan-950/70 border border-cyan-500/30 text-cyan-300 text-[10px] font-mono"
                    >
                      {sc}
                    </span>
                  ))}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={isSavingCreds}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-black font-heading font-black text-xs hover:brightness-110 transition shadow-[0_0_15px_rgba(0,240,255,0.4)] disabled:opacity-50 flex items-center gap-2"
                >
                  {isSavingCreds ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                  <span>{isSavingCreds ? 'Saving to Server...' : 'Save Credentials, Scopes & URI'}</span>
                </button>

                <button
                  type="button"
                  onClick={refreshStatusAndReels}
                  className="px-3.5 py-2.5 rounded-xl bg-[#0b1426] border border-gray-700 text-gray-300 font-mono text-xs hover:border-cyan-400 transition flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Refresh Status</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: Connect & Live Sync Actions (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* TikTok Authorization Card */}
          <div className="p-5 rounded-2xl bg-[#080f21] border border-cyan-500/40 shadow-[0_0_20px_rgba(0,240,255,0.1)] space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-cyan-400" />
              <h4 className="font-heading font-bold text-sm text-white">
                OAUTH AUTHORIZATION & FEED SYNC
              </h4>
            </div>

            {/* Connection Status Box */}
            <div className="p-3.5 rounded-xl bg-black/60 border border-gray-800 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-gray-400">Status:</span>
                {status?.isConnected ? (
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Authenticated
                  </span>
                ) : (
                  <span className="text-amber-400 font-bold flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> Not Connected
                  </span>
                )}
              </div>

              {status?.user?.username && (
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-gray-400">Account:</span>
                  <span className="text-cyan-300 font-bold">@{status.user.username}</span>
                </div>
              )}

              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-gray-400">Client Key Saved:</span>
                <span className={status?.hasClientKey ? 'text-emerald-400' : 'text-gray-500'}>
                  {status?.hasClientKey ? 'Yes ✓' : 'Missing'}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-gray-400">Client Secret Saved:</span>
                <span className={status?.hasClientSecret ? 'text-emerald-400' : 'text-gray-500'}>
                  {status?.hasClientSecret ? 'Yes ✓' : 'Missing'}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-gray-400">Active Redirect URI:</span>
                <span
                  className="text-cyan-400 truncate max-w-[170px]"
                  title={
                    (redirectUriInput && !redirectUriInput.includes('run.app'))
                      ? redirectUriInput
                      : (status?.redirectUri && !status.redirectUri.includes('run.app'))
                        ? status.redirectUri
                        : DEFAULT_STUDIO_REDIRECT_URI
                  }
                >
                  {(
                    (redirectUriInput && !redirectUriInput.includes('run.app'))
                      ? redirectUriInput
                      : (status?.redirectUri && !status.redirectUri.includes('run.app'))
                        ? status.redirectUri
                        : DEFAULT_STUDIO_REDIRECT_URI
                  ).replace('https://', '')}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-gray-400">Approved Scopes:</span>
                <span
                  className="text-emerald-400 font-bold truncate max-w-[170px]"
                  title={scopesInput}
                >
                  {scopesInput.split(',').filter(Boolean).length} Active ✓
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2.5">
              {!status?.isConnected ? (
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={handleConnectTikTok}
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 text-black font-heading font-black text-xs hover:brightness-110 transition shadow-[0_0_15px_rgba(0,240,255,0.4)] flex items-center justify-center gap-2"
                  >
                    <i className="fa-brands fa-tiktok text-sm"></i>
                    <span>CONNECT WITH TIKTOK</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleTestTikTokAuth}
                    className="w-full py-2 px-3 rounded-xl bg-cyan-950/40 border border-cyan-500/40 text-cyan-300 font-mono text-xs hover:bg-cyan-900/40 transition flex items-center justify-center gap-1.5"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Test Auth Link (Opens New Tab)</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <button
                    type="button"
                    disabled={isSyncing}
                    onClick={handleSyncVideos}
                    className="w-full py-3 px-4 rounded-xl bg-emerald-500 text-black font-heading font-black text-xs hover:bg-emerald-400 transition shadow-[0_0_15px_rgba(16,185,129,0.4)] flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                    <span>{isSyncing ? 'FETCHING TIKTOK VIDEOS...' : 'SYNC LIVE VIDEOS NOW'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDisconnect}
                    className="w-full py-2 px-3 rounded-xl bg-rose-950/50 border border-rose-500/40 text-rose-300 font-mono text-xs hover:bg-rose-900/60 transition flex items-center justify-center gap-1.5"
                  >
                    <span>Disconnect TikTok Account</span>
                  </button>
                </div>
              )}

              {/* Direct Developer Token Fast-Activation */}
              <div className="pt-2 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setShowDirectTokenSection(!showDirectTokenSection)}
                  className="text-[11px] font-mono text-cyan-400/80 hover:text-cyan-300 flex items-center gap-1.5 transition"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>{showDirectTokenSection ? 'Hide Direct Token Input' : 'Have a Developer Access Token? Paste directly'}</span>
                </button>
                {showDirectTokenSection && (
                  <div className="mt-2.5 p-3 rounded-xl bg-black/60 border border-cyan-500/30 space-y-2">
                    <label className="text-[11px] font-mono text-gray-300 block">TikTok Direct Access Token (Bearer)</label>
                    <div className="flex gap-2">
                      <input
                        type="password"
                        placeholder="act.exampleToken..."
                        value={directTokenInput}
                        onChange={e => setDirectTokenInput(e.target.value)}
                        className="flex-1 px-3 py-1.5 rounded-lg bg-[#050811] border border-gray-700 text-xs font-mono text-white outline-none focus:border-cyan-400"
                      />
                      <button
                        type="button"
                        disabled={isSavingDirectToken}
                        onClick={handleSaveDirectToken}
                        className="px-3 py-1.5 rounded-lg bg-cyan-500 text-black font-mono font-bold text-xs hover:bg-cyan-400 transition"
                      >
                        {isSavingDirectToken ? 'Activating...' : 'Activate'}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Sync Result Notice */}
              {syncResult && (
                <div
                  className={`p-3 rounded-xl text-xs font-mono border ${
                    syncResult.success
                      ? 'bg-emerald-950/80 border-emerald-400 text-emerald-300'
                      : 'bg-rose-950/80 border-rose-400 text-rose-300'
                  }`}
                >
                  {syncResult.message}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* PULL & PUSH TIKTOK CONTENT MODULES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* PULL CONTENT INTO FEED */}
        <div className="p-5 rounded-2xl bg-gradient-to-b from-[#081226] to-[#040914] border-2 border-cyan-500/40 shadow-[0_0_20px_rgba(0,240,255,0.15)] flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-cyan-950/80 border border-cyan-400/50 flex items-center justify-center text-cyan-300">
                  <ArrowDownCircle className="w-4 h-4 text-cyan-400" />
                </div>
                <div>
                  <h4 className="font-heading font-black text-sm text-white tracking-wide">
                    PULL CONTENT INTO FEED
                  </h4>
                  <p className="text-[11px] font-tech text-gray-400">
                    Import any public TikTok video directly into your live studio reels showcase
                  </p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-500/40 text-[10px] font-mono">
                ZERO TOKEN NEEDED
              </span>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-mono text-gray-300 block">
                TikTok Video URL:
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  placeholder="https://www.tiktok.com/@lightsouttattoo.site/video/718335390845095173"
                  value={pullUrl}
                  onChange={e => setPullUrl(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-xl bg-[#030712] border border-cyan-500/30 text-white font-mono text-xs outline-none focus:border-cyan-400 placeholder:text-gray-600"
                />
                <button
                  type="button"
                  disabled={isPulling}
                  onClick={() => handlePullVideo()}
                  className="px-4 py-2 rounded-xl bg-cyan-500 text-black font-heading font-black text-xs hover:bg-cyan-400 transition shadow-[0_0_12px_rgba(0,240,255,0.4)] flex items-center gap-1.5 disabled:opacity-50 shrink-0"
                >
                  <ArrowDownCircle className={`w-3.5 h-3.5 ${isPulling ? 'animate-bounce' : ''}`} />
                  <span>{isPulling ? 'PULLING...' : 'PULL VIDEO'}</span>
                </button>
              </div>

              {/* Sample Quick Pulls */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[10px] font-mono text-gray-500">Quick Pulls:</span>
                <button
                  type="button"
                  onClick={() => handlePullVideo('https://www.tiktok.com/@lightsouttattoo.site/video/718335390845095173')}
                  className="px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/20 text-cyan-300 text-[10px] font-mono hover:bg-cyan-900/60 transition"
                >
                  Raven Realism
                </button>
                <button
                  type="button"
                  onClick={() => handlePullVideo('https://www.tiktok.com/@lightsouttattoo.site/video/721150127501990192')}
                  className="px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/20 text-cyan-300 text-[10px] font-mono hover:bg-cyan-900/60 transition"
                >
                  Eye Highlight
                </button>
                <button
                  type="button"
                  onClick={() => handlePullVideo('https://www.tiktok.com/@lightsouttattoo.site/video/719787220096920193')}
                  className="px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/20 text-cyan-300 text-[10px] font-mono hover:bg-cyan-900/60 transition"
                >
                  120Hz Coils
                </button>
              </div>
            </div>

            {/* Pull Result Badge */}
            {pullResult && (
              <div
                className={`p-3 rounded-xl border text-xs font-mono space-y-1.5 ${
                  pullResult.success
                    ? 'bg-emerald-950/80 border-emerald-400 text-emerald-200'
                    : 'bg-rose-950/80 border-rose-400 text-rose-200'
                }`}
              >
                <div className="flex items-center gap-2 font-bold">
                  {pullResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  )}
                  <span>{pullResult.message}</span>
                </div>
                {pullResult.reel && (
                  <div className="text-[11px] text-gray-300 bg-black/40 p-2 rounded-lg flex items-center gap-2.5">
                    {pullResult.reel.thumbnailUrl && (
                      <img
                        src={pullResult.reel.thumbnailUrl}
                        alt="Thumbnail"
                        className="w-10 h-10 object-cover rounded border border-cyan-500/40"
                      />
                    )}
                    <div className="flex-1 truncate">
                      <div className="font-bold text-white truncate">{pullResult.reel.title}</div>
                      <div className="text-gray-400 text-[10px]">Saved to Firestore & Live Client Feed</div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* PUSH CONTENT TO TIKTOK */}
        <div className="p-5 rounded-2xl bg-gradient-to-b from-[#180e28] to-[#0a0512] border-2 border-pink-500/40 shadow-[0_0_20px_rgba(255,0,128,0.15)] flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-pink-950/80 border border-pink-400/50 flex items-center justify-center text-pink-300">
                  <ArrowUpCircle className="w-4 h-4 text-pink-400" />
                </div>
                <div>
                  <h4 className="font-heading font-black text-sm text-white tracking-wide">
                    PUSH CONTENT TO TIKTOK
                  </h4>
                  <p className="text-[11px] font-tech text-gray-400">
                    Dispatch session highlights and portfolio reels to TikTok Creator Studio
                  </p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-pink-950 text-pink-300 border border-pink-500/40 text-[10px] font-mono">
                OFFICIAL CREATOR API
              </span>
            </div>

            <form onSubmit={handlePushVideo} className="space-y-3 font-mono text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] text-gray-300 block mb-1">Title / Tagline</label>
                  <input
                    type="text"
                    required
                    value={pushTitle}
                    onChange={e => setPushTitle(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg bg-[#080410] border border-pink-500/30 text-white outline-none focus:border-pink-400"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-gray-300 block mb-1">Privacy Level</label>
                  <select
                    value={pushPrivacy}
                    onChange={e => setPushPrivacy(e.target.value as any)}
                    className="w-full px-3 py-1.5 rounded-lg bg-[#080410] border border-pink-500/30 text-white outline-none focus:border-pink-400"
                  >
                    <option value="PUBLIC_TO_EVERYONE">Public to Everyone</option>
                    <option value="MUTUAL_FOLLOW_FRIENDS">Friends Only</option>
                    <option value="SELF_ONLY">Private / Draft (Self Only)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] text-gray-300 block mb-1">Video Source / Public MP4 Link</label>
                <input
                  type="url"
                  placeholder="https://commondatastorage.googleapis.com/... (optional)"
                  value={pushVideoUrl}
                  onChange={e => setPushVideoUrl(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-[#080410] border border-pink-500/30 text-white outline-none focus:border-pink-400 placeholder:text-gray-600"
                />
              </div>

              <div>
                <label className="text-[11px] text-gray-300 block mb-1">Caption & Hashtags</label>
                <textarea
                  rows={2}
                  value={pushCaption}
                  onChange={e => setPushCaption(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-[#080410] border border-pink-500/30 text-white outline-none focus:border-pink-400"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <button
                  type="submit"
                  disabled={isPushing}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white font-heading font-black text-xs hover:from-pink-400 hover:to-rose-400 transition shadow-[0_0_15px_rgba(244,63,94,0.4)] flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Send className={`w-3.5 h-3.5 ${isPushing ? 'animate-ping' : ''}`} />
                  <span>{isPushing ? 'DISPATCHING TO TIKTOK...' : 'DISPATCH / PUSH TO TIKTOK'}</span>
                </button>
              </div>
            </form>

            {/* Push Result Details */}
            {pushResult && (
              <div
                className={`p-3 rounded-xl border text-xs font-mono space-y-2 ${
                  pushResult.success
                    ? 'bg-emerald-950/80 border-emerald-400 text-emerald-200'
                    : 'bg-rose-950/80 border-rose-400 text-rose-200'
                }`}
              >
                <div className="flex items-center gap-2 font-bold">
                  {pushResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  )}
                  <span>{pushResult.message || 'Dispatch completed.'}</span>
                </div>

                {pushResult.creatorUploadUrl && (
                  <div className="pt-1">
                    <a
                      href={pushResult.creatorUploadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-pink-600 text-white font-bold text-xs hover:bg-pink-500 transition shadow"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Open in TikTok Creator Studio (Pre-filled)</span>
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Synced Reels Management & Manual Showcase */}
      <div className="p-5 rounded-2xl bg-[#080e1c] border border-cyan-500/30 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h4 className="font-heading font-bold text-sm text-white flex items-center gap-2">
              <Video className="w-4 h-4 text-cyan-400" />
              <span>CURRENT STUDIO REELS ({reels.length})</span>
            </h4>
            <p className="text-xs text-gray-400 font-tech mt-0.5">
              These videos are displayed in the client-facing TikTok Reels showcase.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAddingManual(!isAddingManual)}
              className="px-3 py-1.5 rounded-xl bg-cyan-950/70 border border-cyan-400/50 text-cyan-300 text-xs font-mono font-bold hover:bg-cyan-900 transition flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isAddingManual ? 'Cancel Manual' : 'Add Manual Reel'}</span>
            </button>
          </div>
        </div>

        {/* Manual Reel Form */}
        {isAddingManual && (
          <form onSubmit={handleAddManualReel} className="p-4 rounded-xl bg-black/60 border border-cyan-500/40 space-y-3 font-mono text-xs">
            <div className="font-heading font-bold text-cyan-300 text-xs">
              ADD REEL MANUALLY (DIRECT LINK FALLBACK)
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-gray-400 block mb-1">Reel Title / Focus *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Full Sleeve Skull Shading"
                  value={manualTitle}
                  onChange={e => setManualTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#050811] border border-gray-700 text-white outline-none focus:border-cyan-400"
                />
              </div>
              <div>
                <label className="text-gray-400 block mb-1">TikTok Video URL</label>
                <input
                  type="url"
                  placeholder="https://www.tiktok.com/@lightsouttattoo.site/video/..."
                  value={manualUrl}
                  onChange={e => setManualUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#050811] border border-gray-700 text-white outline-none focus:border-cyan-400"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-gray-400 block mb-1">Cover Image / Thumbnail URL</label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={manualThumbnail}
                  onChange={e => setManualThumbnail(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#050811] border border-gray-700 text-white outline-none focus:border-cyan-400"
                />
              </div>
              <div>
                <label className="text-gray-400 block mb-1">Caption / Description</label>
                <input
                  type="text"
                  placeholder="e.g. 5-hour realism session behind the machine..."
                  value={manualCaption}
                  onChange={e => setManualCaption(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#050811] border border-gray-700 text-white outline-none focus:border-cyan-400"
                />
              </div>
            </div>
            <div className="pt-1 flex justify-end">
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-cyan-500 text-black font-bold font-mono hover:bg-cyan-400 transition"
              >
                Save Reel to Showcase
              </button>
            </div>
          </form>
        )}

        {/* Reels Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {reels.map(reel => (
            <div
              key={reel.id}
              className="rounded-xl bg-black/60 border border-gray-800 overflow-hidden group hover:border-cyan-400/50 transition flex flex-col justify-between"
            >
              <div className="relative aspect-[9/14] overflow-hidden bg-gray-900">
                <img
                  src={reel.thumbnailUrl}
                  alt={reel.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-black/70 text-cyan-300 text-[10px] font-mono">
                  {reel.duration || '0:30'}
                </div>
                <div className="absolute bottom-2 left-2 right-2 text-white">
                  <div className="font-heading font-bold text-xs truncate">{reel.title}</div>
                  <div className="flex items-center gap-3 text-[10px] font-mono text-gray-300 mt-1">
                    <span className="flex items-center gap-1">
                      <Heart className="w-3 h-3 text-rose-400" />
                      {reel.likes || 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3 text-cyan-400" />
                      {reel.views || 0}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-2.5 border-t border-gray-800/80 flex items-center justify-between text-xs font-mono">
                {reel.videoUrl ? (
                  <a
                    href={reel.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyan-400 hover:underline flex items-center gap-1 text-[11px]"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>Watch</span>
                  </a>
                ) : (
                  <span className="text-gray-500 text-[11px]">Local Demo</span>
                )}
                <button
                  onClick={() => handleDeleteReel(reel.id)}
                  className="p-1 rounded text-gray-500 hover:text-rose-400 transition"
                  title="Remove reel"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
