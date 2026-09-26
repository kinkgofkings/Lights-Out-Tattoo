/**
 * Cloudflare Pages Function: /api/tiktok/status
 * 
 * Returns TikTok connection status, artist profile, and configured key info.
 */

import {
  corsHeaders,
  getCredentialsFromFirestore,
  getTokensFromFirestore,
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

  try {
    const creds = await getCredentialsFromFirestore(context.env);
    const token = await getTokensFromFirestore(context.env);

    const hasKey = Boolean(creds.clientKey);
    const hasSecret = Boolean(creds.hasSecret || creds.clientSecret);
    const redirectUri = normalizeRedirectUri(creds.redirectUri, context.request);

    const isConnected = Boolean(
      token?.accessToken && token.expiresAt && token.expiresAt > Date.now() - 300000
    );

    const maskedKey = creds.clientKey
      ? (creds.clientKey.length > 8 ? `${creds.clientKey.slice(0, 4)}••••${creds.clientKey.slice(-4)}` : '••••••••')
      : '';

    return new Response(
      JSON.stringify({
        configured: hasKey && hasSecret,
        hasClientKey: hasKey,
        hasClientSecret: hasSecret,
        clientKey: maskedKey,
        rawClientKey: creds.clientKey,
        redirectUri,
        isConnected,
        user: token?.user || null,
        expiresAt: token?.expiresAt || null
      }),
      { status: 200, headers }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({
        configured: false,
        hasClientKey: false,
        hasClientSecret: false,
        clientKey: '',
        rawClientKey: '',
        redirectUri: `${new URL(context.request.url).origin}/api/tiktok/callback`,
        isConnected: false,
        user: null,
        expiresAt: null,
        error: err.message
      }),
      { status: 200, headers }
    );
  }
};
