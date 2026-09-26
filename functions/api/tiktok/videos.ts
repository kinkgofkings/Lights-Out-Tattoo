/**
 * Cloudflare Pages Function: /api/tiktok/videos
 * 
 * Fetches user's published TikTok videos using the decrypted access token from Firestore.
 * Automatically handles token refresh when within 5 minutes of expiration.
 */

import {
  corsHeaders,
  getCredentialsFromFirestore,
  getTokensFromFirestore,
  saveTokensToFirestore,
  type PagesFunction
} from './_lib';

interface Env {
  TIKTOK_CLIENT_KEY?: string;
  TIKTOK_CLIENT_SECRET?: string;
  ENCRYPTION_SECRET?: string;
  TIKTOK_KV?: any;
}

export const onRequestOptions: PagesFunction<Env> = async () => {
  return new Response(null, { status: 204, headers: corsHeaders() });
};

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const headers = corsHeaders(context.request);

  try {
    const token = await getTokensFromFirestore(context.env);
    const creds = await getCredentialsFromFirestore(context.env);

    if (!token || !token.accessToken) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'TikTok account is not connected. Please connect in the Admin Dashboard.'
        }),
        { status: 401, headers }
      );
    }

    let accessToken = token.accessToken;

    // Refresh token if near expiration (within 5 minutes)
    if (token.expiresAt < Date.now() + 5 * 60 * 1000 && token.refreshToken) {
      try {
        const refreshParams = new URLSearchParams({
          client_key: creds.clientKey,
          client_secret: creds.clientSecret,
          grant_type: 'refresh_token',
          refresh_token: token.refreshToken
        });

        const refreshRes = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: refreshParams.toString()
        });

        const refreshData = (await refreshRes.json()) as any;
        if (refreshData?.data?.access_token) {
          accessToken = refreshData.data.access_token;
          await saveTokensToFirestore(
            {
              ...token,
              accessToken,
              refreshToken: refreshData.data.refresh_token || token.refreshToken,
              expiresAt: Date.now() + (refreshData.data.expires_in || 86400) * 1000
            },
            context.env
          );
        }
      } catch (e) {
        console.warn('Could not refresh TikTok token:', e);
      }
    }

    // Query TikTok Video List API
    const listRes = await fetch(
      'https://open.tiktokapis.com/v2/video/list/?fields=id,title,video_description,duration,cover_image_url,embed_html,embed_link,like_count,comment_count,share_count,view_count',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ max_count: 20 })
      }
    );

    const listData = (await listRes.json()) as any;

    if (listData?.error && listData.error.code !== 'ok' && listData.error.code !== 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: listData.error.message || 'Error querying TikTok video list',
          rawError: listData.error
        }),
        { status: 400, headers }
      );
    }

    const videos = listData?.data?.videos || [];

    return new Response(
      JSON.stringify({
        success: true,
        videos,
        cursor: listData?.data?.cursor || null,
        has_more: listData?.data?.has_more || false
      }),
      { status: 200, headers }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ success: false, error: err.message || 'Failed to fetch videos.' }),
      { status: 500, headers }
    );
  }
};
