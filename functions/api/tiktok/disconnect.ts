/**
 * Cloudflare Pages Function: /api/tiktok/disconnect
 * 
 * Disconnects active TikTok session by clearing stored tokens in Firestore.
 */

import { corsHeaders, saveTokensToFirestore, type PagesFunction } from './_lib';

interface Env {
  TIKTOK_KV?: any;
}

export const onRequestOptions: PagesFunction<Env> = async () => {
  return new Response(null, { status: 204, headers: corsHeaders() });
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const headers = corsHeaders(context.request);

  try {
    await saveTokensToFirestore(null, context.env);
    return new Response(
      JSON.stringify({ success: true, message: 'TikTok account disconnected.' }),
      { status: 200, headers }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ success: false, error: err.message || 'Failed to disconnect.' }),
      { status: 500, headers }
    );
  }
};
