/**
 * Cloudflare Pages Function: /oauth/callback
 * Delegates to /api/tiktok/callback
 */

export { onRequestGet } from '../api/tiktok/callback';
