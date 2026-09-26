/**
 * Cloudflare Pages Function: /api/tiktok/callback
 * 
 * Implements the TikTok OAuth 2.0 Token Exchange Flow:
 * 1. Receives authorization code from TikTok redirect
 * 2. Fetches decrypted Client Secret from secure Firestore store
 * 3. Exchanges code for Access Token & Refresh Token with TikTok API
 * 4. Retrieves artist user profile from TikTok
 * 5. Encrypts tokens with AES-256-GCM and persists them to Firestore
 * 6. Delivers seamless authentication bridge via window.opener postMessage and auto-redirect
 */

import {
  corsHeaders,
  getCredentialsFromFirestore,
  saveTokensToFirestore,
  normalizeRedirectUri,
  type PagesFunction
} from './_lib';

interface Env {
  TIKTOK_CLIENT_KEY?: string;
  TIKTOK_CLIENT_SECRET?: string;
  TIKTOK_REDIRECT_URI?: string;
  ENCRYPTION_SECRET?: string;
  TIKTOK_KV?: any;
}

export const onRequestOptions: PagesFunction<Env> = async () => {
  return new Response(null, {
    status: 204,
    headers: corsHeaders()
  });
};

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const url = new URL(context.request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const error = url.searchParams.get('error');
  const errorDescription = url.searchParams.get('error_description');

  // Handle TikTok Authorization denial or error
  if (error) {
    return new Response(
      `<!DOCTYPE html>
      <html>
        <head><title>TikTok Authorization Failed</title></head>
        <body style="font-family: sans-serif; background: #050811; color: #fff; text-align: center; padding: 40px;">
          <h2 style="color: #ff3366;">TikTok Authorization Failed</h2>
          <p style="color: #94a3b8;">${errorDescription || error}</p>
          <button onclick="window.location.href = '/?tab=admin'" style="margin-top: 20px; padding: 10px 20px; background: #00f0ff; color: #000; border: none; border-radius: 8px; font-weight: bold; cursor: pointer;">Return to Dashboard</button>
          <script>setTimeout(() => { window.location.href = '/?tab=admin'; }, 4000);</script>
        </body>
      </html>`,
      { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    );
  }

  if (!code) {
    return new Response(
      'Missing authorization code parameter from TikTok callback.',
      { status: 400, headers: { 'Content-Type': 'text/plain; charset=utf-8' } }
    );
  }

  try {
    const creds = await getCredentialsFromFirestore(context.env);

    if (!creds.clientKey || !creds.clientSecret) {
      return new Response(
        `<!DOCTYPE html>
        <html>
          <head><title>Configuration Missing</title></head>
          <body style="font-family: sans-serif; background: #050811; color: #fff; text-align: center; padding: 40px;">
            <h2 style="color: #ff3366;">TikTok Credentials Missing</h2>
            <p>TikTok Client Key and Secret must be configured in Firestore before completing OAuth token exchange.</p>
            <button onclick="window.location.href = '/?tab=admin'" style="margin-top: 20px; padding: 10px 20px; background: #00f0ff; color: #000; border: none; border-radius: 8px; font-weight: bold; cursor: pointer;">Go to Admin</button>
          </body>
        </html>`,
        { status: 400, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
      );
    }

    // Determine configured redirect URI for token exchange - exact match with TikTok Developer Portal
    const redirectUri = 'https://lightsouttattoo.site/oauth/callback';
    let returnUrl = '';
    if (state && context.env?.TIKTOK_KV && typeof context.env.TIKTOK_KV.get === 'function') {
      try {
        const stateInfo = await context.env.TIKTOK_KV.get(`state:${state}`, 'json');
        if (stateInfo?.returnUrl) returnUrl = stateInfo.returnUrl;
      } catch {}
    }

    // Official TikTok OAuth v2 Token Exchange
    const tokenUrl = 'https://open.tiktokapis.com/v2/oauth/token/';
    const bodyParams = new URLSearchParams({
      client_key: creds.clientKey,
      client_secret: creds.clientSecret,
      code: code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri
    });

    const tokenRes = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cache-Control': 'no-cache'
      },
      body: bodyParams.toString()
    });

    const tokenData = (await tokenRes.json()) as any;

    if (tokenData.error && tokenData.error.code !== 'ok' && tokenData.error.code !== 0) {
      console.error('TikTok token exchange error response:', tokenData);
      const errMsg = tokenData.error.message || JSON.stringify(tokenData.error);
      return new Response(
        `<!DOCTYPE html>
        <html>
          <head><title>Token Exchange Failed</title></head>
          <body style="font-family: sans-serif; background: #050811; color: #fff; text-align: center; padding: 40px;">
            <h2 style="color: #ff3366;">OAuth Token Exchange Failed</h2>
            <p style="color: #94a3b8;">${errMsg}</p>
            <p style="color: #64748b; font-size: 13px;">Redirect URI used: ${redirectUri}</p>
            <button onclick="window.location.href = '/?tab=admin'" style="margin-top: 20px; padding: 10px 20px; background: #00f0ff; color: #000; border: none; border-radius: 8px; font-weight: bold; cursor: pointer;">Return to Dashboard</button>
          </body>
        </html>`,
        { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
      );
    }

    const payload = tokenData.data || tokenData;
    const {
      access_token,
      refresh_token,
      expires_in,
      refresh_expires_in,
      open_id
    } = payload;

    if (!access_token) {
      throw new Error('No access_token returned by TikTok token endpoint.');
    }

    // Fetch TikTok User Info with approved scopes
    let userInfo: { username?: string; displayName?: string; avatarUrl?: string } = {};
    try {
      const userRes = await fetch(
        'https://open.tiktokapis.com/v2/user/info/?fields=open_id,union_id,avatar_url,display_name',
        {
          headers: {
            Authorization: `Bearer ${access_token}`
          }
        }
      );
      const userJson = (await userRes.json()) as any;
      if (userJson?.data?.user) {
        userInfo = {
          username: userJson.data.user.username || (userJson.data.user.display_name ? userJson.data.user.display_name.toLowerCase().replace(/\s+/g, '_') : 'lightsouttattoo.site'),
          displayName: userJson.data.user.display_name || 'The Dirty Texan',
          avatarUrl: userJson.data.user.avatar_url || '/icon.png'
        };
      }
    } catch (e) {
      console.warn('Could not fetch user info from TikTok:', e);
    }

    const safeUsername = userInfo.username || 'lightsouttattoo.site';
    const safeDisplayName = userInfo.displayName || 'The Dirty Texan';
    const safeAvatar = userInfo.avatarUrl || '/icon.png';

    // Encrypt tokens with AES-256-GCM and store in Firestore
    await saveTokensToFirestore(
      {
        accessToken: access_token,
        refreshToken: refresh_token || '',
        expiresAt: Date.now() + (expires_in || 86400) * 1000,
        refreshExpiresAt: refresh_expires_in ? Date.now() + refresh_expires_in * 1000 : undefined,
        openId: open_id || '',
        user: {
          username: safeUsername,
          displayName: safeDisplayName,
          avatarUrl: safeAvatar
        },
        updatedAt: new Date().toISOString()
      },
      context.env
    );

    // Return polished completion page that closes popup and notifies parent window
    const html = `<!DOCTYPE html>
      <html>
        <head>
          <title>TikTok Connected Successfully</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: system-ui, -apple-system, sans-serif; background: #050811; color: #fff; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; text-align: center;">
          <div style="background: #081122; border: 2px solid #00f0ff; border-radius: 16px; padding: 32px 24px; max-width: 420px; box-shadow: 0 0 30px rgba(0,240,255,0.3);">
            <div style="font-size: 40px; margin-bottom: 12px;">⚡</div>
            <h2 style="color: #00f0ff; margin: 0 0 8px 0; font-size: 22px;">TikTok Account Connected!</h2>
            <p style="color: #94a3b8; font-size: 14px; margin: 0 0 20px 0;">
              Lights Out Tattoo is now authenticated with your official TikTok feed via Cloudflare Pages.
            </p>
            <button onclick="handleComplete()" style="width: 100%; padding: 12px 20px; background: #00f0ff; color: #000; border: none; border-radius: 10px; font-weight: bold; font-size: 15px; cursor: pointer; transition: opacity 0.2s;">
              Return to Studio Dashboard
            </button>
          </div>
          <script>
            function handleComplete() {
              const sessionData = {
                isAuthenticated: true,
                method: 'tiktok',
                username: ${JSON.stringify(safeUsername)}.startsWith('@') ? ${JSON.stringify(safeUsername)} : '@' + ${JSON.stringify(safeUsername)},
                displayName: ${JSON.stringify(safeDisplayName)},
                avatarUrl: ${JSON.stringify(safeAvatar)},
                verifiedArtist: true,
                loginTime: new Date().toISOString()
              };

              try {
                localStorage.setItem('lot_admin_session_v1', JSON.stringify(sessionData));
                localStorage.setItem('lightsout_admin_session', JSON.stringify(sessionData));
              } catch (e) {}

              if (window.opener && !window.opener.closed) {
                try {
                  window.opener.postMessage({
                    type: 'TIKTOK_AUTH_SUCCESS',
                    user: ${JSON.stringify(userInfo)}
                  }, '*');
                } catch(e) {}
                try {
                  window.close();
                  return;
                } catch(e) {}
              }

              setTimeout(() => {
                const rawReturn = ${JSON.stringify(returnUrl)};
                let targetUrl;
                try {
                  targetUrl = rawReturn ? new URL(rawReturn, window.location.href) : new URL('/?tab=admin', window.location.href);
                } catch(e) {
                  targetUrl = new URL('/?tab=admin', window.location.href);
                }
                targetUrl.searchParams.set('tab', 'admin');
                targetUrl.searchParams.set('tiktok_auth', 'success');
                targetUrl.searchParams.set('username', ${JSON.stringify(safeUsername)});
                targetUrl.searchParams.set('display_name', ${JSON.stringify(safeDisplayName)});
                targetUrl.searchParams.set('avatar', ${JSON.stringify(safeAvatar)});
                window.location.href = targetUrl.toString();
              }, 250);
            }

            setTimeout(() => { handleComplete(); }, 1500);
          </script>
        </body>
      </html>`;

    return new Response(html, {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
  } catch (err: any) {
    console.error('TikTok OAuth callback exception:', err);
    return new Response(
      `<!DOCTYPE html>
      <html>
        <head><title>Authentication Error</title></head>
        <body style="font-family: sans-serif; background: #050811; color: #fff; text-align: center; padding: 40px;">
          <h2 style="color: #ff3366;">Authentication Error</h2>
          <p>${err.message}</p>
          <button onclick="window.location.href = '/?tab=admin'" style="margin-top: 20px; padding: 10px 20px; background: #00f0ff; color: #000; border: none; border-radius: 8px; font-weight: bold; cursor: pointer;">Return to Dashboard</button>
        </body>
      </html>`,
      { status: 500, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    );
  }
};
