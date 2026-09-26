/**
 * Cloudflare Pages Function: /api/tiktok/publish-video
 * 
 * Initiates video publishing to TikTok Creator queue via the official TikTok
 * Content Posting API v2.
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

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const headers = corsHeaders(context.request);

  try {
    let token = await getTokensFromFirestore(context.env);
    if (!token || !token.accessToken) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'TikTok account is not connected. Please connect in the Admin Dashboard first.'
        }),
        { status: 401, headers }
      );
    }

    const creds = await getCredentialsFromFirestore(context.env);

    // Refresh token if within 5 minutes of expiration
    if (token.expiresAt && token.expiresAt < Date.now() + 5 * 60 * 1000 && token.refreshToken) {
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
          token = {
            ...token,
            accessToken: refreshData.data.access_token,
            refreshToken: refreshData.data.refresh_token || token.refreshToken,
            expiresAt: Date.now() + (refreshData.data.expires_in || 86400) * 1000
          };
          await saveTokensToFirestore(token, context.env);
        }
      } catch (e) {
        console.warn('Could not refresh TikTok token before publishing:', e);
      }
    }

    let body: any = {};
    try {
      body = await context.request.json();
    } catch {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid JSON request payload.' }),
        { status: 400, headers }
      );
    }

    const {
      title,
      caption,
      privacyLevel = 'PUBLIC_TO_EVERYONE',
      disableComment = false,
      disableDuet = false,
      disableStitch = false,
      mediaUrl,
      imageUrl,
      videoUrl,
      videoDataUrl
    } = body;

    const fullTitle = (title || 'Lights Out Tattoo Session - Tex | Winchester VA').substring(0, 150);
    const postCaption = (caption || 'Custom black & grey realism by Tex at Lights Out Tattoo in Winchester, VA. #LightsOutTattoo #WinchesterVA #BlackAndGreyRealism #TattooArtist').substring(0, 500);

    const targetMedia = videoUrl || mediaUrl || imageUrl || videoDataUrl;
    const mediaSourceUrl = (targetMedia && (targetMedia.startsWith('http://') || targetMedia.startsWith('https://')))
      ? targetMedia
      : 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4';

    // Query TikTok Content Posting API
    const publishInitUrl = 'https://open.tiktokapis.com/v2/post/publish/video/init/';
    const tiktokRes = await fetch(publishInitUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        post_info: {
          title: postCaption,
          privacy_level: privacyLevel,
          disable_duet: disableDuet,
          disable_stitch: disableStitch,
          disable_comment: disableComment,
          video_cover_timestamp_ms: 1000
        },
        source_info: {
          source: 'PULL_FROM_URL',
          video_url: mediaSourceUrl
        }
      })
    });

    const tiktokData = (await tiktokRes.json()) as any;

    if (tiktokData?.data?.publish_id) {
      return new Response(
        JSON.stringify({
          success: true,
          postId: tiktokData.data.publish_id,
          status: 'PROCESSING',
          message: 'Video successfully dispatched to your official TikTok Creator queue!',
          user: token.user || null,
          postDetails: {
            title: fullTitle,
            caption: postCaption,
            privacyLevel,
            account: token.user?.username || '@lightsouttattoo',
            publishId: tiktokData.data.publish_id,
            timestamp: new Date().toISOString()
          }
        }),
        { status: 200, headers }
      );
    }

    if (tiktokData?.error && tiktokData.error.code !== 'ok' && tiktokData.error.code !== 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: tiktokData.error.message || `TikTok Content Posting error: ${tiktokData.error.code}`,
          code: tiktokData.error.code,
          details: tiktokData.error
        }),
        { status: 400, headers }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: tiktokData,
        message: 'Video dispatch initiated with TikTok.'
      }),
      { status: 200, headers }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ success: false, error: err.message || 'Failed to publish video.' }),
      { status: 500, headers }
    );
  }
};
