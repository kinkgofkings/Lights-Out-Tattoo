/**
 * Cloudflare Pages Function: /api/tiktok/auth-url
 * 
 * Generates official TikTok OAuth 2.0 Authorization URL with CSRF protection.
 */

import {
  corsHeaders,
  getCredentialsFromFirestore,
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
  return new Response(null, { status: 204, headers: corsHeaders() });
};

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const headers = corsHeaders(context.request);
  const url = new URL(context.request.url);

  try {
    const creds = await getCredentialsFromFirestore(context.env);
    const clientRedirectUri = url.searchParams.get('redirectUri')?.trim();
    const returnUrl = url.searchParams.get('returnUrl')?.trim();
    const requestedScopes =
      url.searchParams.get('scopes')?.trim() ||
      'user.info.basic,video.list';

    const redirectUri = clientRedirectUri
      ? normalizeRedirectUri(clientRedirectUri, context.request)
      : normalizeRedirectUri(creds.redirectUri, context.request);

    if (!creds.clientKey) {
      return new Response(
        JSON.stringify({
          error: 'TikTok Client Key is not configured. Please save your Client Key in the Admin Dashboard.'
        }),
        { status: 400, headers }
      );
    }

    // Generate cryptographically random state for CSRF protection
    const stateArray = new Uint8Array(16);
    crypto.getRandomValues(stateArray);
    const state = Array.from(stateArray, b => b.toString(16).padStart(2, '0')).join('');

    // Store state in KV or memory for callback validation
    if (context.env?.TIKTOK_KV && typeof context.env.TIKTOK_KV.put === 'function') {
      try {
        await context.env.TIKTOK_KV.put(
          `state:${state}`,
          JSON.stringify({ createdAt: Date.now(), redirectUri, returnUrl }),
          { expirationTtl: 900 } // 15 minutes
        );
      } catch {}
    }

    // Build official TikTok v2 authorization URL
    const authUrl = `https://www.tiktok.com/v2/auth/authorize/?client_key=${encodeURIComponent(
      creds.clientKey
    )}&scope=${encodeURIComponent(requestedScopes)}&response_type=code&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&state=${encodeURIComponent(state)}`;

    return new Response(
      JSON.stringify({
        authUrl,
        state,
        redirectUri,
        scopes: requestedScopes,
        returnUrl: returnUrl || null
      }),
      { status: 200, headers }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message || 'Failed to generate authorization URL.' }),
      { status: 500, headers }
    );
  }
};
