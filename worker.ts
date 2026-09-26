/**
 * Cloudflare Worker / Pages Advanced Mode Entry Point
 * 
 * Handles all dynamic API and OAuth routes while delegating static assets
 * to env.ASSETS. Resolves 405 Method Not Allowed errors when Cloudflare
 * deploys with `wrangler deploy` or Cloudflare Pages.
 */

import * as configHandler from './functions/api/tiktok/config';
import * as statusHandler from './functions/api/tiktok/status';
import * as authUrlHandler from './functions/api/tiktok/auth-url';
import * as callbackHandler from './functions/api/tiktok/callback';
import * as disconnectHandler from './functions/api/tiktok/disconnect';
import * as videosHandler from './functions/api/tiktok/videos';
import * as publishVideoHandler from './functions/api/tiktok/publish-video';
import * as oauthCallbackHandler from './functions/oauth/callback';
import * as authCallbackHandler from './functions/auth/callback';

export interface Env {
  ASSETS?: { fetch: (request: Request) => Promise<Response> };
  TIKTOK_CLIENT_KEY?: string;
  TIKTOK_CLIENT_SECRET?: string;
  TIKTOK_REDIRECT_URI?: string;
  ENCRYPTION_SECRET?: string;
  FIREBASE_PROJECT_ID?: string;
  FIRESTORE_DATABASE_ID?: string;
  FIREBASE_API_KEY?: string;
  TIKTOK_KV?: any;
  [key: string]: any;
}

function createContext(request: Request, env: Env, ctx?: any) {
  return {
    request,
    env,
    params: {},
    waitUntil: (promise: Promise<any>) => {
      if (ctx && typeof ctx.waitUntil === 'function') {
        ctx.waitUntil(promise);
      }
    },
    next: async () => {
      if (env.ASSETS && typeof env.ASSETS.fetch === 'function') {
        return env.ASSETS.fetch(request);
      }
      return fetch(request);
    },
    data: {}
  };
}

export default {
  async fetch(request: Request, env: Env, ctx: any): Promise<Response> {
    const url = new URL(request.url);
    const pathname = url.pathname.replace(/\/$/, '') || '/';
    const method = request.method.toUpperCase();

    // CORS preflight for any /api/ or /oauth/ or /auth/ endpoint
    if (method === 'OPTIONS') {
      if (pathname.startsWith('/api/') || pathname.startsWith('/oauth/') || pathname.startsWith('/auth/')) {
        return new Response(null, {
          status: 204,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
            'Access-Control-Max-Age': '86400'
          }
        });
      }
    }

    const context = createContext(request, env, ctx);

    // Route: /api/tiktok/config & /api/tiktok/config.js
    if (pathname === '/api/tiktok/config' || pathname === '/api/tiktok/config.js') {
      if (method === 'GET') {
        return configHandler.onRequestGet(context as any);
      }
      if (method === 'POST') {
        return configHandler.onRequestPost(context as any);
      }
      if (method === 'OPTIONS') {
        return configHandler.onRequestOptions(context as any);
      }
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Route: /api/tiktok/status & /api/tiktok/status.js
    if (pathname === '/api/tiktok/status' || pathname === '/api/tiktok/status.js') {
      if (method === 'GET') {
        return statusHandler.onRequestGet(context as any);
      }
      if (method === 'OPTIONS') {
        return statusHandler.onRequestOptions(context as any);
      }
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Route: /api/tiktok/auth-url & /api/tiktok/auth-url.js
    if (pathname === '/api/tiktok/auth-url' || pathname === '/api/tiktok/auth-url.js') {
      if (method === 'GET') {
        return authUrlHandler.onRequestGet(context as any);
      }
      if (method === 'OPTIONS') {
        return authUrlHandler.onRequestOptions(context as any);
      }
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Route: /api/tiktok/callback & /api/tiktok/callback.js
    if (pathname === '/api/tiktok/callback' || pathname === '/api/tiktok/callback.js') {
      if (method === 'GET') {
        return callbackHandler.onRequestGet(context as any);
      }
      if (method === 'OPTIONS') {
        return callbackHandler.onRequestOptions(context as any);
      }
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Route: /oauth/callback
    if (pathname === '/oauth/callback') {
      if (method === 'GET') {
        return oauthCallbackHandler.onRequestGet(context as any);
      }
      if (method === 'OPTIONS') {
        return new Response(null, { status: 204 });
      }
    }

    // Route: /auth/callback
    if (pathname === '/auth/callback') {
      if (method === 'GET') {
        return authCallbackHandler.onRequestGet(context as any);
      }
      if (method === 'OPTIONS') {
        return new Response(null, { status: 204 });
      }
    }

    // Route: /api/tiktok/disconnect & /api/tiktok/disconnect.js
    if (pathname === '/api/tiktok/disconnect' || pathname === '/api/tiktok/disconnect.js') {
      if (method === 'POST') {
        return disconnectHandler.onRequestPost(context as any);
      }
      if (method === 'OPTIONS') {
        return disconnectHandler.onRequestOptions(context as any);
      }
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Route: /api/tiktok/videos & /api/tiktok/videos.js
    if (pathname === '/api/tiktok/videos' || pathname === '/api/tiktok/videos.js') {
      if (method === 'GET') {
        return videosHandler.onRequestGet(context as any);
      }
      if (method === 'OPTIONS') {
        return videosHandler.onRequestOptions(context as any);
      }
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Route: /api/tiktok/publish-video & /api/tiktok/publish-video.js
    if (pathname === '/api/tiktok/publish-video' || pathname === '/api/tiktok/publish-video.js') {
      if (method === 'POST') {
        return publishVideoHandler.onRequestPost(context as any);
      }
      if (method === 'OPTIONS') {
        return publishVideoHandler.onRequestOptions(context as any);
      }
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Fallback: Delegate to Static Assets
    if (env.ASSETS && typeof env.ASSETS.fetch === 'function') {
      return env.ASSETS.fetch(request);
    }

    return fetch(request);
  }
};
