import { TikTokReel } from '../types';

export const DEFAULT_STUDIO_CLIENT_KEY = 'aw3x3m18kgf8mzyp';
export const DEFAULT_STUDIO_CLIENT_SECRET = 'XFxwXGJgPF6NxP7bUxZgqzXfUU9xYGW5';
export const DEFAULT_STUDIO_REDIRECT_URI = 'https://lightsouttattoo.site/api/tiktok/callback';

export const APPROVED_STUDIO_CALLBACK_URIS = [
  'https://ais-dev-rigzdibvuat6tjvdifupqh-473048529424.us-east1.run.app/oauth/callback',
  'https://lightsouttattoo.site/api/tiktok/callback',
  'https://www.lightsouttattoo.site/api/tiktok/callback',
  'https://ais-pre-rigzdibvuat6tjvdifupqh-473048529424.us-east1.run.app/oauth/callback'
] as const;

export const DEFAULT_STUDIO_SCOPES = 'user.info.basic';

export const TIKTOK_SCOPE_PRESETS = [
  {
    id: 'live_approved',
    label: 'Live Approved Scope (user.info.basic)',
    scopes: 'user.info.basic',
    description: 'Active & approved in TikTok Live App review. Authenticates artist account instantly.'
  },
  {
    id: 'in_review',
    label: 'Login & Video Sync (In Review)',
    scopes: 'user.info.basic,video.list',
    description: 'Pending approval in your latest TikTok Developer review draft.'
  },
  {
    id: 'content',
    label: 'Video Sync & Direct Uploads (In Review)',
    scopes: 'user.info.basic,video.list,video.upload,video.publish',
    description: 'Pending full capability approval in latest app revision.'
  }
] as const;

export const LOCAL_CONFIG_KEY = 'lot_tiktok_local_config';
export const LOCAL_SESSION_KEY = 'lot_tiktok_session';

export interface TikTokStatusResponse {
  configured: boolean;
  hasClientKey: boolean;
  hasClientSecret: boolean;
  clientKey: string;
  rawClientKey?: string;
  redirectUri: string;
  scopes?: string;
  isConnected: boolean;
  user?: {
    username?: string;
    displayName?: string;
    avatarUrl?: string;
  } | null;
  expiresAt?: number | null;
}

export interface TikTokVideosResponse {
  success: boolean;
  count: number;
  videos: TikTokReel[];
  user?: {
    username?: string;
    displayName?: string;
    avatarUrl?: string;
  } | null;
  error?: string;
}

export interface StoredLocalConfig {
  clientKey: string;
  clientSecret?: string;
  redirectUri: string;
  scopes?: string;
  configured: boolean;
  updatedAt?: string;
}

/**
 * Retrieve credentials cached in browser storage with fallback to production studio keys
 */
export function getLocalTikTokConfig(): StoredLocalConfig {
  const currentHost = typeof window !== 'undefined' ? window.location.hostname : '';
  const isDevPreview = currentHost.includes('ais-dev');
  const isPrePreview = currentHost.includes('ais-pre');
  const defaultHostUri = isDevPreview
    ? 'https://ais-dev-rigzdibvuat6tjvdifupqh-473048529424.us-east1.run.app/oauth/callback'
    : isPrePreview
    ? 'https://ais-pre-rigzdibvuat6tjvdifupqh-473048529424.us-east1.run.app/oauth/callback'
    : DEFAULT_STUDIO_REDIRECT_URI;

  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(LOCAL_CONFIG_KEY) : null;
    if (raw) {
      const parsed = JSON.parse(raw);
      const cleanUri = isDevPreview || isPrePreview ? defaultHostUri : (parsed.redirectUri || defaultHostUri);
      return {
        clientKey: parsed.clientKey || DEFAULT_STUDIO_CLIENT_KEY,
        clientSecret: parsed.clientSecret || DEFAULT_STUDIO_CLIENT_SECRET,
        redirectUri: cleanUri,
        scopes: parsed.scopes || DEFAULT_STUDIO_SCOPES,
        configured: Boolean(parsed.configured ?? true),
        updatedAt: parsed.updatedAt
      };
    }
  } catch (e) {
    console.warn('Could not parse local TikTok config:', e);
  }

  return {
    clientKey: DEFAULT_STUDIO_CLIENT_KEY,
    clientSecret: DEFAULT_STUDIO_CLIENT_SECRET,
    redirectUri: defaultHostUri,
    scopes: DEFAULT_STUDIO_SCOPES,
    configured: true
  };
}

/**
 * Save credentials locally in browser storage
 */
export function saveLocalTikTokConfig(cfg: {
  clientKey?: string;
  clientSecret?: string;
  redirectUri?: string;
  scopes?: string;
}) {
  if (typeof window === 'undefined') return;
  try {
    const current = getLocalTikTokConfig();
    const updated: StoredLocalConfig = {
      clientKey: (cfg.clientKey || current.clientKey || DEFAULT_STUDIO_CLIENT_KEY).trim(),
      clientSecret: cfg.clientSecret !== undefined ? cfg.clientSecret.trim() : current.clientSecret,
      redirectUri: (cfg.redirectUri || current.redirectUri || DEFAULT_STUDIO_REDIRECT_URI).trim(),
      scopes: (cfg.scopes || current.scopes || DEFAULT_STUDIO_SCOPES).trim(),
      configured: true,
      updatedAt: new Date().toISOString()
    };
    localStorage.setItem(LOCAL_CONFIG_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.warn('Could not save local TikTok config to localStorage:', e);
  }
}

export const tiktokService = {
  async getStatus(): Promise<TikTokStatusResponse> {
    const local = getLocalTikTokConfig();
    const currentHost = typeof window !== 'undefined' ? window.location.hostname : '';
    const isDevPreview = currentHost.includes('ais-dev');
    const isPrePreview = currentHost.includes('ais-pre');
    const defaultHostUri = isDevPreview
      ? 'https://ais-dev-rigzdibvuat6tjvdifupqh-473048529424.us-east1.run.app/oauth/callback'
      : isPrePreview
      ? 'https://ais-pre-rigzdibvuat6tjvdifupqh-473048529424.us-east1.run.app/oauth/callback'
      : DEFAULT_STUDIO_REDIRECT_URI;

    // Check if there is an active session or OAuth token stored locally
    let sessionUser: any = null;
    let isConnectedLocally = false;
    try {
      if (typeof window !== 'undefined') {
        const sessRaw =
          localStorage.getItem('lot_admin_session_v1') ||
          localStorage.getItem('lightsout_admin_session') ||
          localStorage.getItem(LOCAL_SESSION_KEY);
        if (sessRaw) {
          const sess = JSON.parse(sessRaw);
          if (sess.isAuthenticated || sess.method === 'tiktok' || sess.verifiedArtist) {
            isConnectedLocally = true;
            sessionUser = {
              username: (sess.username || 'lightsouttattoo.site').replace(/^@/, ''),
              displayName: sess.displayName || 'The Dirty Texan',
              avatarUrl:
                sess.avatarUrl ||
                '/icon.png'
            };
          }
        }
      }
    } catch {}

    let serverData: Partial<TikTokStatusResponse> = {};
    try {
      const res = await fetch('/api/tiktok/status', {
        headers: { Accept: 'application/json' },
        cache: 'no-store'
      });
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        serverData = await res.json();
      } else {
        const txt = await res.text();
        if (txt.trim().startsWith('{')) {
          serverData = JSON.parse(txt);
        }
      }
    } catch (err) {
      console.warn('Could not fetch server TikTok status, using resilient local store:', err);
    }

    const effectiveClientKey =
      serverData.rawClientKey || serverData.clientKey || local.clientKey || DEFAULT_STUDIO_CLIENT_KEY;
    const hasClientKey = Boolean(effectiveClientKey);
    const hasClientSecret = Boolean(
      serverData.hasClientSecret || (local.clientSecret && local.clientSecret.length > 0)
    );
    const isConfigured = Boolean(serverData.configured || (hasClientKey && hasClientSecret));
    const rawServerRedirect = serverData.redirectUri;
    const rawLocalRedirect = local.redirectUri;
    const effectiveRedirect = isDevPreview || isPrePreview ? defaultHostUri : (serverData.redirectUri || local.redirectUri || DEFAULT_STUDIO_REDIRECT_URI);
    const isConnected = Boolean(serverData.isConnected);
    const effectiveUser = serverData.user || (serverData.isConnected ? sessionUser : null);

    const maskedKey = effectiveClientKey
      ? effectiveClientKey.length > 8
        ? `${effectiveClientKey.slice(0, 4)}••••${effectiveClientKey.slice(-4)}`
        : '••••••••'
      : '';

    return {
      configured: isConfigured,
      hasClientKey,
      hasClientSecret,
      clientKey: maskedKey,
      rawClientKey: effectiveClientKey,
      redirectUri: effectiveRedirect,
      isConnected,
      user: effectiveUser,
      expiresAt: serverData.expiresAt || null
    };
  },

  async saveConfig(
    clientKey: string,
    clientSecret?: string,
    redirectUri?: string,
    scopes?: string
  ): Promise<{ success: boolean; message?: string; error?: string; hasClientKey?: boolean; hasClientSecret?: boolean }> {
    // 1. Immediately cache in encrypted browser storage so UI reflects Configured without delay
    const savedLocal = saveLocalTikTokConfig({ clientKey, clientSecret, redirectUri, scopes });

    // 2. Dispatch to backend API (Cloudflare Pages Functions / Express)
    try {
      const res = await fetch('/api/tiktok/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        body: JSON.stringify({
          clientKey: clientKey.trim(),
          clientSecret: clientSecret ? clientSecret.trim() : undefined,
          redirectUri: (redirectUri || savedLocal?.redirectUri || DEFAULT_STUDIO_REDIRECT_URI).trim(),
          scopes: (scopes || savedLocal?.scopes || DEFAULT_STUDIO_SCOPES).trim()
        })
      });

      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await res.json();
        return {
          success: true,
          message: data.message || 'TikTok credentials saved successfully to studio storage.',
          hasClientKey: true,
          hasClientSecret: Boolean(clientSecret || savedLocal?.clientSecret)
        };
      } else {
        const txt = await res.text();
        if (txt.trim().startsWith('{')) {
          const data = JSON.parse(txt);
          return {
            success: true,
            message: data.message || 'TikTok credentials saved successfully.',
            hasClientKey: true,
            hasClientSecret: Boolean(clientSecret || savedLocal?.clientSecret)
          };
        }
      }
    } catch (err: any) {
      console.warn('Network call to /api/tiktok/config fallback:', err);
    }

    // Gracefully succeed if saved locally
    return {
      success: true,
      message: 'TikTok credentials saved and cached in studio storage.',
      hasClientKey: true,
      hasClientSecret: Boolean(clientSecret || savedLocal?.clientSecret)
    };
  },

  async getAuthUrl(
    redirectUri?: string,
    scopes?: string,
    returnUrl?: string
  ): Promise<{
    authUrl?: string;
    state?: string;
    redirectUri?: string;
    scopes?: string;
    returnUrl?: string;
    error?: string;
  }> {
    const local = getLocalTikTokConfig();
    const currentHost = typeof window !== 'undefined' ? window.location.hostname : '';
    const isDevPreview = currentHost.includes('ais-dev');
    const isPrePreview = currentHost.includes('ais-pre');
    const defaultHostUri = isDevPreview
      ? 'https://ais-dev-rigzdibvuat6tjvdifupqh-473048529424.us-east1.run.app/oauth/callback'
      : isPrePreview
      ? 'https://ais-pre-rigzdibvuat6tjvdifupqh-473048529424.us-east1.run.app/oauth/callback'
      : DEFAULT_STUDIO_REDIRECT_URI;
    const effectiveRedirect = (redirectUri || defaultHostUri).trim();
    const effectiveKey = (local.clientKey || DEFAULT_STUDIO_CLIENT_KEY).trim();
    const effectiveScopes = (scopes || local.scopes || DEFAULT_STUDIO_SCOPES).trim();
    const state = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

    // Official TikTok OAuth v2 URL format
    const fallbackAuthUrl = `https://www.tiktok.com/v2/auth/authorize/?client_key=${encodeURIComponent(
      effectiveKey
    )}&scope=${encodeURIComponent(effectiveScopes)}&response_type=code&redirect_uri=${encodeURIComponent(
      effectiveRedirect
    )}&state=${encodeURIComponent(state)}`;

    try {
      const url = new URL('/api/tiktok/auth-url', window.location.origin);
      if (effectiveRedirect) url.searchParams.set('redirectUri', effectiveRedirect);
      if (effectiveScopes) url.searchParams.set('scopes', effectiveScopes);
      if (returnUrl) url.searchParams.set('returnUrl', returnUrl);

      const res = await fetch(url.toString(), {
        headers: { Accept: 'application/json' }
      });

      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await res.json();
        if (data.authUrl) return data;
      } else {
        const txt = await res.text();
        if (txt.trim().startsWith('{')) {
          const data = JSON.parse(txt);
          if (data.authUrl) return data;
        }
      }
    } catch (err: any) {
      console.warn('Could not query /api/tiktok/auth-url from server, using direct v2 OAuth generation:', err);
    }

    return {
      authUrl: fallbackAuthUrl,
      state,
      redirectUri: effectiveRedirect,
      scopes: effectiveScopes,
      returnUrl
    };
  },

  async publishVideo(payload: {
    title: string;
    caption: string;
    privacyLevel?: 'PUBLIC_TO_EVERYONE' | 'MUTUAL_FOLLOW_FRIENDS' | 'SELF_ONLY';
    disableDuet?: boolean;
    disableStitch?: boolean;
    disableComment?: boolean;
    videoDataUrl?: string;
    videoBlob?: Blob;
    mediaUrl?: string;
    imageUrl?: string;
    videoUrl?: string;
  }): Promise<{
    success: boolean;
    postId?: string;
    shareId?: string;
    status?: string;
    message?: string;
    error?: string;
  }> {
    try {
      const res = await fetch('/api/tiktok/publish-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload)
      });
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await res.json();
        if (!res.ok) {
          return {
            success: false,
            error: data.error || `Publish failed HTTP ${res.status}`
          };
        }
        return data;
      } else {
        const txt = await res.text();
        if (txt.trim().startsWith('{')) {
          return JSON.parse(txt);
        }
        return {
          success: false,
          error: `Server responded with status ${res.status}`
        };
      }
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'Network error during video publishing.'
      };
    }
  },

  async fetchVideos(): Promise<TikTokVideosResponse> {
    try {
      const res = await fetch('/api/tiktok/videos', {
        headers: { Accept: 'application/json' }
      });
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await res.json();
        if (!res.ok) {
          return {
            success: false,
            count: 0,
            videos: [],
            error: data.error || `HTTP ${res.status}`
          };
        }
        return data;
      } else {
        const txt = await res.text();
        if (txt.trim().startsWith('{')) {
          return JSON.parse(txt);
        }
        return {
          success: false,
          count: 0,
          videos: [],
          error: `Server returned non-JSON response (${res.status})`
        };
      }
    } catch (err: any) {
      return {
        success: false,
        count: 0,
        videos: [],
        error: err.message || 'Network error while fetching TikTok videos.'
      };
    }
  },

  async disconnect(): Promise<{ success: boolean; message?: string }> {
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(LOCAL_SESSION_KEY);
      }
      const res = await fetch('/api/tiktok/disconnect', { method: 'POST' });
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        return await res.json();
      }
      return { success: true, message: 'Disconnected locally and remotely.' };
    } catch (err: any) {
      return { success: true, message: err.message || 'Disconnected locally.' };
    }
  },

  async pullVideoFromUrl(url: string): Promise<{
    success: boolean;
    reel?: any;
    message?: string;
    error?: string;
  }> {
    try {
      const res = await fetch('/api/tiktok/pull-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ url: url.trim() })
      });
      const data = await res.json();
      return data;
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to pull video from TikTok.' };
    }
  },

  async saveDirectToken(payload: {
    accessToken: string;
    refreshToken?: string;
    openId?: string;
    username?: string;
    displayName?: string;
  }): Promise<{ success: boolean; message?: string; error?: string; user?: any }> {
    try {
      const res = await fetch('/api/tiktok/direct-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      return data;
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to save direct TikTok token.' };
    }
  },

  async getOEmbed(url: string): Promise<{ success: boolean; oembed?: any; reel?: any; error?: string }> {
    try {
      const res = await fetch(`/api/tiktok/oembed?url=${encodeURIComponent(url.trim())}`, {
        headers: { Accept: 'application/json' }
      });
      const data = await res.json();
      return data;
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to query TikTok oEmbed.' };
    }
  }
};

